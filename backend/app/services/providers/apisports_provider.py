"""
API-Sports Provider
Wraps API-Sports.io in the unified sports data interface
Specializes in live scores, team stats, player data, and detailed game information
"""

import os
from typing import Dict, List, Optional, Any
import logging
from datetime import datetime, timezone, timedelta

from .base_provider import BaseSportsProvider
from ..models.sports_data import (
    GameData, OddsData, ScoreData, TeamStats, VenueData,
    SportType, APIResponse, GameStatus, BetType,
    normalize_team_name, PlayerStats
)

logger = logging.getLogger(__name__)


class APISportsProvider(BaseSportsProvider):
    """Provider for API-Sports - specializes in live scores, stats, and game data"""
    
    def __init__(self, api_key: str = None):
        api_key = api_key or os.environ.get('APISPORTS_KEY', '')
        
        # API-Sports has different endpoints for different sports
        super().__init__(
            name="APISports",
            api_key=api_key,
            base_url="https://v1.american-football.api-sports.io",  # Default to NFL
            timeout=15
        )
        
        # Sports-specific API endpoints
        self.sport_endpoints = {
            SportType.NFL: "https://v1.american-football.api-sports.io",
            SportType.NBA: "https://v1.basketball.api-sports.io", 
            SportType.MLB: "https://v1.baseball.api-sports.io",
            SportType.NHL: "https://v1.hockey.api-sports.io",
            SportType.SOCCER: "https://v3.football.api-sports.io"
        }
        
        # League mappings for each sport
        self.league_mappings = {
            SportType.NFL: 1,  # NFL league ID
            SportType.NBA: 12,  # NBA league ID
            SportType.MLB: 1,   # MLB league ID  
            SportType.NHL: 57,  # NHL league ID
            SportType.SOCCER: 39  # Premier League ID (example)
        }
        
        # Status mappings from API-Sports to our format
        self.status_mappings = {
            'NS': GameStatus.SCHEDULED,  # Not Started
            '1H': GameStatus.LIVE,       # First Half
            '2H': GameStatus.LIVE,       # Second Half
            'HT': GameStatus.LIVE,       # Half Time
            'FT': GameStatus.FINISHED,   # Full Time
            'AET': GameStatus.FINISHED,  # After Extra Time
            'PEN': GameStatus.FINISHED,  # Penalties
            'PST': GameStatus.POSTPONED,
            'CANC': GameStatus.CANCELLED,
            'SUSP': GameStatus.SUSPENDED
        }
        
        self.rate_limit_delay = 1.5  # API-Sports rate limiting
    
    def get_supported_sports(self) -> List[SportType]:
        """Return sports supported by API-Sports"""
        return list(self.sport_endpoints.keys())
    
    def _add_auth_params(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """API-Sports uses headers for authentication, not params"""
        # Authentication is handled in headers, not params
        return params
    
    def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Optional[Dict]:
        """Override to add API-Sports specific headers"""
        if not self.api_key:
            logger.error(f"{self.name}: API key not configured")
            return None
        
        # Update the request method to include headers
        import requests
        import time
        
        # Rate limiting
        time_since_last = time.time() - self.last_request_time
        if time_since_last < self.rate_limit_delay:
            sleep_time = self.rate_limit_delay - time_since_last
            time.sleep(sleep_time)
        
        url = f"{self.base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        params = params or {}
        
        headers = {
            'x-rapidapi-key': self.api_key,
            'x-rapidapi-host': self.base_url.split('//')[1]  # Extract hostname
        }
        
        for attempt in range(self.max_retries):
            try:
                self.last_request_time = time.time()
                
                logger.debug(f"{self.name}: Making request to {endpoint} (attempt {attempt + 1})")
                response = requests.get(url, params=params, headers=headers, timeout=self.timeout)
                
                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 60))
                    logger.warning(f"{self.name}: Rate limited, waiting {retry_after}s")
                    time.sleep(retry_after)
                    continue
                
                response.raise_for_status()
                
                # Log API usage
                remaining = response.headers.get('x-ratelimit-requests-remaining')
                if remaining:
                    logger.info(f"{self.name}: API calls remaining: {remaining}")
                
                data = response.json()
                return data.get('response', data)  # API-Sports wraps data in 'response'
                
            except requests.exceptions.Timeout:
                logger.warning(f"{self.name}: Request timeout (attempt {attempt + 1})")
                if attempt == self.max_retries - 1:
                    return None
                time.sleep(2 ** attempt)
                
            except requests.exceptions.RequestException as e:
                logger.error(f"{self.name}: Request error: {str(e)}")
                if attempt == self.max_retries - 1:
                    return None
                time.sleep(2 ** attempt)
        
        return None
    
    def _set_sport_endpoint(self, sport: SportType):
        """Set the correct API endpoint for the sport"""
        if sport in self.sport_endpoints:
            self.base_url = self.sport_endpoints[sport]
    
    def get_live_games(self, sport: SportType, limit: int = 10) -> APIResponse:
        """Get current/upcoming games from API-Sports"""
        if sport not in self.league_mappings:
            return APIResponse.error_response(
                f"Sport {sport.value} not supported by API-Sports",
                source=self.name
            )
        
        self._set_sport_endpoint(sport)
        league_id = self.league_mappings[sport]
        
        # Get current season year
        current_year = datetime.now().year
        
        params = {
            'league': league_id,
            'season': current_year,
            'timezone': 'America/New_York'
        }
        
        # API-Sports endpoint varies by sport
        if sport == SportType.NFL:
            endpoint = "games"
        elif sport == SportType.NBA:
            endpoint = "games"
        elif sport == SportType.MLB:
            endpoint = "games"
        elif sport == SportType.NHL:
            endpoint = "games"
        else:
            endpoint = "fixtures"
        
        raw_data = self._make_request(endpoint, params)
        
        if not raw_data:
            return APIResponse.error_response(
                "Failed to fetch games from API-Sports",
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
            source=self.name
        )
    
    def get_game_odds(self, game_id: str, sport: SportType) -> APIResponse:
        """API-Sports doesn't specialize in odds - return empty"""
        return APIResponse.success_response(
            data=[],
            source=self.name
        )
    
    def get_game_scores(self, game_id: str, sport: SportType) -> APIResponse:
        """Get live scores for a specific game"""
        self._set_sport_endpoint(sport)
        
        params = {'id': game_id}
        
        if sport == SportType.NFL:
            endpoint = f"games"
        else:
            endpoint = f"games"
        
        raw_data = self._make_request(endpoint, params)
        
        if not raw_data:
            return APIResponse.error_response(
                f"Failed to fetch scores for game {game_id}",
                source=self.name
            )
        
        if raw_data:
            game_data = raw_data[0] if isinstance(raw_data, list) else raw_data
            score_data = self._extract_score_data(game_data, sport)
            
            return APIResponse.success_response(
                data=score_data,
                source=self.name
            )
        
        return APIResponse.error_response(
            f"Game {game_id} not found",
            source=self.name
        )
    
    def get_team_stats(self, team_name: str, sport: SportType) -> APIResponse:
        """Get team statistics from API-Sports"""
        self._set_sport_endpoint(sport)
        league_id = self.league_mappings.get(sport)
        
        if not league_id:
            return APIResponse.error_response(
                f"Sport {sport.value} not supported",
                source=self.name
            )
        
        # First, find the team ID
        teams_endpoint = "teams"
        teams_params = {'league': league_id, 'season': datetime.now().year}
        
        teams_data = self._make_request(teams_endpoint, teams_params)
        
        if not teams_data:
            return APIResponse.error_response(
                "Failed to fetch teams data",
                source=self.name
            )
        
        # Find matching team
        target_team = None
        team_name_lower = normalize_team_name(team_name).lower()
        
        for team in teams_data:
            if team_name_lower in team.get('name', '').lower():
                target_team = team
                break
        
        if not target_team:
            return APIResponse.error_response(
                f"Team {team_name} not found",
                source=self.name
            )
        
        # Get team statistics
        stats_params = {
            'team': target_team.get('id'),
            'league': league_id,
            'season': datetime.now().year
        }
        
        stats_data = self._make_request("teams/statistics", stats_params)
        
        if stats_data:
            team_stats = self._convert_to_team_stats(stats_data, target_team.get('name', ''), sport)
            return APIResponse.success_response(data=team_stats, source=self.name)
        
        return APIResponse.error_response(
            f"Failed to fetch stats for {team_name}",
            source=self.name
        )
    
    def search_games(self, team_name: str, sport: SportType, days_ahead: int = 7) -> APIResponse:
        """Search for games involving a specific team"""
        games_response = self.get_live_games(sport, limit=100)
        
        if not games_response.success:
            return games_response
        
        team_name_lower = normalize_team_name(team_name).lower()
        matching_games = []
        
        cutoff_date = datetime.now(timezone.utc) + timedelta(days=days_ahead)
        
        for game in games_response.data:
            if (team_name_lower in game.home_team.lower() or 
                team_name_lower in game.away_team.lower()) and game.game_date <= cutoff_date:
                matching_games.append(game)
        
        return APIResponse.success_response(
            data=matching_games,
            source=self.name
        )
    
    def _convert_to_game_data(self, raw_game: Dict[str, Any], sport: SportType) -> GameData:
        """Convert API-Sports format to standardized GameData"""
        
        # API-Sports structure varies by sport, handle common patterns
        teams = raw_game.get('teams', {})
        home_team = teams.get('home', {}).get('name', '') if teams else ''
        away_team = teams.get('away', {}).get('name', '') if teams else ''
        
        # Alternative structure for some sports
        if not home_team:
            home_team = raw_game.get('home', {}).get('name', '')
            away_team = raw_game.get('away', {}).get('name', '')
        
        # Game status
        game_status = raw_game.get('status', {}).get('short', 'NS')
        status = self.status_mappings.get(game_status, GameStatus.SCHEDULED)
        
        # Game date
        date_str = raw_game.get('date') or raw_game.get('commence_time', '')
        try:
            game_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            game_date = datetime.now(timezone.utc)
        
        game = GameData(
            game_id=str(raw_game.get('id', '')),
            sport=sport,
            home_team=normalize_team_name(home_team),
            away_team=normalize_team_name(away_team),
            game_date=game_date,
            status=status,
            data_sources=[self.name]
        )
        
        # Add score data if available
        scores = raw_game.get('scores', {})
        if scores:
            game.score = self._extract_score_data(raw_game, sport)
        
        # Add venue data if available
        venue = raw_game.get('venue')
        if venue:
            game.venue = VenueData(
                name=venue.get('name', ''),
                city=venue.get('city', ''),
                state=venue.get('state'),
                capacity=venue.get('capacity')
            )
        
        return game
    
    def _extract_score_data(self, game_data: Dict[str, Any], sport: SportType) -> ScoreData:
        """Extract live score information"""
        scores = game_data.get('scores', {})
        
        home_score = scores.get('home', 0) if scores else 0
        away_score = scores.get('away', 0) if scores else 0
        
        # Extract period/quarter info
        status = game_data.get('status', {})
        period = status.get('period', 0) if status else 0
        time_remaining = status.get('clock', '') if status else ''
        
        return ScoreData(
            home_score=int(home_score) if home_score else 0,
            away_score=int(away_score) if away_score else 0,
            period=int(period) if period else 0,
            time_remaining=str(time_remaining),
            last_updated=datetime.now(timezone.utc)
        )
    
    def _convert_to_team_stats(self, stats_data: Dict[str, Any], team_name: str, sport: SportType) -> TeamStats:
        """Convert API-Sports team stats to standardized format"""
        
        # API-Sports stats structure varies by sport
        stats = TeamStats(team_name=team_name)
        
        if sport == SportType.NFL:
            stats.wins = stats_data.get('wins', {}).get('all', 0)
            stats.losses = stats_data.get('losses', {}).get('all', 0)
            stats.ties = stats_data.get('draws', {}).get('all', 0)
        elif sport == SportType.NBA:
            games_played = stats_data.get('games', {}).get('played', {}).get('all', 0)
            wins = stats_data.get('wins', {}).get('all', 0)
            stats.wins = wins
            stats.losses = games_played - wins
        
        # Calculate win percentage
        total_games = stats.wins + stats.losses + stats.ties
        if total_games > 0:
            stats.win_percentage = stats.wins / total_games
        
        return stats