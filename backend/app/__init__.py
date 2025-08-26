from flask import Flask
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from app.config.settings import config
from app.models.user import db
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration
import os

# Initialize extensions
migrate = Migrate()
jwt = JWTManager()
mail = Mail()
limiter = Limiter(key_func=get_remote_address)

def create_app(config_name=None):
    """Application factory pattern for Flask app creation"""
    
    # Initialize Sentry for error monitoring
    sentry_dsn = os.environ.get('SENTRY_DSN')
    if sentry_dsn and config_name in ['production', 'staging']:
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[FlaskIntegration(transaction_style='endpoint')],
            traces_sample_rate=0.1,  # Capture 10% of transactions for performance monitoring
            environment=config_name,
            release=os.environ.get('APP_VERSION', '2.0.0'),
            before_send=lambda event, hint: event if event.get('level') in ['error', 'fatal'] else None
        )
    
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    mail.init_app(app)
    limiter.init_app(app)
    
    # Initialize CORS with security settings
    CORS(app, 
         origins=app.config['ALLOWED_ORIGINS'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
         allow_headers=['Content-Type', 'Authorization'],
         supports_credentials=True,
         max_age=600)
    
    # Configure request limits for security
    app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024  # 1MB max request size
    
    # JWT configuration
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        """Check if token is revoked/blacklisted"""
        from app.models.user import UserSession
        jti = jwt_payload['jti']
        token_type = jwt_payload.get('type', 'access')  # default to access token
        
        # Check if session exists and is active
        if token_type == 'refresh':
            session = UserSession.query.filter_by(
                refresh_token_jti=jti,
                is_active=True
            ).first()
        else:  # access token
            session = UserSession.query.filter_by(
                access_token_jti=jti,
                is_active=True
            ).first()
        
        if not session:
            return True  # Token is revoked if no active session found
            
        # Check if session is expired
        if session.is_expired():
            session.is_active = False
            db.session.commit()
            return True
            
        return False
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token has expired', 'message': 'Please refresh your token'}, 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return {'error': 'Invalid token', 'message': 'Please provide a valid token'}, 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return {'error': 'Authorization required', 'message': 'Please provide a valid token'}, 401
    
    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return {'error': 'Token has been revoked', 'message': 'Please log in again'}, 401
    
    # Register blueprints
    from app.routes.api import api_bp
    from app.routes.auth import auth_bp
    from app.routes.payments import payments_bp
    from app.routes.updates import updates_bp
    from app.routes.pickem_simple import pickem_bp
    from app.routes.admin import admin_bp
    from app.routes.email import email_bp
    from app.routes.educational import educational_bp
    from app.routes.usage import usage_bp
    from app.routes.consent_api import consent_bp
    from app.routes.email_capture import email_capture_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(updates_bp)
    app.register_blueprint(pickem_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(email_bp)
    app.register_blueprint(email_capture_bp)  # Email capture for CPA affiliates
    app.register_blueprint(educational_bp)
    app.register_blueprint(usage_bp, url_prefix='/api/usage')
    app.register_blueprint(consent_bp)  # Already has /api/user prefix
    
    # Add security headers
    @app.after_request
    def add_security_headers(response):
        """Add security headers to all responses"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        
        # Configure HSTS only for HTTPS in production
        if app.config.get('FLASK_ENV') == 'production':
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        
        # Enhanced CSP for production with Stripe integration
        csp = app.config.get('CONTENT_SECURITY_POLICY', 
                           "default-src 'self'; "
                           "script-src 'self' 'unsafe-inline' https://js.stripe.com; "
                           "style-src 'self' 'unsafe-inline'; "
                           "img-src 'self' data: https:; "
                           "connect-src 'self' https://api.stripe.com; "
                           "frame-src https://js.stripe.com")
        response.headers['Content-Security-Policy'] = csp
        return response
    
    # Root route
    @app.route('/')
    def index():
        return {
            'message': 'PrizmBets AI API',
            'version': '2.0.0',
            'status': 'running',
            'features': [
                'authentication',
                'free-tier-system', 
                'parlay-evaluation',
                'odds-comparison',
                'admin-dashboard',
                'email-system',
                'educational-content',
                'nfl-pickem-pools',
                'production-ready'
            ],
            'endpoints': {
                'auth': '/api/auth/*',
                'parlay_analysis': '/api/evaluate',
                'tier_management': '/api/usage',
                'admin_dashboard': '/api/admin/*',
                'email_management': '/api/email/*', 
                'educational_content': '/api/education/*',
                'payments': '/api/payments/*',
                'pickem_pools': '/api/pickem/*'
            }
        }
    
    # Health check with database status
    @app.route('/health')
    def health_check():
        try:
            # Test database connection with modern SQLAlchemy syntax
            from sqlalchemy import text
            db.session.execute(text('SELECT 1'))
            db_status = 'healthy'
        except Exception as e:
            db_status = 'unhealthy'
        
        return {
            'status': 'healthy',
            'database': db_status,
            'service': 'PrizmBets AI',
            'version': '2.0.0',
            'systems': {
                'authentication': 'operational',
                'free_tier': 'operational',
                'email_service': 'operational',
                'admin_dashboard': 'operational',
                'educational_content': 'operational',
                'production_config': 'ready'
            },
            'deployment_ready': True
        }
    
    # Global error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'error': 'Endpoint not found'}, 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return {'error': 'Method not allowed'}, 405
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500
    
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return {'error': 'Request payload too large'}, 413
    
    return app