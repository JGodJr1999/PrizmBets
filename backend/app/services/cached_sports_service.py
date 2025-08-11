"""
Cached Sports Service - Enhanced version with database caching
Integrates SportsDataCache for persistent storage and improved performance
"""

import os
import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

# Add required directories to path
sys.path.append(os.path.join(os.path.dirname(__file__)))
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'models'))

from comprehensive_sports_service import ComprehensiveSportsService
from sports_cache import SportsDataCache

logger = logging.getLogger(__name__)

class CachedSportsService(ComprehensiveSportsService):
    """
    Enhanced sports service with database caching layer
    Provides fallback mechanisms and persistent data storage
    """
    
    def __init__(self, cache_db_path: str = None):
        # Initialize parent class
        super().__init__()
        
        # Initialize database cache
        if cache_db_path is None:
            cache_db_path = os.path.join(os.path.dirname(__file__), '..', '..', 'sports_cache.db')
        
        self.db_cache = SportsDataCache(cache_db_path)
        
        # Cache configuration
        self.sports_cache_hours = 24      # Sports metadata cached for 24 hours
        self.games_cache_minutes = 15     # Games cached for 15 minutes  
        self.odds_cache_minutes = 5       # Odds cached for 5 minutes
        
        logger.info("CachedSportsService initialized with database caching")
    
    def get_available_sports(self) -> List[Dict]:
        """Get available sports with database caching fallback"""
        try:
            # Check database cache first
            cached_sports = self.db_cache.get_cached_sports()
            if cached_sports:
                logger.info(f"Using cached sports data ({len(cached_sports)} sports)")
                return cached_sports
            
            # Fallback to parent method (API or mock data)
            sports_data = super().get_available_sports()
            
            # Cache the fresh data
            if sports_data:
                self.db_cache.cache_sports_metadata(sports_data, self.sports_cache_hours)
            
            return sports_data
            
        except Exception as e:
            logger.error(f"Error in get_available_sports: {e}")
            
            # Emergency fallback to basic sports list
            return [
                {'key': 'nfl', 'name': 'NFL', 'active': True, 'season_status': 'active'},
                {'key': 'nba', 'name': 'NBA', 'active': True, 'season_status': 'active'},
                {'key': 'mlb', 'name': 'MLB', 'active': True, 'season_status': 'active'},
                {'key': 'nhl', 'name': 'NHL', 'active': True, 'season_status': 'active'}
            ]
    
    def get_live_odds(self, sport: str, limit: int = 10) -> Dict[str, Any]:
        """Get live odds with database caching and fallback"""
        try:
            # Check if we have fresh cached games
            cached_games = self.db_cache.get_cached_games(sport, limit)
            
            if cached_games:
                logger.info(f"Using cached games for {sport} ({len(cached_games)} games)")
                return {
                    'success': True,
                    'sport': sport,
                    'games': cached_games,
                    'total_games': len(cached_games),
                    'data_source': 'database_cache',
                    'cache_hit': True
                }
            
            # Get fresh data from parent method
            odds_data = super().get_live_odds(sport, limit)
            
            if odds_data.get('success') and odds_data.get('games'):
                # Cache the fresh games data
                self.db_cache.cache_games_data(sport, odds_data['games'], self.games_cache_minutes)
                odds_data['cache_hit'] = False
                return odds_data
            
            # If API fails, try to get any cached data (even expired)
            logger.warning(f"API failed for {sport}, checking for any cached data")
            
            # Check if we're in demo mode
            if not self.use_live_api:
                logger.info("Running in DEMO MODE - Using mock data. Get a free API key at https://the-odds-api.com/")
            
            # Get any cached data (ignoring expiration)
            fallback_games = self._get_fallback_cached_games(sport, limit)
            if fallback_games:
                return {
                    'success': True,
                    'sport': sport,
                    'games': fallback_games,
                    'total_games': len(fallback_games),
                    'data_source': 'expired_cache_fallback',
                    'cache_hit': True,
                    'warning': 'Using expired cached data due to API unavailability',
                    'demo_mode': False  # Don't show demo mode for cached real data
                }
            
            # Ultimate fallback to parent method's mock data
            return super().get_live_odds(sport, limit)
            
        except Exception as e:
            logger.error(f"Error in cached get_live_odds for {sport}: {e}")
            return super().get_live_odds(sport, limit)
    
    def get_all_games(self, limit_per_sport: int = 3, show_upcoming: bool = True) -> Dict[str, Any]:
        """Get all games with database caching"""
        try:
            all_games = []
            cache_hits = 0
            api_calls = 0
            
            sports_list = self.get_available_sports()
            active_sports = [s for s in sports_list if s.get('active', True)]
            
            for sport in active_sports:
                sport_key = sport['key']
                
                # Check cache first
                cached_games = self.db_cache.get_cached_games(sport_key, limit_per_sport)
                
                if cached_games:
                    cache_hits += 1
                    # Add sport metadata to games
                    for game in cached_games:
                        game['sport'] = sport_key
                        game['sport_name'] = sport['name']
                    all_games.extend(cached_games)
                else:
                    api_calls += 1
                    # Get fresh data
                    sport_data = self.get_live_odds(sport_key, limit_per_sport)
                    if sport_data.get('success') and sport_data.get('games'):
                        for game in sport_data['games']:
                            game['sport'] = sport_key
                            game['sport_name'] = sport['name']
                        all_games.extend(sport_data['games'])
            
            # Sort all games by commence time
            all_games.sort(key=lambda x: x.get('commence_time', '9999-12-31T23:59:59Z'))
            
            return {
                'success': True,
                'games': all_games,
                'total_games': len(all_games),
                'sports_checked': len(active_sports),
                'cache_performance': {
                    'cache_hits': cache_hits,
                    'api_calls': api_calls,
                    'cache_hit_ratio': f"{(cache_hits / max(len(active_sports), 1)) * 100:.1f}%"
                },
                'data_source': 'cached_comprehensive'
            }
            
        except Exception as e:
            logger.error(f"Error in cached get_all_games: {e}")
            return super().get_all_games(limit_per_sport, show_upcoming)
    
    def get_odds_comparison(self, sport: str, limit: int = 10) -> Dict[str, Any]:
        """Get odds comparison with enhanced caching"""
        try:
            # Get games data (which will use caching)
            games_data = self.get_live_odds(sport, limit)
            
            if not games_data.get('success') or not games_data.get('games'):
                return {
                    'success': False,
                    'error': f'No games data available for {sport}',
                    'odds_comparison': [],
                    'data_source': 'cache_fallback'
                }
            
            # Build odds comparison from games data
            odds_comparison = []
            
            for game in games_data['games']:
                game_comparison = {
                    'game_id': game.get('id', f"{sport}_{len(odds_comparison)}"),
                    'home_team': game.get('home_team', 'Unknown'),
                    'away_team': game.get('away_team', 'Unknown'),
                    'commence_time': game.get('commence_time'),
                    'sportsbooks': game.get('sportsbooks', {}),
                    'best_home_odds': None,
                    'best_away_odds': None,
                    'best_home_book': None,
                    'best_away_book': None
                }
                
                # Find best odds across sportsbooks
                best_home_price = -999999
                best_away_price = -999999
                
                for book, odds in game.get('sportsbooks', {}).items():
                    home_odds = odds.get('home')
                    away_odds = odds.get('away')
                    
                    if home_odds and home_odds > best_home_price:
                        best_home_price = home_odds
                        game_comparison['best_home_odds'] = home_odds
                        game_comparison['best_home_book'] = book
                    
                    if away_odds and away_odds > best_away_price:
                        best_away_price = away_odds
                        game_comparison['best_away_odds'] = away_odds
                        game_comparison['best_away_book'] = book
                
                odds_comparison.append(game_comparison)
            
            return {
                'success': True,
                'sport': sport,
                'odds_comparison': odds_comparison,
                'total_games': len(odds_comparison),
                'data_source': games_data.get('data_source', 'cached'),
                'cache_hit': games_data.get('cache_hit', False)
            }
            
        except Exception as e:
            logger.error(f"Error in cached odds comparison for {sport}: {e}")
            return super().get_odds_comparison(sport, limit)
    
    def _get_fallback_cached_games(self, sport_key: str, limit: int) -> Optional[List[Dict]]:
        """Get cached games ignoring expiration (emergency fallback)"""
        try:
            import sqlite3
            with sqlite3.connect(self.db_cache.db_path) as conn:
                cursor = conn.cursor()
                
                cursor.execute('''
                    SELECT game_data 
                    FROM games_cache 
                    WHERE sport_key = ?
                    ORDER BY last_updated DESC
                    LIMIT ?
                ''', (sport_key, limit))
                
                rows = cursor.fetchall()
                if not rows:
                    return None
                
                games_data = []
                for row in rows:
                    try:
                        import json
                        game_data = json.loads(row[0])
                        games_data.append(game_data)
                    except json.JSONDecodeError:
                        continue
                
                logger.info(f"Retrieved {len(games_data)} fallback cached games for {sport_key}")
                return games_data if games_data else None
                
        except Exception as e:
            logger.error(f"Failed to retrieve fallback cached games: {e}")
            return None
    
    def get_cache_statistics(self) -> Dict[str, Any]:
        """Get comprehensive cache statistics"""
        try:
            stats = self.db_cache.get_cache_stats()
            
            # Add service-specific stats
            stats['service_info'] = {
                'cache_enabled': True,
                'live_api_enabled': self.use_live_api,
                'cache_configuration': {
                    'sports_cache_hours': self.sports_cache_hours,
                    'games_cache_minutes': self.games_cache_minutes,
                    'odds_cache_minutes': self.odds_cache_minutes
                }
            }
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting cache statistics: {e}")
            return {'error': str(e)}
    
    def cleanup_cache(self):
        """Clean up expired cache entries"""
        try:
            self.db_cache.cleanup_expired_cache()
            logger.info("Cache cleanup completed")
        except Exception as e:
            logger.error(f"Cache cleanup failed: {e}")
    
    def invalidate_cache(self, cache_type: str = 'all', sport_key: str = None):
        """Manually invalidate cache entries"""
        try:
            if cache_type == 'all':
                # Invalidate all cache entries by setting expiration to past
                import sqlite3
                from datetime import datetime
                
                past_time = datetime.now() - timedelta(hours=1)
                
                with sqlite3.connect(self.db_cache.db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute('UPDATE sports_metadata SET expires_at = ?', (past_time,))
                    cursor.execute('UPDATE games_cache SET expires_at = ?', (past_time,))
                    cursor.execute('UPDATE odds_cache SET expires_at = ?', (past_time,))
                    conn.commit()
                    
                logger.info("All cache entries invalidated")
                
            elif cache_type == 'games' and sport_key:
                import sqlite3
                past_time = datetime.now() - timedelta(hours=1)
                
                with sqlite3.connect(self.db_cache.db_path) as conn:
                    cursor = conn.cursor()
                    cursor.execute('UPDATE games_cache SET expires_at = ? WHERE sport_key = ?', (past_time, sport_key))
                    conn.commit()
                    
                logger.info(f"Games cache invalidated for {sport_key}")
                
        except Exception as e:
            logger.error(f"Cache invalidation failed: {e}")
    
    def warmup_cache(self):
        """Pre-populate cache with fresh data"""
        try:
            logger.info("Starting cache warmup...")
            
            # Warmup sports metadata
            sports_data = self.get_available_sports()
            logger.info(f"Warmed up {len(sports_data)} sports")
            
            # Warmup games for active sports
            active_sports = [s for s in sports_data if s.get('active', True)]
            warmed_sports = 0
            
            for sport in active_sports[:5]:  # Limit to prevent API exhaustion
                sport_key = sport['key']
                games_data = self.get_live_odds(sport_key, 5)
                if games_data.get('success'):
                    warmed_sports += 1
                    
            logger.info(f"Cache warmup completed: {warmed_sports} sports warmed up")
            
        except Exception as e:
            logger.error(f"Cache warmup failed: {e}")