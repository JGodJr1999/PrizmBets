"""
PrizmBets - Secure Admin API Routes
Admin dashboard endpoints with role-based access control
"""

from flask import Blueprint, request, jsonify
from app.utils.auth_decorators import auth_required
from app.services.admin_service import AdminService
from app.models.user import User
import logging

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')
logger = logging.getLogger(__name__)

def admin_required(f):
    """Decorator to require admin privileges"""
    from functools import wraps
    
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user = getattr(request, 'current_user', None)
        
        if not current_user:
            return jsonify({'error': 'Authentication required'}), 401
        
        if not AdminService.check_admin_permission(current_user, 'admin'):
            logger.warning(f"Unauthorized admin access attempt by {current_user.email}")
            return jsonify({'error': 'Admin privileges required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

@admin_bp.route('/dashboard', methods=['GET'])
@auth_required()
@admin_required
def get_dashboard():
    """Get admin dashboard overview"""
    try:
        dashboard_data = AdminService.get_dashboard_overview()
        
        if 'error' in dashboard_data:
            return jsonify(dashboard_data), 500
        
        return jsonify({
            'success': True,
            'data': dashboard_data
        })
        
    except Exception as e:
        logger.error(f"Admin dashboard error: {str(e)}")
        return jsonify({'error': 'Unable to load dashboard'}), 500

@admin_bp.route('/users', methods=['GET'])
@auth_required()
@admin_required
def get_users():
    """Get user analytics with pagination"""
    try:
        # Get pagination parameters
        limit = request.args.get('limit', 50, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        # Validate parameters
        if limit < 1 or limit > 1000:
            return jsonify({'error': 'Limit must be between 1 and 1000'}), 400
        
        if offset < 0:
            return jsonify({'error': 'Offset must be non-negative'}), 400
        
        user_data = AdminService.get_user_analytics(limit=limit, offset=offset)
        
        if 'error' in user_data:
            return jsonify(user_data), 500
        
        return jsonify({
            'success': True,
            'data': user_data
        })
        
    except Exception as e:
        logger.error(f"Admin users error: {str(e)}")
        return jsonify({'error': 'Unable to retrieve user data'}), 500

@admin_bp.route('/users/<int:user_id>', methods=['GET'])
@auth_required()
@admin_required
def get_user_detail(user_id):
    """Get detailed information about a specific user"""
    try:
        user_detail = AdminService.get_user_detail(user_id)
        
        if 'error' in user_detail:
            return jsonify(user_detail), 404 if user_detail['error'] == 'User not found' else 400
        
        return jsonify({
            'success': True,
            'data': user_detail
        })
        
    except Exception as e:
        logger.error(f"Admin user detail error for user {user_id}: {str(e)}")
        return jsonify({'error': 'Unable to retrieve user details'}), 500

@admin_bp.route('/users/<int:user_id>/action', methods=['POST'])
@auth_required()
@admin_required
def admin_user_action(user_id):
    """Perform admin action on a user"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        action = data.get('action')
        
        if not action:
            return jsonify({'error': 'Action is required'}), 400
        
        current_user = getattr(request, 'current_user')
        result = AdminService.update_user_status(current_user, user_id, action)
        
        if 'error' in result:
            status_code = 403 if 'permission' in result['error'].lower() else 400
            return jsonify(result), status_code
        
        return jsonify({
            'success': True,
            'data': result
        })
        
    except Exception as e:
        logger.error(f"Admin action error for user {user_id}: {str(e)}")
        return jsonify({'error': 'Unable to complete admin action'}), 500

@admin_bp.route('/system/health', methods=['GET'])
@auth_required()
@admin_required
def get_system_health():
    """Get system health metrics"""
    try:
        health_data = AdminService.get_system_health()
        
        if 'error' in health_data:
            return jsonify(health_data), 500
        
        return jsonify({
            'success': True,
            'data': health_data
        })
        
    except Exception as e:
        logger.error(f"System health error: {str(e)}")
        return jsonify({'error': 'Unable to retrieve system health'}), 500

@admin_bp.route('/analytics/trends', methods=['GET'])
@auth_required()
@admin_required
def get_usage_trends():
    """Get usage trends and analytics"""
    try:
        days = request.args.get('days', 7, type=int)
        
        # Validate days parameter
        if days < 1 or days > 90:
            return jsonify({'error': 'Days must be between 1 and 90'}), 400
        
        trends_data = AdminService.get_usage_trends(days=days)
        
        if 'error' in trends_data:
            return jsonify(trends_data), 500
        
        return jsonify({
            'success': True,
            'data': trends_data
        })
        
    except Exception as e:
        logger.error(f"Usage trends error: {str(e)}")
        return jsonify({'error': 'Unable to retrieve usage trends'}), 500

@admin_bp.route('/test', methods=['GET'])
@auth_required()
@admin_required
def admin_test():
    """Test endpoint to verify admin access"""
    current_user = getattr(request, 'current_user')
    return jsonify({
        'success': True,
        'message': f'Admin access confirmed for {current_user.email}',
        'timestamp': AdminService.get_dashboard_overview().get('timestamp')
    })

# Security headers for admin endpoints
@admin_bp.after_request
def add_security_headers(response):
    """Add security headers to admin responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@admin_bp.errorhandler(403)
def forbidden(error):
    """Handle forbidden access attempts"""
    return jsonify({
        'error': 'Access forbidden',
        'message': 'Admin privileges required'
    }), 403

@admin_bp.errorhandler(401)
def unauthorized(error):
    """Handle unauthorized access attempts"""
    return jsonify({
        'error': 'Authentication required',
        'message': 'Please log in with admin credentials'
    }), 401