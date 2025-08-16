"""
Production Logging Configuration for PrizmBets
Structured logging with JSON format for production monitoring
"""

import logging
import logging.config
import os
import sys
from datetime import datetime
import json

class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""
    
    def format(self, record):
        # Create log entry structure
        log_entry = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields from record
        extra_fields = [
            'user_id', 'request_id', 'ip_address', 'user_agent',
            'endpoint', 'method', 'status_code', 'response_time'
        ]
        
        for field in extra_fields:
            if hasattr(record, field):
                log_entry[field] = getattr(record, field)
        
        return json.dumps(log_entry)

def setup_production_logging():
    """Configure production logging with structured JSON output"""
    
    log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()
    log_format = os.environ.get('LOG_FORMAT', 'json').lower()
    
    if log_format == 'json':
        formatter_class = 'monitoring.logging_config.JSONFormatter'
        format_string = None
    else:
        formatter_class = 'logging.Formatter'
        format_string = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    config = {
        'version': 1,
        'disable_existing_loggers': False,
        'formatters': {
            'detailed': {
                'class': formatter_class,
            },
            'simple': {
                'format': '%(levelname)s - %(message)s'
            }
        },
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
                'level': log_level,
                'formatter': 'detailed',
                'stream': sys.stdout
            },
            'file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': log_level,
                'formatter': 'detailed',
                'filename': 'logs/prizmbets.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 10,
                'encoding': 'utf8'
            },
            'error_file': {
                'class': 'logging.handlers.RotatingFileHandler',
                'level': 'ERROR',
                'formatter': 'detailed',
                'filename': 'logs/errors.log',
                'maxBytes': 10485760,  # 10MB
                'backupCount': 5,
                'encoding': 'utf8'
            }
        },
        'loggers': {
            '': {  # Root logger
                'level': log_level,
                'handlers': ['console', 'file'],
                'propagate': False
            },
            'app': {
                'level': log_level,
                'handlers': ['console', 'file', 'error_file'],
                'propagate': False
            },
            'werkzeug': {
                'level': 'WARNING',
                'handlers': ['console'],
                'propagate': False
            },
            'gunicorn.error': {
                'level': 'INFO',
                'handlers': ['console', 'file'],
                'propagate': False
            },
            'gunicorn.access': {
                'level': 'INFO',
                'handlers': ['console'],
                'propagate': False
            }
        }
    }
    
    # Add format string if not using JSON
    if format_string:
        config['formatters']['detailed']['format'] = format_string
    
    # Create logs directory if it doesn't exist
    os.makedirs('logs', exist_ok=True)
    
    logging.config.dictConfig(config)
    
    # Configure Sentry if DSN is provided
    sentry_dsn = os.environ.get('SENTRY_DSN')
    if sentry_dsn:
        import sentry_sdk
        from sentry_sdk.integrations.flask import FlaskIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        
        sentry_logging = LoggingIntegration(
            level=logging.INFO,        # Capture info and above as breadcrumbs
            event_level=logging.ERROR  # Send error events for ERROR and above
        )
        
        sentry_sdk.init(
            dsn=sentry_dsn,
            integrations=[
                FlaskIntegration(transaction_style='endpoint'),
                sentry_logging,
            ],
            traces_sample_rate=0.1,  # Capture 10% of transactions for performance monitoring
            send_default_pii=False,  # Don't send PII
            environment=os.environ.get('FLASK_ENV', 'production'),
            release=os.environ.get('APP_VERSION', 'unknown')
        )

def get_request_logger():
    """Get logger configured for request logging"""
    return logging.getLogger('app.requests')

def get_security_logger():
    """Get logger configured for security events"""
    return logging.getLogger('app.security')

def get_performance_logger():
    """Get logger configured for performance metrics"""
    return logging.getLogger('app.performance')

def log_request_info(request, response, response_time=None):
    """Log request information in structured format"""
    logger = get_request_logger()
    
    # Create log record with extra fields
    extra = {
        'ip_address': request.remote_addr,
        'user_agent': request.headers.get('User-Agent', ''),
        'endpoint': request.endpoint,
        'method': request.method,
        'status_code': response.status_code,
        'request_id': getattr(request, 'request_id', None),
        'user_id': getattr(request, 'current_user_id', None),
    }
    
    if response_time:
        extra['response_time'] = response_time
    
    logger.info(
        f"{request.method} {request.path} - {response.status_code}",
        extra=extra
    )

def log_security_event(event_type, details, user_id=None, ip_address=None):
    """Log security events"""
    logger = get_security_logger()
    
    extra = {
        'event_type': event_type,
        'user_id': user_id,
        'ip_address': ip_address,
    }
    
    logger.warning(f"Security event: {event_type} - {details}", extra=extra)

def log_performance_metric(metric_name, value, unit='ms', **kwargs):
    """Log performance metrics"""
    logger = get_performance_logger()
    
    extra = {
        'metric_name': metric_name,
        'metric_value': value,
        'metric_unit': unit,
        **kwargs
    }
    
    logger.info(f"Performance metric: {metric_name} = {value}{unit}", extra=extra)