from datetime import datetime
import logging
from app import db
from app.models.user_consent import UserConsent, ConsentAuditLog, UserBetData
from cryptography.fernet import Fernet
import os
import base64
import hashlib
import json

logger = logging.getLogger(__name__)

class ConsentError(Exception):
    """Custom exception for consent-related errors"""
    pass

class ConsentService:
    """
    Service for managing user consent for data processing features.
    Handles legal compliance, audit logging, and data protection.
    """
    
    def __init__(self):
        # Initialize encryption key for bet data
        self.encryption_key = self._get_or_create_encryption_key()
        self.cipher_suite = Fernet(self.encryption_key)
    
    def _get_or_create_encryption_key(self):
        """Get or create encryption key for bet data"""
        key_path = os.path.join(os.path.dirname(__file__), '..', '..', 'encryption.key')
        
        if os.path.exists(key_path):
            with open(key_path, 'rb') as key_file:
                return key_file.read()
        else:
            # Generate new key
            key = Fernet.generate_key()
            with open(key_path, 'wb') as key_file:
                key_file.write(key)
            logger.info("Generated new encryption key for bet data")
            return key
    
    def record_consent(self, user_id, feature, ip_address=None, user_agent=None, session_id=None):
        """
        Record user's explicit consent for a feature.
        
        Args:
            user_id (int): User's ID
            feature (str): Feature name (e.g., 'email_parser')
            ip_address (str): User's IP address
            user_agent (str): User's browser user agent
            session_id (str): Session identifier
            
        Returns:
            dict: Consent record information
            
        Raises:
            ConsentError: If consent cannot be recorded
        """
        try:
            # Check if user already has consent for this feature
            existing_consent = UserConsent.query.filter_by(
                user_id=user_id,
                feature=feature,
                consented=True
            ).first()
            
            if existing_consent and existing_consent.is_valid_consent():
                logger.info(f"User {user_id} already has valid consent for {feature}")
                return existing_consent.to_dict()
            
            # Create new consent record
            consent = UserConsent(
                user_id=user_id,
                feature=feature,
                consented=True,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            db.session.add(consent)
            db.session.flush()  # Get the ID
            
            # Create audit log
            audit_log = ConsentAuditLog(
                user_id=user_id,
                action='consent_granted',
                feature=feature,
                ip_address=ip_address,
                user_agent=user_agent,
                session_id=session_id,
                details={
                    'consent_id': consent.id,
                    'terms_version': consent.terms_version,
                    'terms_hash': consent.terms_hash
                }
            )
            
            db.session.add(audit_log)
            db.session.commit()
            
            logger.info(f"Consent granted for user {user_id} feature {feature}")
            
            return consent.to_dict()
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error recording consent: {str(e)}")
            raise ConsentError(f"Failed to record consent: {str(e)}")
    
    def verify_consent(self, user_id, feature):
        """
        Verify that user has valid consent for a feature.
        
        Args:
            user_id (int): User's ID
            feature (str): Feature name
            
        Returns:
            bool: True if consent is valid
            
        Raises:
            ConsentError: If no valid consent found
        """
        consent = UserConsent.query.filter_by(
            user_id=user_id,
            feature=feature,
            consented=True
        ).order_by(UserConsent.timestamp.desc()).first()
        
        if not consent:
            raise ConsentError(f"No consent on file for {feature}")
        
        if not consent.is_valid_consent():
            raise ConsentError(f"Consent for {feature} is no longer valid (terms changed or revoked)")
        
        return True
    
    def revoke_consent(self, user_id, feature, reason=None, ip_address=None, user_agent=None, session_id=None):
        """
        Revoke user's consent for a feature and delete associated data.
        
        Args:
            user_id (int): User's ID
            feature (str): Feature name
            reason (str): Reason for revocation
            ip_address (str): User's IP address
            user_agent (str): User's browser user agent
            session_id (str): Session identifier
            
        Returns:
            dict: Revocation status
        """
        try:
            # Find and revoke consent
            consent = UserConsent.query.filter_by(
                user_id=user_id,
                feature=feature,
                consented=True
            ).first()
            
            if consent:
                consent.revoke_consent(reason)
                
                # Delete associated data based on feature
                if feature == 'email_parser':
                    self._delete_user_bet_data(user_id)
                
                # Create audit log
                audit_log = ConsentAuditLog(
                    user_id=user_id,
                    action='consent_revoked',
                    feature=feature,
                    ip_address=ip_address,
                    user_agent=user_agent,
                    session_id=session_id,
                    details={
                        'consent_id': consent.id,
                        'reason': reason,
                        'data_deleted': True
                    }
                )
                
                db.session.add(audit_log)
                db.session.commit()
                
                logger.info(f"Consent revoked for user {user_id} feature {feature}")
                
                return {
                    'revoked': True,
                    'data_deleted': True,
                    'timestamp': datetime.utcnow().isoformat()
                }
            else:
                logger.warning(f"No consent found to revoke for user {user_id} feature {feature}")
                return {
                    'revoked': False,
                    'reason': 'No active consent found'
                }
                
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error revoking consent: {str(e)}")
            raise ConsentError(f"Failed to revoke consent: {str(e)}")
    
    def _delete_user_bet_data(self, user_id):
        """Delete all bet data for a user"""
        try:
            deleted_count = UserBetData.query.filter_by(user_id=user_id).delete()
            logger.info(f"Deleted {deleted_count} bet records for user {user_id}")
            return deleted_count
        except Exception as e:
            logger.error(f"Error deleting bet data: {str(e)}")
            raise
    
    def get_user_consents(self, user_id):
        """
        Get all consent records for a user.
        
        Args:
            user_id (int): User's ID
            
        Returns:
            list: List of consent records
        """
        consents = UserConsent.query.filter_by(user_id=user_id).order_by(UserConsent.timestamp.desc()).all()
        return [consent.to_dict() for consent in consents]
    
    def store_encrypted_bet_data(self, user_id, bet_data, source, sportsbook=None):
        """
        Store encrypted bet data after verifying consent.
        
        Args:
            user_id (int): User's ID
            bet_data (dict): Bet information to encrypt and store
            source (str): Data source ('email_parser', 'manual_entry')
            sportsbook (str): Sportsbook name
            
        Returns:
            dict: Storage result
            
        Raises:
            ConsentError: If no consent or consent invalid
        """
        try:
            # Verify consent if from email parser
            if source == 'email_parser':
                self.verify_consent(user_id, 'email_parser')
            
            # Encrypt bet data
            bet_json = json.dumps(bet_data, sort_keys=True)
            encrypted_data = self.cipher_suite.encrypt(bet_json.encode())
            
            # Create hash for duplicate detection
            bet_hash = hashlib.sha256(bet_json.encode()).hexdigest()
            
            # Check for duplicates
            existing = UserBetData.query.filter_by(bet_hash=bet_hash).first()
            if existing:
                logger.info(f"Duplicate bet data detected for user {user_id}")
                return {
                    'stored': False,
                    'reason': 'Duplicate bet detected',
                    'existing_id': existing.id
                }
            
            # Store encrypted data
            bet_record = UserBetData(
                user_id=user_id,
                encrypted_bet_data=base64.b64encode(encrypted_data).decode(),
                bet_hash=bet_hash,
                source=source,
                sportsbook=sportsbook,
                bet_placed_at=bet_data.get('timestamp', datetime.utcnow())
            )
            
            db.session.add(bet_record)
            db.session.commit()
            
            # Create audit log
            audit_log = ConsentAuditLog(
                user_id=user_id,
                action='data_processed',
                feature=source,
                details={
                    'bet_record_id': bet_record.id,
                    'sportsbook': sportsbook,
                    'data_encrypted': True
                }
            )
            
            db.session.add(audit_log)
            db.session.commit()
            
            logger.info(f"Bet data stored for user {user_id} from {source}")
            
            return {
                'stored': True,
                'bet_id': bet_record.id,
                'encrypted': True
            }
            
        except ConsentError:
            raise
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error storing bet data: {str(e)}")
            raise ConsentError(f"Failed to store bet data: {str(e)}")
    
    def get_user_bet_data(self, user_id, decrypt=False):
        """
        Get user's bet data, optionally decrypted.
        
        Args:
            user_id (int): User's ID
            decrypt (bool): Whether to decrypt the data
            
        Returns:
            list: List of bet records
        """
        bet_records = UserBetData.query.filter_by(user_id=user_id).order_by(UserBetData.bet_placed_at.desc()).all()
        
        results = []
        for record in bet_records:
            bet_dict = record.to_dict()
            
            if decrypt:
                try:
                    # Decrypt bet data
                    encrypted_data = base64.b64decode(record.encrypted_bet_data)
                    decrypted_data = self.cipher_suite.decrypt(encrypted_data)
                    bet_info = json.loads(decrypted_data.decode())
                    bet_dict['bet_data'] = bet_info
                except Exception as e:
                    logger.error(f"Error decrypting bet data: {str(e)}")
                    bet_dict['bet_data'] = {'error': 'Failed to decrypt'}
            
            results.append(bet_dict)
        
        return results
    
    def get_consent_audit_log(self, user_id, feature=None, limit=100):
        """
        Get audit log for consent actions.
        
        Args:
            user_id (int): User's ID
            feature (str): Optional feature filter
            limit (int): Maximum number of records
            
        Returns:
            list: List of audit records
        """
        query = ConsentAuditLog.query.filter_by(user_id=user_id)
        
        if feature:
            query = query.filter_by(feature=feature)
        
        audit_records = query.order_by(ConsentAuditLog.timestamp.desc()).limit(limit).all()
        
        return [record.to_dict() for record in audit_records]

# Global instance
consent_service = ConsentService()