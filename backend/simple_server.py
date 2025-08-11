#!/usr/bin/env python3
"""
Simple Flask server for testing comprehensive sports service
Bypasses SQLAlchemy compatibility issues
"""

from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import sys
import os
import time
from collections import defaultdict

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from services.comprehensive_sports_service import ComprehensiveSportsService
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Configure CORS securely
CORS(app, 
     origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=False,
     max_age=600)

# Add security headers
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' http://localhost:*"
    return response

# Initialize comprehensive sports service  
sports_service = ComprehensiveSportsService()

# Simple rate limiting
request_times = defaultdict(list)
RATE_LIMIT = 60  # requests per minute
RATE_LIMIT_WINDOW = 60  # seconds

def rate_limit_check():
    """Basic rate limiting per IP"""
    client_ip = request.remote_addr
    current_time = time.time()
    
    # Clean old requests outside the window
    request_times[client_ip] = [
        req_time for req_time in request_times[client_ip] 
        if current_time - req_time < RATE_LIMIT_WINDOW
    ]
    
    # Check if limit exceeded
    if len(request_times[client_ip]) >= RATE_LIMIT:
        abort(429)  # Too Many Requests
    
    # Add current request
    request_times[client_ip].append(current_time)

@app.before_request
def before_request():
    """Apply security checks before each request"""
    rate_limit_check()

@app.route('/')
def home():
    return jsonify({
        'message': 'SmartBets 2.0 - Enhanced Sports Data API',
        'version': '2.0.0',
        'status': 'running',
        'features': ['accurate-team-names', 'chronological-ordering', 'live-api-integration'],
        'endpoints': [
            '/api/odds/all-games',
            '/api/odds/comparison/<sport>',
            '/api/odds/sports',
            '/api/season/status'
        ]
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Enhanced Sports Data',
        'live_api_enabled': sports_service.use_live_api
    })

# === COMPREHENSIVE SPORTS DATA ENDPOINTS ===

@app.route('/api/odds/all-games', methods=['GET'])
def get_all_games():
    """Get games from all sports combined with accurate, live data"""
    try:
        limit_per_sport = request.args.get('per_sport', 3, type=int)
        show_upcoming = request.args.get('upcoming', 'true').lower() == 'true'
        
        # Validate parameters
        if limit_per_sport < 1 or limit_per_sport > 10:
            limit_per_sport = 3
        
        logger.info(f"Getting all games (per_sport: {limit_per_sport}, upcoming: {show_upcoming})")
        
        games_data = sports_service.get_all_games(
            limit_per_sport=limit_per_sport,
            show_upcoming=show_upcoming
        )
        
        return jsonify(games_data)
        
    except Exception as e:
        logger.error(f"All games error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch all games',
            'games': [],
            'total_games': 0,
            'message': str(e)
        }), 500

@app.route('/api/odds/comparison/<sport>', methods=['GET'])
def get_odds_comparison(sport):
    """Get comprehensive odds comparison for a sport with accurate data"""
    try:
        # Get optional limit parameter
        limit = request.args.get('limit', 10, type=int)
        if limit > 50:
            limit = 50
            
        logger.info(f"Getting comprehensive odds comparison for {sport} (limit: {limit})")
        
        # Get comprehensive comparison data from sports service
        comparison_data = sports_service.get_odds_comparison(sport.lower(), limit)
        
        return jsonify(comparison_data)
        
    except Exception as e:
        logger.error(f"Odds comparison error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve odds comparison',
            'message': str(e)
        }), 500

@app.route('/api/odds/sports', methods=['GET'])
def get_supported_sports():
    """Get comprehensive list of supported sports with real-time season status"""
    try:
        sports_data = sports_service.get_available_sports()
        
        return jsonify({
            'success': True,
            'sports': sports_data,
            'total_count': len(sports_data),
            'active_sports': len([s for s in sports_data if s['active']]),
            'data_source': 'comprehensive_coverage',
            'last_updated': 'real-time'
        })
        
    except Exception as e:
        logger.error(f"Sports list error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve sports list',
            'message': str(e)
        }), 500

@app.route('/api/season/status', methods=['GET'])
def get_season_statuses():
    """Get current season status for all sports"""
    try:
        season_data = sports_service.get_season_statuses()
        return jsonify(season_data)
        
    except Exception as e:
        logger.error(f"Season status error: {str(e)}")
        return jsonify({
            'success': False,  
            'error': 'Failed to get season statuses',
            'message': str(e)
        }), 500

@app.route('/api/odds/live/<sport>', methods=['GET'])
def get_live_odds(sport):
    """Get live odds for a specific sport with accurate team names"""
    try:
        limit = request.args.get('limit', 10, type=int)
        if limit > 25:
            limit = 25
            
        logger.info(f"Getting live odds for {sport} (limit: {limit})")
        
        odds_data = sports_service.get_live_odds(sport.lower(), limit)
        
        return jsonify(odds_data)
        
    except Exception as e:
        logger.error(f"Live odds error for {sport}: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to fetch live odds for {sport}',
            'games': [],
            'message': str(e)
        }), 500

# === CACHE MANAGEMENT ENDPOINTS ===

@app.route('/api/cache/stats', methods=['GET'])
def get_cache_stats():
    """Get cache statistics and performance metrics"""
    try:
        stats = sports_service.get_cache_statistics()
        return jsonify({
            'success': True,
            'cache_stats': stats
        })
        
    except Exception as e:
        logger.error(f"Cache stats error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get cache statistics',
            'message': str(e)
        }), 500

@app.route('/api/cache/cleanup', methods=['POST'])
def cleanup_cache():
    """Clean up expired cache entries"""
    try:
        sports_service.cleanup_cache()
        return jsonify({
            'success': True,
            'message': 'Cache cleanup completed'
        })
        
    except Exception as e:
        logger.error(f"Cache cleanup error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to cleanup cache',
            'message': str(e)
        }), 500

@app.route('/api/cache/invalidate', methods=['POST'])
def invalidate_cache():
    """Invalidate cache entries manually"""
    try:
        cache_type = request.json.get('type', 'all') if request.json else 'all'
        sport_key = request.json.get('sport') if request.json else None
        
        sports_service.invalidate_cache(cache_type, sport_key)
        
        return jsonify({
            'success': True,
            'message': f'Cache invalidated: {cache_type}'
        })
        
    except Exception as e:
        logger.error(f"Cache invalidation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to invalidate cache',
            'message': str(e)
        }), 500

@app.route('/api/cache/warmup', methods=['POST'])
def warmup_cache():
    """Pre-populate cache with fresh data"""
    try:
        # Note: warmup_cache method doesn't exist in ComprehensiveSportsService
        return jsonify({
            'success': True,
            'message': 'Cache warmup not available for this service'
        })
        
    except Exception as e:
        logger.error(f"Cache warmup error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to warmup cache',
            'message': str(e)
        }), 500

# === NEW LIVE GAME ENDPOINTS ===

@app.route('/api/odds/live-game/<game_id>', methods=['GET'])
def get_live_game_details(game_id):
    """Get detailed live information for a specific game"""
    try:
        logger.info(f"Getting live details for game {game_id}")
        
        # For now, this would need to be implemented with game ID lookup
        # This is a placeholder for the live game details endpoint
        return jsonify({
            'success': True,
            'game_id': game_id,
            'live_data': {
                'status': 'live',
                'message': 'Live game details endpoint - implementation pending',
                'last_updated': datetime.utcnow().isoformat() + 'Z'
            }
        })
        
    except Exception as e:
        logger.error(f"Live game details error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to get live game details for {game_id}',
            'message': str(e)
        }), 500

@app.route('/api/odds/live-scores', methods=['GET'])
def get_all_live_scores():
    """Get all currently live games with scores across all sports"""
    try:
        sport = request.args.get('sport', '').lower()
        
        if sport:
            # Get live games for specific sport
            logger.info(f"Getting live scores for {sport}")
            odds_data = sports_service.get_live_odds(sport)
        else:
            # Get live games from all sports
            logger.info("Getting live scores for all sports")
            odds_data = sports_service.get_all_games(limit_per_sport=5, show_upcoming=False)
        
        # Filter to only games with live_data
        if 'games' in odds_data:
            live_games = [
                game for game in odds_data['games'] 
                if game.get('live_data') and game.get('live_data', {}).get('status') == 'live'
            ]
            
            return jsonify({
                'success': True,
                'live_games': live_games,
                'total_live_games': len(live_games),
                'sport': sport or 'all',
                'last_updated': datetime.utcnow().isoformat() + 'Z'
            })
        else:
            return jsonify({
                'success': True,
                'live_games': [],
                'total_live_games': 0,
                'sport': sport or 'all'
            })
        
    except Exception as e:
        logger.error(f"Live scores error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get live scores',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print("=" * 60)
    print("STARTING SMARTBETS 2.0 CACHED SPORTS DATA SERVER")
    print("=" * 60)
    print(f"Live API Integration: {'ENABLED' if sports_service.use_live_api else 'MOCK DATA'}")
    print(f"Database Caching: ENABLED (SQLite)")
    print(f"Server: http://localhost:5001")
    print(f"Sports Coverage: {len(sports_service.available_sports)} sports")
    print("Features: Database caching, API fallback, accurate data")
    print("Cache Endpoints: /api/cache/stats, /api/cache/cleanup, /api/cache/warmup")
    print("=" * 60)
    
    # Initialize cache warmup in background
    try:
        sports_service.warmup_cache()
        print("[OK] Cache warmup completed successfully")
    except Exception as e:
        print(f"[WARNING] Cache warmup failed: {e}")
    
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5001)