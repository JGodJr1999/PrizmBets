#!/usr/bin/env python3
"""
Simple test server for NFL Pick'em Pools API
Bypasses SQLAlchemy compatibility issues with mock data
"""

from flask import Flask, jsonify, request, g
from flask_cors import CORS
from functools import wraps
import logging
import secrets
import string
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'])

# Mock data storage (in-memory for testing)
mock_pools = {}
mock_memberships = {}
mock_games = {}
mock_picks = {}
mock_weeks = {}
current_pool_id = 1
current_game_id = 1

# Simple JWT simulation for testing
def jwt_required(f):
    """Mock JWT decorator"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        
        # Mock user ID from token (in real app, decode JWT)
        g.current_user_id = 1
        return f(*args, **kwargs)
    return wrapper

def validate_json_data(required_fields=None):
    """Decorator to validate JSON request data"""
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            if not request.is_json:
                return jsonify({'success': False, 'error': 'Content-Type must be application/json'}), 400
            
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'Invalid JSON data'}), 400
            
            if required_fields:
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    return jsonify({
                        'success': False,
                        'error': f'Missing required fields: {", ".join(missing_fields)}'
                    }), 400
            
            g.json_data = data
            return f(*args, **kwargs)
        return wrapper
    return decorator

def generate_invite_code(length=8):
    """Generate a unique invite code"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))

def init_mock_data():
    """Initialize mock data for testing"""
    global current_pool_id, current_game_id
    
    # Create mock NFL week
    current_week = {
        'id': 1,
        'week_number': 1,
        'season_year': 2024,
        'week_type': 'regular',
        'start_date': datetime.now().isoformat(),
        'pick_deadline': (datetime.now() + timedelta(days=2)).isoformat(),
        'end_date': (datetime.now() + timedelta(days=7)).isoformat(),
        'is_active': True,
        'is_completed': False
    }
    mock_weeks[1] = current_week
    
    # Create mock NFL games
    sample_games = [
        {'home_team': 'Kansas City Chiefs', 'away_team': 'Buffalo Bills'},
        {'home_team': 'Dallas Cowboys', 'away_team': 'Philadelphia Eagles'},
        {'home_team': 'Green Bay Packers', 'away_team': 'San Francisco 49ers'},
        {'home_team': 'Cincinnati Bengals', 'away_team': 'Baltimore Ravens'},
        {'home_team': 'New England Patriots', 'away_team': 'Miami Dolphins'},
        {'home_team': 'Seattle Seahawks', 'away_team': 'Los Angeles Rams'},
        {'home_team': 'Detroit Lions', 'away_team': 'Minnesota Vikings'},
        {'home_team': 'New Orleans Saints', 'away_team': 'Tampa Bay Buccaneers'},
    ]
    
    for i, game_data in enumerate(sample_games):
        game_id = current_game_id + i
        game = {
            'id': game_id,
            'week_id': 1,
            'home_team': game_data['home_team'],
            'away_team': game_data['away_team'],
            'game_time': (datetime.now() + timedelta(days=3, hours=i*2)).isoformat(),
            'is_completed': False,
            'actual_winner': None,
            'has_started': False,
            'game_status': 'scheduled'
        }
        mock_games[game_id] = game
    
    current_game_id += len(sample_games)
    
    logger.info(f"Initialized {len(sample_games)} mock games for week 1")

# Routes

@app.route('/')
def home():
    return jsonify({
        'message': 'SmartBets 2.0 - NFL Pick\'em Pools Test API',
        'version': '1.0.0',
        'status': 'running',
        'features': ['pool-management', 'picks-submission', 'leaderboards'],
        'endpoints': [
            'POST /api/pickem/pools - Create pool',
            'POST /api/pickem/pools/join - Join pool',
            'GET /api/pickem/pools - Get user pools',
            'GET /api/pickem/nfl/weeks/current - Current week',
            'GET /api/pickem/nfl/weeks/<week>/games - Week games',
            'POST /api/pickem/pools/<id>/picks - Submit picks',
            'GET /api/pickem/pools/<id>/leaderboard - Leaderboard'
        ]
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Pick\'em Pools Test API',
        'pools': len(mock_pools),
        'games': len(mock_games)
    })

# Pool Management Routes

@app.route('/api/pickem/pools', methods=['POST'])
@jwt_required
@validate_json_data(['name'])
def create_pool():
    """Create a new Pick'em pool"""
    try:
        global current_pool_id
        data = g.json_data
        user_id = g.current_user_id
        
        name = data.get('name', '').strip()
        if len(name) < 3:
            return jsonify({'success': False, 'error': 'Pool name must be at least 3 characters'}), 400
        
        pool_id = current_pool_id
        invite_code = generate_invite_code()
        
        pool = {
            'id': pool_id,
            'name': name,
            'description': data.get('description', ''),
            'creator_id': user_id,
            'invite_code': invite_code,
            'is_private': True,
            'max_members': 50,
            'member_count': 1,
            'season_year': 2024,
            'settings': data.get('settings', {'pick_type': 'straight_up'}),
            'is_active': True,
            'created_at': datetime.now().isoformat(),
            'creator_name': 'Test User'
        }
        
        mock_pools[pool_id] = pool
        
        # Add creator as member
        membership = {
            'pool_id': pool_id,
            'user_id': user_id,
            'display_name': 'Test User',
            'is_admin': True,
            'total_correct_picks': 0,
            'total_picks_made': 0,
            'win_percentage': 0.0,
            'joined_at': datetime.now().isoformat()
        }
        
        if pool_id not in mock_memberships:
            mock_memberships[pool_id] = {}
        mock_memberships[pool_id][user_id] = membership
        
        current_pool_id += 1
        
        logger.info(f"Created pool {pool_id}: {name}")
        
        return jsonify({
            'success': True,
            'pool': pool,
            'invite_code': invite_code
        }), 201
        
    except Exception as e:
        logger.error(f"Error creating pool: {e}")
        return jsonify({'success': False, 'error': 'Failed to create pool'}), 500

@app.route('/api/pickem/pools/join', methods=['POST'])
@jwt_required
@validate_json_data(['invite_code'])
def join_pool():
    """Join a pool using invite code"""
    try:
        data = g.json_data
        user_id = g.current_user_id
        invite_code = data.get('invite_code', '').strip().upper()
        
        # Find pool by invite code
        pool = None
        for p in mock_pools.values():
            if p['invite_code'] == invite_code:
                pool = p
                break
        
        if not pool:
            return jsonify({'success': False, 'error': 'Invalid invite code'}), 400
        
        pool_id = pool['id']
        
        # Check if already a member
        if pool_id in mock_memberships and user_id in mock_memberships[pool_id]:
            return jsonify({'success': False, 'error': 'Already a member of this pool'}), 400
        
        # Add membership
        membership = {
            'pool_id': pool_id,
            'user_id': user_id,
            'display_name': data.get('display_name', f'User {user_id}'),
            'is_admin': False,
            'total_correct_picks': 0,
            'total_picks_made': 0,
            'win_percentage': 0.0,
            'joined_at': datetime.now().isoformat()
        }
        
        if pool_id not in mock_memberships:
            mock_memberships[pool_id] = {}
        mock_memberships[pool_id][user_id] = membership
        
        # Update member count
        mock_pools[pool_id]['member_count'] += 1
        
        return jsonify({
            'success': True,
            'pool': pool,
            'membership': membership
        }), 200
        
    except Exception as e:
        logger.error(f"Error joining pool: {e}")
        return jsonify({'success': False, 'error': 'Failed to join pool'}), 500

@app.route('/api/pickem/pools', methods=['GET'])
@jwt_required
def get_user_pools():
    """Get all pools for the current user"""
    try:
        user_id = g.current_user_id
        user_pools = []
        
        for pool_id, memberships in mock_memberships.items():
            if user_id in memberships:
                pool = mock_pools.get(pool_id)
                if pool:
                    membership = memberships[user_id]
                    pool_data = pool.copy()
                    pool_data['user_role'] = 'admin' if membership['is_admin'] else 'member'
                    pool_data['display_name'] = membership['display_name']
                    user_pools.append(pool_data)
        
        return jsonify({
            'success': True,
            'pools': user_pools,
            'total_pools': len(user_pools)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user pools: {e}")
        return jsonify({'success': False, 'error': 'Failed to get pools'}), 500

@app.route('/api/pickem/pools/<int:pool_id>', methods=['GET'])
@jwt_required
def get_pool_details(pool_id):
    """Get detailed pool information"""
    try:
        user_id = g.current_user_id
        
        # Check if user is a member
        if pool_id not in mock_memberships or user_id not in mock_memberships[pool_id]:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        pool = mock_pools.get(pool_id)
        if not pool:
            return jsonify({'success': False, 'error': 'Pool not found'}), 404
        
        # Get members
        members = []
        if pool_id in mock_memberships:
            for member_data in mock_memberships[pool_id].values():
                members.append(member_data)
        
        pool_data = pool.copy()
        pool_data['current_week'] = mock_weeks.get(1)
        pool_data['members'] = members
        pool_data['user_role'] = 'admin' if mock_memberships[pool_id][user_id]['is_admin'] else 'member'
        
        return jsonify({'success': True, 'pool': pool_data}), 200
        
    except Exception as e:
        logger.error(f"Error getting pool details: {e}")
        return jsonify({'success': False, 'error': 'Failed to get pool details'}), 500

# NFL Schedule Routes

@app.route('/api/pickem/nfl/weeks/current', methods=['GET'])
@jwt_required
def get_current_week():
    """Get current NFL week"""
    try:
        current_week = mock_weeks.get(1)
        if current_week:
            return jsonify({'success': True, 'week': current_week}), 200
        else:
            return jsonify({'success': False, 'error': 'No active week found'}), 404
    except Exception as e:
        logger.error(f"Error getting current week: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/pickem/nfl/weeks/<int:week_number>/games', methods=['GET'])
@jwt_required
def get_week_games(week_number):
    """Get games for a specific week"""
    try:
        week = mock_weeks.get(week_number, mock_weeks.get(1))  # Default to week 1
        games = list(mock_games.values())
        
        # Add pick-friendly format
        for game in games:
            game['matchup'] = f"{game['away_team']} @ {game['home_team']}"
            game['pick_options'] = [
                {'value': 'away', 'label': game['away_team'], 'team': game['away_team']},
                {'value': 'home', 'label': game['home_team'], 'team': game['home_team']}
            ]
            game['can_pick'] = not game['has_started']
        
        return jsonify({
            'success': True,
            'week': week,
            'games': games
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting week games: {e}")
        return jsonify({'success': False, 'error': 'Failed to get games'}), 500

# Pick Management Routes

@app.route('/api/pickem/pools/<int:pool_id>/picks', methods=['POST'])
@jwt_required
@validate_json_data(['picks'])
def submit_picks(pool_id):
    """Submit picks for a pool"""
    try:
        data = g.json_data
        user_id = g.current_user_id
        picks = data.get('picks', [])
        
        # Verify pool membership
        if pool_id not in mock_memberships or user_id not in mock_memberships[pool_id]:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Validate picks
        for pick in picks:
            if not isinstance(pick, dict) or 'game_id' not in pick or 'predicted_winner' not in pick:
                return jsonify({'success': False, 'error': 'Invalid pick format'}), 400
            
            if pick['predicted_winner'] not in ['home', 'away']:
                return jsonify({'success': False, 'error': 'predicted_winner must be "home" or "away"'}), 400
        
        # Store picks (in real app, validate against game times)
        if pool_id not in mock_picks:
            mock_picks[pool_id] = {}
        if user_id not in mock_picks[pool_id]:
            mock_picks[pool_id][user_id] = {}
        
        picks_submitted = 0
        for pick in picks:
            game_id = pick['game_id']
            if game_id in mock_games:  # Verify game exists
                mock_picks[pool_id][user_id][game_id] = {
                    'game_id': game_id,
                    'predicted_winner': pick['predicted_winner'],
                    'submitted_at': datetime.now().isoformat(),
                    'is_correct': None
                }
                picks_submitted += 1
        
        logger.info(f"User {user_id} submitted {picks_submitted} picks for pool {pool_id}")
        
        return jsonify({
            'success': True,
            'picks_submitted': picks_submitted,
            'message': f'Successfully submitted {picks_submitted} picks'
        }), 200
        
    except Exception as e:
        logger.error(f"Error submitting picks: {e}")
        return jsonify({'success': False, 'error': 'Failed to submit picks'}), 500

@app.route('/api/pickem/pools/<int:pool_id>/picks', methods=['GET'])
@jwt_required
def get_user_picks(pool_id):
    """Get user's picks for a pool"""
    try:
        user_id = g.current_user_id
        
        # Verify access
        if pool_id not in mock_memberships or user_id not in mock_memberships[pool_id]:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        week = mock_weeks.get(1)  # Current week
        user_picks = []
        
        if pool_id in mock_picks and user_id in mock_picks[pool_id]:
            for pick in mock_picks[pool_id][user_id].values():
                pick_data = pick.copy()
                game = mock_games.get(pick['game_id'])
                if game:
                    pick_data['game_info'] = game
                user_picks.append(pick_data)
        
        return jsonify({
            'success': True,
            'week': week,
            'picks': user_picks
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user picks: {e}")
        return jsonify({'success': False, 'error': 'Failed to get picks'}), 500

# Leaderboard Routes

@app.route('/api/pickem/pools/<int:pool_id>/leaderboard', methods=['GET'])
@jwt_required
def get_pool_leaderboard(pool_id):
    """Get pool leaderboard"""
    try:
        user_id = g.current_user_id
        
        # Verify access
        if pool_id not in mock_memberships or user_id not in mock_memberships[pool_id]:
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        leaderboard = []
        if pool_id in mock_memberships:
            for i, (member_id, membership) in enumerate(mock_memberships[pool_id].items(), 1):
                leaderboard.append({
                    'rank': i,
                    'user_id': member_id,
                    'display_name': membership['display_name'],
                    'total_correct_picks': membership['total_correct_picks'],
                    'total_picks_made': membership['total_picks_made'],
                    'win_percentage': membership['win_percentage'],
                    'current_streak': 0,
                    'best_week_score': 0
                })
        
        return jsonify({
            'success': True,
            'leaderboard': leaderboard,
            'total_members': len(leaderboard)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting leaderboard: {e}")
        return jsonify({'success': False, 'error': 'Failed to get leaderboard'}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("STARTING SMARTBETS 2.0 NFL PICK'EM POOLS TEST SERVER")
    print("=" * 60)
    print("Server: http://localhost:5004")
    print("Features: Pool creation, picks submission, leaderboards")
    print("Mock Data: 8 NFL games, 1 week, in-memory storage")
    print("=" * 60)
    
    # Initialize mock data
    init_mock_data()
    print("[OK] Mock data initialized successfully")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5004)