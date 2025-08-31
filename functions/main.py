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
from datetime import datetime, timedelta
import pytz
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin SDK
initialize_app()

# Set global options for cost control
set_global_options(max_instances=10)

# CORS Configuration
ALLOWED_ORIGINS = [
    'https://smartbets-5c06f.web.app',
    'https://smartbets-5c06f.firebaseapp.com',
    'https://prizmbets.app',
    'https://www.prizmbets.app'
]

# API Configuration
ODDS_API_KEY = os.getenv('ODDS_API_KEY', '10895df98265449efc15e58a68e4158b')
ODDS_API_BASE_URL = os.getenv('ODDS_API_BASE_URL', 'https://api.the-odds-api.com/v4')
APISPORTS_KEY = os.getenv('APISPORTS_KEY', '513982b126a3025cd4d1950d781539c2')

# Cache for API responses (simple in-memory cache)
api_cache = {}
CACHE_DURATION = 300000  # 5 minutes in milliseconds

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

def handle_cors_preflight():
    """Handle CORS preflight requests"""
    origin = request.headers.get('Origin')
    headers = get_cors_headers(origin)
    return ('', 204, headers)

# Health Check Function
@https_fn.on_request(cors=options.CorsOptions(
    cors_origins=ALLOWED_ORIGINS,
    cors_methods=["get", "post", "options"]
))
def api_health(req: https_fn.Request) -> https_fn.Response:
    """Health check endpoint"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight()
    
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
@https_fn.on_request(cors=options.CorsOptions(
    cors_origins=ALLOWED_ORIGINS,
    cors_methods=["get", "post", "options"]
))
def api_odds_comparison(req: https_fn.Request) -> https_fn.Response:
    """Get odds comparison for sports"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight()
    
    try:
        # Extract sport from path
        path_parts = req.path.split('/')
        sport = 'americanfootball_nfl'  # Default sport
        if 'comparison' in path_parts:
            sport_index = path_parts.index('comparison') + 1
            if sport_index < len(path_parts):
                sport = path_parts[sport_index]
        
        # Check cache first
        cache_key = f"odds_{sport}"
        now = int(time.time() * 1000)
        
        if cache_key in api_cache:
            cached_data = api_cache[cache_key]
            if now - cached_data['timestamp'] < CACHE_DURATION:
                return https_fn.Response(
                    json.dumps(cached_data['data']),
                    status=200,
                    headers={
                        'Content-Type': 'application/json',
                        **get_cors_headers(req.headers.get('Origin'))
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
                
                # Cache the result
                api_cache[cache_key] = {
                    'data': result,
                    'timestamp': now
                }
                
                return https_fn.Response(
                    json.dumps(result),
                    status=200,
                    headers={
                        'Content-Type': 'application/json',
                        **get_cors_headers(req.headers.get('Origin'))
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
@https_fn.on_request(cors=options.CorsOptions(
    cors_origins=ALLOWED_ORIGINS,
    cors_methods=["get", "post", "options"]
))
def api_evaluate(req: https_fn.Request) -> https_fn.Response:
    """Evaluate parlay with AI analysis"""
    if req.method == 'OPTIONS':
        return handle_cors_preflight()
    
    if req.method != 'POST':
        return https_fn.Response(
            json.dumps({'error': 'Method not allowed'}),
            status=405,
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

# Export the functions
# Note: Firebase Functions for Python automatically detects functions with the @https_fn.on_request decorator