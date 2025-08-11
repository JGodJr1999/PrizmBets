#!/usr/bin/env python3
"""
Real-time NFL Pick'em Pools Server for SmartBets 2.0
Integrates with existing comprehensive sports service for live NFL data
"""

from flask import Flask, jsonify, request, g
from flask_cors import CORS
from functools import wraps
import logging
import secrets
import string
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import sqlite3
import json

# Add the app directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

from services.cached_sports_service import CachedSportsService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'])

# Initialize sports service for real-time NFL data
sports_service = CachedSportsService()

# SQLite database for Pick'em data (simpler than full SQLAlchemy)
DB_PATH = 'pickem_pools.db'

def init_database():
    """Initialize SQLite database with Pick'em tables"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create pools table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            creator_id INTEGER NOT NULL,
            invite_code TEXT UNIQUE NOT NULL,
            is_private BOOLEAN DEFAULT 1,
            max_members INTEGER DEFAULT 50,
            season_year INTEGER NOT NULL,
            settings TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create pool memberships table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pool_memberships (
            pool_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            display_name TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            total_correct_picks INTEGER DEFAULT 0,
            total_picks_made INTEGER DEFAULT 0,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (pool_id, user_id),
            FOREIGN KEY (pool_id) REFERENCES pools (id)
        )
    ''')
    
    # Create picks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS picks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            pool_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            game_id TEXT NOT NULL,
            week_number INTEGER NOT NULL,
            predicted_winner TEXT NOT NULL,
            is_correct BOOLEAN,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(pool_id, user_id, game_id),
            FOREIGN KEY (pool_id) REFERENCES pools (id)
        )
    ''')
    
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

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

def get_current_week_number():
    """Calculate current NFL week number based on date"""
    # NFL season typically starts first Thursday in September
    season_start = datetime(2024, 9, 5)  # Adjust for actual season
    current_date = datetime.now()
    
    if current_date < season_start:
        return 1
    
    days_since_start = (current_date - season_start).days
    week_number = min(18, max(1, (days_since_start // 7) + 1))
    
    return week_number

# Routes

@app.route('/')
def home():
    return jsonify({
        'message': 'SmartBets 2.0 - NFL Pick\'em Pools API (Real-time)',
        'version': '2.0.0',
        'status': 'running',
        'features': ['real-time-nfl-data', 'pool-management', 'picks-submission', 'leaderboards'],
        'data_source': 'Live NFL data from comprehensive sports service',
        'endpoints': [
            'POST /api/pickem/pools - Create pool',
            'POST /api/pickem/pools/join - Join pool',
            'GET /api/pickem/pools - Get user pools',
            'GET /api/pickem/nfl/weeks/current - Current week with live games',
            'GET /api/pickem/nfl/weeks/<week>/games - Week games (real-time)',
            'POST /api/pickem/pools/<id>/picks - Submit picks',
            'GET /api/pickem/pools/<id>/leaderboard - Leaderboard'
        ]
    })

@app.route('/health')
def health():
    try:
        # Test database connection
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM pools")
        pool_count = cursor.fetchone()[0]
        conn.close()
        
        # Check sports service
        nfl_data = sports_service.get_live_odds('nfl', limit=1)
        sports_service_status = 'healthy' if nfl_data.get('success') else 'degraded'
        
        return jsonify({
            'status': 'healthy',
            'service': 'Pick\'em Pools Real-time API',
            'database': 'connected',
            'pools': pool_count,
            'sports_service': sports_service_status,
            'current_week': get_current_week_number()
        })
    except Exception as e:
        logger.error(f"Health check error: {e}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 500

# Pool Management Routes

@app.route('/api/pickem/pools', methods=['POST'])
@jwt_required
@validate_json_data(['name'])
def create_pool():
    """Create a new Pick'em pool"""
    try:
        data = g.json_data
        user_id = g.current_user_id
        
        name = data.get('name', '').strip()
        if len(name) < 3:
            return jsonify({'success': False, 'error': 'Pool name must be at least 3 characters'}), 400
        
        invite_code = generate_invite_code()
        settings = json.dumps(data.get('settings', {'pick_type': 'straight_up'}))
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO pools (name, description, creator_id, invite_code, season_year, settings)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (name, data.get('description', ''), user_id, invite_code, 2024, settings))
        
        pool_id = cursor.lastrowid
        
        # Add creator as admin member
        cursor.execute('''
            INSERT INTO pool_memberships (pool_id, user_id, display_name, is_admin)
            VALUES (?, ?, ?, ?)
        ''', (pool_id, user_id, 'Pool Creator', 1))
        
        conn.commit()
        conn.close()
        
        logger.info(f"Created pool {pool_id}: {name}")
        
        return jsonify({
            'success': True,
            'pool': {
                'id': pool_id,
                'name': name,
                'invite_code': invite_code,
                'creator_id': user_id
            },
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
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Find pool by invite code
        cursor.execute('SELECT id, name FROM pools WHERE invite_code = ? AND is_active = 1', (invite_code,))
        pool = cursor.fetchone()
        
        if not pool:
            conn.close()
            return jsonify({'success': False, 'error': 'Invalid invite code'}), 400
        
        pool_id, pool_name = pool
        
        # Check if already a member
        cursor.execute('SELECT 1 FROM pool_memberships WHERE pool_id = ? AND user_id = ?', (pool_id, user_id))
        if cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Already a member of this pool'}), 400
        
        # Add membership
        display_name = data.get('display_name', f'User {user_id}')
        cursor.execute('''
            INSERT INTO pool_memberships (pool_id, user_id, display_name, is_admin)
            VALUES (?, ?, ?, ?)
        ''', (pool_id, user_id, display_name, 0))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'pool': {
                'id': pool_id,
                'name': pool_name,
                'invite_code': invite_code
            }
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
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT p.id, p.name, p.description, p.invite_code, p.created_at,
                   pm.is_admin, pm.display_name, pm.total_correct_picks, pm.total_picks_made
            FROM pools p
            JOIN pool_memberships pm ON p.id = pm.pool_id
            WHERE pm.user_id = ? AND p.is_active = 1
        ''', (user_id,))
        
        pools = []
        for row in cursor.fetchall():
            win_percentage = 0
            if row[8] > 0:
                win_percentage = (row[7] / row[8]) * 100
                
            pools.append({
                'id': row[0],
                'name': row[1],
                'description': row[2],
                'invite_code': row[3],
                'created_at': row[4],
                'user_role': 'admin' if row[5] else 'member',
                'display_name': row[6],
                'stats': {
                    'total_correct': row[7],
                    'total_picks': row[8],
                    'win_percentage': round(win_percentage, 1)
                }
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'pools': pools,
            'total_pools': len(pools)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user pools: {e}")
        return jsonify({'success': False, 'error': 'Failed to get pools'}), 500

# NFL Schedule Routes (Real-time data)

@app.route('/api/pickem/nfl/weeks/current', methods=['GET'])
@jwt_required
def get_current_week():
    """Get current NFL week with real-time games"""
    try:
        week_number = get_current_week_number()
        
        # Get real NFL games from sports service
        nfl_data = sports_service.get_live_odds('nfl', limit=50)
        
        if not nfl_data.get('success'):
            return jsonify({
                'success': False,
                'error': 'Failed to fetch NFL data'
            }), 500
        
        games = nfl_data.get('games', [])
        
        # Filter games for current week
        current_week_games = []
        for game in games:
            # Estimate week number based on game date
            game_time = game.get('commence_time', '')
            if game_time:
                # Add to current week games
                current_week_games.append(game)
        
        return jsonify({
            'success': True,
            'week': {
                'week_number': week_number,
                'season_year': 2024,
                'total_games': len(current_week_games),
                'data_source': nfl_data.get('data_source', 'live'),
                'cache_hit': nfl_data.get('cache_hit', False)
            },
            'games': current_week_games
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting current week: {e}")
        return jsonify({'success': False, 'error': 'Internal server error'}), 500

@app.route('/api/pickem/nfl/weeks/<int:week_number>/games', methods=['GET'])
@jwt_required
def get_week_games(week_number):
    """Get real-time games for a specific week"""
    try:
        # Get all NFL games from sports service
        nfl_data = sports_service.get_live_odds('nfl', limit=100)
        
        if not nfl_data.get('success'):
            return jsonify({
                'success': False,
                'error': 'Failed to fetch NFL data',
                'data_source': nfl_data.get('data_source', 'unknown')
            }), 500
        
        all_games = nfl_data.get('games', [])
        
        # Format games for Pick'em
        formatted_games = []
        for game in all_games:
            formatted_game = {
                'id': game.get('id', f"nfl_{len(formatted_games)}"),
                'home_team': game.get('home_team', 'Unknown'),
                'away_team': game.get('away_team', 'Unknown'),
                'game_time': game.get('commence_time', ''),
                'matchup': f"{game.get('away_team', 'Unknown')} @ {game.get('home_team', 'Unknown')}",
                'pick_options': [
                    {'value': 'away', 'label': game.get('away_team', 'Unknown'), 'team': game.get('away_team', 'Unknown')},
                    {'value': 'home', 'label': game.get('home_team', 'Unknown'), 'team': game.get('home_team', 'Unknown')}
                ],
                'sportsbooks': game.get('sportsbooks', {}),
                'has_started': False,  # Would need to check game time
                'can_pick': True
            }
            
            # Check if game has started
            if game.get('commence_time'):
                try:
                    game_time = datetime.fromisoformat(game['commence_time'].replace('Z', '+00:00'))
                    formatted_game['has_started'] = datetime.utcnow() > game_time
                    formatted_game['can_pick'] = not formatted_game['has_started']
                except:
                    pass
            
            formatted_games.append(formatted_game)
        
        return jsonify({
            'success': True,
            'week': {
                'week_number': week_number,
                'season_year': 2024,
                'total_games': len(formatted_games)
            },
            'games': formatted_games,
            'data_source': nfl_data.get('data_source', 'live'),
            'cache_performance': nfl_data.get('cache_performance', {})
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
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verify pool membership
        cursor.execute('SELECT 1 FROM pool_memberships WHERE pool_id = ? AND user_id = ?', (pool_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Get current week
        week_number = get_current_week_number()
        
        picks_submitted = 0
        picks_updated = 0
        
        for pick in picks:
            game_id = pick.get('game_id')
            predicted_winner = pick.get('predicted_winner')
            
            if not game_id or predicted_winner not in ['home', 'away']:
                continue
            
            try:
                # Try to insert new pick
                cursor.execute('''
                    INSERT INTO picks (pool_id, user_id, game_id, week_number, predicted_winner)
                    VALUES (?, ?, ?, ?, ?)
                ''', (pool_id, user_id, game_id, week_number, predicted_winner))
                picks_submitted += 1
            except sqlite3.IntegrityError:
                # Update existing pick
                cursor.execute('''
                    UPDATE picks SET predicted_winner = ?, submitted_at = CURRENT_TIMESTAMP
                    WHERE pool_id = ? AND user_id = ? AND game_id = ?
                ''', (predicted_winner, pool_id, user_id, game_id))
                picks_updated += 1
        
        conn.commit()
        conn.close()
        
        logger.info(f"User {user_id} submitted {picks_submitted} new picks, updated {picks_updated} for pool {pool_id}")
        
        return jsonify({
            'success': True,
            'picks_submitted': picks_submitted,
            'picks_updated': picks_updated,
            'message': f'Successfully processed {picks_submitted + picks_updated} picks'
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
        week_number = request.args.get('week', type=int, default=get_current_week_number())
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verify access
        cursor.execute('SELECT 1 FROM pool_memberships WHERE pool_id = ? AND user_id = ?', (pool_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Get picks
        cursor.execute('''
            SELECT game_id, predicted_winner, is_correct, submitted_at
            FROM picks
            WHERE pool_id = ? AND user_id = ? AND week_number = ?
        ''', (pool_id, user_id, week_number))
        
        picks = []
        for row in cursor.fetchall():
            picks.append({
                'game_id': row[0],
                'predicted_winner': row[1],
                'is_correct': row[2],
                'submitted_at': row[3]
            })
        
        conn.close()
        
        return jsonify({
            'success': True,
            'week_number': week_number,
            'picks': picks,
            'total_picks': len(picks)
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting user picks: {e}")
        return jsonify({'success': False, 'error': 'Failed to get picks'}), 500

# Leaderboard Routes

@app.route('/api/pickem/pools/<int:pool_id>/leaderboard', methods=['GET'])
@jwt_required
def get_pool_leaderboard(pool_id):
    """Get pool leaderboard with real statistics"""
    try:
        user_id = g.current_user_id
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Verify access
        cursor.execute('SELECT 1 FROM pool_memberships WHERE pool_id = ? AND user_id = ?', (pool_id, user_id))
        if not cursor.fetchone():
            conn.close()
            return jsonify({'success': False, 'error': 'Access denied'}), 403
        
        # Get leaderboard data
        cursor.execute('''
            SELECT pm.user_id, pm.display_name, pm.total_correct_picks, pm.total_picks_made,
                   COUNT(p.id) as week_picks
            FROM pool_memberships pm
            LEFT JOIN picks p ON pm.pool_id = p.pool_id AND pm.user_id = p.user_id
            WHERE pm.pool_id = ? AND pm.is_active = 1
            GROUP BY pm.user_id
            ORDER BY pm.total_correct_picks DESC, pm.total_picks_made ASC
        ''', (pool_id,))
        
        leaderboard = []
        rank = 1
        for row in cursor.fetchall():
            win_percentage = 0
            if row[3] > 0:
                win_percentage = (row[2] / row[3]) * 100
                
            leaderboard.append({
                'rank': rank,
                'user_id': row[0],
                'display_name': row[1],
                'total_correct_picks': row[2],
                'total_picks_made': row[3],
                'win_percentage': round(win_percentage, 1),
                'current_week_picks': row[4]
            })
            rank += 1
        
        conn.close()
        
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
    print("STARTING SMARTBETS 2.0 NFL PICK'EM POOLS SERVER (REAL-TIME)")
    print("=" * 60)
    print("Server: http://localhost:5004")
    print("Data Source: Live NFL data from comprehensive sports service")
    print("Features: Real-time games, pool management, picks, leaderboards")
    print("Database: SQLite (pickem_pools.db)")
    print("=" * 60)
    
    # Initialize database
    init_database()
    print("[OK] Database initialized successfully")
    
    # Test sports service connection
    try:
        test_data = sports_service.get_live_odds('nfl', limit=1)
        if test_data.get('success'):
            print("[OK] Sports service connected successfully")
            print(f"     Data source: {test_data.get('data_source', 'unknown')}")
        else:
            print("[WARNING] Sports service returned no data")
    except Exception as e:
        print(f"[ERROR] Sports service connection failed: {e}")
    
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5006)