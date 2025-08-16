"""
Simplified NFL Pick'em Pools API Routes for PrizmBets
Temporary replacement without decorator conflicts
"""

from flask import Blueprint, request, jsonify, g
import logging

from ..services.pickem_service import PickEmService
from ..utils.auth_decorators import jwt_required
from ..models.user import User

logger = logging.getLogger(__name__)

# Create blueprint
pickem_bp = Blueprint('pickem', __name__, url_prefix='/api/pickem')

# Initialize service
pickem_service = PickEmService()

# Pool Management Routes

@pickem_bp.route('/pools', methods=['POST'])
@jwt_required
def create_pool():
    """Create a new Pick'em pool"""
    try:
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400
        
        data = request.get_json()
        if not data or 'name' not in data:
            return jsonify({
                'success': False,
                'error': 'Pool name is required'
            }), 400
            
        user_id = g.current_user_id
        
        # Validate input
        name = data.get('name', '').strip()
        if not name or len(name) < 3:
            return jsonify({
                'success': False,
                'error': 'Pool name must be at least 3 characters'
            }), 400
        
        description = data.get('description', '').strip()
        settings = data.get('settings', {})
        
        # Validate settings
        valid_pick_types = ['straight_up', 'against_spread', 'confidence']
        if settings.get('pick_type') and settings['pick_type'] not in valid_pick_types:
            return jsonify({
                'success': False,
                'error': f'Invalid pick type. Must be one of: {valid_pick_types}'
            }), 400
        
        result = pickem_service.create_pool(
            creator_id=user_id,
            name=name,
            description=description if description else None,
            settings=settings
        )
        
        if result['success']:
            logger.info(f"Pool created successfully by user {user_id}")
            return jsonify(result), 201
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in create_pool endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@pickem_bp.route('/pools/join', methods=['POST'])
@jwt_required
def join_pool():
    """Join a pool using invite code"""
    try:
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400
            
        data = request.get_json()
        if not data or 'invite_code' not in data:
            return jsonify({
                'success': False,
                'error': 'Invite code is required'
            }), 400
            
        user_id = g.current_user_id
        
        invite_code = data.get('invite_code', '').strip().upper()
        display_name = data.get('display_name', '').strip()
        
        if not invite_code:
            return jsonify({
                'success': False,
                'error': 'Invite code is required'
            }), 400
        
        result = pickem_service.join_pool(
            user_id=user_id,
            invite_code=invite_code,
            display_name=display_name if display_name else None
        )
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in join_pool endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@pickem_bp.route('/pools', methods=['GET'])
@jwt_required
def get_user_pools():
    """Get all pools for the current user"""
    try:
        user_id = g.current_user_id
        
        result = pickem_service.get_user_pools(user_id)
        
        return jsonify(result), 200
        
    except Exception as e:
        logger.error(f"Error in get_user_pools endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@pickem_bp.route('/pools/<int:pool_id>', methods=['GET'])
@jwt_required
def get_pool_details(pool_id):
    """Get detailed information about a specific pool"""
    try:
        user_id = g.current_user_id
        
        result = pickem_service.get_pool_details(pool_id, user_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if 'not found' in result['error'].lower() else 403
            
    except Exception as e:
        logger.error(f"Error in get_pool_details endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# NFL Schedule Routes

@pickem_bp.route('/nfl/weeks/current', methods=['GET'])
@jwt_required
def get_current_week():
    """Get current NFL week information"""
    try:
        current_week = pickem_service.get_current_nfl_week()
        
        if current_week:
            return jsonify({
                'success': True,
                'week': current_week.to_dict()
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'No active NFL week found'
            }), 404
            
    except Exception as e:
        logger.error(f"Error in get_current_week endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@pickem_bp.route('/nfl/weeks/<int:week_number>/games', methods=['GET'])
@jwt_required
def get_week_games(week_number):
    """Get all games for a specific NFL week"""
    try:
        season_year = request.args.get('season', type=int)
        
        result = pickem_service.get_nfl_week_games(week_number, season_year)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_week_games endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# Pick Management Routes

@pickem_bp.route('/pools/<int:pool_id>/picks', methods=['POST'])
@jwt_required
def submit_picks(pool_id):
    """Submit picks for a pool"""
    try:
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400
            
        data = request.get_json()
        if not data or 'picks' not in data:
            return jsonify({
                'success': False,
                'error': 'Picks are required'
            }), 400
            
        user_id = g.current_user_id
        
        picks = data.get('picks', [])
        
        if not isinstance(picks, list) or len(picks) == 0:
            return jsonify({
                'success': False,
                'error': 'Picks must be a non-empty list'
            }), 400
        
        # Validate pick format
        for pick in picks:
            if not isinstance(pick, dict):
                return jsonify({
                    'success': False,
                    'error': 'Each pick must be an object'
                }), 400
            
            required_pick_fields = ['game_id', 'predicted_winner']
            missing_fields = [field for field in required_pick_fields if field not in pick]
            if missing_fields:
                return jsonify({
                    'success': False,
                    'error': f'Each pick must contain: {required_pick_fields}'
                }), 400
            
            if pick['predicted_winner'] not in ['home', 'away']:
                return jsonify({
                    'success': False,
                    'error': 'predicted_winner must be "home" or "away"'
                }), 400
        
        result = pickem_service.submit_picks(pool_id, user_id, picks)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Error in submit_picks endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@pickem_bp.route('/pools/<int:pool_id>/picks', methods=['GET'])
@jwt_required
def get_user_picks(pool_id):
    """Get user's picks for a pool"""
    try:
        user_id = g.current_user_id
        week_number = request.args.get('week', type=int)
        
        result = pickem_service.get_user_picks(pool_id, user_id, week_number)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404 if 'not found' in result['error'].lower() else 403
            
    except Exception as e:
        logger.error(f"Error in get_user_picks endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# Standings and Leaderboard Routes

@pickem_bp.route('/pools/<int:pool_id>/leaderboard', methods=['GET'])
@jwt_required
def get_pool_leaderboard(pool_id):
    """Get overall leaderboard for a pool"""
    try:
        user_id = g.current_user_id
        
        # Verify user has access to pool
        pool_details = pickem_service.get_pool_details(pool_id, user_id)
        if not pool_details['success']:
            return jsonify(pool_details), 403
        
        result = pickem_service.get_pool_leaderboard(pool_id)
        
        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 404
            
    except Exception as e:
        logger.error(f"Error in get_pool_leaderboard endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

# Health Check Route

@pickem_bp.route('/health', methods=['GET'])
def health_check():
    """Health check for Pick'em service"""
    try:
        current_week = pickem_service.get_current_nfl_week()
        
        return jsonify({
            'success': True,
            'service': 'Pick\'em Pools',
            'current_season': pickem_service.current_season,
            'current_week': current_week.week_number if current_week else None,
            'status': 'healthy'
        }), 200
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({
            'success': False,
            'error': 'Service unhealthy'
        }), 500

# Error Handlers

@pickem_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad request'
    }), 400

@pickem_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'success': False,
        'error': 'Authentication required'
    }), 401

@pickem_bp.errorhandler(403)
def forbidden(error):
    return jsonify({
        'success': False,
        'error': 'Access forbidden'
    }), 403

@pickem_bp.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'Resource not found'
    }), 404

@pickem_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error in Pick'em routes: {error}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500