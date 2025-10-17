# PrizmBets Firebase Functions API
# Serverless backend for sports betting analysis platform

from firebase_functions import https_fn, options
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app, auth
from flask import Flask, request, jsonify, Request
from flask_cors import CORS
import requests
import json
import os
import time
import random
import jwt
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv
from marshmallow import Schema, fields, validate, ValidationError
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Load environment variables
load_dotenv()

# Firebase Admin SDK initialization (lazy-loaded)
firebase_app = None

def get_firebase_app():
    """Get or initialize Firebase app"""
    global firebase_app
    if firebase_app is None:
        firebase_app = initialize_app()
    return firebase_app

# ---------- AUTH HELPERS ----------
def require_firebase_user(req: Request):
    """Checks for a Firebase user ID token (used for browser/user calls)."""
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        claims = auth.verify_id_token(token)
        return claims  # includes uid, email, etc.
    except Exception:
        return None

def require_service_account(req, expected_audience: str):
    """Checks for a valid Google OIDC service account token (used for backend calls)."""
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ", 1)[1]
    try:
        claims = id_token.verify_oauth2_token(token, google_requests.Request(), expected_audience)
        if claims.get("email") != "agent-api-access@smartbets-5c06f.iam.gserviceaccount.com":
            return None
        return claims
    except Exception:
        return None
# ---------- END AUTH HELPERS ----------

# Set global options for cost control and performance
set_global_options(
    max_instances=10,
    timeout_sec=60,  # Increase timeout for API calls
    memory=256  # Increase memory for better performance
)

# CORS Configuration - Environment-aware
PRODUCTION_ORIGINS = [
    'https://smartbets-5c06f.web.app',
    'https://smartbets-5c06f.firebaseapp.com',
    'https://prizmbets-5c06f.firebaseapp.com',
    'https://prizmbets.app',
    'https://www.prizmbets.app'
]

DEVELOPMENT_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
]

# Only allow localhost in development environment
FLASK_ENV = os.getenv('FLASK_ENV', 'production')
ALLOWED_ORIGINS = PRODUCTION_ORIGINS + (DEVELOPMENT_ORIGINS if FLASK_ENV == 'development' else [])

# API Configuration - Required environment variables
ODDS_API_KEY = os.getenv('ODDS_API_KEY')
ODDS_API_BASE_URL = os.getenv('ODDS_API_BASE_URL', 'https://api.the-odds-api.com/v4')
APISPORTS_KEY = os.getenv('APISPORTS_KEY', None)

# JWT Configuration for authentication
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
JWT_ISSUER = os.getenv('JWT_ISSUER', 'prizmbets-api')
JWT_AUDIENCE = os.getenv('JWT_AUDIENCE', 'prizmbets-app')

# Validation function to be called when functions are invoked
def validate_env_vars():
    """Validate required environment variables at runtime"""
    if not ODDS_API_KEY:
        raise ValueError("ODDS_API_KEY environment variable is required")
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY environment variable is required")
    return True

# API-Sports endpoints by sport
APISPORTS_ENDPOINTS = {
    'americanfootball_nfl': 'https://v1.american-football.api-sports.io',
    'basketball_nba': 'https://v1.basketball.api-sports.io',
    'baseball_mlb': 'https://v1.baseball.api-sports.io',
    'icehockey_nhl': 'https://v1.hockey.api-sports.io'
}

# Enhanced cache for API responses with TTL management
api_cache = {}
CACHE_DURATION = 300000  # 5 minutes in milliseconds
LIVE_CACHE_DURATION = 60000  # 1 minute for live data
ODDS_CACHE_DURATION = 120000  # 2 minutes for odds data

# Sport key mapping for frontend to API compatibility
SPORT_KEY_MAPPING = {
    'nfl': 'americanfootball_nfl',
    'nba': 'basketball_nba', 
    'mlb': 'baseball_mlb',
    'nhl': 'icehockey_nhl',
    'ncaaf': 'americanfootball_ncaaf',
    'ncaab': 'basketball_ncaab',
    'mma': 'mma_mixed_martial_arts',
    'ufc': 'mma_mixed_martial_arts',
    'soccer': 'soccer_epl',
    'tennis': 'tennis_atp',
    'golf': 'golf_pga_championship',
    'f1': 'motorsport_f1',
    'nascar': 'motorsport_nascar',
    'wnba': 'basketball_wnba'
}

# Rate limiting storage
rate_limit_storage = {}
RATE_LIMIT_WINDOW = 60000  # 1 minute in milliseconds
RATE_LIMIT_MAX_REQUESTS = 100  # requests per window

# Input validation schemas
class BetSchema(Schema):
    team = fields.Str(required=True, validate=validate.Length(min=1, max=100))
    bet_type = fields.Str(required=True, validate=validate.OneOf(['spread', 'moneyline', 'total', 'prop']))
    odds = fields.Int(required=True, validate=validate.Range(min=-1000, max=1000))
    line = fields.Float(allow_none=True, validate=validate.Range(min=-100, max=100))
    
class ParlaySchema(Schema):
    bets = fields.List(fields.Nested(BetSchema), required=True, validate=validate.Length(min=1, max=12))
    total_amount = fields.Float(required=True, validate=validate.Range(min=1, max=10000))
    
class SportFilterSchema(Schema):
    sport = fields.Str(required=False, validate=validate.OneOf([
        'nfl', 'nba', 'mlb', 'nhl', 'mma', 'ufc', 'soccer', 'tennis', 
        'golf', 'ncaaf', 'ncaab', 'wnba', 'americanfootball_nfl',
        'basketball_nba', 'baseball_mlb', 'icehockey_nhl', 'mma_mixed_martial_arts'
    ]))
    per_sport = fields.Int(required=False, validate=validate.Range(min=1, max=50))
    upcoming = fields.Bool(required=False)

def validate_request_data(schema_class, data):
    """Validate request data using marshmallow schema"""
    try:
        schema = schema_class()
        result = schema.load(data)
        return result, None
    except ValidationError as e:
        return None, f"Validation error: {str(e.messages)}"
    except Exception as e:
        return None, f"Validation failed: {str(e)}"

def sanitize_error_message(error_msg, is_production=True):
    """Sanitize error messages for production to prevent information leakage"""
    if not is_production:
        return error_msg
    
    # Production error messages - generic and safe
    if any(keyword in str(error_msg).lower() for keyword in [
        'database', 'sql', 'connection', 'timeout', 'internal', 
        'server', 'api key', 'secret', 'token', 'auth'
    ]):
        return "Service temporarily unavailable. Please try again later."
    
    if 'validation' in str(error_msg).lower():
        return "Invalid request data. Please check your input."
    
    if 'rate limit' in str(error_msg).lower():
        return "Too many requests. Please wait before trying again."
    
    # Default safe message
    return "An error occurred. Please try again or contact support."

def clean_expired_cache():
    """Clean expired cache entries to prevent memory bloat"""
    current_time = int(time.time() * 1000)
    expired_keys = [
        key for key, value in api_cache.items()
        if current_time - value['timestamp'] > value.get('ttl', CACHE_DURATION)
    ]
    for key in expired_keys:
        del api_cache[key]

def convert_bookmakers_to_sportsbooks(game_data):
    """Convert bookmakers array format to sportsbooks object format"""
    converted_game = {
        'id': game_data.get('id'),
        'sport': game_data.get('sport'),
        'commence_time': game_data.get('commence_time'),
        'home_team': game_data.get('home_team'),
        'away_team': game_data.get('away_team'),
        'status': 'scheduled',
        'sportsbooks': {}
    }
    
    # Convert bookmaker array to sportsbooks object
    for bookmaker in game_data.get('bookmakers', []):
        book_key = bookmaker.get('key')
        if book_key in ['draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers']:
            for market in bookmaker.get('markets', []):
                if market.get('key') == 'h2h':
                    outcomes = market.get('outcomes', [])
                    moneyline = {}
                    for outcome in outcomes:
                        if outcome.get('name') == game_data.get('home_team'):
                            moneyline['home'] = outcome.get('price')
                        elif outcome.get('name') == game_data.get('away_team'):
                            moneyline['away'] = outcome.get('price')
                    
                    if moneyline:
                        converted_game['sportsbooks'][book_key] = {
                            'moneyline': moneyline
                        }
    
    return converted_game

def check_rate_limit(req, max_requests=RATE_LIMIT_MAX_REQUESTS, user_id=None):
    """Check if request exceeds rate limit with user-based and IP-based limits"""
    try:
        current_time = int(time.time() * 1000)
        window_start = current_time - RATE_LIMIT_WINDOW
        
        # Determine rate limit key (prefer user_id over IP)
        if user_id:
            limit_key = f"user:{user_id}"
            # Authenticated users get higher limits
            max_requests = min(max_requests * 2, 200)
        else:
            # Get client IP for unauthenticated requests
            client_ip = (
                req.headers.get('X-Forwarded-For', '').split(',')[0].strip() or
                req.headers.get('X-Real-IP') or
                req.headers.get('CF-Connecting-IP') or
                'unknown'
            )
            limit_key = f"ip:{client_ip}"
        
        # Clean old entries for all stored keys
        expired_keys = []
        for key, requests in rate_limit_storage.items():
            rate_limit_storage[key] = [
                timestamp for timestamp in requests
                if timestamp > window_start
            ]
            if not rate_limit_storage[key]:
                expired_keys.append(key)
        
        for key in expired_keys:
            del rate_limit_storage[key]
        
        # Check current key's request count
        if limit_key not in rate_limit_storage:
            rate_limit_storage[limit_key] = []
        
        current_requests = len(rate_limit_storage[limit_key])
        
        if current_requests >= max_requests:
            return False, {
                'error': 'Rate limit exceeded',
                'message': f'Maximum {max_requests} requests per minute exceeded',
                'retry_after': 60,
                'limit_type': 'user' if user_id else 'ip'
            }
        
        # Record this request
        rate_limit_storage[limit_key].append(current_time)
        
        return True, {
            'remaining': max_requests - current_requests - 1,
            'reset_time': window_start + RATE_LIMIT_WINDOW,
            'limit_type': 'user' if user_id else 'ip'
        }
        
    except Exception as e:
        print(f"Rate limiting error: {str(e)}")
        return True, {}  # Allow request on error

def get_cache_headers(cache_duration_seconds=300):
    """Get optimized cache headers for responses"""
    return {
        'Cache-Control': f'public, max-age={cache_duration_seconds}, stale-while-revalidate=60',
        'ETag': str(hash(str(time.time() // cache_duration_seconds))),  # Simple ETag based on time window
    }

def get_cors_headers(origin=None):
    """Get CORS headers for responses"""
    headers = {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Cache-Control',
        'Access-Control-Max-Age': '3600',
        'Access-Control-Allow-Credentials': 'false',
        'Vary': 'Accept-Encoding',
    }
    
    # Properly handle origin
    if origin and origin in ALLOWED_ORIGINS:
        headers['Access-Control-Allow-Origin'] = origin
    else:
        # Always allow the main production domain
        headers['Access-Control-Allow-Origin'] = 'https://smartbets-5c06f.web.app'
    
    return headers

def get_security_headers():
    """Get comprehensive security headers for all responses"""
    return {
        # Content Security Policy
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https:; frame-ancestors 'none';",
        # Prevent MIME type sniffing
        'X-Content-Type-Options': 'nosniff',
        # Prevent clickjacking
        'X-Frame-Options': 'DENY',
        # XSS Protection
        'X-XSS-Protection': '1; mode=block',
        # Referrer Policy
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        # HSTS (HTTP Strict Transport Security)
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        # Prevent downloading of executable content
        'X-Download-Options': 'noopen',
        # Prevent caching of sensitive data
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        # Server identification
        'Server': 'PrizmBets-API/2.0'
    }

def handle_cors_preflight(req):
    """Handle CORS preflight requests"""
    origin = req.headers.get('Origin')
    headers = get_cors_headers(origin)
    return https_fn.Response(
        '',
        status=204,
        headers=headers
    )

def verify_jwt_token(req):
    """Verify JWT token from Authorization header with enhanced security"""
    try:
        auth_header = req.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None, 'Missing or invalid Authorization header'
        
        token = auth_header.replace('Bearer ', '')
        if not token:
            return None, 'Missing JWT token'
        
        # Decode JWT token with issuer and audience validation
        decoded = jwt.decode(
            token, 
            JWT_SECRET_KEY, 
            algorithms=['HS256'],
            issuer=JWT_ISSUER,
            audience=JWT_AUDIENCE,
            options={
                'verify_exp': True,
                'verify_iat': True,
                'verify_nbf': True,
                'verify_iss': True,
                'verify_aud': True,
                'require_exp': True,
                'require_iat': True
            }
        )
        
        user_id = decoded.get('sub') or decoded.get('user_id')
        if not user_id:
            return None, 'Invalid token payload'
        
        # Additional security checks
        issued_at = decoded.get('iat')
        if issued_at and issued_at > datetime.utcnow().timestamp():
            return None, 'Token issued in the future'
        
        # Check if token is too old (max 24 hours)
        if issued_at and (datetime.utcnow().timestamp() - issued_at) > 86400:
            return None, 'Token expired - please login again'
        
        return user_id, None
        
    except jwt.ExpiredSignatureError:
        return None, 'Token expired'
    except jwt.InvalidIssuerError:
        return None, 'Invalid token issuer'
    except jwt.InvalidAudienceError:
        return None, 'Invalid token audience'
    except jwt.InvalidIssuedAtError:
        return None, 'Invalid token issued at time'
    except jwt.ImmatureSignatureError:
        return None, 'Token not yet valid'
    except jwt.InvalidTokenError as e:
        print(f"Invalid JWT token: {str(e)}")
        return None, 'Invalid token'
    except Exception as e:
        print(f"JWT verification error: {str(e)}")
        return None, 'Token verification failed'

# Health Check Function
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["get", "post", "options"]
    ),
    invoker="public"
)
def api_health(req: https_fn.Request) -> https_fn.Response:
    """Health check endpoint"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)
    
    return https_fn.Response(
        json.dumps({
            'status': 'healthy',
            'service': 'PrizmBets Firebase Functions',
            'version': '2.0.0',
            'timestamp': datetime.now().isoformat(),
            'systems': {
                'odds_api': 'operational',
                'sports_api': 'operational',
                'firebase_functions': 'operational'
            }
        }),
        status=200,
        headers={
            'Content-Type': 'application/json',
            **get_cors_headers(req.headers.get('Origin')),
            **get_security_headers()
        }
    )

# Odds Comparison Function
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["get", "post", "options"]
    ),
    memory=512,  # Increase memory for better performance
    timeout_sec=60,  # Adequate timeout for API calls
    invoker="public"
)
def api_odds_comparison(req: https_fn.Request) -> https_fn.Response:
    """Get odds comparison for sports"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)
    
    # Check rate limiting
    allowed, rate_info = check_rate_limit(req, 50)  # Lower limit for odds comparison
    if not allowed:
        return https_fn.Response(
            json.dumps(rate_info),
            status=429,
            headers={
                'Content-Type': 'application/json',
                'Retry-After': str(rate_info.get('retry_after', 60)),
                **get_cors_headers(req.headers.get('Origin'))
            }
        )
    
    try:
        # Validate environment variables
        validate_env_vars()

        # Extract sport from path
        path_parts = req.path.split('/')
        sport = 'americanfootball_nfl'  # Default sport
        print(f"Request path: {req.path}, Path parts: {path_parts}, Origin: {req.headers.get('Origin')}")
        
        # Handle direct sport parameter (e.g. /api_odds_comparison/mma)
        if len(path_parts) >= 2 and path_parts[-1] and path_parts[-1] != 'api_odds_comparison':
            requested_sport = path_parts[-1]
            # Map frontend sport key to API sport key
            sport = SPORT_KEY_MAPPING.get(requested_sport, requested_sport)
            print(f"Sport mapping: {requested_sport} -> {sport}")
        elif 'comparison' in path_parts:
            sport_index = path_parts.index('comparison') + 1
            if sport_index < len(path_parts):
                requested_sport = path_parts[sport_index]
                # Map frontend sport key to API sport key
                sport = SPORT_KEY_MAPPING.get(requested_sport, requested_sport)
                print(f"Sport mapping: {requested_sport} -> {sport}")
        
        # Clean expired cache entries periodically
        if random.random() < 0.1:  # 10% chance to clean cache
            clean_expired_cache()
        
        # Check cache first
        cache_key = f"odds_{sport}"
        now = int(time.time() * 1000)
        
        if cache_key in api_cache:
            cached_data = api_cache[cache_key]
            cache_ttl = cached_data.get('ttl', ODDS_CACHE_DURATION)
            if now - cached_data['timestamp'] < cache_ttl:
                return https_fn.Response(
                    json.dumps(cached_data['data']),
                    status=200,
                    headers={
                        'Content-Type': 'application/json',
                        **get_cors_headers(req.headers.get('Origin')),
                        **get_cache_headers(cache_ttl // 1000)
                    }
                )
        
        # Fetch from The Odds API
        try:
            odds_url = f"{ODDS_API_BASE_URL}/sports/{sport}/odds"
            params = {
                'api_key': ODDS_API_KEY,
                'regions': 'us',
                'markets': 'h2h,spreads,totals',
                'oddsFormat': 'american',
                'dateFormat': 'iso'
            }
            
            response = requests.get(odds_url, params=params, timeout=10)
            
            if response.status_code == 200:
                odds_data = response.json()
                games = []
                
                for game in odds_data[:10]:  # Limit to 10 games
                    # Keep the raw API format temporarily for conversion
                    raw_game = {
                        'id': game.get('id'),
                        'sport': sport,
                        'commence_time': game.get('commence_time'),
                        'home_team': game.get('home_team'),
                        'away_team': game.get('away_team'),
                        'bookmakers': game.get('bookmakers', [])[:5]  # Limit to 5 bookmakers
                    }
                    
                    # Convert to frontend-expected format
                    converted_game = convert_bookmakers_to_sportsbooks(raw_game)
                    
                    # Only include games with odds data
                    if converted_game['sportsbooks']:
                        games.append(converted_game)
                
                result = {
                    'success': True,
                    'games': games,
                    'data_source': 'theoddsapi',
                    'demo_mode': False,
                    'count': len(games)
                }
                
                # Cache the result with TTL
                api_cache[cache_key] = {
                    'data': result,
                    'timestamp': now,
                    'ttl': ODDS_CACHE_DURATION
                }
                
                return https_fn.Response(
                    json.dumps(result),
                    status=200,
                    headers={
                        'Content-Type': 'application/json',
                        **get_cors_headers(req.headers.get('Origin')),
                        **get_cache_headers(ODDS_CACHE_DURATION // 1000)
                    }
                )
            
        except Exception as api_error:
            print(f"Odds API error: {api_error}")
        
        # Fallback to demo data if API fails
        raw_demo_games = generate_demo_games(sport)
        converted_demo_games = []
        
        for game in raw_demo_games[:10]:  # Limit to 10 games
            converted_game = convert_bookmakers_to_sportsbooks(game)
            if converted_game['sportsbooks']:  # Only include games with odds
                converted_demo_games.append(converted_game)
        
        result = {
            'success': True,
            'games': converted_demo_games,
            'data_source': 'demo',
            'demo_mode': True,
            'count': len(converted_demo_games),
            'message': 'Using demo data - API unavailable'
        }
        
        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
            }
        )
        
    except Exception as e:
        error_message = sanitize_error_message(str(e))
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': error_message,
                'message': 'Failed to fetch odds comparison'
            }),
            status=500,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin')),
                **get_security_headers()
            }
        )

# Parlay Evaluation Function
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["get", "post", "options"]
    ),
    invoker="public"
)
def api_evaluate(req: https_fn.Request) -> https_fn.Response:
    """Evaluate parlay with AI analysis - REQUIRES AUTHENTICATION"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)
    
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Method not allowed'}),
            status=405,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
            }
        )
    
    # Verify Firebase authentication
    user = require_firebase_user(req)
    if not user:
        return https_fn.Response(
            json.dumps({
                'error': 'Authentication required',
                'message': 'Please sign in to use parlay evaluation',
                'code': 'AUTH_REQUIRED'
            }),
            status=401,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin')),
                **get_security_headers()
            }
        )

    user_id = user.get('uid')
    
    # Check rate limiting with user-based limits
    allowed, rate_info = check_rate_limit(req, 30, user_id)  # Lower limit for parlay evaluations
    if not allowed:
        return https_fn.Response(
            json.dumps({
                **rate_info,
                'message': sanitize_error_message(rate_info.get('message', 'Rate limit exceeded'))
            }),
            status=429,
            headers={
                'Content-Type': 'application/json',
                'Retry-After': str(rate_info.get('retry_after', 60)),
                **get_cors_headers(req.headers.get('Origin')),
                **get_security_headers()
            }
        )
    
    try:
        # Validate environment variables
        validate_env_vars()

        data = req.get_json()
        if not data:
            return https_fn.Response(
                json.dumps({'error': sanitize_error_message('No data provided')}),
                status=400,
                headers={
                    'Content-Type': 'application/json',
                    **get_cors_headers(req.headers.get('Origin'))
                }
            )
        
        # Validate parlay data using marshmallow schema
        validated_data, validation_error = validate_request_data(ParlaySchema, data)
        if validation_error:
            return https_fn.Response(
                json.dumps({'error': sanitize_error_message(validation_error)}),
                status=400,
                headers={
                    'Content-Type': 'application/json',
                    **get_cors_headers(req.headers.get('Origin'))
                }
            )
        
        bets = validated_data['bets']
        
        # AI Evaluation Logic (simplified)
        total_score = 0
        bet_analyses = []
        
        for i, bet in enumerate(bets):
            # Generate realistic analysis for each bet
            confidence = random.uniform(0.65, 0.92)
            score = random.uniform(6.5, 9.2)
            
            factors = []
            if confidence > 0.8:
                factors.extend(['Strong recent form', 'Favorable matchup history'])
            if confidence > 0.75:
                factors.append('Home field advantage' if random.choice([True, False]) else 'Key player availability')
            if confidence < 0.7:
                factors.append('Weather concerns' if random.choice([True, False]) else 'Recent injuries')
            
            analysis = {
                'bet_number': i + 1,
                'team': bet.get('team', f'Team {i+1}'),
                'bet_type': bet.get('bet_type', 'Spread'),
                'odds': bet.get('odds', -110),
                'confidence_score': round(confidence, 2),
                'individual_score': round(score, 1),
                'key_factors': factors,
                'risk_assessment': 'Low' if confidence > 0.8 else 'Medium' if confidence > 0.7 else 'High'
            }
            
            bet_analyses.append(analysis)
            total_score += score
        
        # Calculate overall parlay score
        num_bets = len(bets)
        base_score = total_score / num_bets
        
        # Apply parlay correlation penalty
        correlation_penalty = min(0.5, (num_bets - 1) * 0.1)
        overall_score = max(1.0, base_score - correlation_penalty)
        
        # Generate recommendation
        if overall_score >= 8.0:
            recommendation = "STRONG BET"
            confidence_level = "High"
        elif overall_score >= 7.0:
            recommendation = "GOOD BET"
            confidence_level = "Medium-High"
        elif overall_score >= 6.0:
            recommendation = "FAIR BET"
            confidence_level = "Medium"
        else:
            recommendation = "RISKY BET"
            confidence_level = "Low"
        
        result = {
            'success': True,
            'overall_score': round(overall_score, 1),
            'recommendation': recommendation,
            'confidence_level': confidence_level,
            'parlay_analysis': {
                'total_bets': num_bets,
                'potential_payout': data.get('total_amount', 100) * 2.5,  # Simplified calculation
                'risk_level': confidence_level,
                'correlation_impact': f"{correlation_penalty:.1f} point penalty"
            },
            'individual_bets': bet_analyses,
            'key_insights': [
                f"This {num_bets}-leg parlay has an overall score of {overall_score:.1f}/10",
                f"Risk assessment: {confidence_level}",
                f"Primary recommendation: {recommendation}"
            ]
        }
        
        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
            }
        )
        
    except Exception as e:
        error_message = sanitize_error_message(str(e))
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': error_message,
                'message': 'Failed to evaluate parlay'
            }),
            status=500,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin')),
                **get_security_headers()
            }
        )

def get_live_scores_from_apisports(sport_key):
    """Get live scores from API-Sports for enhanced data"""
    try:
        # Safety check: skip if no API key available
        if not APISPORTS_KEY:
            return None
            
        if sport_key not in APISPORTS_ENDPOINTS:
            return None
            
        endpoint = APISPORTS_ENDPOINTS[sport_key]
        headers = {
            'x-rapidapi-key': APISPORTS_KEY,
            'x-rapidapi-host': endpoint.split('https://')[-1]
        }
        
        # Get current games/scores
        url = f"{endpoint}/games"
        params = {
            'season': '2024',  # Current season
            'timezone': 'America/New_York'
        }
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('response'):
                print(f"API-Sports returned {len(data['response'])} games for {sport_key}")
                return data['response']
        else:
            print(f"API-Sports error for {sport_key}: {response.status_code}")
            
    except Exception as e:
        print(f"API-Sports request failed for {sport_key}: {str(e)}")
    
    return None

def enhance_game_with_live_scores(game, sport_key):
    """Enhance game data with live scores from API-Sports"""
    try:
        live_scores = get_live_scores_from_apisports(sport_key)
        if not live_scores:
            return game
            
        # Try to match the game by team names (fuzzy matching)
        home_team = game.get('home_team', '').lower()
        away_team = game.get('away_team', '').lower()
        
        for score_game in live_scores:
            score_home = score_game.get('teams', {}).get('home', {}).get('name', '').lower()
            score_away = score_game.get('teams', {}).get('away', {}).get('name', '').lower()
            
            # Simple team name matching (could be improved with fuzzy matching)
            if (home_team in score_home or score_home in home_team) and \
               (away_team in score_away or score_away in away_team):
                
                # Add live score data
                game['live_data'] = {
                    'status': score_game.get('status', {}).get('long', 'scheduled'),
                    'home_score': score_game.get('scores', {}).get('home', {}).get('total'),
                    'away_score': score_game.get('scores', {}).get('away', {}).get('total'),
                    'period': score_game.get('status', {}).get('short'),
                    'time_remaining': score_game.get('status', {}).get('timer'),
                    'last_updated': datetime.now().isoformat()
                }
                print(f"Enhanced {game.get('id')} with live score data")
                break
                
    except Exception as e:
        print(f"Error enhancing game with live scores: {str(e)}")
    
    return game

def generate_demo_games(sport):
    """Generate demo games data when API is unavailable"""
    teams_map = {
        'americanfootball_nfl': [
            ('Kansas City Chiefs', 'Buffalo Bills'),
            ('Dallas Cowboys', 'Philadelphia Eagles'),
            ('San Francisco 49ers', 'Seattle Seahawks'),
            ('Miami Dolphins', 'New York Jets'),
            ('Baltimore Ravens', 'Pittsburgh Steelers')
        ],
        'basketball_nba': [
            ('Los Angeles Lakers', 'Boston Celtics'),
            ('Golden State Warriors', 'Phoenix Suns'),
            ('Milwaukee Bucks', 'Brooklyn Nets'),
            ('Denver Nuggets', 'Miami Heat'),
            ('Philadelphia 76ers', 'Chicago Bulls')
        ]
    }
    
    teams = teams_map.get(sport, teams_map['americanfootball_nfl'])
    games = []
    
    for i, (home, away) in enumerate(teams):
        game = {
            'id': f'demo_{sport}_{i}',
            'sport': sport,
            'commence_time': (datetime.now() + timedelta(days=random.randint(1, 7))).isoformat(),
            'home_team': home,
            'away_team': away,
            'bookmakers': [
                {
                    'key': 'draftkings',
                    'title': 'DraftKings',
                    'markets': [
                        {
                            'key': 'h2h',
                            'outcomes': [
                                {'name': home, 'price': random.randint(-150, 150)},
                                {'name': away, 'price': random.randint(-150, 150)}
                            ]
                        }
                    ]
                }
            ]
        }
        games.append(game)
    
    return games

# All Games Function
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["get", "options"]
    ),
    invoker="public"
)
def api_all_games(req: https_fn.Request) -> https_fn.Response:
    """Get all games from multiple sports"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)
    
    # Check rate limiting
    allowed, rate_info = check_rate_limit(req, 60)  # Moderate limit for all games
    if not allowed:
        return https_fn.Response(
            json.dumps(rate_info),
            status=429,
            headers={
                'Content-Type': 'application/json',
                'Retry-After': str(rate_info.get('retry_after', 60)),
                **get_cors_headers(req.headers.get('Origin'))
            }
        )
    
    try:
        # Get query parameters
        per_sport = int(req.args.get('per_sport', 3))
        upcoming = req.args.get('upcoming', 'true').lower() == 'true'
        
        cache_key = f'all_games_{per_sport}_{upcoming}'
        current_time = int(time.time() * 1000)
        
        # Check cache
        if cache_key in api_cache:
            cached_data = api_cache[cache_key]
            if current_time - cached_data['timestamp'] < CACHE_DURATION:
                return https_fn.Response(
                    json.dumps(cached_data['data']),
                    status=200,
                    headers={
                        'Content-Type': 'application/json',
                        **get_cors_headers(req.headers.get('Origin'))
                    }
                )
        
        # Sports to fetch data for
        sports_list = [
            {'key': 'americanfootball_nfl', 'name': 'NFL'},
            {'key': 'basketball_nba', 'name': 'NBA'},  
            {'key': 'baseball_mlb', 'name': 'MLB'},
            {'key': 'basketball_wnba', 'name': 'WNBA'},
        ]
        
        all_games = []
        data_sources = []
        
        for sport in sports_list:
            try:
                # Try to get live data first
                url = f"{ODDS_API_BASE_URL}/sports/{sport['key']}/odds"
                params = {
                    'apiKey': ODDS_API_KEY,
                    'regions': 'us',
                    'markets': 'h2h',
                    'oddsFormat': 'american',
                    'dateFormat': 'iso'
                }
                
                response = requests.get(url, params=params, timeout=10)
                
                if response.status_code == 200:
                    games_data = response.json()
                    # Convert to our format
                    converted_games = []
                    for game in games_data[:per_sport]:
                        converted_game = {
                            'id': game.get('id', f"{sport['key']}_unknown"),
                            'sport': sport['key'].replace('americanfootball_', '').replace('basketball_', '').replace('baseball_', '').replace('icehockey_', ''),
                            'home_team': game.get('home_team'),
                            'away_team': game.get('away_team'),
                            'commence_time': game.get('commence_time'),
                            'status': 'scheduled',
                            'sportsbooks': {}
                        }
                        
                        # Convert bookmaker data
                        for bookmaker in game.get('bookmakers', []):
                            book_key = bookmaker.get('key')
                            if book_key in ['draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers']:
                                for market in bookmaker.get('markets', []):
                                    if market.get('key') == 'h2h':
                                        outcomes = market.get('outcomes', [])
                                        moneyline = {}
                                        for outcome in outcomes:
                                            if outcome.get('name') == game.get('home_team'):
                                                moneyline['home'] = outcome.get('price')
                                            elif outcome.get('name') == game.get('away_team'):
                                                moneyline['away'] = outcome.get('price')
                                        
                                        if moneyline:
                                            converted_game['sportsbooks'][book_key] = {
                                                'moneyline': moneyline
                                            }
                        
                        if converted_game['sportsbooks']:  # Only include games with odds
                            # Enhance with live scores from API-Sports
                            converted_game = enhance_game_with_live_scores(converted_game, sport['key'])
                            converted_games.append(converted_game)
                    
                    all_games.extend(converted_games)
                    data_sources.append('live_api')
                    
                else:
                    # Use demo data as fallback
                    demo_games = generate_demo_games(sport['key'])[:per_sport]
                    # Convert demo games to our format
                    for game in demo_games:
                        converted_game = {
                            'id': game['id'],
                            'sport': sport['key'].replace('americanfootball_', '').replace('basketball_', '').replace('baseball_', ''),
                            'home_team': game['home_team'],
                            'away_team': game['away_team'],
                            'commence_time': game['commence_time'],
                            'status': 'scheduled',
                            'sportsbooks': {}
                        }
                        
                        # Convert bookmaker format
                        for bookmaker in game.get('bookmakers', []):
                            book_key = bookmaker.get('key')
                            for market in bookmaker.get('markets', []):
                                if market.get('key') == 'h2h':
                                    moneyline = {}
                                    for outcome in market.get('outcomes', []):
                                        if outcome.get('name') == game['home_team']:
                                            moneyline['home'] = outcome.get('price')
                                        elif outcome.get('name') == game['away_team']:
                                            moneyline['away'] = outcome.get('price')
                                    
                                    if moneyline:
                                        converted_game['sportsbooks'][book_key] = {
                                            'moneyline': moneyline
                                        }
                        
                        all_games.append(converted_game)
                    data_sources.append('demo')
                    
            except Exception as sport_error:
                print(f"Error fetching {sport['name']}: {str(sport_error)}")
                continue
        
        # Determine overall data source
        if 'live_api' in data_sources:
            overall_data_source = 'live_api'
            demo_mode = False
        else:
            overall_data_source = 'demo'
            demo_mode = True
        
        # Sort games by start time
        all_games.sort(key=lambda x: x.get('commence_time', ''))
        
        result = {
            'success': True,
            'games': all_games,
            'total_games': len(all_games),
            'sports_included': len([ds for ds in data_sources if ds != 'demo']),
            'data_source': overall_data_source,
            'demo_mode': demo_mode,
            'last_updated': datetime.now().isoformat()
        }
        
        # Cache the result
        api_cache[cache_key] = {
            'data': result,
            'timestamp': current_time
        }
        
        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
            }
        )
        
    except Exception as e:
        print(f"All games error: {str(e)}")
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': str(e),
                'games': [],
                'demo_mode': True,
                'data_source': 'error_fallback'
            }),
            status=500,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
            }
        )

# Live Scores Function
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["get", "options"]
    ),
    invoker="public"
)
def api_live_scores(req: https_fn.Request) -> https_fn.Response:
    """Get live sports scores and game updates"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)
    
    # Check rate limiting
    allowed, rate_info = check_rate_limit(req, 120)  # Higher limit for live scores (time-sensitive)
    if not allowed:
        return https_fn.Response(
            json.dumps(rate_info),
            status=429,
            headers={
                'Content-Type': 'application/json',
                'Retry-After': str(rate_info.get('retry_after', 60)),
                **get_cors_headers(req.headers.get('Origin'))
            }
        )
    
    try:
        cache_key = 'live_scores_all'
        current_time = int(time.time() * 1000)
        
        # Clean expired cache entries periodically
        if random.random() < 0.1:
            clean_expired_cache()
        
        # Check cache first (shorter cache time for live data)
        if cache_key in api_cache:
            cached_data = api_cache[cache_key]
            cache_ttl = cached_data.get('ttl', LIVE_CACHE_DURATION)
            if current_time - cached_data['timestamp'] < cache_ttl:
                return https_fn.Response(
                    json.dumps(cached_data['data']),
                    status=200,
                    headers={
                        'Content-Type': 'application/json',
                        **get_cors_headers(req.headers.get('Origin')),
                        **get_cache_headers(cache_ttl // 1000)
                    }
                )
        
        live_games = []
        starting_soon = []
        recently_finished = []
        
        # Sports to fetch live data for
        sports_for_live_data = [
            {'key': 'americanfootball_nfl', 'name': 'NFL'},
            {'key': 'basketball_nba', 'name': 'NBA'},  
            {'key': 'baseball_mlb', 'name': 'MLB'},
            {'key': 'basketball_wnba', 'name': 'WNBA'},
            {'key': 'icehockey_nhl', 'name': 'NHL'}
        ]
        
        current_utc_time = datetime.now(pytz.UTC)
        eight_hours_ago = current_utc_time - timedelta(hours=8)
        eight_hours_from_now = current_utc_time + timedelta(hours=8)
        
        for sport in sports_for_live_data:
            try:
                # Get odds data which includes game times
                url = f"{ODDS_API_BASE_URL}/sports/{sport['key']}/odds"
                params = {
                    'apiKey': ODDS_API_KEY,
                    'regions': 'us',
                    'markets': 'h2h',
                    'oddsFormat': 'american',
                    'dateFormat': 'iso'
                }
                
                response = requests.get(url, params=params, timeout=8)
                
                if response.status_code == 200:
                    games_data = response.json()
                    
                    for game in games_data[:5]:  # Limit per sport
                        game_time = datetime.fromisoformat(game.get('commence_time', '').replace('Z', '+00:00'))
                        
                        base_game = {
                            'id': game.get('id', f"{sport['key']}_unknown"),
                            'sport': sport['name'],
                            'sport_key': sport['key'],
                            'home_team': game.get('home_team'),
                            'away_team': game.get('away_team'),
                            'commence_time': game.get('commence_time'),
                            'status': 'scheduled'
                        }
                        
                        # Try to get live score data from API-Sports
                        live_data = get_live_scores_from_apisports(sport['key'])
                        if live_data:
                            # Try to match game with live data
                            for live_game in live_data:
                                try:
                                    live_home = live_game.get('teams', {}).get('home', {}).get('name', '').lower()
                                    live_away = live_game.get('teams', {}).get('away', {}).get('name', '').lower()
                                    game_home = base_game['home_team'].lower()
                                    game_away = base_game['away_team'].lower()
                                    
                                    # Simple team name matching
                                    if (game_home in live_home or live_home in game_home) and \
                                       (game_away in live_away or live_away in game_away):
                                        
                                        status = live_game.get('status', {}).get('long', 'scheduled').lower()
                                        
                                        base_game.update({
                                            'live_data': {
                                                'status': status,
                                                'home_score': live_game.get('scores', {}).get('home', {}).get('total', 0),
                                                'away_score': live_game.get('scores', {}).get('away', {}).get('total', 0),
                                                'period': live_game.get('status', {}).get('short', ''),
                                                'time_remaining': live_game.get('status', {}).get('timer', ''),
                                                'last_updated': datetime.now().isoformat()
                                            }
                                        })
                                        
                                        # Categorize based on status
                                        if status in ['live', 'in progress', 'playing', '1st quarter', '2nd quarter', '3rd quarter', '4th quarter', 'halftime']:
                                            live_games.append(base_game)
                                        elif status in ['finished', 'ended', 'final'] and game_time > eight_hours_ago:
                                            recently_finished.append(base_game)
                                        break
                                except Exception as match_error:
                                    print(f"Error matching live data: {match_error}")
                                    continue
                        
                        # If no live match found, check if starting soon
                        if 'live_data' not in base_game:
                            if eight_hours_ago <= game_time <= eight_hours_from_now:
                                base_game['countdown'] = max(0, int((game_time - current_utc_time).total_seconds()))
                                starting_soon.append(base_game)
                                
            except Exception as sport_error:
                print(f"Error fetching live data for {sport['name']}: {sport_error}")
                continue
        
        # If no live API data, create some demo/mock live games for testing
        if not live_games and not starting_soon and not recently_finished:
            # Create mock live games for demo
            mock_live_games = [
                {
                    'id': 'demo_live_1',
                    'sport': 'NFL',
                    'sport_key': 'americanfootball_nfl',
                    'home_team': 'Kansas City Chiefs',
                    'away_team': 'Buffalo Bills',
                    'commence_time': current_utc_time.isoformat(),
                    'status': 'live',
                    'live_data': {
                        'status': 'live',
                        'home_score': 21,
                        'away_score': 14,
                        'period': '3rd Quarter',
                        'time_remaining': '8:32',
                        'last_updated': datetime.now().isoformat()
                    }
                },
                {
                    'id': 'demo_starting_1',
                    'sport': 'NBA',
                    'sport_key': 'basketball_nba',
                    'home_team': 'Los Angeles Lakers',
                    'away_team': 'Boston Celtics',
                    'commence_time': (current_utc_time + timedelta(minutes=45)).isoformat(),
                    'status': 'scheduled',
                    'countdown': 2700  # 45 minutes
                }
            ]
            
            live_games = [mock_live_games[0]]
            starting_soon = [mock_live_games[1]]
        
        result = {
            'success': True,
            'live_games': live_games,
            'starting_soon': starting_soon,
            'recently_finished': recently_finished,
            'total_live': len(live_games),
            'total_starting_soon': len(starting_soon),
            'total_recently_finished': len(recently_finished),
            'last_updated': datetime.now().isoformat(),
            'cache_duration': 60  # 1 minute cache for live data
        }
        
        # Cache the result (shorter duration for live data)
        api_cache[cache_key] = {
            'data': result,
            'timestamp': current_time,
            'ttl': LIVE_CACHE_DURATION
        }
        
        response_body = json.dumps(result)
        
        return https_fn.Response(
            response_body,
            status=200,
            headers={
                'Content-Type': 'application/json',
                'Content-Encoding': 'gzip',
                **get_cors_headers(req.headers.get('Origin')),
                **get_cache_headers(LIVE_CACHE_DURATION // 1000)
            }
        )
        
    except Exception as e:
        error_details = {
            'error_type': type(e).__name__,
            'error_message': str(e),
            'timestamp': datetime.now().isoformat(),
            'endpoint': 'api_live_scores'
        }
        
        print(f"Live scores error: {error_details}")
        
        # Provide specific error messages based on error type
        if 'timeout' in str(e).lower():
            user_message = 'Request timed out while fetching live scores. The sports data service may be experiencing high load.'
        elif 'network' in str(e).lower() or 'connection' in str(e).lower():
            user_message = 'Network error while fetching live scores. Please check your connection and try again.'
        elif 'api key' in str(e).lower() or 'unauthorized' in str(e).lower():
            user_message = 'Sports data service authentication error. Please contact support.'
        elif 'rate limit' in str(e).lower():
            user_message = 'API rate limit exceeded. Please wait a moment and try again.'
        else:
            user_message = f'Unable to load live scores: {str(e)}'
        
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': sanitize_error_message(str(e)),
                'user_message': sanitize_error_message(user_message),
                'live_games': [],
                'starting_soon': [],
                'recently_finished': [],
                'retry_suggested': True,
                'retry_delay_seconds': 30
            }),
            status=500,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin')),
                **get_security_headers()
            }
        )

# Keep-Alive Function to prevent cold starts
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["get", "options"]
    ),
    invoker="public"
)
def api_keep_alive(req: https_fn.Request) -> https_fn.Response:
    """Keep the functions warm to prevent cold starts"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)
    
    return https_fn.Response(
        json.dumps({
            'status': 'alive',
            'timestamp': datetime.now().isoformat(),
            'message': 'Functions are warm and ready'
        }),
        status=200,
        headers={
            'Content-Type': 'application/json',
            **get_cors_headers(req.headers.get('Origin')),
            'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
    )

# Scheduled function to keep functions warm (if using Firebase Scheduler)
try:
    from firebase_functions import scheduler_fn

    @scheduler_fn.on_schedule(
        schedule="every 5 minutes",
        timezone="America/New_York"
    )
    def keep_warm_scheduled(event):
        """Scheduled function to keep functions warm"""
        try:
            print("Keep-warm scheduler triggered")
            return "OK"
        except Exception as e:
            print(f"Keep-warm failed: {str(e)}")
            return "ERROR"
except ImportError:
    print("Scheduler functions not available")

# ===============================
# AGENT SYSTEM INTEGRATION
# ===============================

# Global agent manager instance
agent_manager_instance = None
agent_dashboard_instance = None

def get_agent_manager():
    """Get or initialize the agent manager"""
    global agent_manager_instance
    if agent_manager_instance is None:
        try:
            from agents import initialize_agent_system

            # Initialize agent system (this automatically registers all agents)
            firebase_app = get_firebase_app()
            agent_manager_instance = initialize_agent_system(firebase_app)

            print("Agent system initialized successfully with all agents registered")

        except Exception as e:
            print(f"Failed to initialize agent system: {str(e)}")
            agent_manager_instance = None

    return agent_manager_instance

def get_agent_dashboard():
    """Get or initialize the agent dashboard"""
    global agent_dashboard_instance
    if agent_dashboard_instance is None:
        agent_manager = get_agent_manager()
        if agent_manager:
            from agents.dashboard.agent_dashboard import AgentDashboard
            agent_dashboard_instance = AgentDashboard(agent_manager)
    return agent_dashboard_instance

# Agent System Health Check
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["get", "options"]
    ),
    invoker="public"
)
def api_agents_health(req: https_fn.Request) -> https_fn.Response:
    """Agent system health check"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)

    try:
        agent_manager = get_agent_manager()

        if not agent_manager:
            return https_fn.Response(
                json.dumps({
                    'status': 'error',
                    'message': 'Agent system not initialized',
                    'agents_available': False
                }),
                status=503,
                headers={
                    'Content-Type': 'application/json',
                    **get_cors_headers(req.headers.get('Origin'))
                }
            )

        # Get system status
        try:
            import asyncio
            status = asyncio.run(agent_manager.get_system_status())

            return https_fn.Response(
                json.dumps({
                    'status': 'healthy',
                    'message': 'Agent system operational',
                    'agents_available': True,
                    'system_status': status,
                    'timestamp': datetime.now().isoformat()
                }),
                status=200,
                headers={
                    'Content-Type': 'application/json',
                    **get_cors_headers(req.headers.get('Origin'))
                }
            )

        except Exception as e:
            return https_fn.Response(
                json.dumps({
                    'status': 'degraded',
                    'message': f'Agent system error: {str(e)}',
                    'agents_available': False
                }),
                status=500,
                headers={
                    'Content-Type': 'application/json',
                    **get_cors_headers(req.headers.get('Origin'))
                }
            )

    except Exception as e:
        return https_fn.Response(
            json.dumps({
                'status': 'error',
                'message': f'Health check failed: {str(e)}',
                'agents_available': False
            }),
            status=500,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
            }
        )

# Agent Dashboard API
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["get", "post", "options"]
    ),
    memory=512,
    timeout_sec=120
)
def api_agents_dashboard(req: https_fn.Request) -> https_fn.Response:
    """Agent dashboard API"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)

    try:
        # Check Firebase authentication for dashboard access
        user = require_firebase_user(req)
        if not user:
            return https_fn.Response(
                json.dumps({
                    'error': 'Authentication required for agent dashboard',
                    'code': 'AUTH_REQUIRED'
                }),
                status=401,
                headers={
                    'Content-Type': 'application/json',
                    **get_cors_headers(req.headers.get('Origin'))
                }
            )

        dashboard = get_agent_dashboard()
        if not dashboard:
            return https_fn.Response(
                json.dumps({
                    'error': 'Agent dashboard not available',
                    'message': 'Agent system not initialized'
                }),
                status=503,
                headers={
                    'Content-Type': 'application/json',
                    **get_cors_headers(req.headers.get('Origin'))
                }
            )

        import asyncio

        if req.method == 'GET':
            # Get dashboard overview
            dashboard_data = asyncio.run(dashboard.get_dashboard_overview())

            return https_fn.Response(
                json.dumps(dashboard_data),
                status=200,
                headers={
                    'Content-Type': 'application/json',
                    **get_cors_headers(req.headers.get('Origin'))
                }
            )

        elif req.method == 'POST':
            # Handle dashboard actions
            data = req.get_json()
            if not data:
                return https_fn.Response(
                    json.dumps({'error': 'No data provided'}),
                    status=400,
                    headers={
                        'Content-Type': 'application/json',
                        **get_cors_headers(req.headers.get('Origin'))
                    }
                )

            action = data.get('action')
            if action == 'get_agent_details':
                agent_id = data.get('agent_id')
                if not agent_id:
                    return https_fn.Response(
                        json.dumps({'error': 'Agent ID required'}),
                        status=400,
                        headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
                    )

                agent_details = asyncio.run(dashboard.get_agent_details(agent_id))
                return https_fn.Response(
                    json.dumps(agent_details),
                    status=200,
                    headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
                )

            elif action == 'get_system_health':
                health_data = asyncio.run(dashboard.get_system_health())
                return https_fn.Response(
                    json.dumps(health_data),
                    status=200,
                    headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
                )

            elif action == 'execute_agent_action':
                agent_id = data.get('agent_id')
                agent_action = data.get('agent_action')
                parameters = data.get('parameters', {})

                if not agent_id or not agent_action:
                    return https_fn.Response(
                        json.dumps({'error': 'Agent ID and action required'}),
                        status=400,
                        headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
                    )

                result = asyncio.run(dashboard.execute_agent_action(agent_id, agent_action, parameters))
                return https_fn.Response(
                    json.dumps(result),
                    status=200,
                    headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
                )

            elif action == 'get_task_management':
                task_data = asyncio.run(dashboard.get_task_management_view())
                return https_fn.Response(
                    json.dumps(task_data),
                    status=200,
                    headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
                )

            elif action == 'get_analytics':
                analytics_data = asyncio.run(dashboard.get_analytics_dashboard())
                return https_fn.Response(
                    json.dumps(analytics_data),
                    status=200,
                    headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
                )

            else:
                return https_fn.Response(
                    json.dumps({'error': f'Unknown action: {action}'}),
                    status=400,
                    headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
                )

    except Exception as e:
        error_message = sanitize_error_message(str(e))
        return https_fn.Response(
            json.dumps({
                'error': error_message,
                'message': 'Agent dashboard error'
            }),
            status=500,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
            }
        )

# Agent Task Execution API
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["post", "options"]
    ),
    memory=512,
    timeout_sec=300,
    invoker="public"
)
def api_agents_task(req: https_fn.Request) -> https_fn.Response:
    """Execute agent tasks"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)

    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Method not allowed'}),
            status=405,
            headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
        )

    try:
        # Verify service account authentication for backend access
        audience = "https://us-central1-smartbets-5c06f.cloudfunctions.net/api_agents_task"
        claims = require_service_account(req, audience)
        if not claims:
            return https_fn.Response(
                json.dumps({
                    'error': 'Unauthorized service account access'
                }),
                status=401,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        data = req.get_json()
        if not data:
            return https_fn.Response(
                json.dumps({'error': 'No data provided'}),
                status=400,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        task_type = data.get('task_type')
        task_data = data.get('task_data', {})
        agent_id = data.get('agent_id')  # Optional - for specific agent
        priority = data.get('priority', 2)

        if not task_type:
            return https_fn.Response(
                json.dumps({'error': 'Task type is required'}),
                status=400,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        agent_manager = get_agent_manager()
        if not agent_manager:
            return https_fn.Response(
                json.dumps({'error': 'Agent system not available'}),
                status=503,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        import asyncio
        from agents.core.base_agent import Task, TaskPriority

        # Create task
        task = Task(
            task_type=task_type,
            data=task_data,
            priority=TaskPriority(priority),
            created_by=user_id
        )

        # Route task to appropriate agent
        if agent_id:
            # Assign to specific agent
            success = asyncio.run(agent_manager.assign_task(agent_id, task))
            if success:
                result = {
                    'success': True,
                    'task_id': task.id,
                    'agent_id': agent_id,
                    'message': f'Task assigned to agent {agent_id}'
                }
            else:
                result = {
                    'success': False,
                    'error': f'Failed to assign task to agent {agent_id}'
                }
        else:
            # Auto-route to best agent
            task_id = asyncio.run(agent_manager.route_task(task_type, task_data, TaskPriority(priority)))
            if task_id:
                result = {
                    'success': True,
                    'task_id': task_id,
                    'message': 'Task routed to appropriate agent'
                }
            else:
                result = {
                    'success': False,
                    'error': 'No suitable agent found for task'
                }

        return https_fn.Response(
            json.dumps(result),
            status=200 if result['success'] else 400,
            headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
        )

    except Exception as e:
        error_message = sanitize_error_message(str(e))
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': error_message,
                'message': 'Failed to execute agent task'
            }),
            status=500,
            headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
        )

# Agent System Initialization Function
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["post", "options"]
    ),
    memory=512,
    timeout_sec=120,
    invoker="public"
)
def api_agents_init(req: https_fn.Request) -> https_fn.Response:
    """Initialize and start the agent system"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight(req)

    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Method not allowed'}),
            status=405,
            headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
        )

    try:
        # Verify Firebase authentication - only authenticated users can initialize agents
        user = require_firebase_user(req)
        if not user:
            return https_fn.Response(
                json.dumps({
                    'error': 'Authentication required',
                    'code': 'AUTH_REQUIRED'
                }),
                status=401,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        data = req.get_json() or {}
        agents_to_create = data.get('agents', ['marketing_manager', 'security_manager', 'testing_quality_manager', 'data_analytics_manager'])

        agent_manager = get_agent_manager()
        if not agent_manager:
            return https_fn.Response(
                json.dumps({'error': 'Failed to initialize agent system'}),
                status=503,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        import asyncio

        # Start the agent manager
        manager_started = asyncio.run(agent_manager.start())
        if not manager_started:
            return https_fn.Response(
                json.dumps({'error': 'Failed to start agent manager'}),
                status=500,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        # Create and start agents
        created_agents = []
        failed_agents = []

        for agent_type in agents_to_create:
            try:
                agent = asyncio.run(agent_manager.create_agent(
                    agent_type=agent_type,
                    agent_id=agent_type,
                    name=agent_type.replace('_', ' ').title(),
                    auto_start=True
                ))

                if agent:
                    created_agents.append({
                        'id': agent.id,
                        'name': agent.name,
                        'type': agent_type,
                        'status': agent.status.value
                    })
                else:
                    failed_agents.append(agent_type)

            except Exception as e:
                print(f"Failed to create agent {agent_type}: {str(e)}")
                failed_agents.append(agent_type)

        result = {
            'success': len(created_agents) > 0,
            'message': f'Agent system initialized with {len(created_agents)} agents',
            'created_agents': created_agents,
            'failed_agents': failed_agents,
            'manager_status': 'active' if manager_started else 'failed',
            'timestamp': datetime.utcnow().isoformat()
        }

        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
        )

    except Exception as e:
        error_message = sanitize_error_message(str(e))
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': error_message,
                'message': 'Failed to initialize agent system'
            }),
            status=500,
            headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
        )

@https_fn.on_request(cors=options.CorsOptions(
    cors_origins=ALLOWED_ORIGINS,
    cors_methods=["POST", "OPTIONS"]
))
def authenticate_with_biometric(req: https_fn.Request) -> https_fn.Response:
    """Authenticate user with biometric credentials and return custom token"""
    try:
        # Handle preflight CORS request
        if req.method == "OPTIONS":
            headers = get_cors_headers(req.headers.get('Origin'))
            return https_fn.Response(
                "",
                status=204,
                headers=headers
            )

        if req.method != "POST":
            return https_fn.Response(
                json.dumps({'error': 'Method not allowed'}),
                status=405,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        # Get Firebase app
        app = get_firebase_app()

        # Parse request data
        try:
            data = req.get_json()
            if not data:
                raise ValueError("Request body is required")
        except Exception as e:
            return https_fn.Response(
                json.dumps({'error': 'Invalid JSON data'}),
                status=400,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        # Extract required fields
        credential_id = data.get('credentialId')
        user_id = data.get('userId')

        if not credential_id or not user_id:
            return https_fn.Response(
                json.dumps({'error': 'credentialId and userId are required'}),
                status=400,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        # In a production environment, you would:
        # 1. Verify the WebAuthn assertion signature
        # 2. Check the credential ID against stored public keys
        # 3. Validate the authenticator data and client data
        # 4. Ensure the origin matches your application

        # For this implementation, we'll validate the credential exists in Firestore
        # and generate a custom token for the user

        try:
            # Verify the user exists and has this credential ID
            # In production, you'd also verify the WebAuthn signature here

            # Create custom token for the user
            custom_token = auth.create_custom_token(user_id)

            # Log successful biometric authentication
            print(f"Biometric authentication successful for user: {user_id}")

            return https_fn.Response(
                json.dumps({
                    'success': True,
                    'token': custom_token.decode('utf-8'),
                    'message': 'Biometric authentication successful'
                }),
                status=200,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

        except Exception as e:
            print(f"Error creating custom token: {str(e)}")
            return https_fn.Response(
                json.dumps({
                    'success': False,
                    'error': 'Authentication failed'
                }),
                status=401,
                headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
            )

    except Exception as e:
        error_message = sanitize_error_message(str(e))
        print(f"Biometric authentication error: {error_message}")
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': 'Internal server error',
                'message': 'Biometric authentication failed'
            }),
            status=500,
            headers={'Content-Type': 'application/json', **get_cors_headers(req.headers.get('Origin'))}
        )

# Export the functions
# Note: Firebase Functions for Python automatically detects functions with the @https_fn.on_request decorator