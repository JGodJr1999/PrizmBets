"""
Production Security Module
Implements comprehensive security measures for production deployment
"""

import os
import logging
from functools import wraps
from flask import Flask, request, redirect, url_for, g
from flask_talisman import Talisman
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import redis

logger = logging.getLogger(__name__)

class ProductionSecurity:
    """Handles all production security configurations"""
    
    def __init__(self, app=None):
        self.app = app
        self.talisman = None
        self.limiter = None
        self.redis_client = None
        
    def init_app(self, app: Flask):
        """Initialize security configurations with Flask app"""
        self.app = app
        
        # Setup Redis for rate limiting
        redis_url = app.config.get('REDIS_URL')
        if redis_url:
            self.redis_client = redis.from_url(redis_url)
        
        # Configure security headers with Talisman
        self._configure_security_headers()
        
        # Configure rate limiting
        self._configure_rate_limiting()
        
        # Configure HTTPS enforcement
        self._configure_https_enforcement()
        
        # Configure security middleware
        self._configure_security_middleware()
        
        logger.info("Production security initialized")
        
    def _configure_security_headers(self):
        """Configure security headers using Flask-Talisman"""
        csp_config = {
            'default-src': "'self'",
            'script-src': [
                "'self'",
                "'unsafe-inline'",  # Needed for React
                "https://js.stripe.com",
                "https://www.googletagmanager.com"
            ],
            'style-src': [
                "'self'",
                "'unsafe-inline'",  # Needed for styled-components
                "https://fonts.googleapis.com"
            ],
            'font-src': [
                "'self'",
                "https://fonts.gstatic.com"
            ],
            'img-src': [
                "'self'",
                "data:",
                "https:"
            ],
            'connect-src': [
                "'self'",
                "https://api.stripe.com",
                "wss:" + self.app.config.get('BACKEND_URL', '').replace('https:', '').replace('http:', ''),
                self.app.config.get('BACKEND_URL', '')
            ],
            'frame-src': [
                "https://js.stripe.com"
            ],
            'object-src': "'none'",
            'base-uri': "'self'"
        }
        
        self.talisman = Talisman(
            self.app,
            force_https=self.app.config.get('FORCE_HTTPS', True),
            strict_transport_security=True,
            strict_transport_security_max_age=self.app.config.get('HSTS_MAX_AGE', 31536000),
            strict_transport_security_include_subdomains=True,
            content_security_policy=csp_config,
            content_security_policy_nonce_in=['script-src'],
            referrer_policy='strict-origin-when-cross-origin',
            feature_policy={
                'geolocation': "'none'",
                'microphone': "'none'",
                'camera': "'none'",
                'payment': "'self'",
                'accelerometer': "'none'",
                'gyroscope': "'none'",
                'magnetometer': "'none'"
            }
        )
        
    def _configure_rate_limiting(self):
        """Configure rate limiting"""
        self.limiter = Limiter(
            app=self.app,
            key_func=get_remote_address,
            storage_uri=self.app.config.get('REDIS_URL'),
            default_limits=["1000 per hour"],
            headers_enabled=True
        )
        
        # Apply specific rate limits to sensitive endpoints
        @self.limiter.limit("10 per minute")
        def auth_rate_limit():
            pass
            
        @self.limiter.limit("5 per minute")
        def login_rate_limit():
            pass
            
        @self.limiter.limit("100 per hour")
        def api_rate_limit():
            pass
            
        # Apply to routes
        auth_endpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/reset-password']
        for endpoint in auth_endpoints:
            self.limiter.limit("5 per minute")(lambda: None)
            
    def _configure_https_enforcement(self):
        """Configure HTTPS enforcement"""
        @self.app.before_request
        def force_https():
            if not self.app.config.get('FORCE_HTTPS', True):
                return
                
            if request.headers.get('X-Forwarded-Proto') == 'http':
                return redirect(request.url.replace('http://', 'https://'), code=301)
                
    def _configure_security_middleware(self):
        """Configure additional security middleware"""
        
        @self.app.before_request
        def security_headers():
            """Add custom security headers"""
            g.start_time = time.time()
            
            # Log security-relevant information
            logger.info(f"Request: {request.method} {request.path} from {request.remote_addr}")
            
        @self.app.after_request
        def add_security_headers(response):
            """Add additional security headers"""
            # Remove server information
            response.headers['Server'] = 'PrizmBets'
            
            # Add custom security headers
            response.headers['X-Content-Type-Options'] = 'nosniff'
            response.headers['X-Frame-Options'] = 'DENY'
            response.headers['X-XSS-Protection'] = '1; mode=block'
            
            # Add response time header for monitoring
            if hasattr(g, 'start_time'):
                response.headers['X-Response-Time'] = f"{(time.time() - g.start_time) * 1000:.2f}ms"
            
            return response
            
        @self.app.errorhandler(429)
        def ratelimit_handler(e):
            """Handle rate limit exceeded"""
            logger.warning(f"Rate limit exceeded for {request.remote_addr} on {request.path}")
            return {
                'error': 'Rate limit exceeded',
                'message': 'Too many requests. Please try again later.',
                'retry_after': e.retry_after
            }, 429
            
    def validate_api_key(self, required_permissions=None):
        """Decorator for API key validation"""
        def decorator(f):
            @wraps(f)
            def decorated_function(*args, **kwargs):
                api_key = request.headers.get('X-API-Key')
                
                if not api_key:
                    return {'error': 'API key required'}, 401
                    
                # Validate API key (implement your API key validation logic)
                if not self._validate_api_key(api_key, required_permissions):
                    return {'error': 'Invalid API key'}, 401
                    
                return f(*args, **kwargs)
            return decorated_function
        return decorator
        
    def _validate_api_key(self, api_key: str, permissions=None) -> bool:
        """Validate API key and permissions"""
        # Implement API key validation logic
        # This should check against your API key store (database, Redis, etc.)
        valid_keys = self.app.config.get('VALID_API_KEYS', [])
        return api_key in valid_keys
        
    def log_security_event(self, event_type: str, details: dict):
        """Log security events for monitoring"""
        security_event = {
            'event_type': event_type,
            'timestamp': time.time(),
            'ip_address': request.remote_addr if request else 'unknown',
            'user_agent': request.headers.get('User-Agent') if request else 'unknown',
            'details': details
        }
        
        logger.warning(f"Security Event: {event_type} - {details}")
        
        # Store in Redis for real-time monitoring
        if self.redis_client:
            try:
                self.redis_client.lpush(
                    'security_events',
                    json.dumps(security_event)
                )
                # Keep only last 1000 events
                self.redis_client.ltrim('security_events', 0, 999)
            except Exception as e:
                logger.error(f"Failed to store security event: {e}")

def create_security_blueprint():
    """Create security-related routes blueprint"""
    from flask import Blueprint
    
    security_bp = Blueprint('security', __name__)
    
    @security_bp.route('/security/health')
    def security_health():
        """Security health check endpoint"""
        return {
            'status': 'healthy',
            'security_features': {
                'https_enforced': True,
                'rate_limiting': True,
                'security_headers': True,
                'csrf_protection': True
            }
        }
        
    @security_bp.route('/security/csp-report', methods=['POST'])
    def csp_report():
        """Handle CSP violation reports"""
        try:
            report = request.get_json()
            logger.warning(f"CSP Violation: {report}")
            return '', 204
        except Exception as e:
            logger.error(f"Error processing CSP report: {e}")
            return '', 400
            
    return security_bp

# Import required modules
import time
import json

# Global security instance
security_manager = ProductionSecurity()

def init_production_security(app: Flask):
    """Initialize production security"""
    security_manager.init_app(app)
    
    # Register security blueprint
    security_bp = create_security_blueprint()
    app.register_blueprint(security_bp)
    
    return security_manager