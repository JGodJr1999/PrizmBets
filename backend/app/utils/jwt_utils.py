"""
JWT token management utilities for PrizmBets
Handles token generation, validation, and session management
"""

import uuid
import hashlib
from datetime import datetime, timezone, timedelta
from flask import current_app, request
from flask_jwt_extended import create_access_token, create_refresh_token, get_jwt, get_jwt_identity
from werkzeug.security import generate_password_hash
from app.models.user import db, UserSession
import logging

logger = logging.getLogger(__name__)

class TokenManager:
    """Centralized token management for authentication"""
    
    @staticmethod
    def create_user_tokens(user_id, additional_claims=None):
        """
        Create access and refresh tokens for a user
        Returns tuple: (access_token, refresh_token, session_id)
        """
        try:
            # Generate JTI (JWT ID) for both tokens
            access_jti = str(uuid.uuid4())
            refresh_jti = str(uuid.uuid4())
            
            # Additional claims for tokens
            claims = additional_claims or {}
            claims.update({
                'user_id': user_id,
                'type': 'access'
            })
            
            # Create tokens
            access_token = create_access_token(
                identity=user_id,
                additional_claims=claims,
                fresh=True
            )
            
            refresh_token = create_refresh_token(
                identity=user_id,
                additional_claims={'type': 'refresh'}
            )
            
            # Create session record
            session = TokenManager._create_session_record(
                user_id=user_id,
                access_jti=access_jti,
                refresh_jti=refresh_jti,
                refresh_token=refresh_token
            )
            
            if session:
                return access_token, refresh_token, session.id
            else:
                return None, None, None
                
        except Exception as e:
            logger.error(f"Error creating tokens for user {user_id}: {str(e)}")
            return None, None, None
    
    @staticmethod
    def _create_session_record(user_id, access_jti, refresh_jti, refresh_token):
        """Create a new session record in the database"""
        try:
            # Hash the refresh token for storage
            token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
            
            # Get client information
            ip_address = TokenManager._get_client_ip()
            user_agent = request.headers.get('User-Agent', '')[:500] if request else None
            
            # Create session
            session = UserSession(
                user_id=user_id,
                token_hash=token_hash,
                access_token_jti=access_jti,
                refresh_token_jti=refresh_jti,
                ip_address=ip_address,
                user_agent=user_agent,
                expires_at=datetime.now(timezone.utc) + current_app.config['JWT_REFRESH_TOKEN_EXPIRES']
            )
            
            db.session.add(session)
            db.session.commit()
            
            # Clean up old sessions for this user
            TokenManager._cleanup_user_sessions(user_id)
            
            return session
            
        except Exception as e:
            logger.error(f"Error creating session record: {str(e)}")
            db.session.rollback()
            return None
    
    @staticmethod
    def refresh_access_token(current_user_id):
        """
        Create a new access token using the current refresh token
        Returns new access token or None if invalid
        """
        try:
            # Get current JWT claims
            current_token = get_jwt()
            refresh_jti = current_token.get('jti')
            
            if not refresh_jti:
                return None
            
            # Verify session exists and is valid
            session = UserSession.query.filter_by(
                user_id=current_user_id,
                refresh_token_jti=refresh_jti,
                is_active=True
            ).first()
            
            if not session or session.is_expired():
                return None
            
            # Update session last used time
            session.update_last_used()
            db.session.commit()
            
            # Create new access token
            new_access_token = create_access_token(
                identity=current_user_id,
                additional_claims={
                    'user_id': current_user_id,
                    'type': 'access'
                },
                fresh=False
            )
            
            return new_access_token
            
        except Exception as e:
            logger.error(f"Error refreshing access token: {str(e)}")
            return None
    
    @staticmethod
    def revoke_token(user_id, session_id=None, all_sessions=False):
        """
        Revoke user tokens/sessions
        If session_id provided, revokes that session
        If all_sessions=True, revokes all user sessions
        """
        try:
            if all_sessions:
                # Revoke all sessions for user
                sessions = UserSession.query.filter_by(
                    user_id=user_id,
                    is_active=True
                ).all()
                
                for session in sessions:
                    session.is_active = False
                
                db.session.commit()
                logger.info(f"Revoked all sessions for user {user_id}")
                return True
                
            elif session_id:
                # Revoke specific session
                session = UserSession.query.filter_by(
                    id=session_id,
                    user_id=user_id,
                    is_active=True
                ).first()
                
                if session:
                    session.is_active = False
                    db.session.commit()
                    logger.info(f"Revoked session {session_id} for user {user_id}")
                    return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error revoking tokens: {str(e)}")
            db.session.rollback()
            return False
    
    @staticmethod
    def validate_session(user_id, jti):
        """Validate if a JWT session is still valid"""
        try:
            session = UserSession.query.filter_by(
                user_id=user_id,
                refresh_token_jti=jti,
                is_active=True
            ).first()
            
            if not session:
                return False
            
            if session.is_expired():
                session.is_active = False
                db.session.commit()
                return False
            
            return True
            
        except Exception as e:
            logger.error(f"Error validating session: {str(e)}")
            return False
    
    @staticmethod
    def _cleanup_user_sessions(user_id):
        """Clean up old/expired sessions for a user"""
        try:
            # Get max sessions allowed per user
            max_sessions = current_app.config.get('MAX_SESSIONS_PER_USER', 5)
            
            # Mark expired sessions as inactive
            expired_sessions = UserSession.query.filter(
                UserSession.user_id == user_id,
                UserSession.expires_at < datetime.now(timezone.utc),
                UserSession.is_active == True
            ).all()
            
            for session in expired_sessions:
                session.is_active = False
            
            # Limit active sessions per user
            active_sessions = UserSession.query.filter_by(
                user_id=user_id,
                is_active=True
            ).order_by(UserSession.created_at.desc()).all()
            
            if len(active_sessions) > max_sessions:
                # Deactivate oldest sessions
                old_sessions = active_sessions[max_sessions:]
                for session in old_sessions:
                    session.is_active = False
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error cleaning up sessions: {str(e)}")
            db.session.rollback()
    
    @staticmethod
    def _get_client_ip():
        """Get client IP address from request"""
        if not request:
            return None
        
        # Check for forwarded IP first (reverse proxy)
        forwarded_ip = request.headers.get('X-Forwarded-For')
        if forwarded_ip:
            return forwarded_ip.split(',')[0].strip()
        
        # Check for real IP header
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip
        
        # Fall back to remote address
        return request.remote_addr
    
    @staticmethod
    def get_user_sessions(user_id, active_only=True):
        """Get all sessions for a user"""
        try:
            query = UserSession.query.filter_by(user_id=user_id)
            
            if active_only:
                query = query.filter_by(is_active=True)
            
            sessions = query.order_by(UserSession.created_at.desc()).all()
            return [session.to_dict() for session in sessions]
            
        except Exception as e:
            logger.error(f"Error getting user sessions: {str(e)}")
            return []

class SecurityUtils:
    """Additional security utilities for authentication"""
    
    @staticmethod
    def generate_device_fingerprint(request_data):
        """Generate a device fingerprint for enhanced security"""
        if not request:
            return None
        
        fingerprint_data = [
            request.headers.get('User-Agent', ''),
            request.headers.get('Accept-Language', ''),
            request.headers.get('Accept-Encoding', ''),
            str(request.headers.get('Accept', '')),
        ]
        
        fingerprint_string = '|'.join(fingerprint_data)
        return hashlib.md5(fingerprint_string.encode()).hexdigest()
    
    @staticmethod
    def is_suspicious_activity(user_id, ip_address):
        """
        Check for suspicious authentication activity
        Returns True if activity seems suspicious
        """
        try:
            # Get recent sessions for this user
            recent_time = datetime.now(timezone.utc) - timedelta(hours=1)
            recent_sessions = UserSession.query.filter(
                UserSession.user_id == user_id,
                UserSession.created_at > recent_time
            ).all()
            
            # Check for multiple IPs in short time
            unique_ips = set([s.ip_address for s in recent_sessions if s.ip_address])
            if len(unique_ips) > 3:  # More than 3 different IPs in 1 hour
                logger.warning(f"Suspicious activity: Multiple IPs for user {user_id}")
                return True
            
            # Check for too many login attempts
            if len(recent_sessions) > 10:  # More than 10 sessions in 1 hour
                logger.warning(f"Suspicious activity: Too many sessions for user {user_id}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error checking suspicious activity: {str(e)}")
            return False