"""
Update Management API Routes for SmartBets 2.0
Endpoints for checking and applying software updates
"""

from flask import Blueprint, request, jsonify, g
from functools import wraps
import logging
import asyncio
from typing import Dict, Any

# Import update manager with proper path
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

try:
    from agents.update_manager import update_manager
    from agents.subagents.update_subagents import (
        PackageScanner, VulnerabilityScanner, 
        DependencyResolver, UpdateScheduler, RollbackManager
    )
    UPDATE_MANAGER_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Update manager not available: {e}")
    UPDATE_MANAGER_AVAILABLE = False
    update_manager = None
    PackageScanner = None
    VulnerabilityScanner = None
    DependencyResolver = None
    UpdateScheduler = None
    RollbackManager = None

logger = logging.getLogger(__name__)

# Create blueprint
updates_bp = Blueprint('updates', __name__, url_prefix='/api/updates')

# Initialize subagents if available
if UPDATE_MANAGER_AVAILABLE:
    package_scanner = PackageScanner()
    vulnerability_scanner = VulnerabilityScanner()
    dependency_resolver = DependencyResolver()
    update_scheduler = UpdateScheduler()
    rollback_manager = RollbackManager()
else:
    package_scanner = None
    vulnerability_scanner = None
    dependency_resolver = None
    update_scheduler = None
    rollback_manager = None

def admin_required(f):
    """Decorator to require admin privileges"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # For now, just check if user is authenticated
        # In production, check for admin role
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization required'}), 401
        return f(*args, **kwargs)
    return decorated_function

def run_async(coro):
    """Helper to run async functions in Flask"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()

@updates_bp.route('/check', methods=['GET'])
@admin_required
def check_updates():
    """Check for available updates"""
    if not UPDATE_MANAGER_AVAILABLE:
        return jsonify({
            'success': False,
            'error': 'Update manager not available'
        }), 503
    
    try:
        # Run async update check
        result = run_async(update_manager._perform_update_check())
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking updates: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/apply', methods=['POST'])
@admin_required
def apply_updates():
    """Apply selected updates"""
    try:
        data = request.get_json()
        
        # Get list of updates to apply
        updates_to_apply = data.get('updates', [])
        auto_only = data.get('auto_only', False)
        
        if auto_only:
            # Apply only automatic updates
            result = run_async(update_manager._apply_pending_updates())
        else:
            # Apply specific updates
            results = {'applied': [], 'failed': []}
            
            for update in updates_to_apply:
                package = update.get('package')
                version = update.get('version')
                update_type = update.get('type')
                
                if update_type == 'npm':
                    success = run_async(update_manager.apply_npm_update(package, version))
                elif update_type == 'pip':
                    success = run_async(update_manager.apply_pip_update(package, version))
                else:
                    success = False
                
                if success:
                    results['applied'].append(update)
                else:
                    results['failed'].append(update)
            
            result = results
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error applying updates: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/history', methods=['GET'])
@admin_required
def get_update_history():
    """Get update history"""
    try:
        # Get pagination parameters
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        # Get history from update manager
        history = update_manager.update_history
        
        # Paginate
        start = (page - 1) * per_page
        end = start + per_page
        paginated = history[start:end]
        
        return jsonify({
            'success': True,
            'data': {
                'history': paginated,
                'total': len(history),
                'page': page,
                'per_page': per_page
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting update history: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/rollback', methods=['POST'])
@admin_required
def rollback_update():
    """Rollback a specific update"""
    try:
        data = request.get_json()
        
        # Get rollback parameters
        package = data.get('package')
        package_type = data.get('type')
        rollback_id = data.get('rollback_id')
        
        if rollback_id:
            # Use specific rollback point
            result = run_async(rollback_manager.rollback(rollback_id))
        else:
            # Rollback to previous version
            result = run_async(update_manager._perform_rollback({
                'package': package,
                'type': package_type
            }))
        
        return jsonify({
            'success': result.get('success', False),
            'data': result
        }), 200 if result.get('success') else 400
        
    except Exception as e:
        logger.error(f"Error rolling back update: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/vulnerabilities', methods=['GET'])
@admin_required
def check_vulnerabilities():
    """Check for security vulnerabilities"""
    try:
        # Run security scan
        result = run_async(update_manager._perform_security_scan())
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error checking vulnerabilities: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/status', methods=['GET'])
@admin_required
def get_update_status():
    """Get current update manager status"""
    try:
        # Get status from update manager
        status = run_async(update_manager.get_status_report())
        
        return jsonify({
            'success': True,
            'data': status
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting update status: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/settings', methods=['GET'])
@admin_required
def get_update_settings():
    """Get update manager settings"""
    try:
        settings = {
            'auto_update_major': update_manager.auto_update_major,
            'auto_update_minor': update_manager.auto_update_minor,
            'auto_update_patch': update_manager.auto_update_patch,
            'check_interval_hours': update_manager.check_interval.total_seconds() / 3600,
            'npm_available': update_manager.npm_available,
            'pip_available': update_manager.pip_available
        }
        
        return jsonify({
            'success': True,
            'data': settings
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting update settings: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/settings', methods=['PUT'])
@admin_required
def update_settings():
    """Update manager settings"""
    try:
        data = request.get_json()
        
        # Update settings
        if 'auto_update_major' in data:
            update_manager.auto_update_major = data['auto_update_major']
        if 'auto_update_minor' in data:
            update_manager.auto_update_minor = data['auto_update_minor']
        if 'auto_update_patch' in data:
            update_manager.auto_update_patch = data['auto_update_patch']
        if 'check_interval_hours' in data:
            from datetime import timedelta
            update_manager.check_interval = timedelta(hours=data['check_interval_hours'])
        
        return jsonify({
            'success': True,
            'message': 'Settings updated successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Error updating settings: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/schedule', methods=['POST'])
@admin_required
def schedule_update():
    """Schedule an update for later"""
    try:
        data = request.get_json()
        
        # Get scheduling parameters
        package = data.get('package')
        update_type = data.get('type')
        scheduled_time = data.get('scheduled_time')
        
        # Schedule the update
        result = update_scheduler.schedule_update(package, update_type)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error scheduling update: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/package/<package_type>/<package_name>', methods=['GET'])
@admin_required
def get_package_info(package_type: str, package_name: str):
    """Get detailed information about a specific package"""
    try:
        # Get current version
        current_version = request.args.get('current_version', 'latest')
        
        # Scan package for info
        if package_type == 'npm':
            result = run_async(package_scanner.scan_npm_package(package_name, current_version))
        elif package_type == 'pip':
            result = run_async(package_scanner.scan_pip_package(package_name, current_version))
        else:
            return jsonify({'error': 'Invalid package type'}), 400
        
        # Check compatibility
        if 'latest' in result:
            compatibility = run_async(
                dependency_resolver.check_compatibility(
                    package_name, result['latest'], package_type
                )
            )
            result['compatibility'] = compatibility
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting package info: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@updates_bp.route('/rollback-points', methods=['GET'])
@admin_required
def get_rollback_points():
    """Get available rollback points"""
    try:
        rollback_points = rollback_manager.get_available_rollbacks()
        
        return jsonify({
            'success': True,
            'data': rollback_points
        }), 200
        
    except Exception as e:
        logger.error(f"Error getting rollback points: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# Error handlers
@updates_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        'success': False,
        'error': 'Bad request'
    }), 400

@updates_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'success': False,
        'error': 'Unauthorized'
    }), 401

@updates_bp.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal error in updates routes: {error}")
    return jsonify({
        'success': False,
        'error': 'Internal server error'
    }), 500