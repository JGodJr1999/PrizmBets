from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, JSON, Numeric, Index
from app.models.user import db


class Parlay(db.Model):
    """Model for storing and tracking parlay bets"""
    __tablename__ = 'parlays'
    
    id = Column(Integer, primary_key=True)
    
    # Parlay identification
    parlay_id = Column(String(36), unique=True, nullable=False, index=True)  # UUID
    name = Column(String(255), nullable=True)  # User-defined name
    
    # Parlay data
    bets = Column(JSON, nullable=False)  # Array of individual bet objects
    total_amount = Column(Numeric(10, 2), nullable=False)
    potential_payout = Column(Numeric(10, 2), nullable=True)
    combined_odds = Column(Numeric(10, 3), nullable=True)
    
    # AI Analysis
    ai_confidence = Column(Numeric(5, 2), nullable=True)  # 0-100 confidence score
    ai_recommendation = Column(String(20), nullable=True)  # recommend, caution, avoid
    ai_analysis = Column(JSON, nullable=True)  # Detailed AI analysis
    
    # Status and tracking
    status = Column(String(20), default='pending', nullable=False)  # pending, placed, won, lost, push, cancelled
    result = Column(String(20), nullable=True)  # final result
    actual_payout = Column(Numeric(10, 2), nullable=True)
    
    # Metadata
    sport_leagues = Column(JSON, nullable=True)  # ['nfl', 'nba'] - sports involved
    bet_types = Column(JSON, nullable=True)  # ['moneyline', 'spread'] - bet types involved
    num_legs = Column(Integer, nullable=False, default=0)
    
    # External tracking
    sportsbook = Column(String(50), nullable=True)
    external_bet_id = Column(String(255), nullable=True)
    
    # Notes and tracking
    notes = Column(Text, nullable=True)
    tags = Column(JSON, nullable=True)  # User-defined tags
    
    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), 
                       onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    placed_at = Column(DateTime, nullable=True)
    settled_at = Column(DateTime, nullable=True)
    
    # Database indexes for performance
    __table_args__ = (
        Index('idx_parlay_created_at', 'created_at'),
        Index('idx_parlay_status', 'status'),
        Index('idx_parlay_sport_leagues', 'sport_leagues'),
        Index('idx_parlay_ai_confidence', 'ai_confidence'),
    )
    
    def __init__(self, parlay_id, bets, total_amount, **kwargs):
        self.parlay_id = parlay_id
        self.bets = bets
        self.total_amount = total_amount
        self.num_legs = len(bets) if isinstance(bets, list) else 0
        
        # Extract sport leagues and bet types from bets
        if isinstance(bets, list):
            self.sport_leagues = list(set([bet.get('sport', 'unknown') for bet in bets]))
            self.bet_types = list(set([bet.get('bet_type', 'unknown') for bet in bets]))
        
        # Set optional fields
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def calculate_combined_odds(self):
        """Calculate combined odds from individual bet odds"""
        if not self.bets or not isinstance(self.bets, list):
            return None
        
        try:
            combined = 1.0
            for bet in self.bets:
                odds = bet.get('odds', 0)
                if odds > 0:
                    # Positive American odds
                    decimal_odds = (odds / 100) + 1
                else:
                    # Negative American odds
                    decimal_odds = (100 / abs(odds)) + 1
                combined *= decimal_odds
            
            self.combined_odds = combined
            return combined
        except (ValueError, ZeroDivisionError):
            return None
    
    def calculate_potential_payout(self):
        """Calculate potential payout based on combined odds"""
        if not self.combined_odds:
            self.calculate_combined_odds()
        
        if self.combined_odds and self.total_amount:
            self.potential_payout = float(self.total_amount) * float(self.combined_odds)
            return self.potential_payout
        return None
    
    def update_status(self, new_status, result=None, actual_payout=None):
        """Update parlay status and related fields"""
        self.status = new_status
        self.updated_at = datetime.now(timezone.utc)
        
        if result:
            self.result = result
        
        if actual_payout is not None:
            self.actual_payout = actual_payout
        
        if new_status == 'placed' and not self.placed_at:
            self.placed_at = datetime.now(timezone.utc)
        elif new_status in ['won', 'lost', 'push'] and not self.settled_at:
            self.settled_at = datetime.now(timezone.utc)
    
    def add_ai_analysis(self, confidence, recommendation, analysis_data):
        """Add AI analysis results to parlay"""
        self.ai_confidence = confidence
        self.ai_recommendation = recommendation
        self.ai_analysis = analysis_data
        self.updated_at = datetime.now(timezone.utc)
    
    def to_dict(self, include_detailed=False):
        """Convert parlay to dictionary for API responses"""
        data = {
            'id': self.id,
            'parlay_id': self.parlay_id,
            'name': self.name,
            'bets': self.bets,
            'total_amount': float(self.total_amount),
            'potential_payout': float(self.potential_payout) if self.potential_payout else None,
            'combined_odds': float(self.combined_odds) if self.combined_odds else None,
            'status': self.status,
            'result': self.result,
            'actual_payout': float(self.actual_payout) if self.actual_payout else None,
            'sport_leagues': self.sport_leagues,
            'bet_types': self.bet_types,
            'num_legs': self.num_legs,
            'sportsbook': self.sportsbook,
            'ai_confidence': float(self.ai_confidence) if self.ai_confidence else None,
            'ai_recommendation': self.ai_recommendation,
            'notes': self.notes,
            'tags': self.tags,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'placed_at': self.placed_at.isoformat() if self.placed_at else None,
            'settled_at': self.settled_at.isoformat() if self.settled_at else None
        }
        
        if include_detailed:
            data.update({
                'ai_analysis': self.ai_analysis,
                'external_bet_id': self.external_bet_id
            })
        
        return data
    
    def __repr__(self):
        return f'<Parlay {self.parlay_id} - {self.num_legs} legs - ${self.total_amount}>'