"""
Email Capture API Routes
Handles newsletter signups and email list building for affiliate partnerships
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timezone
import logging
import re
from app.models.user import db
from app import limiter
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base

logger = logging.getLogger(__name__)

# Create email capture blueprint
email_capture_bp = Blueprint('email_capture', __name__, url_prefix='/api/email')

# Email capture model
class EmailCapture(db.Model):
    """Model for storing email capture data"""
    __tablename__ = 'email_captures'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), nullable=False, unique=True, index=True)
    source = Column(String(100), nullable=False)  # modal, footer, popup, etc.
    captured_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    is_verified = Column(Boolean, default=False)
    is_subscribed = Column(Boolean, default=True)
    user_agent = Column(String(500))
    ip_address = Column(String(45))  # Support IPv6
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'source': self.source,
            'captured_at': self.captured_at.isoformat(),
            'is_verified': self.is_verified,
            'is_subscribed': self.is_subscribed
        }

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email.lower()) is not None

@email_capture_bp.route('/capture', methods=['POST'])
@limiter.limit("5 per minute")
def capture_email():
    """
    Capture email address for newsletter/marketing
    
    Expected JSON:
    {
        "email": "user@example.com",
        "source": "modal|footer|popup",
        "timestamp": "2025-01-01T12:00:00Z"
    }
    """
    try:
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400
            
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body cannot be empty'
            }), 400
        
        # Validate required fields
        email = data.get('email', '').strip().lower()
        source = data.get('source', 'unknown').strip()
        
        if not email:
            return jsonify({
                'success': False,
                'error': 'Email address is required'
            }), 400
        
        # Validate email format
        if not validate_email(email):
            return jsonify({
                'success': False,
                'error': 'Invalid email address format'
            }), 400
        
        # Check if email already exists
        existing_capture = EmailCapture.query.filter_by(email=email).first()
        if existing_capture:
            if existing_capture.is_subscribed:
                return jsonify({
                    'success': True,
                    'message': 'Email already subscribed',
                    'existing': True
                }), 200
            else:
                # Re-subscribe existing email
                existing_capture.is_subscribed = True
                existing_capture.captured_at = datetime.now(timezone.utc)
                existing_capture.source = source
                db.session.commit()
                
                return jsonify({
                    'success': True,
                    'message': 'Email re-subscribed successfully',
                    'resubscribed': True
                }), 200
        
        # Create new email capture record
        email_capture = EmailCapture(
            email=email,
            source=source,
            user_agent=request.headers.get('User-Agent', '')[:500],
            ip_address=request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', ''))[:45]
        )
        
        db.session.add(email_capture)
        db.session.commit()
        
        logger.info(f"Email captured successfully: {email} from {source}")
        
        # TODO: Integrate with email service provider (Mailchimp, ConvertKit, etc.)
        # This would typically trigger:
        # 1. Welcome email sequence
        # 2. Add to email marketing lists
        # 3. Tag based on source for segmentation
        
        return jsonify({
            'success': True,
            'message': 'Email captured successfully',
            'data': {
                'email': email,
                'source': source,
                'captured_at': email_capture.captured_at.isoformat()
            }
        }), 201
        
    except Exception as e:
        logger.error(f"Email capture error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@email_capture_bp.route('/unsubscribe', methods=['POST'])
def unsubscribe_email():
    """
    Unsubscribe email from newsletter
    
    Expected JSON:
    {
        "email": "user@example.com"
    }
    """
    try:
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400
            
        data = request.get_json()
        email = data.get('email', '').strip().lower()
        
        if not email or not validate_email(email):
            return jsonify({
                'success': False,
                'error': 'Valid email address is required'
            }), 400
        
        # Find and unsubscribe email
        email_capture = EmailCapture.query.filter_by(email=email).first()
        if email_capture:
            email_capture.is_subscribed = False
            db.session.commit()
            
            logger.info(f"Email unsubscribed: {email}")
            
            return jsonify({
                'success': True,
                'message': 'Email unsubscribed successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Email not found in our records'
            }), 404
            
    except Exception as e:
        logger.error(f"Unsubscribe error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500

@email_capture_bp.route('/stats', methods=['GET'])
def get_capture_stats():
    """Get email capture statistics (admin only)"""
    try:
        from sqlalchemy import func
        from datetime import timedelta
        
        # Basic stats
        total_captures = EmailCapture.query.count()
        active_subscribers = EmailCapture.query.filter_by(is_subscribed=True).count()
        
        # Recent captures (last 30 days)
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        recent_captures = EmailCapture.query.filter(
            EmailCapture.captured_at >= thirty_days_ago
        ).count()
        
        # Source breakdown
        source_stats = db.session.query(
            EmailCapture.source,
            func.count(EmailCapture.id).label('count')
        ).group_by(EmailCapture.source).all()
        
        return jsonify({
            'success': True,
            'data': {
                'total_captures': total_captures,
                'active_subscribers': active_subscribers,
                'recent_captures_30d': recent_captures,
                'source_breakdown': [
                    {'source': source, 'count': count} 
                    for source, count in source_stats
                ]
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Stats error: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve statistics'
        }), 500