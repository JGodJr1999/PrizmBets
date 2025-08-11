from flask import Flask
from flask_cors import CORS
# Temporarily disabled due to SQLAlchemy version issue
# from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from app.config.settings import config
from app.models.user import db
import os

# Initialize extensions
# migrate = Migrate()  # Temporarily disabled
jwt = JWTManager()

def create_app(config_name=None):
    """Application factory pattern for Flask app creation"""
    
    app = Flask(__name__)
    
    # Load configuration
    config_name = config_name or os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    # migrate.init_app(app, db)  # Temporarily disabled
    jwt.init_app(app)
    
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
        
        # Check if session exists and is active
        session = UserSession.query.filter_by(
            refresh_token_jti=jti,
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
    # TODO: Fix pickem blueprint endpoint conflict
    # from app.routes.pickem import pickem_bp
    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(payments_bp, url_prefix='/api/payments')
    app.register_blueprint(updates_bp)
    # app.register_blueprint(pickem_bp)
    
    # Add security headers
    @app.after_request
    def add_security_headers(response):
        """Add security headers to all responses"""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        response.headers['Content-Security-Policy'] = "default-src 'self'"
        return response
    
    # Root route
    @app.route('/')
    def index():
        return {
            'message': 'SmartBets AI API',
            'version': '2.0.0',
            'status': 'running',
            'features': ['authentication', 'parlay-evaluation', 'odds-comparison', 'nfl-pickem-pools']
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
            'service': 'SmartBets AI',
            'version': '2.0.0'
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