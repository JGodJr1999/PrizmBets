"""
The Odds API Provider
Wraps The Odds API in the unified sports data interface
Specializes in betting odds, lines, and spreads
"""

import os
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime, timezone

from .base_provider import BaseSportsProvider
from ..models.sports_data import (
    GameData, OddsData, ScoreData, TeamStats,
    SportType, APIResponse, GameStatus, BetType,
    normalize_team_name, convert_odds_format
)

logger = logging.getLogger(__name__)


class TheOddsAPIProvider(BaseSportsProvider):
    """Provider for The Odds API - specializes in betting odds and lines"""
    
    def __init__(self, api_key: str = None):
        api_key = api_key or os.environ.get('ODDS_API_KEY', '')
        super().__init__(
            name="TheOddsAPI",
            api_key=api_key,
            base_url="https://api.the-odds-api.com/v4",
            timeout=10
        )
        
        # Sports mapping for The Odds API
        self.sports_mapping = {
            SportType.NFL: 'americanfootball_nfl',
            SportType.NBA: 'basketball_nba', 
            SportType.MLB: 'baseball_mlb',
            SportType.NHL: 'icehockey_nhl',
            SportType.NCAAF: 'americanfootball_ncaaf',
            SportType.NCAAB: 'basketball_ncaab',
            SportType.SOCCER: 'soccer_epl',
            SportType.MMA: 'mma_mixed_martial_arts'
        }
        
        # Market mapping
        self.market_mapping = {
            BetType.MONEYLINE: 'h2h',
            BetType.SPREAD: 'spreads', 
            BetType.TOTAL_OVER_UNDER: 'totals'
        }
        
        # Priority sportsbooks (in order of preference)
        self.priority_sportsbooks = [
            'draftkings', 'fanduel', 'betmgm', 'caesars', 
            'betrivers', 'espnbet', 'fanatics', 'bet365'
        ]
        
        self.rate_limit_delay = 1.2  # The Odds API rate limiting
    
    def get_supported_sports(self) -> List[SportType]:
        """Return sports supported by The Odds API"""
        return list(self.sports_mapping.keys())
    
    def _add_auth_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Add API key to request parameters"""
        params['apiKey'] = self.api_key
        return params
    
    def get_live_games(self, sport: SportType, limit: int = 10) -> APIResponse:
        """Get current/upcoming games with odds from The Odds API"""
        if sport not in self.sports_mapping:
            return APIResponse.error_response(
                f"Sport {sport.value} not supported by The Odds API",
                source=self.name
            )
        
        sport_key = self.sports_mapping[sport]
        
        params = {
            'regions': 'us',
            'markets': 'h2h,spreads,totals',  # Get all main markets
            'oddsFormat': 'american',
            'dateFormat': 'iso'
        }
        
        endpoint = f"sports/{sport_key}/odds"
        raw_data = self._make_request(endpoint, params)
        
        if not raw_data:
            return APIResponse.error_response(
                "Failed to fetch games from The Odds API",
                source=self.name
            )
        
        games = []
        for game_data in raw_data[:limit]:
            try:
                game = self._convert_to_game_data(game_data, sport)
                games.append(game)
            except Exception as e:
                logger.warning(f"Failed to convert game data: {str(e)}")
                continue
        
        return APIResponse.success_response(
            data=games,
            source=self.name,
            rate_limit_remaining=self._extract_rate_limit(raw_data)
        )
    
    def get_game_odds(self, game_id: str, sport: SportType) -> APIResponse:
        """Get detailed odds for a specific game"""
        # The Odds API doesn't support single game lookup by ID
        # So we fetch all games and filter by ID
        games_response = self.get_live_games(sport, limit=50)
        
        if not games_response.success:
            return games_response
        
        target_game = None
        for game in games_response.data:
            if game.game_id == game_id:
                target_game = game
                break
        
        if not target_game:
            return APIResponse.error_response(
                f"Game {game_id} not found",
                source=self.name
            )
        
        return APIResponse.success_response(
            data=target_game.odds,
            source=self.name
        )
    
    def get_game_scores(self, game_id: str, sport: SportType) -> APIResponse:
        """The Odds API doesn't provide live scores - return empty data"""
        return APIResponse.success_response(
            data=None,
            source=self.name
        )
    
    def get_team_stats(self, team_name: str, sport: SportType) -> APIResponse:
        """The Odds API doesn't provide team stats - return empty data"""
        return APIResponse.success_response(
            data=None, 
            source=self.name
        )
    
    def search_games(self, team_name: str, sport: SportType, days_ahead: int = 7) -> APIResponse:
        """Search for games involving a specific team"""
        games_response = self.get_live_games(sport, limit=100)
        
        if not games_response.success:
            return games_response
        
        team_name_lower = normalize_team_name(team_name).lower()
        matching_games = []
        
        for game in games_response.data:
            if (team_name_lower in game.home_team.lower() or 
                team_name_lower in game.away_team.lower()):
                matching_games.append(game)
        
        return APIResponse.success_response(
            data=matching_games,
            source=self.name
        )
    
    def find_best_odds_for_bet(self, sport: SportType, team_name: str, bet_type: BetType) -> APIResponse:
        """Find the best odds across all sportsbooks for a specific bet"""
        games_response = self.search_games(team_name, sport)
        
        if not games_response.success or not games_response.data:
            return APIResponse.error_response(
                f"No games found for team {team_name}",
                source=self.name
            )
        
        best_odds = None
        best_game = None
        
        for game in games_response.data:
            game_best_odds = game.get_best_odds_for_bet(bet_type)
            if game_best_odds and (not best_odds or game_best_odds.payout_ratio > best_odds.payout_ratio):
                best_odds = game_best_odds
                best_game = game
        
        if not best_odds:
            return APIResponse.error_response(
                f"No odds found for {bet_type.value} on {team_name}",
                source=self.name
            )
        
        result = {
            'game': best_game,
            'best_odds': best_odds,
            'all_sportsbooks': [odds for odds in best_game.odds if odds.bet_type == bet_type]
        }
        
        return APIResponse.success_response(data=result, source=self.name)
    
    def _convert_to_game_data(self, raw_game: Dict[str, Any], sport: SportType) -> GameData:
        """Convert The Odds API format to our standardized GameData"""
        
        # Create base game data
        game = GameData(
            game_id=raw_game.get('id', ''),
            sport=sport,
            home_team=normalize_team_name(raw_game.get('home_team', '')),
            away_team=normalize_team_name(raw_game.get('away_team', '')),
            game_date=datetime.fromisoformat(raw_game.get('commence_time', '').replace('Z', '+00:00')),
            status=GameStatus.SCHEDULED,  # The Odds API mainly has scheduled games
            data_sources=[self.name]
        )
        
        # Process bookmaker odds
        bookmakers = raw_game.get('bookmakers', [])
        for bookmaker in bookmakers:
            sportsbook = bookmaker.get('key', '')
            markets = bookmaker.get('markets', [])
            
            for market in markets:
                market_key = market.get('key', '')
                bet_type = self._map_market_to_bet_type(market_key)
                
                if not bet_type:
                    continue
                
                outcomes = market.get('outcomes', [])
                for outcome in outcomes:
                    # Skip draws for now
                    if outcome.get('name') in ['Draw', 'Tie']:
                        continue
                    
                    odds_data = OddsData(
                        sportsbook=sportsbook,
                        bet_type=bet_type,
                        odds=int(outcome.get('price', -110)),
                        line=outcome.get('point'),  # For spreads/totals
                        last_updated=datetime.now(timezone.utc)
                    )
                    
                    game.add_odds(odds_data)
        
        return game
    
    def _map_market_to_bet_type(self, market_key: str) -> Optional[BetType]:
        """Map The Odds API market keys to our bet types"""
        mapping = {
            'h2h': BetType.MONEYLINE,
            'spreads': BetType.SPREAD,
            'totals': BetType.TOTAL_OVER_UNDER
        }
        return mapping.get(market_key)
    
    def _extract_rate_limit(self, response_data: Any) -> Optional[int]:
        """Extract rate limit info from response headers (would need request object)"""
        # This would need to be implemented with access to response headers
        return None
    
    def get_provider_specific_data(self, endpoint: str, params: Dict = None) -> APIResponse:
        """Access provider-specific endpoints not covered by the abstract interface"""
        raw_data = self._make_request(endpoint, params or {})
        
        if not raw_data:
            return APIResponse.error_response(
                f"Failed to fetch data from {endpoint}",
                source=self.name
            )
        
        return APIResponse.success_response(data=raw_data, source=self.name)