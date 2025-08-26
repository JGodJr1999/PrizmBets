"""
Sports Data Aggregator
Unified interface that combines data from multiple sports APIs
Handles conflict resolution, caching, and intelligent data merging
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from enum import Enum

from .providers import BaseSportsProvider, TheOddsAPIProvider, APISportsProvider
from .models.sports_data import (
    GameData, OddsData, ScoreData, TeamStats,
    SportType, APIResponse, GameStatus, BetType
)

logger = logging.getLogger(__name__)


class DataSource(Enum):
    """Priority order for different types of data"""
    ODDS_PRIMARY = "theoddsapi"
    SCORES_PRIMARY = "apisports"
    STATS_PRIMARY = "apisports"
    FALLBACK = "fallback"


class SportsDataAggregator:
    """
    Main aggregator that combines data from multiple sports APIs
    Provides a single interface for all sports data needs
    """
    
    def __init__(self):
        """Initialize all providers and configure data source priorities"""
        
        # Initialize providers
        self.odds_provider = TheOddsAPIProvider()
        self.sports_provider = APISportsProvider()
        
        # Provider health status
        self._provider_health = {
            'theoddsapi': True,
            'apisports': True
        }
        
        # Data source priorities
        self.source_priorities = {
            'odds': [DataSource.ODDS_PRIMARY, DataSource.FALLBACK],
            'scores': [DataSource.SCORES_PRIMARY, DataSource.FALLBACK],
            'stats': [DataSource.STATS_PRIMARY, DataSource.FALLBACK]
        }
        
        # Cache settings
        self.cache_durations = {
            'odds': timedelta(minutes=5),      # Odds change frequently
            'scores': timedelta(seconds=30),   # Live scores need frequent updates
            'stats': timedelta(hours=1),       # Team stats change daily
            'games': timedelta(minutes=15)     # Game schedules
        }
        
        # Simple in-memory cache (in production, use Redis)
        self._cache = {}
        
        logger.info("Sports Data Aggregator initialized with multiple providers")
    
    def get_enriched_game_data(self, sport: SportType, team_name: str = None, limit: int = 10) -> APIResponse:
        """
        Get comprehensive game data combining odds from The Odds API 
        and scores/stats from API-Sports
        """
        cache_key = f"enriched_games_{sport.value}_{team_name}_{limit}"
        cached_data = self._get_cached_data(cache_key, 'games')
        
        if cached_data:
            return APIResponse.success_response(
                data=cached_data,
                source="aggregated",
                cached=True
            )
        
        # Strategy: Get base games from the healthiest provider
        base_games = []
        
        # Try odds provider first (usually has good game listings)
        if self._is_provider_healthy('theoddsapi'):
            if team_name:
                games_response = self.odds_provider.search_games(team_name, sport, days_ahead=14)
            else:
                games_response = self.odds_provider.get_live_games(sport, limit)
            
            if games_response.success and games_response.data:
                base_games = games_response.data
                logger.info(f"Got {len(base_games)} base games from The Odds API")
        
        # Fallback to sports provider if odds provider failed
        if not base_games and self._is_provider_healthy('apisports'):
            if team_name:
                games_response = self.sports_provider.search_games(team_name, sport, days_ahead=14)
            else:
                games_response = self.sports_provider.get_live_games(sport, limit)
            
            if games_response.success and games_response.data:
                base_games = games_response.data
                logger.info(f"Got {len(base_games)} base games from API-Sports")
        
        if not base_games:
            return APIResponse.error_response(
                "Failed to fetch games from all providers",
                source="aggregated"
            )
        
        # Enrich each game with data from other sources
        enriched_games = []
        for game in base_games:
            enriched_game = self._enrich_single_game(game, sport)
            enriched_games.append(enriched_game)
        
        # Cache the results
        self._cache_data(cache_key, enriched_games, 'games')
        
        return APIResponse.success_response(
            data=enriched_games,
            source="aggregated"
        )
    
    def _enrich_single_game(self, base_game: GameData, sport: SportType) -> GameData:
        """Enrich a single game with data from all available sources"""
        
        # Start with the base game
        enriched = base_game
        
        # Add live scores if missing (prioritize API-Sports)
        if not enriched.score and self._is_provider_healthy('apisports'):
            scores_response = self.sports_provider.get_game_scores(enriched.game_id, sport)
            if scores_response.success and scores_response.data:
                enriched.score = scores_response.data
                if 'apisports' not in enriched.data_sources:
                    enriched.data_sources.append('apisports')
        
        # Add/enhance odds data (prioritize The Odds API)
        if (not enriched.odds or len(enriched.odds) < 3) and self._is_provider_healthy('theoddsapi'):
            odds_response = self.odds_provider.get_game_odds(enriched.game_id, sport)
            if odds_response.success and odds_response.data:
                # Merge odds data
                for odds in odds_response.data:
                    enriched.add_odds(odds)
                if 'theoddsapi' not in enriched.data_sources:
                    enriched.data_sources.append('theoddsapi')
        
        # Calculate confidence score based on data completeness
        enriched.confidence_score = self._calculate_confidence_score(enriched)
        
        return enriched
    
    def get_best_odds_for_parlay(self, parlay_legs: List[Dict[str, Any]]) -> APIResponse:
        """
        Find the best odds for each leg of a parlay across all sportsbooks
        """
        cache_key = f"parlay_odds_{hash(str(parlay_legs))}"
        cached_data = self._get_cached_data(cache_key, 'odds')
        
        if cached_data:
            return APIResponse.success_response(
                data=cached_data,
                source="aggregated",
                cached=True
            )
        
        parlay_analysis = {
            'legs': [],
            'total_odds': 1.0,
            'best_payout': 0.0,
            'recommended_sportsbooks': {},
            'potential_winnings': 0.0
        }
        
        for leg in parlay_legs:
            sport = SportType(leg.get('sport', 'nfl'))
            team = leg.get('team', '')
            bet_type = BetType(leg.get('bet_type', 'moneyline'))
            
            # Get best odds for this leg
            best_odds_response = self.odds_provider.find_best_odds_for_bet(sport, team, bet_type)
            
            leg_analysis = {
                'sport': sport.value,
                'team': team,
                'bet_type': bet_type.value,
                'best_odds': None,
                'all_options': [],
                'confidence': 0.5
            }
            
            if best_odds_response.success:
                best_odds_data = best_odds_response.data
                leg_analysis.update({
                    'best_odds': best_odds_data['best_odds'].__dict__,
                    'all_options': [odds.__dict__ for odds in best_odds_data['all_sportsbooks']],
                    'confidence': 0.9
                })
                
                # Track recommended sportsbooks
                sportsbook = best_odds_data['best_odds'].sportsbook
                if sportsbook not in parlay_analysis['recommended_sportsbooks']:
                    parlay_analysis['recommended_sportsbooks'][sportsbook] = []
                parlay_analysis['recommended_sportsbooks'][sportsbook].append(leg_analysis)
            
            parlay_analysis['legs'].append(leg_analysis)
        
        # Calculate total parlay odds and potential payout
        self._calculate_parlay_payout(parlay_analysis, parlay_legs)
        
        # Cache results
        self._cache_data(cache_key, parlay_analysis, 'odds')
        
        return APIResponse.success_response(
            data=parlay_analysis,
            source="aggregated"
        )
    
    def get_team_analysis(self, team_name: str, sport: SportType) -> APIResponse:
        """Get comprehensive team analysis including stats, recent games, and trends"""
        
        cache_key = f"team_analysis_{team_name}_{sport.value}"
        cached_data = self._get_cached_data(cache_key, 'stats')
        
        if cached_data:
            return APIResponse.success_response(
                data=cached_data,
                source="aggregated",
                cached=True
            )
        
        analysis = {
            'team_name': team_name,
            'sport': sport.value,
            'stats': None,
            'recent_games': [],
            'upcoming_games': [],
            'betting_trends': {},
            'confidence': 0.0
        }
        
        # Get team stats (prioritize API-Sports)
        if self._is_provider_healthy('apisports'):
            stats_response = self.sports_provider.get_team_stats(team_name, sport)
            if stats_response.success and stats_response.data:
                analysis['stats'] = stats_response.data.__dict__
                analysis['confidence'] += 0.4
        
        # Get recent and upcoming games
        games_response = self.get_enriched_game_data(sport, team_name, limit=20)
        if games_response.success:
            now = datetime.now(timezone.utc)
            for game in games_response.data:
                if game.game_date < now and game.status == GameStatus.FINISHED:
                    analysis['recent_games'].append(game.__dict__)
                elif game.game_date > now:
                    analysis['upcoming_games'].append(game.__dict__)
            
            analysis['confidence'] += 0.3
        
        # Analyze betting trends from recent games
        analysis['betting_trends'] = self._analyze_betting_trends(analysis['recent_games'])
        
        # Cache results
        self._cache_data(cache_key, analysis, 'stats')
        
        return APIResponse.success_response(
            data=analysis,
            source="aggregated"
        )
    
    def _calculate_parlay_payout(self, parlay_analysis: Dict, parlay_legs: List[Dict]) -> None:
        """Calculate total parlay odds and potential winnings"""
        
        total_american_odds = 1.0
        valid_legs = 0
        
        for leg in parlay_analysis['legs']:
            if leg['best_odds']:
                american_odds = leg['best_odds']['odds']
                
                # Convert American odds to decimal
                if american_odds > 0:
                    decimal_odds = (american_odds / 100) + 1
                else:
                    decimal_odds = (100 / abs(american_odds)) + 1
                
                total_american_odds *= decimal_odds
                valid_legs += 1
        
        if valid_legs > 0:
            # Convert back to American odds
            if total_american_odds >= 2.0:
                parlay_analysis['total_odds'] = int((total_american_odds - 1) * 100)
            else:
                parlay_analysis['total_odds'] = int(-100 / (total_american_odds - 1))
            
            # Calculate potential winnings for $100 bet
            bet_amount = 100
            if parlay_analysis['total_odds'] > 0:
                potential_win = bet_amount * (parlay_analysis['total_odds'] / 100)
            else:
                potential_win = bet_amount * (100 / abs(parlay_analysis['total_odds']))
            
            parlay_analysis['potential_winnings'] = round(potential_win, 2)
            parlay_analysis['best_payout'] = round(potential_win + bet_amount, 2)
    
    def _analyze_betting_trends(self, recent_games: List[Dict]) -> Dict[str, Any]:
        """Analyze betting trends from recent games"""
        
        trends = {
            'games_analyzed': len(recent_games),
            'avg_total_score': 0,
            'high_scoring_games': 0,
            'close_games': 0,
            'home_performance': {'wins': 0, 'losses': 0},
            'away_performance': {'wins': 0, 'losses': 0}
        }
        
        if not recent_games:
            return trends
        
        total_scores = []
        for game_dict in recent_games:
            if game_dict.get('score'):
                score = game_dict['score']
                total_score = score.get('home_score', 0) + score.get('away_score', 0)
                total_scores.append(total_score)
                
                # High scoring game (sport-specific thresholds)
                if total_score > 50:  # Adjust based on sport
                    trends['high_scoring_games'] += 1
                
                # Close game (within 7 points)
                score_diff = abs(score.get('home_score', 0) - score.get('away_score', 0))
                if score_diff <= 7:
                    trends['close_games'] += 1
        
        if total_scores:
            trends['avg_total_score'] = round(sum(total_scores) / len(total_scores), 1)
        
        return trends
    
    def _calculate_confidence_score(self, game: GameData) -> float:
        """Calculate confidence score based on data completeness and freshness"""
        
        score = 0.0
        
        # Base score for having the game
        score += 0.2
        
        # Odds data quality
        if game.odds:
            score += min(0.3, len(game.odds) * 0.05)  # Up to 0.3 for having many sportsbooks
        
        # Live score data
        if game.score:
            score += 0.2
            if game.status == GameStatus.LIVE:
                score += 0.1  # Bonus for live games
        
        # Team stats
        if game.home_team_stats or game.away_team_stats:
            score += 0.1
        
        # Data freshness (within last hour gets bonus)
        time_diff = datetime.now(timezone.utc) - game.last_updated
        if time_diff < timedelta(hours=1):
            score += 0.1
        
        # Multiple data sources bonus
        if len(game.data_sources) > 1:
            score += 0.1
        
        return min(1.0, score)  # Cap at 1.0
    
    def _is_provider_healthy(self, provider_name: str) -> bool:
        """Check if a provider is currently healthy"""
        return self._provider_health.get(provider_name, False)
    
    def _get_cached_data(self, cache_key: str, data_type: str) -> Optional[Any]:
        """Get data from cache if still valid"""
        
        if cache_key not in self._cache:
            return None
        
        cached_item = self._cache[cache_key]
        cache_duration = self.cache_durations.get(data_type, timedelta(minutes=15))
        
        if datetime.now(timezone.utc) - cached_item['timestamp'] < cache_duration:
            logger.debug(f"Cache hit for {cache_key}")
            return cached_item['data']
        else:
            # Cache expired
            del self._cache[cache_key]
            return None
    
    def _cache_data(self, cache_key: str, data: Any, data_type: str) -> None:
        """Cache data with timestamp"""
        
        self._cache[cache_key] = {
            'data': data,
            'timestamp': datetime.now(timezone.utc),
            'type': data_type
        }
        
        # Simple cache size management (keep last 1000 items)
        if len(self._cache) > 1000:
            # Remove oldest 100 items
            oldest_keys = sorted(
                self._cache.keys(),
                key=lambda k: self._cache[k]['timestamp']
            )[:100]
            
            for key in oldest_keys:
                del self._cache[key]
    
    def get_provider_status(self) -> Dict[str, Any]:
        """Get status of all providers"""
        
        status = {
            'aggregator_healthy': True,
            'providers': {},
            'cache_stats': {
                'total_items': len(self._cache),
                'cache_types': {}
            }
        }
        
        # Check provider health
        providers = {
            'theoddsapi': self.odds_provider,
            'apisports': self.sports_provider
        }
        
        for name, provider in providers.items():
            provider_info = provider.get_provider_info()
            status['providers'][name] = provider_info
            self._provider_health[name] = provider_info['healthy']
        
        # Cache statistics
        cache_types = {}
        for item in self._cache.values():
            cache_type = item['type']
            cache_types[cache_type] = cache_types.get(cache_type, 0) + 1
        
        status['cache_stats']['cache_types'] = cache_types
        
        return status
    
    def clear_cache(self, data_type: str = None) -> None:
        """Clear cache for specific data type or all cache"""
        
        if data_type:
            keys_to_remove = []
            for key, item in self._cache.items():
                if item['type'] == data_type:
                    keys_to_remove.append(key)
            
            for key in keys_to_remove:
                del self._cache[key]
                
            logger.info(f"Cleared {len(keys_to_remove)} items from {data_type} cache")
        else:
            self._cache.clear()
            logger.info("Cleared entire cache")