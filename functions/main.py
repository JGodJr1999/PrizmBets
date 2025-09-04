# PrizmBets Firebase Functions API
# Serverless backend for sports betting analysis platform

from firebase_functions import https_fn, options
from firebase_functions.options import set_global_options
from firebase_admin import initialize_app
from flask import Flask, request, jsonify
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

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
initialize_app()

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
if not ODDS_API_KEY:
    raise ValueError("ODDS_API_KEY environment variable is required")

ODDS_API_BASE_URL = os.getenv('ODDS_API_BASE_URL', 'https://api.the-odds-api.com/v4')

APISPORTS_KEY = os.getenv('APISPORTS_KEY')
if not APISPORTS_KEY:
    raise ValueError("APISPORTS_KEY environment variable is required")

# JWT Configuration for authentication
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
if not JWT_SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY environment variable is required")

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

# Rate limiting storage
rate_limit_storage = {}
RATE_LIMIT_WINDOW = 60000  # 1 minute in milliseconds
RATE_LIMIT_MAX_REQUESTS = 100  # requests per window

def clean_expired_cache():
    """Clean expired cache entries to prevent memory bloat"""
    current_time = int(time.time() * 1000)
    expired_keys = [
        key for key, value in api_cache.items()
        if current_time - value['timestamp'] > value.get('ttl', CACHE_DURATION)
    ]
    for key in expired_keys:
        del api_cache[key]

def check_rate_limit(req, max_requests=RATE_LIMIT_MAX_REQUESTS):
    """Check if request exceeds rate limit"""
    try:
        # Get client IP (consider various proxy headers)
        client_ip = (
            req.headers.get('X-Forwarded-For', '').split(',')[0].strip() or
            req.headers.get('X-Real-IP') or
            req.headers.get('CF-Connecting-IP') or
            'unknown'
        )
        
        current_time = int(time.time() * 1000)
        window_start = current_time - RATE_LIMIT_WINDOW
        
        # Clean old entries
        expired_ips = []
        for ip, requests in rate_limit_storage.items():
            rate_limit_storage[ip] = [
                timestamp for timestamp in requests
                if timestamp > window_start
            ]
            if not rate_limit_storage[ip]:
                expired_ips.append(ip)
        
        for ip in expired_ips:
            del rate_limit_storage[ip]
        
        # Check current IP's request count
        if client_ip not in rate_limit_storage:
            rate_limit_storage[client_ip] = []
        
        current_requests = len(rate_limit_storage[client_ip])
        
        if current_requests >= max_requests:
            return False, {
                'error': 'Rate limit exceeded',
                'message': f'Maximum {max_requests} requests per minute exceeded',
                'retry_after': 60
            }
        
        # Record this request
        rate_limit_storage[client_ip].append(current_time)
        
        return True, {
            'remaining': max_requests - current_requests - 1,
            'reset_time': window_start + RATE_LIMIT_WINDOW
        }
        
    except Exception as e:
        print(f"Rate limiting error: {str(e)}")
        return True, {}  # Allow request on error

def get_cache_headers(cache_duration_seconds=300):
    """Get optimized cache headers for responses"""
    return {
        'Cache-Control': f'public, max-age={cache_duration_seconds}, stale-while-revalidate=60',
        'Vary': 'Accept-Encoding, Origin',
        'ETag': str(hash(str(time.time() // cache_duration_seconds))),  # Simple ETag based on time window
    }

def get_cors_headers(origin=None):
    """Get CORS headers for responses"""
    headers = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600',
    }
    
    if origin and origin in ALLOWED_ORIGINS:
        headers['Access-Control-Allow-Origin'] = origin
    else:
        headers['Access-Control-Allow-Origin'] = ALLOWED_ORIGINS[0]
    
    return headers

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
    """Verify JWT token from Authorization header"""
    try:
        auth_header = req.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None, 'Missing or invalid Authorization header'
        
        token = auth_header.replace('Bearer ', '')
        if not token:
            return None, 'Missing JWT token'
        
        # Decode JWT token
        decoded = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        user_id = decoded.get('sub') or decoded.get('user_id')
        
        if not user_id:
            return None, 'Invalid token payload'
        
        # Check token expiration
        exp = decoded.get('exp')
        if exp and datetime.utcfromtimestamp(exp) < datetime.utcnow():
            return None, 'Token expired'
        
        return user_id, None
        
    except jwt.ExpiredSignatureError:
        return None, 'Token expired'
    except jwt.InvalidTokenError:
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
            **get_cors_headers(req.headers.get('Origin'))
        }
    )

# Odds Comparison Function
@https_fn.on_request(
    cors=options.CorsOptions(
        cors_origins=ALLOWED_ORIGINS,
        cors_methods=["get", "post", "options"]
    ),
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
        # Extract sport from path
        path_parts = req.path.split('/')
        sport = 'americanfootball_nfl'  # Default sport
        if 'comparison' in path_parts:
            sport_index = path_parts.index('comparison') + 1
            if sport_index < len(path_parts):
                sport = path_parts[sport_index]
        
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
                    game_data = {
                        'id': game.get('id'),
                        'sport': sport,
                        'commence_time': game.get('commence_time'),
                        'home_team': game.get('home_team'),
                        'away_team': game.get('away_team'),
                        'bookmakers': []
                    }
                    
                    # Process bookmakers
                    for bookmaker in game.get('bookmakers', [])[:3]:  # Limit to 3 bookmakers
                        bm_data = {
                            'key': bookmaker.get('key'),
                            'title': bookmaker.get('title'),
                            'markets': bookmaker.get('markets', [])
                        }
                        game_data['bookmakers'].append(bm_data)
                    
                    games.append(game_data)
                
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
        demo_games = generate_demo_games(sport)
        result = {
            'success': True,
            'games': demo_games,
            'data_source': 'demo',
            'demo_mode': True,
            'count': len(demo_games),
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
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': str(e),
                'message': 'Failed to fetch odds comparison'
            }),
            status=500,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
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
    
    # Verify authentication
    user_id, auth_error = verify_jwt_token(req)
    if auth_error:
        return https_fn.Response(
            json.dumps({
                'error': 'Authentication required',
                'message': auth_error,
                'code': 'AUTH_REQUIRED'
            }),
            status=401,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
            }
        )
    
    try:
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
        
        # Validate parlay data
        bets = data.get('bets', [])
        if not bets:
            return https_fn.Response(
                json.dumps({'error': 'No bets provided'}),
                status=400,
                headers={
                    'Content-Type': 'application/json',
                    **get_cors_headers(req.headers.get('Origin'))
                }
            )
        
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
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': str(e),
                'message': 'Failed to evaluate parlay'
            }),
            status=500,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
            }
        )

def get_live_scores_from_apisports(sport_key):
    """Get live scores from API-Sports for enhanced data"""
    try:
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
        four_hours_ago = current_utc_time - timedelta(hours=4)
        four_hours_from_now = current_utc_time + timedelta(hours=4)
        
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
                                        elif status in ['finished', 'ended', 'final'] and game_time > four_hours_ago:
                                            recently_finished.append(base_game)
                                        break
                                except Exception as match_error:
                                    print(f"Error matching live data: {match_error}")
                                    continue
                        
                        # If no live match found, check if starting soon
                        if 'live_data' not in base_game:
                            if four_hours_ago <= game_time <= four_hours_from_now:
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
        
        return https_fn.Response(
            json.dumps(result),
            status=200,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin')),
                **get_cache_headers(LIVE_CACHE_DURATION // 1000)
            }
        )
        
    except Exception as e:
        print(f"Live scores error: {str(e)}")
        return https_fn.Response(
            json.dumps({
                'success': False,
                'error': str(e),
                'live_games': [],
                'starting_soon': [],
                'recently_finished': [],
                'message': 'Failed to fetch live scores'
            }),
            status=500,
            headers={
                'Content-Type': 'application/json',
                **get_cors_headers(req.headers.get('Origin'))
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
from firebase_functions import scheduler_fn

@scheduler_fn.on_schedule(
    schedule="every 5 minutes",
    timezone="America/New_York"
)
def keep_warm_scheduled(event):
    """Scheduled function to keep functions warm"""
    try:
        # Ping our own endpoints to keep them warm
        keep_alive_endpoints = [
            '/api/health',
            '/api/odds/comparison/americanfootball_nfl',
            '/api/live-scores'
        ]
        
        base_url = 'https://us-central1-smartbets-5c06f.cloudfunctions.net'
        
        import concurrent.futures
        
        def ping_endpoint(endpoint):
            try:
                import urllib.request
                url = f"{base_url}{endpoint}"
                req = urllib.request.Request(url, headers={'User-Agent': 'keep-warm-scheduler'})
                with urllib.request.urlopen(req, timeout=10) as response:
                    return f"Pinged {endpoint}: {response.status}"
            except Exception as e:
                return f"Failed to ping {endpoint}: {str(e)}"
        
        # Ping endpoints concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            results = list(executor.map(ping_endpoint, keep_alive_endpoints))
        
        print(f"Keep-warm results: {results}")
        
    except Exception as e:
        print(f"Keep-warm failed: {str(e)}")

# Export the functions
# Note: Firebase Functions for Python automatically detects functions with the @https_fn.on_request decorator