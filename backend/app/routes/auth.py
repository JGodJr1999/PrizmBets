"""
Authentication routes for PrizmBets
Handles user registration, login, logout, token refresh, and profile management
"""

from flask import Blueprint, request, jsonify, current_app
from marshmallow import ValidationError
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from app.models.user import db, User, UserProfile, UserSession
from app.utils.auth_validation import (
    validate_registration_data, validate_login_data, validate_profile_update_data,
    validate_password_change_data, validate_password_reset_request_data, validate_password_reset_data
)
from app.utils.jwt_utils import TokenManager, SecurityUtils
from app.utils.auth_decorators import auth_required, verified_user_required, get_current_user
from app.services.email_service import EmailService
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
import logging
import uuid

# Create blueprint
auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

# Configure logging
logger = logging.getLogger(__name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Register a new user account
    Expects JSON: {email, password, confirm_password, name, terms_accepted}
    """
    try:
        # Validate request content type
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json'
            }), 400
        
        # Get and validate input data
        raw_data = request.get_json()
        if not raw_data:
            return jsonify({
                'error': 'Request body cannot be empty'
            }), 400
        
        # Validate registration data
        try:
            validated_data = validate_registration_data(raw_data)
        except ValidationError as e:
            logger.warning(f"Registration validation error: {e}")
            return jsonify({
                'error': 'Invalid registration data',
                'details': str(e)
            }), 400
        
        # Check if user already exists
        existing_user = User.query.filter_by(email=validated_data['email']).first()
        if existing_user:
            return jsonify({
                'error': 'User already exists',
                'message': 'An account with this email address already exists'
            }), 409
        
        # Create new user
        try:
            new_user = User(
                email=validated_data['email'],
                password=validated_data['password'],
                name=validated_data['name']
            )
            
            db.session.add(new_user)
            db.session.flush()  # Get user ID without committing
            
            # Create user profile
            user_profile = UserProfile(
                user_id=new_user.id,
                marketing_emails=validated_data.get('marketing_emails', False)
            )
            
            db.session.add(user_profile)
            db.session.commit()
            
            logger.info(f"New user registered: {new_user.email} (ID: {new_user.id})")
            
            # Send welcome email (non-blocking)
            try:
                from app import mail
                email_service = EmailService(mail)
                email_service.send_welcome_email(new_user)
                logger.info(f"Welcome email queued for {new_user.email}")
            except Exception as email_error:
                logger.warning(f"Failed to send welcome email to {new_user.email}: {str(email_error)}")
                # Don't fail registration if email fails
            
            # Return success response (don't auto-login for security)
            return jsonify({
                'success': True,
                'message': 'Account created successfully',
                'user': {
                    'id': new_user.id,
                    'email': new_user.email,
                    'name': new_user.name,
                    'is_verified': new_user.is_verified
                },
                'next_step': 'verify_email'
            }), 201
            
        except IntegrityError as e:
            db.session.rollback()
            logger.error(f"Database integrity error during registration: {str(e)}")
            return jsonify({
                'error': 'Registration failed',
                'message': 'User with this email may already exist'
            }), 409
            
    except Exception as e:
        db.session.rollback()
        logger.error(f"Registration error: {str(e)}")
        return jsonify({
            'error': 'Registration failed',
            'message': 'Please try again later'
        }), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Login user and return JWT tokens
    Expects JSON: {email, password, remember_me}
    """
    try:
        # Validate request content type
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json'
            }), 400
        
        # Get and validate input data
        raw_data = request.get_json()
        if not raw_data:
            return jsonify({
                'error': 'Request body cannot be empty'
            }), 400
        
        # Validate login data
        try:
            validated_data = validate_login_data(raw_data)
        except ValidationError as e:
            logger.warning(f"Login validation error: {e}")
            return jsonify({
                'error': 'Invalid login data',
                'details': str(e)
            }), 400
        
        # Find user by email
        user = User.query.filter_by(email=validated_data['email']).first()
        
        if not user or not user.check_password(validated_data['password']):
            logger.warning(f"Failed login attempt for email: {validated_data['email']}")
            return jsonify({
                'error': 'Invalid credentials',
                'message': 'Email or password is incorrect'
            }), 401
        
        # Check if user account is active
        if not user.is_active:
            logger.warning(f"Login attempt for inactive user: {user.email}")
            return jsonify({
                'error': 'Account inactive',
                'message': 'Your account has been deactivated. Please contact support.'
            }), 401
        
        # Check for suspicious activity
        client_ip = TokenManager._get_client_ip()
        if SecurityUtils.is_suspicious_activity(user.id, client_ip):
            logger.warning(f"Suspicious login activity for user {user.id} from {client_ip}")
            # Could implement additional verification here
        
        # Create JWT tokens
        access_token, refresh_token, session_id = TokenManager.create_user_tokens(user.id)
        
        if not access_token:
            logger.error(f"Failed to create tokens for user {user.id}")
            return jsonify({
                'error': 'Login failed',
                'message': 'Unable to create session. Please try again.'
            }), 500
        
        # Update user login timestamp
        user.update_last_login()
        
        logger.info(f"Successful login for user: {user.email} (ID: {user.id})")
        
        # Return tokens and user info
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user.to_dict(),
            'session_id': session_id
        }), 200
        
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({
            'error': 'Login failed',
            'message': 'Please try again later'
        }), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """
    Refresh access token using refresh token
    """
    try:
        current_user_id = get_jwt_identity()
        
        if not current_user_id:
            return jsonify({
                'error': 'Invalid refresh token',
                'message': 'Unable to identify user'
            }), 401
        
        # Create new access token
        new_access_token = TokenManager.refresh_access_token(current_user_id)
        
        if not new_access_token:
            return jsonify({
                'error': 'Token refresh failed',
                'message': 'Please log in again'
            }), 401
        
        # Get user info
        user = User.query.get(current_user_id)
        if not user or not user.is_active:
            return jsonify({
                'error': 'User not found or inactive',
                'message': 'Please log in again'
            }), 401
        
        logger.info(f"Token refreshed for user: {user.email}")
        
        return jsonify({
            'success': True,
            'access_token': new_access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        return jsonify({
            'error': 'Token refresh failed',
            'message': 'Please log in again'
        }), 401

@auth_bp.route('/me', methods=['GET'])
@auth_required()
def get_current_user_info():
    """
    Get current user information
    """
    try:
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'Please log in again'
            }), 401
        
        # Get user profile
        profile_data = None
        if user.profile:
            profile_data = user.profile.to_dict()
        
        # Get recent sessions
        sessions = TokenManager.get_user_sessions(user.id, active_only=True)
        
        return jsonify({
            'success': True,
            'user': user.to_dict(),
            'profile': profile_data,
            'sessions': sessions[:3]  # Return only 3 most recent sessions
        }), 200
        
    except Exception as e:
        logger.error(f"Get user info error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve user information',
            'message': 'Please try again later'
        }), 500

@auth_bp.route('/logout', methods=['POST'])
@auth_required()
def logout():
    """
    Logout user and revoke current session
    """
    try:
        user = get_current_user()
        token_data = get_jwt()
        jti = token_data.get('jti')
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'Already logged out'
            }), 401
        
        # Find and revoke current session
        session = UserSession.query.filter_by(
            user_id=user.id,
            refresh_token_jti=jti,
            is_active=True
        ).first()
        
        if session:
            session.is_active = False
            db.session.commit()
            logger.info(f"User logged out: {user.email} (session {session.id})")
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200
        
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return jsonify({
            'error': 'Logout failed',
            'message': 'Please try again'
        }), 500

@auth_bp.route('/logout-all', methods=['POST'])
@auth_required()
def logout_all():
    """
    Logout from all sessions/devices
    """
    try:
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'Already logged out'
            }), 401
        
        # Revoke all user sessions
        success = TokenManager.revoke_token(user.id, all_sessions=True)
        
        if success:
            logger.info(f"All sessions revoked for user: {user.email}")
            return jsonify({
                'success': True,
                'message': 'Logged out from all devices successfully'
            }), 200
        else:
            return jsonify({
                'error': 'Logout failed',
                'message': 'Unable to revoke all sessions'
            }), 500
        
    except Exception as e:
        logger.error(f"Logout all error: {str(e)}")
        return jsonify({
            'error': 'Logout failed',
            'message': 'Please try again'
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
@auth_required()
def update_profile():
    """
    Update user profile information
    """
    try:
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'Please log in again'
            }), 401
        
        # Validate request content type
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json'
            }), 400
        
        # Get and validate input data
        raw_data = request.get_json()
        if not raw_data:
            return jsonify({
                'error': 'Request body cannot be empty'
            }), 400
        
        # Validate profile data
        try:
            validated_data = validate_profile_update_data(raw_data)
        except ValidationError as e:
            logger.warning(f"Profile update validation error: {e}")
            return jsonify({
                'error': 'Invalid profile data',
                'details': str(e)
            }), 400
        
        # Update user fields
        if 'name' in validated_data:
            user.name = validated_data['name']
        
        # Update or create profile
        if not user.profile:
            user.profile = UserProfile(user_id=user.id)
        
        profile = user.profile
        
        # Update profile fields
        profile_fields = [
            'timezone', 'favorite_sports', 'preferred_sportsbooks', 
            'default_bet_amount', 'risk_tolerance', 'email_notifications',
            'push_notifications', 'marketing_emails'
        ]
        
        for field in profile_fields:
            if field in validated_data:
                setattr(profile, field, validated_data[field])
        
        # Save changes
        db.session.commit()
        
        logger.info(f"Profile updated for user: {user.email}")
        
        return jsonify({
            'success': True,
            'message': 'Profile updated successfully',
            'user': user.to_dict(),
            'profile': profile.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Profile update error: {str(e)}")
        return jsonify({
            'error': 'Profile update failed',
            'message': 'Please try again later'
        }), 500

@auth_bp.route('/change-password', methods=['POST'])
@auth_required()
def change_password():
    """
    Change user password
    """
    try:
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'Please log in again'
            }), 401
        
        # Validate request content type
        if not request.is_json:
            return jsonify({
                'error': 'Content-Type must be application/json'
            }), 400
        
        # Get and validate input data
        raw_data = request.get_json()
        if not raw_data:
            return jsonify({
                'error': 'Request body cannot be empty'
            }), 400
        
        # Validate password change data
        try:
            validated_data = validate_password_change_data(raw_data)
        except ValidationError as e:
            logger.warning(f"Password change validation error: {e}")
            return jsonify({
                'error': 'Invalid password data',
                'details': str(e)
            }), 400
        
        # Verify current password
        if not user.check_password(validated_data['current_password']):
            return jsonify({
                'error': 'Invalid current password',
                'message': 'Current password is incorrect'
            }), 400
        
        # Update password
        user.set_password(validated_data['new_password'])
        db.session.commit()
        
        # Revoke all other sessions for security
        TokenManager.revoke_token(user.id, all_sessions=True)
        
        logger.info(f"Password changed for user: {user.email}")
        
        return jsonify({
            'success': True,
            'message': 'Password changed successfully. Please log in again.',
            'logout_required': True
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Password change error: {str(e)}")
        return jsonify({
            'error': 'Password change failed',
            'message': 'Please try again later'
        }), 500

@auth_bp.route('/sessions', methods=['GET'])
@auth_required()
def get_user_sessions():
    """
    Get all user sessions
    """
    try:
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'Please log in again'
            }), 401
        
        # Get all sessions
        sessions = TokenManager.get_user_sessions(user.id, active_only=False)
        
        return jsonify({
            'success': True,
            'sessions': sessions
        }), 200
        
    except Exception as e:
        logger.error(f"Get sessions error: {str(e)}")
        return jsonify({
            'error': 'Failed to retrieve sessions',
            'message': 'Please try again later'
        }), 500

@auth_bp.route('/sessions/<int:session_id>', methods=['DELETE'])
@auth_required()
def revoke_session(session_id):
    """
    Revoke a specific session
    """
    try:
        user = get_current_user()
        
        if not user:
            return jsonify({
                'error': 'User not found',
                'message': 'Please log in again'
            }), 401
        
        # Revoke the session
        success = TokenManager.revoke_token(user.id, session_id=session_id)
        
        if success:
            logger.info(f"Session {session_id} revoked for user: {user.email}")
            return jsonify({
                'success': True,
                'message': 'Session revoked successfully'
            }), 200
        else:
            return jsonify({
                'error': 'Session not found',
                'message': 'Session does not exist or is already revoked'
            }), 404
        
    except Exception as e:
        logger.error(f"Revoke session error: {str(e)}")
        return jsonify({
            'error': 'Failed to revoke session',
            'message': 'Please try again later'
        }), 500

# Error handlers for auth blueprint
@auth_bp.errorhandler(400)
def bad_request(error):
    return jsonify({
        'error': 'Bad request',
        'message': 'Invalid request data'
    }), 400

@auth_bp.errorhandler(401)
def unauthorized(error):
    return jsonify({
        'error': 'Unauthorized',
        'message': 'Authentication required'
    }), 401

@auth_bp.errorhandler(403)
def forbidden(error):
    return jsonify({
        'error': 'Forbidden',
        'message': 'Access denied'
    }), 403

@auth_bp.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({
        'error': 'Internal server error',
        'message': 'Please try again later'
    }), 500