"""
Unified data models for sports APIs
Standardized format that both The Odds API and API-Sports will conform to
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union
from enum import Enum


class GameStatus(Enum):
    """Standardized game status across all providers"""
    SCHEDULED = "scheduled"
    LIVE = "live" 
    FINISHED = "finished"
    POSTPONED = "postponed"
    CANCELLED = "cancelled"
    SUSPENDED = "suspended"


class BetType(Enum):
    """Standardized bet types"""
    MONEYLINE = "moneyline"
    SPREAD = "spread" 
    TOTAL_OVER_UNDER = "total"
    PROP = "prop"


class SportType(Enum):
    """Supported sports"""
    NFL = "nfl"
    NBA = "nba"
    MLB = "mlb"
    NHL = "nhl"
    NCAAF = "ncaaf"
    NCAAB = "ncaab"
    SOCCER = "soccer"
    MMA = "mma"
    TENNIS = "tennis"


@dataclass
class VenueData:
    """Stadium/venue information"""
    name: str
    city: str
    state: Optional[str] = None
    country: str = "USA"
    capacity: Optional[int] = None
    surface: Optional[str] = None  # grass, turf, hardwood, etc.
    
    
@dataclass
class TeamStats:
    """Team statistics and current form"""
    team_name: str
    wins: int = 0
    losses: int = 0
    ties: int = 0
    win_percentage: float = 0.0
    points_scored: int = 0
    points_allowed: int = 0
    current_streak: str = ""  # "W3", "L1", etc.
    home_record: str = "0-0"
    away_record: str = "0-0"
    last_5_games: str = "0-0"  # Recent form
    injuries: List[str] = field(default_factory=list)
    key_players: List[str] = field(default_factory=list)


@dataclass
class PlayerStats:
    """Individual player statistics"""
    name: str
    position: str
    team: str
    stats: Dict[str, Union[int, float]] = field(default_factory=dict)
    status: str = "active"  # active, injured, out, questionable
    

@dataclass  
class OddsData:
    """Betting odds information"""
    sportsbook: str
    bet_type: BetType
    odds: int  # American odds format (-110, +150, etc.)
    line: Optional[float] = None  # Spread or total line
    payout_ratio: float = 0.0  # Calculated payout ratio
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def __post_init__(self):
        """Calculate payout ratio from American odds"""
        if self.odds > 0:
            self.payout_ratio = self.odds / 100
        else:
            self.payout_ratio = 100 / abs(self.odds)


@dataclass
class ScoreData:
    """Live game scoring information"""
    home_score: int = 0
    away_score: int = 0
    period: int = 0  # Quarter, inning, set, etc.
    time_remaining: str = ""  # "12:34", "Final", "Halftime"
    period_scores: List[Dict[str, int]] = field(default_factory=list)  # Quarter by quarter
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class GameData:
    """Complete game information combining all data sources"""
    # Basic game info
    game_id: str
    sport: SportType
    home_team: str
    away_team: str  
    game_date: datetime
    status: GameStatus
    
    # Venue info
    venue: Optional[VenueData] = None
    
    # Live scoring (primarily from API-Sports)
    score: Optional[ScoreData] = None
    
    # Team statistics (from API-Sports)
    home_team_stats: Optional[TeamStats] = None
    away_team_stats: Optional[TeamStats] = None
    
    # Betting odds (primarily from The Odds API) 
    odds: List[OddsData] = field(default_factory=list)
    
    # Best odds recommendations
    best_odds: Dict[str, OddsData] = field(default_factory=dict)  # bet_type -> best_odds
    
    # Metadata
    data_sources: List[str] = field(default_factory=list)  # Track which APIs provided data
    confidence_score: float = 1.0  # Data quality/freshness score
    last_updated: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    
    def add_odds(self, odds_data: OddsData):
        """Add odds data and update best odds if better"""
        self.odds.append(odds_data)
        
        bet_type_key = odds_data.bet_type.value
        current_best = self.best_odds.get(bet_type_key)
        
        if not current_best or odds_data.payout_ratio > current_best.payout_ratio:
            self.best_odds[bet_type_key] = odds_data
    
    def get_best_odds_for_bet(self, bet_type: BetType) -> Optional[OddsData]:
        """Get the best odds for a specific bet type"""
        return self.best_odds.get(bet_type.value)


@dataclass
class APIResponse:
    """Standardized API response wrapper"""
    success: bool
    data: Any
    error_message: Optional[str] = None
    source: str = ""  # "theoddsapi", "apisports", "aggregated"
    timestamp: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    cached: bool = False
    rate_limit_remaining: Optional[int] = None
    
    @classmethod
    def success_response(cls, data: Any, source: str = "", cached: bool = False, **kwargs):
        """Create a successful response"""
        return cls(
            success=True,
            data=data,
            source=source,
            cached=cached,
            **kwargs
        )
    
    @classmethod 
    def error_response(cls, error_message: str, source: str = "", **kwargs):
        """Create an error response"""
        return cls(
            success=False,
            data=None,
            error_message=error_message,
            source=source,
            **kwargs
        )


# Utility functions for data conversion
def normalize_team_name(team_name: str) -> str:
    """Normalize team names across different APIs"""
    team_mapping = {
        # Handle common variations
        "kansas city chiefs": "Kansas City Chiefs",
        "kc chiefs": "Kansas City Chiefs",  
        "new england patriots": "New England Patriots",
        "ne patriots": "New England Patriots",
        "las vegas raiders": "Las Vegas Raiders",
        "lv raiders": "Las Vegas Raiders",
        # Add more as needed
    }
    
    normalized = team_name.lower().strip()
    return team_mapping.get(normalized, team_name.title())


def convert_odds_format(odds: Union[int, float, str], target_format: str = "american") -> int:
    """Convert between different odds formats"""
    if target_format == "american":
        if isinstance(odds, str):
            # Handle decimal odds like "1.91" -> -110
            try:
                decimal = float(odds)
                if decimal >= 2.0:
                    return int((decimal - 1) * 100)
                else:
                    return int(-100 / (decimal - 1))
            except ValueError:
                return -110  # Default fallback
        return int(odds)
    
    # Add other format conversions as needed
    return int(odds)