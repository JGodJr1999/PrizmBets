"""
Abstract base class for sports data providers
Defines common interface that both The Odds API and API-Sports will implement
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
import logging
import time
import requests
from datetime import datetime, timezone

from ..models.sports_data import (
    GameData, OddsData, ScoreData, TeamStats, 
    SportType, APIResponse, GameStatus
)

logger = logging.getLogger(__name__)


class BaseSportsProvider(ABC):
    """Abstract base class for sports data providers"""
    
    def __init__(self, name: str, api_key: str, base_url: str, timeout: int = 10):
        self.name = name
        self.api_key = api_key
        self.base_url = base_url
        self.timeout = timeout
        self.last_request_time = 0
        self.rate_limit_delay = 1.0  # Seconds between requests
        self.max_retries = 3
        
    @abstractmethod
    def get_supported_sports(self) -> List[SportType]:
        """Return list of sports this provider supports"""
        pass
    
    @abstractmethod
    def get_live_games(self, sport: SportType, limit: int = 10) -> APIResponse:
        """Get current/upcoming games for a sport"""
        pass
    
    @abstractmethod
    def get_game_odds(self, game_id: str, sport: SportType) -> APIResponse:
        """Get betting odds for a specific game"""
        pass
    
    @abstractmethod  
    def get_game_scores(self, game_id: str, sport: SportType) -> APIResponse:
        """Get live scores for a specific game"""
        pass
    
    @abstractmethod
    def get_team_stats(self, team_name: str, sport: SportType) -> APIResponse:
        """Get team statistics and current form"""
        pass
    
    @abstractmethod
    def search_games(self, team_name: str, sport: SportType, days_ahead: int = 7) -> APIResponse:
        """Search for games involving a specific team"""
        pass
    
    # Common utility methods that all providers can use
    def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Optional[Dict]:
        """
        Make HTTP request with rate limiting, retries, and error handling
        """
        if not self.api_key:
            logger.error(f"{self.name}: API key not configured")
            return None
            
        # Rate limiting
        time_since_last = time.time() - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last
            logger.debug(f"{self.name}: Rate limiting, sleeping {sleep_time:.2f}s")
            time.sleep(sleep_time)
        
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        params = params or {}
        
        # Add API key to params (provider-specific implementation may override)
        params = self._add_auth_params(params)
        
        for attempt in range(self.max_retries):
            try:
                self.last_request_time = time.time()
                
                logger.debug(f"{self.name}: Making request to {endpoint} (attempt {attempt + 1})")
                response = requests.get(url, params=params, timeout=self.timeout)
                
                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 60))
                    logger.warning(f"{self.name}: Rate limited, waiting {retry_after}s")
                    time.sleep(retry_after)
                    continue
                
                response.raise_for_status()
                
                # Log API usage if available
                remaining = response.headers.get('x-requests-remaining') or response.headers.get('x-ratelimit-remaining')
                if remaining:
                    logger.info(f"{self.name}: API calls remaining: {remaining}")
                
                return response.json()
                
            except requests.exceptions.Timeout:
                logger.warning(f"{self.name}: Request timeout (attempt {attempt + 1})")
                if attempt == self.max_retries - 1:
                    logger.error(f"{self.name}: Max retries exceeded for {endpoint}")
                    return None
                time.sleep(2 ** attempt)  # Exponential backoff
                
            except requests.exceptions.HTTPError as e:
                logger.error(f"{self.name}: HTTP error {e.response.status_code}: {e}")
                return None
                
            except requests.exceptions.RequestException as e:
                logger.error(f"{self.name}: Request error: {str(e)}")
                if attempt == self.max_retries - 1:
                    return None
                time.sleep(2 ** attempt)
                
            except ValueError as e:
                logger.error(f"{self.name}: JSON decode error: {str(e)}")
                return None
        
        return None
    
    @abstractmethod
    def _add_auth_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Add authentication parameters (provider-specific)"""
        pass
    
    def _create_fallback_game_data(self, sport: SportType, team1: str, team2: str = None) -> GameData:
        """Create fallback game data when API fails"""
        return GameData(
            game_id=f"fallback_{int(time.time())}",
            sport=sport,
            home_team=team1,
            away_team=team2 or "TBD",
            game_date=datetime.now(timezone.utc),
            status=GameStatus.SCHEDULED,
            data_sources=[f"{self.name}_fallback"],
            confidence_score=0.1  # Low confidence for fallback data
        )
    
    def _create_fallback_odds(self, sportsbook: str = "fallback") -> List[OddsData]:
        """Create realistic fallback odds when API fails"""
        from ..models.sports_data import BetType
        
        return [
            OddsData(sportsbook=sportsbook, bet_type=BetType.MONEYLINE, odds=-110),
            OddsData(sportsbook=sportsbook, bet_type=BetType.SPREAD, odds=-110, line=-3.5),
            OddsData(sportsbook=sportsbook, bet_type=BetType.TOTAL_OVER_UNDER, odds=-110, line=47.5)
        ]
    
    def is_healthy(self) -> bool:
        """Check if the provider is healthy and responding"""
        try:
            # Make a lightweight health check request
            result = self._make_request("sports" if hasattr(self, '_health_endpoint') else "")
            return result is not None
        except:
            return False
    
    def get_provider_info(self) -> Dict[str, Any]:
        """Get information about this provider"""
        return {
            "name": self.name,
            "supports_odds": hasattr(self, 'get_game_odds'),
            "supports_scores": hasattr(self, 'get_game_scores'), 
            "supports_stats": hasattr(self, 'get_team_stats'),
            "supported_sports": [sport.value for sport in self.get_supported_sports()],
            "healthy": self.is_healthy(),
            "rate_limit_delay": self.rate_limit_delay
        }