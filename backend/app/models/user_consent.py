from datetime import datetime
from app import db
import hashlib

class UserConsent(db.Model):
    """
    Model for tracking user consent for various features.
    Critical for legal compliance and GDPR.
    """
    __tablename__ = 'user_consents'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Feature being consented to
    feature = db.Column(db.String(50), nullable=False)  # 'email_parser', 'data_analytics', etc.
    
    # Consent status
    consented = db.Column(db.Boolean, nullable=False, default=False)
    
    # Legal tracking
    ip_address = db.Column(db.String(45))  # IPv6 support
    user_agent = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Version control for terms
    terms_version = db.Column(db.String(20), nullable=False, default='v1.0')
    terms_hash = db.Column(db.String(64))  # SHA-256 of terms text
    
    # Revocation tracking
    revoked_at = db.Column(db.DateTime)
    revoke_reason = db.Column(db.String(200))
    
    # Relationship
    user = db.relationship('User', backref=db.backref('consents', lazy=True))

    def __init__(self, user_id, feature, consented, ip_address=None, user_agent=None, terms_version='v1.0'):
        self.user_id = user_id
        self.feature = feature
        self.consented = consented
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.terms_version = terms_version
        self.terms_hash = self.generate_terms_hash(feature, terms_version)
        self.timestamp = datetime.utcnow()

    def generate_terms_hash(self, feature, version):
        """Generate hash of current terms for this feature/version"""
        terms_text = self.get_terms_text(feature, version)
        return hashlib.sha256(terms_text.encode()).hexdigest()

    def get_terms_text(self, feature, version):
        """Get the exact terms text for legal verification"""
        if feature == 'email_parser' and version == 'v1.0':
            return """
            Email Parser Terms v1.0:
            - User voluntarily forwards bet confirmation emails
            - We extract ONLY: teams, odds, stake, bet type, timestamp
            - We NEVER store: personal info, account numbers, payment data
            - Emails processed and immediately deleted
            - Extracted data encrypted and stored securely
            - User can disable feature anytime
            - Data used solely for personal betting analytics
            - PrizmBets is independent analytics platform
            - No betting advice provided
            - Not responsible for betting decisions
            - Feature is optional
            """
        return f"Terms for {feature} {version}"

    def revoke_consent(self, reason=None):
        """Revoke user's consent"""
        self.consented = False
        self.revoked_at = datetime.utcnow()
        self.revoke_reason = reason
        db.session.commit()

    def is_valid_consent(self):
        """Check if consent is still valid (not revoked, terms haven't changed)"""
        if not self.consented or self.revoked_at:
            return False
        
        # Check if terms have changed
        current_hash = self.generate_terms_hash(self.feature, self.terms_version)
        if current_hash != self.terms_hash:
            return False
            
        return True

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'feature': self.feature,
            'consented': self.consented,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'terms_version': self.terms_version,
            'revoked_at': self.revoked_at.isoformat() if self.revoked_at else None,
            'is_valid': self.is_valid_consent()
        }

    def __repr__(self):
        return f'<UserConsent user_id={self.user_id} feature={self.feature} consented={self.consented}>'


class UserBetData(db.Model):
    """
    Model for storing encrypted user bet data from email parsing.
    Only stores essential betting information, never personal data.
    """
    __tablename__ = 'user_bet_data'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Encrypted bet data (AES-256)
    encrypted_bet_data = db.Column(db.Text, nullable=False)
    
    # Bet identification (for duplicate detection)
    bet_hash = db.Column(db.String(64), unique=True, nullable=False)  # SHA-256 of bet details
    
    # Source tracking
    source = db.Column(db.String(20), nullable=False)  # 'email_parser', 'manual_entry'
    sportsbook = db.Column(db.String(50))  # 'draftkings', 'fanduel', etc.
    
    # Timestamps
    bet_placed_at = db.Column(db.DateTime)  # When user placed the bet
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('bet_data', lazy=True))

    def __init__(self, user_id, encrypted_bet_data, bet_hash, source, sportsbook=None, bet_placed_at=None):
        self.user_id = user_id
        self.encrypted_bet_data = encrypted_bet_data
        self.bet_hash = bet_hash
        self.source = source
        self.sportsbook = sportsbook
        self.bet_placed_at = bet_placed_at or datetime.utcnow()
        self.created_at = datetime.utcnow()

    def to_dict(self):
        """Convert to dictionary for API responses (without encrypted data)"""
        return {
            'id': self.id,
            'source': self.source,
            'sportsbook': self.sportsbook,
            'bet_placed_at': self.bet_placed_at.isoformat() if self.bet_placed_at else None,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }

    def __repr__(self):
        return f'<UserBetData user_id={self.user_id} source={self.source} sportsbook={self.sportsbook}>'


class ConsentAuditLog(db.Model):
    """
    Audit log for all consent-related actions.
    Critical for legal compliance and investigation.
    """
    __tablename__ = 'consent_audit_logs'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    
    # Action details
    action = db.Column(db.String(50), nullable=False)  # 'consent_granted', 'consent_revoked', 'data_processed', etc.
    feature = db.Column(db.String(50), nullable=False)
    details = db.Column(db.JSON)  # Additional action details
    
    # Request tracking
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.Text)
    session_id = db.Column(db.String(128))
    
    # Timestamp
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('consent_audit_logs', lazy=True))

    def __init__(self, user_id, action, feature, ip_address=None, user_agent=None, session_id=None, details=None):
        self.user_id = user_id
        self.action = action
        self.feature = feature
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.session_id = session_id
        self.details = details or {}
        self.timestamp = datetime.utcnow()

    def to_dict(self):
        """Convert to dictionary for API responses"""
        return {
            'id': self.id,
            'action': self.action,
            'feature': self.feature,
            'details': self.details,
            'timestamp': self.timestamp.isoformat(),
            'ip_address': self.ip_address  # Only for admin/audit purposes
        }

    def __repr__(self):
        return f'<ConsentAuditLog user_id={self.user_id} action={self.action} feature={self.feature}>'