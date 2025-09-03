import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration with security best practices"""
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-change-in-production'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle': 300,
        'pool_timeout': 30,
        'max_overflow': 10
    }
    
    # Security configurations
    WTF_CSRF_ENABLED = True
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    
    # CORS settings
    ALLOWED_ORIGINS = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
    
    # Rate limiting
    API_RATE_LIMIT = int(os.environ.get('API_RATE_LIMIT', 100))
    
    # JWT settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-change-in-production'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_ALGORITHM = 'HS256'
    JWT_BLACKLIST_ENABLED = True
    JWT_BLACKLIST_TOKEN_CHECKS = ['access', 'refresh']
    
    # Password security
    BCRYPT_LOG_ROUNDS = 12
    PASSWORD_MIN_LENGTH = 8
    PASSWORD_REQUIRE_SPECIAL = True
    
    # Session security
    SESSION_CLEANUP_INTERVAL = 3600  # 1 hour
    MAX_SESSIONS_PER_USER = 5
    
    # Email configuration
    MAIL_SERVER = os.environ.get('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.environ.get('MAIL_PORT', 587))
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS', 'true').lower() == 'true'
    MAIL_USE_SSL = os.environ.get('MAIL_USE_SSL', 'false').lower() == 'true'
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.environ.get('MAIL_DEFAULT_SENDER')
    MAIL_MAX_EMAILS = int(os.environ.get('MAIL_MAX_EMAILS', 50))  # Rate limiting
    MAIL_SUPPRESS_SEND = os.environ.get('MAIL_SUPPRESS_SEND', 'false').lower() == 'true'
    
    # reCAPTCHA configuration
    RECAPTCHA_SECRET_KEY = os.environ.get('RECAPTCHA_SECRET_KEY')
    RECAPTCHA_SITE_KEY = os.environ.get('RECAPTCHA_SITE_KEY')
    RECAPTCHA_ENABLED = os.environ.get('RECAPTCHA_ENABLED', 'true').lower() == 'true'
    RECAPTCHA_THRESHOLD = float(os.environ.get('RECAPTCHA_THRESHOLD', '0.5'))

class DevelopmentConfig(Config):
    DEBUG = True
    # Use relative path from project root for database
    basedir = os.path.abspath(os.path.dirname(__file__))
    project_root = os.path.join(basedir, '..', '..', '..')
    _db_path = os.path.join(project_root, 'backend', 'instance', 'dev_prizmbets.db')
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or f'sqlite:///{_db_path}'
    SESSION_COOKIE_SECURE = False  # Allow HTTP in development
    MAIL_SUPPRESS_SEND = True  # Don't send real emails in development

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    
    # Enhanced security for production
    PREFERRED_URL_SCHEME = 'https'
    SESSION_COOKIE_SECURE = True
    
    # Production database optimizations
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': int(os.environ.get('DB_POOL_SIZE', 10)),
        'max_overflow': int(os.environ.get('DB_MAX_OVERFLOW', 20)),
        'pool_timeout': int(os.environ.get('DB_POOL_TIMEOUT', 30)),
        'pool_recycle': int(os.environ.get('DB_POOL_RECYCLE', 3600)),
        'pool_pre_ping': True
    }
    
    # Performance optimizations
    WEB_CONCURRENCY = int(os.environ.get('WEB_CONCURRENCY', 4))
    
    # SSL/HTTPS enforcement
    SSL_REDIRECT = os.environ.get('SSL_REDIRECT', 'true').lower() == 'true'
    FORCE_HTTPS = os.environ.get('FORCE_HTTPS', 'true').lower() == 'true'
    
    # Enhanced rate limiting for production
    API_RATE_LIMIT = int(os.environ.get('API_RATE_LIMIT', 1000))
    
    # Logging configuration
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_FORMAT = os.environ.get('LOG_FORMAT', 'json')
    
    # CDN and static files
    CDN_URL = os.environ.get('CDN_URL')
    STATIC_URL = os.environ.get('STATIC_URL')
    
    # Feature flags
    ENABLE_REAL_PAYMENTS = os.environ.get('ENABLE_REAL_PAYMENTS', 'true').lower() == 'true'
    ENABLE_EMAIL_CAMPAIGNS = os.environ.get('ENABLE_EMAIL_CAMPAIGNS', 'true').lower() == 'true'
    ENABLE_ADMIN_DASHBOARD = os.environ.get('ENABLE_ADMIN_DASHBOARD', 'true').lower() == 'true'
    ENABLE_WEBSOCKETS = os.environ.get('ENABLE_WEBSOCKETS', 'true').lower() == 'true'
    
    # Security headers
    HSTS_MAX_AGE = int(os.environ.get('HSTS_MAX_AGE', 31536000))  # 1 year
    CONTENT_SECURITY_POLICY = os.environ.get(
        'CONTENT_SECURITY_POLICY',
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com; "
        "style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; "
        "connect-src 'self' https://api.stripe.com; frame-src https://js.stripe.com"
    )
    
    # Enhanced password security
    BCRYPT_LOG_ROUNDS = 14  # Increased for production
    
    # Session security
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=2)  # Shorter sessions in production
    
    # Rate limiting - more restrictive in production
    API_RATE_LIMIT = int(os.environ.get('API_RATE_LIMIT', 500))
    LOGIN_RATE_LIMIT = int(os.environ.get('LOGIN_RATE_LIMIT', 10))
    
    # File upload security
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    
    # Logging
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    LOG_TO_FILE = os.environ.get('LOG_TO_FILE', 'true').lower() == 'true'
    LOG_FILE_PATH = os.environ.get('LOG_FILE_PATH', '/var/log/prizmbets/app.log')

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

def get_settings():
    """Get current configuration settings"""
    config_name = os.environ.get('FLASK_ENV', 'development')
    return config.get(config_name, DevelopmentConfig)