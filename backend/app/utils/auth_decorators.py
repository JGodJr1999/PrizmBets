"""
Authentication decorators and middleware for PrizmBets
Provides role-based access control and authentication requirements
"""

from functools import wraps
from flask import jsonify, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt, verify_jwt_in_request
from ..models.user import User, UserSession, db
from ..utils.jwt_utils import TokenManager, SecurityUtils
from ..services.payment_service import SubscriptionTier
import logging

logger = logging.getLogger(__name__)

def auth_required(optional=False):
    """
    Decorator to require authentication for endpoints
    Args:
        optional (bool): If True, allows access without token but populates current_user if available
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                if optional:
                    # Try to verify JWT but don't fail if not present
                    try:
                        verify_jwt_in_request(optional=True)
                        user_id = get_jwt_identity()
                        if user_id:
                            current_user = User.query.get(user_id)
                            if current_user and current_user.is_active:
                                request.current_user = current_user
                            else:
                                request.current_user = None
                        else:
                            request.current_user = None
                    except Exception:
                        request.current_user = None
                else:
                    # Require valid JWT
                    verify_jwt_in_request()
                    user_id = get_jwt_identity()
                    
                    if not user_id:
                        return jsonify({
                            'error': 'Invalid token',
                            'message': 'User identity not found in token'
                        }), 401
                    
                    # Get user from database
                    current_user = User.query.get(user_id)
                    if not current_user or not current_user.is_active:
                        return jsonify({
                            'error': 'User not found or inactive',
                            'message': 'Please contact support if you believe this is an error'
                        }), 401
                    
                    # Check for suspicious activity
                    client_ip = TokenManager._get_client_ip()
                    if SecurityUtils.is_suspicious_activity(user_id, client_ip):
                        logger.warning(f"Suspicious activity detected for user {user_id} from IP {client_ip}")
                        # Could implement additional security measures here
                    
                    # Add user to request context
                    request.current_user = current_user
                
                return f(*args, **kwargs)
                
            except Exception as e:
                logger.error(f"Authentication error: {str(e)}")
                return jsonify({
                    'error': 'Authentication failed',
                    'message': 'Please log in again'
                }), 401
        
        return decorated_function
    return decorator

def require_subscription(required_tiers):
    """
    Decorator to require specific subscription tiers for endpoint access
    
    Args:
        required_tiers (list): List of subscription tiers that can access this endpoint
                              ['free', 'pro', 'premium'] or ['pro', 'premium']
    """
    def decorator(f):
        @wraps(f)
        @auth_required()
        def decorated_function(*args, **kwargs):
            user = getattr(request, 'current_user', None)
            
            if not user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please log in to access this resource'
                }), 401
            
            # Check subscription tier
            if user.subscription_tier not in required_tiers:
                return jsonify({
                    'error': 'Subscription upgrade required',
                    'current_tier': user.subscription_tier,
                    'required_tiers': required_tiers,
                    'upgrade_url': '/api/payments/subscription/tiers'
                }), 402  # Payment Required
            
            # Check subscription status for paid tiers
            if user.subscription_tier in ['pro', 'premium']:
                if user.subscription_status not in ['active', 'trialing']:
                    return jsonify({
                        'error': 'Subscription payment required',
                        'subscription_status': user.subscription_status,
                        'billing_url': '/api/payments/subscription/status'
                    }), 402
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def subscription_required(required_tier='premium'):
    """
    Decorator to require specific subscription tier (legacy support)
    Args:
        required_tier (str): Required subscription tier ('free', 'premium', 'pro')
    """
    def decorator(f):
        @wraps(f)
        @auth_required()
        def decorated_function(*args, **kwargs):
            user = getattr(request, 'current_user', None)
            
            if not user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please log in to access this resource'
                }), 401
            
            # Define tier hierarchy
            tier_levels = {
                'free': 0,
                'pro': 1,
                'premium': 2
            }
            
            user_level = tier_levels.get(user.subscription_tier, 0)
            required_level = tier_levels.get(required_tier, 1)
            
            if user_level < required_level:
                return jsonify({
                    'error': 'Subscription upgrade required',
                    'message': f'This feature requires {required_tier} subscription',
                    'current_tier': user.subscription_tier,
                    'required_tier': required_tier
                }), 402  # Payment Required
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def verified_user_required():
    """Decorator to require email verification"""
    def decorator(f):
        @wraps(f)
        @auth_required()
        def decorated_function(*args, **kwargs):
            user = getattr(request, 'current_user', None)
            
            if not user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please log in to access this resource'
                }), 401
            
            if not user.is_verified:
                return jsonify({
                    'error': 'Email verification required',
                    'message': 'Please verify your email address to access this feature',
                    'verification_required': True
                }), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def admin_required():
    """Decorator to require admin privileges"""
    def decorator(f):
        @wraps(f)
        @auth_required()
        def decorated_function(*args, **kwargs):
            user = getattr(request, 'current_user', None)
            
            if not user:
                return jsonify({
                    'error': 'Authentication required',
                    'message': 'Please log in to access this resource'
                }), 401
            
            # Check if user has admin role (you can extend User model with roles)
            if user.subscription_tier != 'admin':  # Placeholder logic
                return jsonify({
                    'error': 'Admin access required',
                    'message': 'You do not have permission to access this resource'
                }), 403
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def rate_limit_check(max_requests=100, window_minutes=60):
    """
    Simple rate limiting decorator
    Args:
        max_requests (int): Maximum requests allowed
        window_minutes (int): Time window in minutes
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Implementation would require Redis or similar for production
            # This is a placeholder for the concept
            
            # For now, just log the request
            user = getattr(request, 'current_user', None)
            client_ip = TokenManager._get_client_ip()
            
            logger.info(f"API request: {request.endpoint} from user {user.id if user else 'anonymous'} at IP {client_ip}")
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def get_current_user():
    """
    Utility function to get current authenticated user
    Returns None if not authenticated
    """
    return getattr(request, 'current_user', None)

def require_fresh_token():
    """Decorator to require a fresh access token"""
    def decorator(f):
        @wraps(f)
        @jwt_required(fresh=True)
        def decorated_function(*args, **kwargs):
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

class AuthMiddleware:
    """Middleware class for authentication processing"""
    
    def __init__(self, app=None):
        self.app = app
        if app is not None:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the middleware with Flask app"""
        app.before_request(self.before_request)
        app.after_request(self.after_request)
    
    def before_request(self):
        """Process request before route handler"""
        # Log request information
        client_ip = TokenManager._get_client_ip()
        user_agent = request.headers.get('User-Agent', '')
        
        logger.debug(f"Request: {request.method} {request.path} from {client_ip}")
        
        # Check for blocked IPs or suspicious patterns
        if self._is_blocked_request():
            return jsonify({
                'error': 'Request blocked',
                'message': 'Your request has been blocked for security reasons'
            }), 403
    
    def after_request(self, response):
        """Process response after route handler"""
        # Add additional security headers if needed
        if not response.headers.get('X-Request-ID'):
            import uuid
            response.headers['X-Request-ID'] = str(uuid.uuid4())
        
        # Log response information
        user = getattr(request, 'current_user', None)
        logger.debug(f"Response: {response.status_code} for user {user.id if user else 'anonymous'}")
        
        return response
    
    def _is_blocked_request(self):
        """Check if request should be blocked"""
        # Implement IP blocking, rate limiting, etc.
        # This is a placeholder for security checks
        
        client_ip = TokenManager._get_client_ip()
        user_agent = request.headers.get('User-Agent', '')
        
        # Block requests with no user agent
        if not user_agent:
            logger.warning(f"Blocked request with no user agent from {client_ip}")
            return True
        
        # Block obviously malicious user agents
        malicious_patterns = [
            'sqlmap',
            'nikto',
            'nmap',
            'dirbuster',
            'burp'
        ]
        
        for pattern in malicious_patterns:
            if pattern.lower() in user_agent.lower():
                logger.warning(f"Blocked malicious user agent: {user_agent} from {client_ip}")
                return True
        
        return False

# Utility functions for use in route handlers
def get_user_from_token():
    """Get user object from JWT token"""
    try:
        user_id = get_jwt_identity()
        if user_id:
            return User.query.get(user_id)
        return None
    except Exception:
        return None

def validate_session_token():
    """Validate that the current session token is still valid"""
    try:
        token_data = get_jwt()
        user_id = get_jwt_identity()
        jti = token_data.get('jti')
        
        if not TokenManager.validate_session(user_id, jti):
            return False
        
        return True
    except Exception:
        return False

# Enhanced JWT decorator with proper g object population
def jwt_required(f):
    """Custom JWT decorator that properly sets up g object for routes"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Use Flask-JWT-Extended's verification
            from flask import g
            from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
            
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            if not user_id:
                return jsonify({
                    'error': 'Invalid token',
                    'message': 'Please provide a valid token'
                }), 401
            
            # Set user ID in g object for route access
            g.current_user_id = user_id
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"JWT verification failed: {str(e)}")
            return jsonify({
                'error': 'Authentication failed', 
                'message': 'Please log in again'
            }), 401
    
    return decorated_function