"""
PrizmBets - Email Management Routes
Admin endpoints for managing email campaigns and user communications
"""

from flask import Blueprint, request, jsonify
from app.utils.auth_decorators import auth_required
from app.services.admin_service import AdminService
from app.services.email_service import EmailService
from app.models.user import User, UserUsage, db
from datetime import datetime, timezone, timedelta
import logging

email_bp = Blueprint('email', __name__, url_prefix='/api/email')
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
            logger.warning(f"Unauthorized email admin access attempt by {current_user.email}")
            return jsonify({'error': 'Admin privileges required'}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

@email_bp.route('/send-engagement', methods=['POST'])
@auth_required()
@admin_required
def send_engagement_emails():
    """Send engagement emails to inactive users"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        days_inactive = data.get('days_inactive', 7)
        
        # Validate parameters
        if not isinstance(days_inactive, int) or days_inactive < 1 or days_inactive > 90:
            return jsonify({'error': 'days_inactive must be between 1 and 90'}), 400
        
        # Find inactive users
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_inactive)
        inactive_users = User.query.filter(
            User.last_login_at < cutoff_date,
            User.is_active == True,
            User.is_verified == True
        ).limit(100).all()  # Limit to prevent spam
        
        # Send engagement emails
        from app import mail
        email_service = EmailService(mail)
        
        sent_count = 0
        failed_count = 0
        
        for user in inactive_users:
            try:
                if email_service.send_engagement_email(user, days_inactive):
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                logger.error(f"Failed to send engagement email to {user.email}: {str(e)}")
                failed_count += 1
        
        logger.info(f"Engagement email campaign: {sent_count} sent, {failed_count} failed")
        
        return jsonify({
            'success': True,
            'message': 'Engagement email campaign completed',
            'stats': {
                'users_found': len(inactive_users),
                'emails_sent': sent_count,
                'emails_failed': failed_count
            }
        })
        
    except Exception as e:
        logger.error(f"Engagement email campaign error: {str(e)}")
        return jsonify({'error': 'Failed to send engagement emails'}), 500

@email_bp.route('/send-upgrade-promotions', methods=['POST'])
@auth_required()
@admin_required
def send_upgrade_promotions():
    """Send upgrade promotions to free tier users"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        target_tier = data.get('target_tier', 'pro')
        
        # Validate target tier
        valid_tiers = ['pro', 'premium']
        if target_tier not in valid_tiers:
            return jsonify({'error': f'target_tier must be one of: {valid_tiers}'}), 400
        
        # Find free tier users who have used features recently
        recent_date = datetime.now(timezone.utc) - timedelta(days=7)
        active_free_users = db.session.query(User).join(UserUsage).filter(
            User.subscription_tier == 'free',
            User.is_active == True,
            User.is_verified == True,
            UserUsage.date >= recent_date,
            UserUsage.parlay_evaluations > 0
        ).distinct().limit(50).all()  # Limit to prevent spam
        
        # Send upgrade emails
        from app import mail
        email_service = EmailService(mail)
        
        sent_count = 0
        failed_count = 0
        
        for user in active_free_users:
            try:
                if email_service.send_upgrade_promotion(user, target_tier.title()):
                    sent_count += 1
                else:
                    failed_count += 1
            except Exception as e:
                logger.error(f"Failed to send upgrade email to {user.email}: {str(e)}")
                failed_count += 1
        
        logger.info(f"Upgrade promotion campaign: {sent_count} sent, {failed_count} failed")
        
        return jsonify({
            'success': True,
            'message': 'Upgrade promotion campaign completed',
            'stats': {
                'users_found': len(active_free_users),
                'emails_sent': sent_count,
                'emails_failed': failed_count,
                'target_tier': target_tier
            }
        })
        
    except Exception as e:
        logger.error(f"Upgrade promotion campaign error: {str(e)}")
        return jsonify({'error': 'Failed to send upgrade promotions'}), 500

@email_bp.route('/test-email', methods=['POST'])
@auth_required()
@admin_required
def test_email():
    """Send test email to admin"""
    try:
        if not request.is_json:
            return jsonify({'error': 'Content-Type must be application/json'}), 400
        
        data = request.get_json()
        email_type = data.get('type', 'welcome')
        recipient_email = data.get('email')
        
        current_user = getattr(request, 'current_user')
        
        # Use admin email if no recipient specified
        if not recipient_email:
            recipient_email = current_user.email
        
        # Basic email validation
        import re
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, recipient_email):
            return jsonify({'error': 'Invalid email address'}), 400
        
        # Create test user object for email rendering
        test_user = User(
            email=recipient_email,
            name="Test User"
        )
        
        # Send test email
        from app import mail
        email_service = EmailService(mail)
        
        success = False
        if email_type == 'welcome':
            success = email_service.send_welcome_email(test_user)
        elif email_type == 'engagement':
            success = email_service.send_engagement_email(test_user, 7)
        elif email_type == 'upgrade':
            success = email_service.send_upgrade_promotion(test_user, 'Pro')
        elif email_type == 'usage_limit':
            success = email_service.send_usage_limit_notification(test_user, 'parlay_evaluations', 3, 3)
        else:
            return jsonify({'error': 'Invalid email type'}), 400
        
        if success:
            logger.info(f"Test email sent: {email_type} to {recipient_email}")
            return jsonify({
                'success': True,
                'message': f'Test {email_type} email sent to {recipient_email}'
            })
        else:
            return jsonify({'error': 'Failed to send test email'}), 500
        
    except Exception as e:
        logger.error(f"Test email error: {str(e)}")
        return jsonify({'error': 'Failed to send test email'}), 500

@email_bp.route('/stats', methods=['GET'])
@auth_required()
@admin_required
def get_email_stats():
    """Get email statistics and metrics"""
    try:
        # Email stats would typically come from email service provider
        # For now, return placeholder data
        stats = {
            'total_emails_sent': 0,  # Would track in database
            'welcome_emails': 0,
            'engagement_emails': 0,
            'upgrade_promotions': 0,
            'usage_notifications': 0,
            'bounce_rate': '2.1%',
            'open_rate': '24.5%',
            'click_rate': '3.2%',
            'last_campaign': None
        }
        
        return jsonify({
            'success': True,
            'stats': stats
        })
        
    except Exception as e:
        logger.error(f"Email stats error: {str(e)}")
        return jsonify({'error': 'Failed to retrieve email stats'}), 500

# Security headers for email endpoints
@email_bp.after_request
def add_security_headers(response):
    """Add security headers to email responses"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    return response

@email_bp.errorhandler(403)
def forbidden(error):
    """Handle forbidden access attempts"""
    return jsonify({
        'error': 'Access forbidden',
        'message': 'Admin privileges required for email management'
    }), 403

@email_bp.errorhandler(400)
def bad_request(error):
    """Handle bad requests"""
    return jsonify({
        'error': 'Bad request',
        'message': 'Invalid request data'
    }), 400