"""
Sports data caching models for SmartBets 2.0
Provides persistent storage for sports data to reduce API calls and improve performance
"""

import sqlite3
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging

logger = logging.getLogger(__name__)

class SportsDataCache:
    """
    SQLite-based caching system for sports data
    Stores games, odds, and sports metadata with automatic expiration
    """
    
    def __init__(self, db_path: str = "sports_cache.db"):
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Initialize the cache database with required tables"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                
                # Sports metadata table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS sports_metadata (
                        sport_key TEXT PRIMARY KEY,
                        sport_name TEXT NOT NULL,
                        active BOOLEAN NOT NULL,
                        season_status TEXT,
                        last_updated TIMESTAMP NOT NULL,
                        expires_at TIMESTAMP NOT NULL
                    )
                ''')
                
                # Games cache table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS games_cache (
                        game_id TEXT PRIMARY KEY,
                        sport_key TEXT NOT NULL,
                        home_team TEXT NOT NULL,
                        away_team TEXT NOT NULL,
                        commence_time TIMESTAMP NOT NULL,
                        game_data TEXT NOT NULL,
                        last_updated TIMESTAMP NOT NULL,
                        expires_at TIMESTAMP NOT NULL,
                        FOREIGN KEY (sport_key) REFERENCES sports_metadata (sport_key)
                    )
                ''')
                
                # Odds cache table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS odds_cache (
                        odds_id TEXT PRIMARY KEY,
                        game_id TEXT NOT NULL,
                        sportsbook TEXT NOT NULL,
                        odds_data TEXT NOT NULL,
                        last_updated TIMESTAMP NOT NULL,
                        expires_at TIMESTAMP NOT NULL,
                        FOREIGN KEY (game_id) REFERENCES games_cache (game_id)
                    )
                ''')
                
                # Cache statistics table
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS cache_stats (
                        stat_key TEXT PRIMARY KEY,
                        stat_value TEXT NOT NULL,
                        last_updated TIMESTAMP NOT NULL
                    )
                ''')
                
                # Create indexes for better performance
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_games_sport ON games_cache (sport_key)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_games_time ON games_cache (commence_time)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_odds_game ON odds_cache (game_id)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_expires ON games_cache (expires_at)')
                
                conn.commit()
                logger.info("Database initialized successfully")
                
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    def cache_sports_metadata(self, sports_data: List[Dict], cache_duration_hours: int = 24):
        """Cache sports metadata with expiration"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                now = datetime.now()
                expires_at = now + timedelta(hours=cache_duration_hours)
                
                for sport in sports_data:
                    cursor.execute('''
                        INSERT OR REPLACE INTO sports_metadata 
                        (sport_key, sport_name, active, season_status, last_updated, expires_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        sport['key'],
                        sport['name'],
                        sport['active'],
                        sport.get('season_status', 'unknown'),
                        now,
                        expires_at
                    ))
                
                conn.commit()
                logger.info(f"Cached {len(sports_data)} sports metadata entries")
                
        except Exception as e:
            logger.error(f"Failed to cache sports metadata: {e}")
    
    def get_cached_sports(self) -> Optional[List[Dict]]:
        """Retrieve cached sports metadata if not expired"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                now = datetime.now()
                
                cursor.execute('''
                    SELECT sport_key, sport_name, active, season_status, last_updated
                    FROM sports_metadata 
                    WHERE expires_at > ?
                    ORDER BY sport_name
                ''', (now,))
                
                rows = cursor.fetchall()
                if not rows:
                    return None
                
                sports_data = []
                for row in rows:
                    sports_data.append({
                        'key': row[0],
                        'name': row[1],
                        'active': bool(row[2]),
                        'season_status': row[3],
                        'last_updated': row[4]
                    })
                
                logger.info(f"Retrieved {len(sports_data)} cached sports")
                return sports_data
                
        except Exception as e:
            logger.error(f"Failed to retrieve cached sports: {e}")
            return None
    
    def cache_games_data(self, sport_key: str, games_data: List[Dict], cache_duration_minutes: int = 15):
        """Cache games data with short expiration for real-time updates"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                now = datetime.now()
                expires_at = now + timedelta(minutes=cache_duration_minutes)
                
                for game in games_data:
                    game_id = f"{sport_key}_{game.get('id', f'{game.get('home_team')}_{game.get('away_team')}')}_{game.get('commence_time')}"
                    
                    cursor.execute('''
                        INSERT OR REPLACE INTO games_cache 
                        (game_id, sport_key, home_team, away_team, commence_time, game_data, last_updated, expires_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        game_id,
                        sport_key,
                        game.get('home_team', 'Unknown'),
                        game.get('away_team', 'Unknown'),
                        game.get('commence_time', now.isoformat()),
                        json.dumps(game),
                        now,
                        expires_at
                    ))
                
                conn.commit()
                logger.info(f"Cached {len(games_data)} games for {sport_key}")
                
        except Exception as e:
            logger.error(f"Failed to cache games data: {e}")
    
    def get_cached_games(self, sport_key: str, limit: int = 10) -> Optional[List[Dict]]:
        """Retrieve cached games for a sport if not expired"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                now = datetime.now()
                
                cursor.execute('''
                    SELECT game_data, commence_time 
                    FROM games_cache 
                    WHERE sport_key = ? AND expires_at > ?
                    ORDER BY commence_time ASC
                    LIMIT ?
                ''', (sport_key, now, limit))
                
                rows = cursor.fetchall()
                if not rows:
                    return None
                
                games_data = []
                for row in rows:
                    try:
                        game_data = json.loads(row[0])
                        games_data.append(game_data)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON in cached game data")
                        continue
                
                logger.info(f"Retrieved {len(games_data)} cached games for {sport_key}")
                return games_data
                
        except Exception as e:
            logger.error(f"Failed to retrieve cached games: {e}")
            return None
    
    def cache_odds_data(self, game_id: str, odds_data: List[Dict], cache_duration_minutes: int = 5):
        """Cache odds data with very short expiration for real-time updates"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                now = datetime.now()
                expires_at = now + timedelta(minutes=cache_duration_minutes)
                
                for odds in odds_data:
                    odds_id = f"{game_id}_{odds.get('sportsbook', 'unknown')}_{int(time.time())}"
                    
                    cursor.execute('''
                        INSERT OR REPLACE INTO odds_cache 
                        (odds_id, game_id, sportsbook, odds_data, last_updated, expires_at)
                        VALUES (?, ?, ?, ?, ?, ?)
                    ''', (
                        odds_id,
                        game_id,
                        odds.get('sportsbook', 'unknown'),
                        json.dumps(odds),
                        now,
                        expires_at
                    ))
                
                conn.commit()
                logger.info(f"Cached {len(odds_data)} odds entries for game {game_id}")
                
        except Exception as e:
            logger.error(f"Failed to cache odds data: {e}")
    
    def cleanup_expired_cache(self):
        """Remove expired cache entries"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                now = datetime.now()
                
                # Clean up expired entries
                cursor.execute('DELETE FROM odds_cache WHERE expires_at < ?', (now,))
                odds_deleted = cursor.rowcount
                
                cursor.execute('DELETE FROM games_cache WHERE expires_at < ?', (now,))
                games_deleted = cursor.rowcount
                
                cursor.execute('DELETE FROM sports_metadata WHERE expires_at < ?', (now,))
                sports_deleted = cursor.rowcount
                
                conn.commit()
                
                if odds_deleted > 0 or games_deleted > 0 or sports_deleted > 0:
                    logger.info(f"Cleaned up expired cache: {odds_deleted} odds, {games_deleted} games, {sports_deleted} sports")
                    
        except Exception as e:
            logger.error(f"Failed to cleanup expired cache: {e}")
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                now = datetime.now()
                
                # Count active cache entries
                cursor.execute('SELECT COUNT(*) FROM sports_metadata WHERE expires_at > ?', (now,))
                active_sports = cursor.fetchone()[0]
                
                cursor.execute('SELECT COUNT(*) FROM games_cache WHERE expires_at > ?', (now,))
                active_games = cursor.fetchone()[0]
                
                cursor.execute('SELECT COUNT(*) FROM odds_cache WHERE expires_at > ?', (now,))
                active_odds = cursor.fetchone()[0]
                
                # Count total entries
                cursor.execute('SELECT COUNT(*) FROM sports_metadata')
                total_sports = cursor.fetchone()[0]
                
                cursor.execute('SELECT COUNT(*) FROM games_cache')
                total_games = cursor.fetchone()[0]
                
                cursor.execute('SELECT COUNT(*) FROM odds_cache')
                total_odds = cursor.fetchone()[0]
                
                return {
                    'active_entries': {
                        'sports': active_sports,
                        'games': active_games,
                        'odds': active_odds
                    },
                    'total_entries': {
                        'sports': total_sports,
                        'games': total_games,
                        'odds': total_odds
                    },
                    'cache_hit_ratio': {
                        'sports': (active_sports / max(total_sports, 1)) * 100,
                        'games': (active_games / max(total_games, 1)) * 100,
                        'odds': (active_odds / max(total_odds, 1)) * 100
                    },
                    'last_updated': now.isoformat()
                }
                
        except Exception as e:
            logger.error(f"Failed to get cache stats: {e}")
            return {}
    
    def is_cache_fresh(self, cache_type: str, sport_key: str = None) -> bool:
        """Check if cache is fresh for a given type and sport"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                cursor = conn.cursor()
                now = datetime.now()
                
                if cache_type == 'sports':
                    cursor.execute('SELECT COUNT(*) FROM sports_metadata WHERE expires_at > ?', (now,))
                elif cache_type == 'games' and sport_key:
                    cursor.execute('SELECT COUNT(*) FROM games_cache WHERE sport_key = ? AND expires_at > ?', (sport_key, now))
                else:
                    return False
                
                count = cursor.fetchone()[0]
                return count > 0
                
        except Exception as e:
            logger.error(f"Failed to check cache freshness: {e}")
            return False