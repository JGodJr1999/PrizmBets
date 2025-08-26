from flask import Blueprint, request, jsonify
from app.utils.auth_decorators import auth_required
from app.services.consent_service import consent_service, ConsentError
import logging
import uuid

consent_bp = Blueprint('consent', __name__, url_prefix='/api/user')
logger = logging.getLogger(__name__)

@consent_bp.route('/email-tracking-status', methods=['GET'])
@auth_required()
def get_email_tracking_status():
    """
    Check if user has email tracking enabled.
    """
    try:
        current_user = getattr(request, 'current_user', None)
        
        # Check if user has valid consent for email parsing
        try:
            consent_service.verify_consent(current_user.id, 'email_parser')
            enabled = True
        except ConsentError:
            enabled = False
        
        return jsonify({
            'success': True,
            'enabled': enabled,
            'user_id': current_user.id
        })
        
    except Exception as e:
        logger.error(f"Error checking email tracking status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to check status'
        }), 500

@consent_bp.route('/enable-email-tracking', methods=['POST'])
@auth_required()
def enable_email_tracking():
    """
    Enable email tracking after recording user's explicit consent.
    """
    try:
        current_user = getattr(request, 'current_user', None)
        data = request.get_json()
        
        if not data or not data.get('consented'):
            return jsonify({
                'success': False,
                'error': 'Consent not provided'
            }), 400
        
        # Get client information for legal compliance
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.environ.get('HTTP_USER_AGENT', '')
        session_id = request.environ.get('HTTP_X_SESSION_ID', str(uuid.uuid4()))
        
        # Record consent
        consent_record = consent_service.record_consent(
            user_id=current_user.id,
            feature='email_parser',
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id
        )
        
        # Generate unique email address for this user
        unique_email = f"user{current_user.id}.bets@prizmbets.app"
        
        logger.info(f"Email tracking enabled for user {current_user.id}")
        
        return jsonify({
            'success': True,
            'enabled': True,
            'unique_email': unique_email,
            'consent_id': consent_record['id'],
            'message': f'Email tracking enabled! Forward your bet confirmations to {unique_email}'
        })
        
    except ConsentError as e:
        logger.warning(f"Consent error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
        
    except Exception as e:
        logger.error(f"Error enabling email tracking: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to enable email tracking'
        }), 500

@consent_bp.route('/disable-email-tracking', methods=['POST'])
@auth_required()
def disable_email_tracking():
    """
    Disable email tracking and delete all associated data.
    """
    try:
        current_user = getattr(request, 'current_user', None)
        data = request.get_json() or {}
        
        # Get client information
        ip_address = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        user_agent = request.environ.get('HTTP_USER_AGENT', '')
        session_id = request.environ.get('HTTP_X_SESSION_ID', str(uuid.uuid4()))
        
        # Revoke consent and delete data
        revocation_result = consent_service.revoke_consent(
            user_id=current_user.id,
            feature='email_parser',
            reason=data.get('reason', 'User requested'),
            ip_address=ip_address,
            user_agent=user_agent,
            session_id=session_id
        )
        
        logger.info(f"Email tracking disabled for user {current_user.id}")
        
        return jsonify({
            'success': True,
            'disabled': True,
            'data_deleted': revocation_result.get('data_deleted', False),
            'message': 'Email tracking disabled and all data deleted'
        })
        
    except Exception as e:
        logger.error(f"Error disabling email tracking: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to disable email tracking'
        }), 500

@consent_bp.route('/consents', methods=['GET'])
@auth_required()
def get_user_consents():
    """
    Get all consent records for the authenticated user.
    """
    try:
        current_user = getattr(request, 'current_user', None)
        
        consents = consent_service.get_user_consents(current_user.id)
        
        return jsonify({
            'success': True,
            'consents': consents,
            'count': len(consents)
        })
        
    except Exception as e:
        logger.error(f"Error getting user consents: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve consents'
        }), 500

@consent_bp.route('/bet-data', methods=['GET'])
@auth_required()
def get_user_bet_data():
    """
    Get user's bet data with optional decryption.
    """
    try:
        current_user = getattr(request, 'current_user', None)
        decrypt = request.args.get('decrypt', 'false').lower() == 'true'
        
        # Verify user has consent for email parsing if requesting decrypted data
        if decrypt:
            try:
                consent_service.verify_consent(current_user.id, 'email_parser')
            except ConsentError:
                return jsonify({
                    'success': False,
                    'error': 'No valid consent for decrypted data access'
                }), 403
        
        bet_data = consent_service.get_user_bet_data(current_user.id, decrypt=decrypt)
        
        return jsonify({
            'success': True,
            'bet_data': bet_data,
            'count': len(bet_data),
            'decrypted': decrypt
        })
        
    except Exception as e:
        logger.error(f"Error getting user bet data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve bet data'
        }), 500

@consent_bp.route('/consent-audit', methods=['GET'])
@auth_required()
def get_consent_audit_log():
    """
    Get consent audit log for the authenticated user.
    """
    try:
        current_user = getattr(request, 'current_user', None)
        feature = request.args.get('feature')
        limit = min(int(request.args.get('limit', 50)), 100)  # Max 100 records
        
        audit_log = consent_service.get_consent_audit_log(
            current_user.id,
            feature=feature,
            limit=limit
        )
        
        return jsonify({
            'success': True,
            'audit_log': audit_log,
            'count': len(audit_log),
            'feature_filter': feature
        })
        
    except Exception as e:
        logger.error(f"Error getting consent audit log: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to retrieve audit log'
        }), 500

@consent_bp.route('/store-bet', methods=['POST'])
@auth_required()
def store_bet_data():
    """
    Store bet data (used by email parser or manual entry).
    """
    try:
        current_user = getattr(request, 'current_user', None)
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No bet data provided'
            }), 400
        
        # Validate required fields
        required_fields = ['bet_data', 'source']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # Store encrypted bet data
        result = consent_service.store_encrypted_bet_data(
            user_id=current_user.id,
            bet_data=data['bet_data'],
            source=data['source'],
            sportsbook=data.get('sportsbook')
        )
        
        return jsonify({
            'success': True,
            'stored': result['stored'],
            'bet_id': result.get('bet_id'),
            'message': 'Bet data stored successfully' if result['stored'] else result.get('reason', 'Not stored')
        })
        
    except ConsentError as e:
        logger.warning(f"Consent error storing bet: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 403
        
    except Exception as e:
        logger.error(f"Error storing bet data: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to store bet data'
        }), 500

@consent_bp.route('/client-ip', methods=['GET'])
def get_client_ip():
    """
    Get client IP address for consent recording.
    """
    try:
        # Try to get real IP from proxy headers
        ip = request.environ.get('HTTP_X_FORWARDED_FOR')
        if ip:
            # Take the first IP if there are multiple
            ip = ip.split(',')[0].strip()
        else:
            ip = request.environ.get('HTTP_X_REAL_IP')
            if not ip:
                ip = request.remote_addr
        
        return jsonify({
            'success': True,
            'ip': ip
        })
        
    except Exception as e:
        logger.error(f"Error getting client IP: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to get IP address',
            'ip': 'unknown'
        }), 200  # Return 200 with unknown IP to not break frontend

# Error handlers
@consent_bp.errorhandler(ConsentError)
def handle_consent_error(e):
    """Handle consent-specific errors"""
    return jsonify({
        'success': False,
        'error': str(e)
    }), 403