from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, Numeric, Index
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
import uuid

db = SQLAlchemy()

class User(db.Model):
    """User model for authentication and profile management"""
    __tablename__ = 'users'
    
    # Primary fields
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    subscription_tier = Column(String(50), default='free', nullable=False)  # free, pro, premium
    subscription_status = Column(String(50), default='active', nullable=False)  # active, canceled, past_due, incomplete
    
    # Stripe integration
    stripe_customer_id = Column(String(255), nullable=True, unique=True)
    stripe_subscription_id = Column(String(255), nullable=True)
    last_payment_date = Column(DateTime, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                       onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    last_login_at = Column(DateTime, nullable=True)
    
    # Verification
    verification_token = Column(String(255), nullable=True)
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime, nullable=True)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    betting_history = relationship("BettingHistory", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    
    # Database constraints and indexes
    __table_args__ = (
        Index('idx_user_email_active', 'email', 'is_active'),
        Index('idx_user_created_at', 'created_at'),
    )
    
    def __init__(self, email, password, name):
        self.email = email.lower().strip()
        self.name = name.strip()
        self.set_password(password)
        self.verification_token = str(uuid.uuid4())
    
    def set_password(self, password):
        """Hash and set password"""
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256', salt_length=16)
    
    def check_password(self, password):
        """Check if provided password matches hash"""
        return check_password_hash(self.password_hash, password)
    
    def update_last_login(self):
        """Update last login timestamp"""
        self.last_login_at = datetime.now(timezone.utc)
        db.session.commit()
    
    def to_dict(self, include_sensitive=False):
        """Convert user to dictionary for API responses"""
        data = {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'is_active': self.is_active,
            'is_verified': self.is_verified,
            'subscription_tier': self.subscription_tier,
            'subscription_status': self.subscription_status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'last_payment_date': self.last_payment_date.isoformat() if self.last_payment_date else None
        }
        
        if include_sensitive:
            data.update({
                'verification_token': self.verification_token,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None
            })
        
        return data
    
    def __repr__(self):
        return f'<User {self.email}>'


class UserProfile(db.Model):
    """Extended user profile information"""
    __tablename__ = 'user_profiles'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, unique=True)
    
    # Profile data
    timezone = Column(String(50), default='UTC', nullable=False)
    favorite_sports = Column(JSON, default=list, nullable=False)  # ['nfl', 'nba', etc.]
    preferred_sportsbooks = Column(JSON, default=list, nullable=False)  # ['draftkings', 'fanduel', etc.]
    default_bet_amount = Column(Numeric(10, 2), default=10.00, nullable=False)
    risk_tolerance = Column(String(20), default='medium', nullable=False)  # low, medium, high
    
    # Preferences
    email_notifications = Column(Boolean, default=True, nullable=False)
    push_notifications = Column(Boolean, default=False, nullable=False)
    marketing_emails = Column(Boolean, default=False, nullable=False)
    
    # Analytics preferences
    tracking_enabled = Column(Boolean, default=True, nullable=False)
    share_anonymous_data = Column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                       onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="profile")
    
    def to_dict(self):
        """Convert profile to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'timezone': self.timezone,
            'favorite_sports': self.favorite_sports,
            'preferred_sportsbooks': self.preferred_sportsbooks,
            'default_bet_amount': float(self.default_bet_amount),
            'risk_tolerance': self.risk_tolerance,
            'email_notifications': self.email_notifications,
            'push_notifications': self.push_notifications,
            'marketing_emails': self.marketing_emails,
            'tracking_enabled': self.tracking_enabled,
            'share_anonymous_data': self.share_anonymous_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<UserProfile {self.user_id}>'


class BettingHistory(db.Model):
    """Track user's betting history and parlay evaluations"""
    __tablename__ = 'betting_history'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Parlay data
    parlay_data = Column(JSON, nullable=False)  # Original parlay submission
    ai_evaluation = Column(JSON, nullable=False)  # AI evaluation results
    
    # Bet tracking
    total_amount = Column(Numeric(10, 2), nullable=False)
    potential_payout = Column(Numeric(10, 2), nullable=True)
    actual_result = Column(String(20), nullable=True)  # win, loss, push, pending
    actual_payout = Column(Numeric(10, 2), nullable=True)
    
    # Status tracking
    status = Column(String(20), default='evaluated', nullable=False)  # evaluated, placed, settled
    confidence_score = Column(Numeric(5, 2), nullable=True)  # AI confidence 0-100
    
    # Metadata
    notes = Column(Text, nullable=True)
    external_bet_id = Column(String(255), nullable=True)  # Sportsbook bet ID if available
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                       onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    settled_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="betting_history")
    
    # Database indexes for performance
    __table_args__ = (
        Index('idx_betting_history_user_created', 'user_id', 'created_at'),
        Index('idx_betting_history_status', 'status'),
        Index('idx_betting_history_result', 'actual_result'),
    )
    
    def to_dict(self):
        """Convert betting history to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'parlay_data': self.parlay_data,
            'ai_evaluation': self.ai_evaluation,
            'total_amount': float(self.total_amount),
            'potential_payout': float(self.potential_payout) if self.potential_payout else None,
            'actual_result': self.actual_result,
            'actual_payout': float(self.actual_payout) if self.actual_payout else None,
            'status': self.status,
            'confidence_score': float(self.confidence_score) if self.confidence_score else None,
            'notes': self.notes,
            'external_bet_id': self.external_bet_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'settled_at': self.settled_at.isoformat() if self.settled_at else None
        }
    
    def __repr__(self):
        return f'<BettingHistory {self.id} - User {self.user_id}>'


class UserSession(db.Model):
    """Track user sessions and JWT tokens"""
    __tablename__ = 'user_sessions'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Session data
    token_hash = Column(String(255), nullable=False, unique=True)  # Hashed refresh token
    access_token_jti = Column(String(255), nullable=True)  # JWT ID for access token
    refresh_token_jti = Column(String(255), nullable=False, unique=True)  # JWT ID for refresh token
    
    # Session metadata
    ip_address = Column(String(45), nullable=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)
    device_fingerprint = Column(String(255), nullable=True)
    
    # Status and expiration
    is_active = Column(Boolean, default=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    last_used_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="sessions")
    
    # Database indexes
    __table_args__ = (
        Index('idx_user_sessions_user_active', 'user_id', 'is_active'),
        Index('idx_user_sessions_expires', 'expires_at'),
        Index('idx_user_sessions_token_hash', 'token_hash'),
    )
    
    def is_expired(self):
        """Check if session is expired"""
        now = datetime.now(timezone.utc)
        expires_at = self.expires_at
        
        # Handle timezone-naive expires_at by making it UTC-aware
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        return now > expires_at
    
    def update_last_used(self):
        """Update last used timestamp"""
        self.last_used_at = datetime.now(timezone.utc)
    
    def to_dict(self):
        """Convert session to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'is_active': self.is_active,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None
        }
    
    def __repr__(self):
        return f'<UserSession {self.id} - User {self.user_id}>'


class UserUsage(db.Model):
    """Track daily usage for free tier limits"""
    __tablename__ = 'user_usage'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Usage tracking
    date = Column(DateTime, nullable=False)  # Date for this usage record
    parlay_evaluations = Column(Integer, default=0, nullable=False)  # Daily parlay count
    odds_comparisons = Column(Integer, default=0, nullable=False)    # Daily odds checks
    api_calls = Column(Integer, default=0, nullable=False)           # Total API usage
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                       onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    
    # Relationships
    user = relationship("User")
    
    # Database constraints
    __table_args__ = (
        Index('idx_user_usage_user_date', 'user_id', 'date'),
        Index('idx_user_usage_date', 'date'),
        # Ensure one record per user per day
        db.UniqueConstraint('user_id', 'date', name='unique_user_daily_usage')
    )
    
    @staticmethod
    def get_or_create_today(user_id):
        """Get or create today's usage record for a user (thread-safe)"""
        from sqlalchemy import func
        from sqlalchemy.exc import IntegrityError
        today = datetime.now(timezone.utc).date()
        
        # First try to get existing record
        usage = UserUsage.query.filter(
            UserUsage.user_id == user_id,
            func.date(UserUsage.date) == today
        ).first()
        
        if not usage:
            # Create new record with error handling for race conditions
            try:
                usage = UserUsage(
                    user_id=user_id,
                    date=datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
                )
                db.session.add(usage)
                db.session.commit()
            except IntegrityError:
                # Another thread created the record, rollback and fetch it
                db.session.rollback()
                usage = UserUsage.query.filter(
                    UserUsage.user_id == user_id,
                    func.date(UserUsage.date) == today
                ).first()
        
        return usage
    
    def increment_parlay_usage(self):
        """Increment parlay evaluation count"""
        self.parlay_evaluations += 1
        self.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return self.parlay_evaluations
    
    def increment_odds_usage(self):
        """Increment odds comparison count"""
        self.odds_comparisons += 1
        self.updated_at = datetime.now(timezone.utc)
        db.session.commit()
        return self.odds_comparisons
    
    def can_use_feature(self, feature_type, user_tier='free'):
        """Check if user can use a feature based on tier limits"""
        limits = {
            'free': {
                'parlay_evaluations': 3,
                'odds_comparisons': 10
            },
            'pro': {
                'parlay_evaluations': -1,  # -1 means unlimited
                'odds_comparisons': -1
            },
            'premium': {
                'parlay_evaluations': -1,
                'odds_comparisons': -1
            }
        }
        
        if user_tier not in limits:
            user_tier = 'free'
        
        limit = limits[user_tier].get(feature_type, 0)
        
        # Unlimited usage
        if limit == -1:
            return True
        
        # Check current usage
        current_usage = getattr(self, feature_type, 0)
        return current_usage < limit
    
    def get_remaining_usage(self, feature_type, user_tier='free'):
        """Get remaining usage for a feature"""
        limits = {
            'free': {
                'parlay_evaluations': 3,
                'odds_comparisons': 10
            },
            'pro': {
                'parlay_evaluations': -1,
                'odds_comparisons': -1
            },
            'premium': {
                'parlay_evaluations': -1,
                'odds_comparisons': -1
            }
        }
        
        if user_tier not in limits:
            user_tier = 'free'
        
        limit = limits[user_tier].get(feature_type, 0)
        
        # Unlimited usage
        if limit == -1:
            return -1
        
        current_usage = getattr(self, feature_type, 0)
        return max(0, limit - current_usage)
    
    def to_dict(self):
        """Convert usage to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'parlay_evaluations': self.parlay_evaluations,
            'odds_comparisons': self.odds_comparisons,
            'api_calls': self.api_calls,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<UserUsage {self.user_id} - {self.date.strftime("%Y-%m-%d")}>'