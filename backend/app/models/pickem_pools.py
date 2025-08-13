"""
NFL Pick'em Pools Database Models for SmartBets 2.0
Comprehensive model definitions for pool management, picks, and standings
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON, Numeric, Index, UniqueConstraint
from sqlalchemy.orm import relationship, backref
from .user import db  # Import the shared db instance
import uuid
import secrets
import string

class PickEmPool(db.Model):
    """Model for NFL Pick'em Pools"""
    __tablename__ = 'pickem_pools'
    
    # Primary fields
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    creator_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    
    # Pool configuration
    invite_code = Column(String(12), unique=True, nullable=False, index=True)
    is_private = Column(Boolean, default=True, nullable=False)
    max_members = Column(Integer, default=50, nullable=False)
    season_year = Column(Integer, nullable=False)
    
    # Pool settings (stored as JSON for flexibility)
    settings = Column(JSON, default={
        'pick_type': 'straight_up',  # straight_up, against_spread, confidence
        'include_playoffs': True,
        'tiebreaker_method': 'head_to_head',
        'late_pick_penalty': False,
        'weekly_prizes': False
    })
    
    # Status and timestamps
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships (using string references to avoid circular imports)
    memberships = relationship('PoolMembership', back_populates='pool', cascade='all, delete-orphan')
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.invite_code:
            self.invite_code = self.generate_invite_code()
        if not self.season_year:
            self.season_year = datetime.now().year
    
    @staticmethod
    def generate_invite_code(length=8):
        """Generate a unique invite code for the pool"""
        characters = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(characters) for _ in range(length))
    
    @property
    def member_count(self):
        """Get current number of pool members"""
        return len(self.memberships)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'creator_id': self.creator_id,
            'invite_code': self.invite_code,
            'is_private': self.is_private,
            'max_members': self.max_members,
            'member_count': self.member_count,
            'season_year': self.season_year,
            'settings': self.settings,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat(),
            'creator_name': self.creator.name if self.creator else None
        }

class PoolMembership(db.Model):
    """Model for pool membership tracking"""
    __tablename__ = 'pool_memberships'
    
    # Composite primary key
    pool_id = Column(Integer, ForeignKey('pickem_pools.id'), primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), primary_key=True)
    
    # Membership details
    display_name = Column(String(100), nullable=False)  # Custom name for this pool
    is_admin = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Statistics
    total_correct_picks = Column(Integer, default=0, nullable=False)
    total_picks_made = Column(Integer, default=0, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    best_week_score = Column(Integer, default=0, nullable=False)
    
    # Timestamps
    joined_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_activity = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    pool = relationship('PickEmPool', back_populates='memberships')
    
    # Indexes
    __table_args__ = (
        Index('ix_pool_membership_active', pool_id, is_active),
    )
    
    def update_stats(self, correct_picks_this_week, total_picks_this_week):
        """Update member statistics after a week"""
        self.total_correct_picks += correct_picks_this_week
        self.total_picks_made += total_picks_this_week
        
        # Update streak
        if correct_picks_this_week == total_picks_this_week:
            self.current_streak += 1
        else:
            self.current_streak = 0
        
        # Update best week if applicable
        if correct_picks_this_week > self.best_week_score:
            self.best_week_score = correct_picks_this_week
            
        self.last_activity = datetime.utcnow()
    
    @property
    def win_percentage(self):
        """Calculate win percentage"""
        if self.total_picks_made == 0:
            return 0.0
        return (self.total_correct_picks / self.total_picks_made) * 100
    
    def to_dict(self):
        return {
            'pool_id': self.pool_id,
            'user_id': self.user_id,
            'display_name': self.display_name,
            'is_admin': self.is_admin,
            'total_correct_picks': self.total_correct_picks,
            'total_picks_made': self.total_picks_made,
            'win_percentage': round(self.win_percentage, 1),
            'current_streak': self.current_streak,
            'best_week_score': self.best_week_score,
            'joined_at': self.joined_at.isoformat(),
            'user_name': self.user.name if self.user else None
        }

class NFLWeek(db.Model):
    """Model for NFL weeks and scheduling"""
    __tablename__ = 'nfl_weeks'
    
    id = Column(Integer, primary_key=True)
    week_number = Column(Integer, nullable=False)  # 1-18 regular season, 19+ playoffs
    season_year = Column(Integer, nullable=False)
    week_type = Column(String(20), default='regular', nullable=False)  # regular, wildcard, divisional, conference, superbowl
    
    # Important dates
    start_date = Column(DateTime, nullable=False)
    pick_deadline = Column(DateTime, nullable=False)  # Usually first game of the week
    end_date = Column(DateTime, nullable=False)
    
    # Status
    is_active = Column(Boolean, default=False, nullable=False)  # Current week flag
    is_completed = Column(Boolean, default=False, nullable=False)
    games_loaded = Column(Boolean, default=False, nullable=False)
    
    # Relationships
    games = relationship('NFLGame', back_populates='week', cascade='all, delete-orphan')
    
    # Indexes
    __table_args__ = (
        UniqueConstraint('week_number', 'season_year', name='uq_week_season'),
        Index('ix_nfl_week_active', is_active),
        Index('ix_nfl_week_season', season_year),
    )
    
    @property
    def total_games(self):
        return len(self.games)
    
    @property
    def completed_games(self):
        return len([g for g in self.games if g.is_completed])
    
    @property
    def is_pick_deadline_passed(self):
        return datetime.utcnow() > self.pick_deadline
    
    def to_dict(self):
        return {
            'id': self.id,
            'week_number': self.week_number,
            'season_year': self.season_year,
            'week_type': self.week_type,
            'start_date': self.start_date.isoformat(),
            'pick_deadline': self.pick_deadline.isoformat(),
            'end_date': self.end_date.isoformat(),
            'is_active': self.is_active,
            'is_completed': self.is_completed,
            'total_games': self.total_games,
            'completed_games': self.completed_games,
            'is_pick_deadline_passed': self.is_pick_deadline_passed
        }

class NFLGame(db.Model):
    """Model for individual NFL games"""
    __tablename__ = 'nfl_games'
    
    id = Column(Integer, primary_key=True)
    week_id = Column(Integer, ForeignKey('nfl_weeks.id'), nullable=False)
    
    # Game details
    external_game_id = Column(String(100), nullable=True, index=True)  # From odds API
    home_team = Column(String(50), nullable=False)
    away_team = Column(String(50), nullable=False)
    game_time = Column(DateTime, nullable=False)
    
    # Game results
    is_completed = Column(Boolean, default=False, nullable=False)
    actual_winner = Column(String(50), nullable=True)  # 'home', 'away', or 'tie'
    home_score = Column(Integer, nullable=True)
    away_score = Column(Integer, nullable=True)
    
    # Spread information (for future use)
    home_spread = Column(Numeric(4, 1), nullable=True)
    total_points = Column(Numeric(4, 1), nullable=True)
    
    # Status tracking
    last_updated = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    week = relationship('NFLWeek', back_populates='games')
    picks = relationship('PoolPick', back_populates='game', cascade='all, delete-orphan')
    
    # Indexes
    __table_args__ = (
        Index('ix_nfl_game_week', week_id),
        Index('ix_nfl_game_time', game_time),
        Index('ix_nfl_game_completed', is_completed),
    )
    
    @property
    def has_started(self):
        return datetime.utcnow() > self.game_time
    
    @property
    def game_status(self):
        if self.is_completed:
            return 'completed'
        elif self.has_started:
            return 'in_progress'
        else:
            return 'scheduled'
    
    def to_dict(self):
        return {
            'id': self.id,
            'week_id': self.week_id,
            'external_game_id': self.external_game_id,
            'home_team': self.home_team,
            'away_team': self.away_team,
            'game_time': self.game_time.isoformat(),
            'is_completed': self.is_completed,
            'actual_winner': self.actual_winner,
            'home_score': self.home_score,
            'away_score': self.away_score,
            'home_spread': float(self.home_spread) if self.home_spread else None,
            'game_status': self.game_status,
            'has_started': self.has_started
        }

class PoolPick(db.Model):
    """Model for individual picks made by pool members"""
    __tablename__ = 'pool_picks'
    
    id = Column(Integer, primary_key=True)
    pool_id = Column(Integer, ForeignKey('pickem_pools.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    game_id = Column(Integer, ForeignKey('nfl_games.id'), nullable=False)
    
    # Pick details
    predicted_winner = Column(String(50), nullable=False)  # 'home' or 'away'
    confidence_points = Column(Integer, nullable=True)  # For confidence pools
    
    # Result tracking
    is_correct = Column(Boolean, nullable=True)  # Null until game completes
    points_earned = Column(Integer, default=1, nullable=False)
    
    # Timestamps
    submitted_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    last_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    pool = relationship('PickEmPool')
    game = relationship('NFLGame', back_populates='picks')
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('pool_id', 'user_id', 'game_id', name='uq_pool_user_game_pick'),
        Index('ix_pool_pick_user_game', pool_id, user_id, game_id),
        Index('ix_pool_pick_submitted', submitted_at),
    )
    
    def evaluate_pick(self):
        """Evaluate the pick against actual game result"""
        if not self.game.is_completed or self.game.actual_winner is None:
            return False
        
        self.is_correct = (self.predicted_winner == self.game.actual_winner)
        
        # Calculate points based on pool settings
        pool_settings = self.pool.settings or {}
        if self.is_correct:
            if pool_settings.get('pick_type') == 'confidence' and self.confidence_points:
                self.points_earned = self.confidence_points
            else:
                self.points_earned = 1
        else:
            self.points_earned = 0
        
        return self.is_correct
    
    def to_dict(self):
        return {
            'id': self.id,
            'pool_id': self.pool_id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'predicted_winner': self.predicted_winner,
            'confidence_points': self.confidence_points,
            'is_correct': self.is_correct,
            'points_earned': self.points_earned,
            'submitted_at': self.submitted_at.isoformat(),
            'game_info': self.game.to_dict() if self.game else None
        }

class WeeklyStandings(db.Model):
    """Model for tracking weekly standings in pools"""
    __tablename__ = 'weekly_standings'
    
    id = Column(Integer, primary_key=True)
    pool_id = Column(Integer, ForeignKey('pickem_pools.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    week_id = Column(Integer, ForeignKey('nfl_weeks.id'), nullable=False)
    
    # Weekly stats
    correct_picks = Column(Integer, default=0, nullable=False)
    total_picks = Column(Integer, default=0, nullable=False)
    points_earned = Column(Integer, default=0, nullable=False)
    week_rank = Column(Integer, nullable=True)
    
    # Tiebreakers
    tiebreaker_score = Column(Integer, nullable=True)
    tiebreaker_diff = Column(Integer, nullable=True)
    
    # Calculated at week end
    calculated_at = Column(DateTime, nullable=True)
    
    # Relationships
    pool = relationship('PickEmPool')
    week = relationship('NFLWeek')
    
    # Constraints and indexes
    __table_args__ = (
        UniqueConstraint('pool_id', 'user_id', 'week_id', name='uq_pool_user_week_standing'),
        Index('ix_weekly_standing_pool_week', pool_id, week_id),
        Index('ix_weekly_standing_points', points_earned.desc()),
    )
    
    @property
    def win_percentage(self):
        if self.total_picks == 0:
            return 0.0
        return (self.correct_picks / self.total_picks) * 100
    
    def to_dict(self):
        return {
            'pool_id': self.pool_id,
            'user_id': self.user_id,
            'week_id': self.week_id,
            'correct_picks': self.correct_picks,
            'total_picks': self.total_picks,
            'points_earned': self.points_earned,
            'week_rank': self.week_rank,
            'win_percentage': round(self.win_percentage, 1),
            'user_name': self.user.name if self.user else None,
            'display_name': next((m.display_name for m in self.user.pool_memberships if m.pool_id == self.pool_id), self.user.name) if self.user else None
        }