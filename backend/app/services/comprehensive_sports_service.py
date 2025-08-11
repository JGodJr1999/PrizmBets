"""
Comprehensive Sports Service - Unified service for all sports data
Replaces the separate comprehensive_odds_api.py with proper integration
"""

import requests
import os
import sys
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import logging
import random
from dotenv import load_dotenv

# Import our live sports agent
try:
    sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', 'agents'))
    from subagents.live_sports_subagent import create_live_sports_processor
except ImportError:
    create_live_sports_processor = None

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

class ComprehensiveSportsService:
    """Unified sports service for accurate, live sports data"""
    
    def __init__(self):
        # The Odds API configuration
        self.odds_api_key = os.environ.get('ODDS_API_KEY', 'demo_key')
        self.odds_api_base = 'https://api.the-odds-api.com/v4'
        self.api_timeout = 10
        self.use_live_api = bool(self.odds_api_key and self.odds_api_key != 'demo_key' and self.odds_api_key != 'demo_key_for_testing' and len(self.odds_api_key) > 10)
        
        # Simple in-memory cache for API data
        self.cache_duration = 300  # 5 minutes
        self.data_cache = {}
        
        # Initialize live sports agent
        self.live_sports_agent = None
        if create_live_sports_processor:
            try:
                self.live_sports_agent = create_live_sports_processor()
                asyncio.create_task(self.live_sports_agent.initialize())
                logger.info("Live Sports Agent initialized successfully")
            except Exception as e:
                logger.warning(f"Could not initialize Live Sports Agent: {e}")
                self.live_sports_agent = None
        self.cache_timestamps = {}
        
        # Sport season calendars with automatic date-based detection
        self.sport_calendars = {
            'nfl': {
                'key': 'americanfootball_nfl', 
                'name': 'NFL',
                'regular_season': {'start': (9, 5), 'end': (1, 15)},  # Sep 5 - Jan 15
                'playoffs': {'start': (1, 15), 'end': (2, 15)},       # Jan 15 - Feb 15
                'preseason': {'start': (8, 1), 'end': (9, 5)},        # Aug 1 - Sep 5
                'offseason': {'start': (2, 15), 'end': (8, 1)}        # Feb 15 - Aug 1
            },
            'nba': {
                'key': 'basketball_nba', 
                'name': 'NBA',
                'regular_season': {'start': (10, 15), 'end': (4, 15)}, # Oct 15 - Apr 15
                'playoffs': {'start': (4, 15), 'end': (6, 20)},        # Apr 15 - Jun 20
                'preseason': {'start': (10, 1), 'end': (10, 15)},      # Oct 1 - Oct 15
                'offseason': {'start': (6, 20), 'end': (10, 1)}        # Jun 20 - Oct 1
            },
            'wnba': {
                'key': 'basketball_wnba', 
                'name': 'WNBA',
                'regular_season': {'start': (5, 15), 'end': (9, 15)},  # May 15 - Sep 15
                'playoffs': {'start': (9, 15), 'end': (10, 15)},       # Sep 15 - Oct 15
                'preseason': {'start': (5, 1), 'end': (5, 15)},        # May 1 - May 15
                'offseason': {'start': (10, 15), 'end': (5, 1)}        # Oct 15 - May 1
            },
            'mlb': {
                'key': 'baseball_mlb', 
                'name': 'MLB',
                'regular_season': {'start': (3, 28), 'end': (10, 1)},  # Mar 28 - Oct 1
                'playoffs': {'start': (10, 1), 'end': (11, 1)},        # Oct 1 - Nov 1
                'preseason': {'start': (2, 15), 'end': (3, 28)},       # Feb 15 - Mar 28
                'offseason': {'start': (11, 1), 'end': (2, 15)}        # Nov 1 - Feb 15
            },
            'nhl': {
                'key': 'icehockey_nhl', 
                'name': 'NHL',
                'regular_season': {'start': (10, 10), 'end': (4, 20)}, # Oct 10 - Apr 20
                'playoffs': {'start': (4, 20), 'end': (6, 30)},        # Apr 20 - Jun 30
                'preseason': {'start': (9, 15), 'end': (10, 10)},      # Sep 15 - Oct 10
                'offseason': {'start': (6, 30), 'end': (9, 15)}        # Jun 30 - Sep 15
            },
            'ncaaf': {
                'key': 'americanfootball_ncaaf', 
                'name': 'College Football',
                'regular_season': {'start': (8, 25), 'end': (12, 10)}, # Aug 25 - Dec 10
                'playoffs': {'start': (12, 10), 'end': (1, 10)},       # Dec 10 - Jan 10
                'preseason': {'start': (8, 1), 'end': (8, 25)},        # Aug 1 - Aug 25
                'offseason': {'start': (1, 10), 'end': (8, 1)}         # Jan 10 - Aug 1
            },
            'ncaab': {
                'key': 'basketball_ncaab', 
                'name': 'College Basketball',
                'regular_season': {'start': (11, 1), 'end': (3, 10)},  # Nov 1 - Mar 10
                'playoffs': {'start': (3, 10), 'end': (4, 10)},        # Mar 10 - Apr 10 (March Madness)
                'preseason': {'start': (10, 15), 'end': (11, 1)},      # Oct 15 - Nov 1
                'offseason': {'start': (4, 10), 'end': (10, 15)}       # Apr 10 - Oct 15
            },
            'soccer': {
                'key': 'soccer_epl', 
                'name': 'Premier League',
                'regular_season': {'start': (8, 15), 'end': (5, 25)},  # Aug 15 - May 25
                'playoffs': {'start': (5, 25), 'end': (6, 10)},        # May 25 - Jun 10
                'preseason': {'start': (7, 15), 'end': (8, 15)},       # Jul 15 - Aug 15
                'offseason': {'start': (6, 10), 'end': (7, 15)}        # Jun 10 - Jul 15
            },
            'mma': {
                'key': 'mma_mixed_martial_arts', 
                'name': 'MMA/UFC',
                'regular_season': {'start': (1, 1), 'end': (12, 31)},  # Year-round
                'playoffs': {'start': (1, 1), 'end': (1, 1)},          # No traditional playoffs
                'preseason': {'start': (1, 1), 'end': (1, 1)},         # No preseason
                'offseason': {'start': (1, 1), 'end': (1, 1)}          # No offseason
            },
            'tennis': {
                'key': 'tennis_atp', 
                'name': 'Tennis ATP',
                'regular_season': {'start': (1, 1), 'end': (11, 15)},  # Jan 1 - Nov 15
                'playoffs': {'start': (11, 15), 'end': (11, 30)},      # Nov 15 - Nov 30 (ATP Finals)
                'preseason': {'start': (12, 15), 'end': (1, 1)},       # Dec 15 - Jan 1
                'offseason': {'start': (11, 30), 'end': (12, 15)}      # Nov 30 - Dec 15
            },
            'golf': {
                'key': 'golf_pga_championship', 
                'name': 'PGA Golf',
                'regular_season': {'start': (1, 1), 'end': (12, 31)},  # Year-round
                'playoffs': {'start': (8, 15), 'end': (9, 15)},        # Aug 15 - Sep 15 (FedEx Cup)
                'preseason': {'start': (1, 1), 'end': (1, 1)},         # No traditional preseason
                'offseason': {'start': (1, 1), 'end': (1, 1)}          # No traditional offseason
            }
        }

        # Initialize available sports with current season status
        self.available_sports = self._get_available_sports()
        
        logger.info(f"Comprehensive Sports Service initialized - Live API: {self.use_live_api}")

    def _make_odds_api_request(self, endpoint: str, params: Dict = None) -> Optional[List[Dict]]:
        """Make request to The Odds API with proper error handling"""
        if not self.use_live_api:
            logger.info("No live API access - no valid API key")
            return None
            
        url = f"{self.odds_api_base}/{endpoint}"
        
        if params is None:
            params = {}
            
        params['apiKey'] = self.odds_api_key
        params['regions'] = 'us'
        params['markets'] = 'h2h'  # Moneyline bets
        params['oddsFormat'] = 'american'
        params['dateFormat'] = 'iso'
        
        try:
            response = requests.get(url, params=params, timeout=self.api_timeout)
            response.raise_for_status()
            
            # Log remaining API calls for monitoring
            remaining_calls = response.headers.get('x-requests-remaining')
            if remaining_calls:
                logger.info(f"The Odds API calls remaining: {remaining_calls}")
            
            data = response.json()
            logger.info(f"Successfully fetched {len(data)} games from The Odds API")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"The Odds API request failed: {str(e)}")
            return None
        except ValueError as e:
            logger.error(f"JSON decode error from The Odds API: {str(e)}")
            return None

    def _make_scores_api_request(self, endpoint: str, params: Dict = None) -> Optional[List[Dict]]:
        """Make request to The Odds API for scores and live data"""
        if not self.use_live_api:
            return None
            
        url = f"{self.odds_api_base}/{endpoint}"
        
        if params is None:
            params = {}
            
        params['apiKey'] = self.odds_api_key
        params['daysFrom'] = 1  # Get games from yesterday to catch live games
        
        try:
            response = requests.get(url, params=params, timeout=self.api_timeout)
            response.raise_for_status()
            
            data = response.json()
            logger.info(f"Successfully fetched {len(data)} game scores from The Odds API")
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"The Odds API scores request failed: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error in scores API request: {str(e)}")
            return None
    
    def _enhance_with_live_data(self, games: List[Dict], sport: str) -> List[Dict]:
        """Enhance game data with live scores using our agent system"""
        logger.info(f"_enhance_with_live_data called for {sport} with {len(games)} games")
        if not self.live_sports_agent:
            logger.info(f"No live_sports_agent available, returning games without live_data")
            # No agent available - return games as-is without adding fake data
            return games
            
        try:
            # Fetch live scores from API
            sport_mapping = {
                'nfl': 'americanfootball_nfl',
                'nba': 'basketball_nba', 
                'mlb': 'baseball_mlb',
                'nhl': 'icehockey_nhl',
                'wnba': 'basketball_wnba',
                'ncaaf': 'americanfootball_ncaaf',
                'ncaab': 'basketball_ncaab',
                'soccer': 'soccer_epl'
            }
            
            api_sport = sport_mapping.get(sport, sport)
            live_scores = self._make_scores_api_request(f"sports/{api_sport}/scores")
            
            if not live_scores:
                # No live scores available - return games without live_data
                logger.info(f"No live scores available for {sport}, returning games without live_data")
                return games
            
            # Create a lookup for live data by game teams
            live_data_lookup = {}
            for score_data in live_scores:
                home_team = score_data.get('home_team', '')
                away_team = score_data.get('away_team', '')
                key = f"{home_team.lower()}-{away_team.lower()}"
                live_data_lookup[key] = score_data
            
            # Enhance games with live data
            enhanced_games = []
            for i, game in enumerate(games):
                home_team = game.get('home_team', '')
                away_team = game.get('away_team', '')
                key = f"{home_team.lower()}-{away_team.lower()}"
                
                # Check if we have live data for this game
                if key in live_data_lookup:
                    live_data = live_data_lookup[key]
                    
                    # Add live data to the game
                    enhanced_game = {**game}
                    enhanced_game['live_data'] = {
                        'status': 'final' if live_data.get('completed', False) else ('live' if not live_data.get('completed', True) else 'scheduled'),
                        'home_score': live_data.get('scores', [{}])[0].get('score') if live_data.get('scores') else None,
                        'away_score': live_data.get('scores', [{}])[1].get('score') if len(live_data.get('scores', [])) > 1 else None,
                        'last_updated': live_data.get('last_update', datetime.utcnow().isoformat() + 'Z')
                    }
                    
                    # Add sport-specific live information
                    if sport in ['nfl', 'ncaaf'] and 'scores' in live_data:
                        enhanced_game['live_data'].update({
                            'quarter': f"Q{live_data.get('period', 1)}" if live_data.get('period', 1) <= 4 else 'OT',
                            'time_remaining': live_data.get('display_clock', '15:00')
                        })
                    elif sport in ['nba', 'wnba', 'ncaab'] and 'scores' in live_data:
                        enhanced_game['live_data'].update({
                            'quarter': f"Q{live_data.get('period', 1)}" if live_data.get('period', 1) <= 4 else 'OT',
                            'time_remaining': live_data.get('display_clock', '12:00')
                        })
                    elif sport == 'mlb' and 'scores' in live_data:
                        enhanced_game['live_data'].update({
                            'inning': live_data.get('period', 1),
                            'inning_half': 'bottom' if live_data.get('period_name', '').lower().startswith('b') else 'top'
                        })
                    elif sport == 'nhl' and 'scores' in live_data:
                        enhanced_game['live_data'].update({
                            'period': f"P{live_data.get('period', 1)}" if live_data.get('period', 1) <= 3 else 'OT',
                            'time_remaining': live_data.get('display_clock', '20:00')
                        })
                    
                    enhanced_games.append(enhanced_game)
                else:
                    enhanced_games.append(game)
            
            return enhanced_games
            
        except Exception as e:
            logger.error(f"Error enhancing games with live data: {e}")
            return games


    def _is_cache_valid(self, cache_key: str) -> bool:
        """Check if cached data is still valid"""
        if cache_key not in self.cache_timestamps:
            return False
        
        cache_time = self.cache_timestamps[cache_key]
        current_time = datetime.utcnow().timestamp()
        
        return (current_time - cache_time) < self.cache_duration

    def _get_cached_data(self, cache_key: str) -> Optional[List[Dict]]:
        """Get data from cache if valid"""
        if self._is_cache_valid(cache_key):
            logger.info(f"Using cached data for {cache_key}")
            return self.data_cache.get(cache_key)
        return None

    def _cache_data(self, cache_key: str, data: List[Dict]) -> None:
        """Cache data with timestamp"""
        self.data_cache[cache_key] = data
        self.cache_timestamps[cache_key] = datetime.utcnow().timestamp()
        logger.info(f"Cached {len(data)} games for {cache_key}")

    def _fetch_live_odds_data(self, sport_key: str) -> Optional[List[Dict]]:
        """Fetch live odds data from The Odds API with caching"""
        if sport_key not in self.sport_calendars:
            return None
        
        cache_key = f"live_odds_{sport_key}"
        
        # Check cache first
        cached_data = self._get_cached_data(cache_key)
        if cached_data:
            return cached_data
            
        api_sport_key = self.sport_calendars[sport_key]['key']
        endpoint = f"sports/{api_sport_key}/odds"
        
        live_data = self._make_odds_api_request(endpoint)
        
        # Cache the data if successful
        if live_data:
            self._cache_data(cache_key, live_data)
        
        return live_data

    def _convert_api_data_to_standard_format(self, api_data: List[Dict], sport_key: str) -> List[Dict]:
        """Convert The Odds API data to our standard format"""
        standard_games = []
        
        for game in api_data:
            try:
                # Extract basic game info
                game_id = game.get('id', f'{sport_key}_live_{len(standard_games)}')
                home_team = game.get('home_team', 'Unknown Home')
                away_team = game.get('away_team', 'Unknown Away')
                commence_time = game.get('commence_time', datetime.utcnow().isoformat() + 'Z')
                
                # Parse sportsbook odds
                sportsbooks = {}
                
                for bookmaker in game.get('bookmakers', []):
                    book_key = bookmaker.get('key', 'unknown')
                    
                    # Only include supported sportsbooks
                    supported_books = ['draftkings', 'fanduel', 'betmgm', 'caesars', 'betrivers', 'espnbet']
                    if book_key not in supported_books:
                        continue
                        
                    for market in bookmaker.get('markets', []):
                        if market.get('key') == 'h2h':  # Moneyline
                            outcomes = market.get('outcomes', [])
                            
                            home_odds = None
                            away_odds = None
                            
                            for outcome in outcomes:
                                if outcome.get('name') == home_team:
                                    home_odds = outcome.get('price')
                                elif outcome.get('name') == away_team:
                                    away_odds = outcome.get('price')
                            
                            if home_odds is not None and away_odds is not None:
                                sportsbooks[book_key] = {
                                    'moneyline': {
                                        'home': home_odds,
                                        'away': away_odds
                                    }
                                }
                
                # Only include games with odds from at least one sportsbook
                if sportsbooks:
                    standard_games.append({
                        'id': game_id,
                        'sport': sport_key,
                        'home_team': home_team,
                        'away_team': away_team,
                        'commence_time': commence_time,
                        'status': 'scheduled',
                        'sportsbooks': sportsbooks,
                        'data_source': 'live_api'
                    })
                    
            except Exception as e:
                logger.error(f"Error processing game data: {str(e)}")
                continue
        
        # Sort by start time
        standard_games.sort(key=lambda x: x['commence_time'])
        return standard_games

    def _get_current_season_status(self, sport_key: str, current_date: datetime = None) -> str:
        """Automatically determine current season status based on date - temporarily defaulting to active for testing"""
        if current_date is None:
            current_date = datetime.utcnow()
        
        # Temporarily default all sports to active for testing live data
        # This will show games for all sports regardless of season
        if self.use_live_api:
            return 'active'
            
        if sport_key not in self.sport_calendars:
            return 'active'  # Default to active for unknown sports
        
        calendar = self.sport_calendars[sport_key]
        current_month = current_date.month
        current_day = current_date.day
        
        # Check each season period
        for season_type in ['regular_season', 'playoffs', 'preseason', 'offseason']:
            if season_type not in calendar:
                continue
                
            start_month, start_day = calendar[season_type]['start']
            end_month, end_day = calendar[season_type]['end']
            
            # Handle seasons that cross year boundaries
            if start_month <= end_month:
                # Same calendar year (e.g., May to September)
                if (current_month > start_month or (current_month == start_month and current_day >= start_day)) and \
                   (current_month < end_month or (current_month == end_month and current_day <= end_day)):
                    return 'active' if season_type in ['regular_season', 'playoffs'] else season_type
            else:
                # Crosses year boundary (e.g., October to April)
                if (current_month > start_month or (current_month == start_month and current_day >= start_day)) or \
                   (current_month < end_month or (current_month == end_month and current_day <= end_day)):
                    return 'active' if season_type in ['regular_season', 'playoffs'] else season_type
        
        return 'active'  # Default fallback

    def _get_available_sports(self) -> Dict[str, Any]:
        """Generate sports list with current season status"""
        sports = {}
        for sport_key, calendar in self.sport_calendars.items():
            current_status = self._get_current_season_status(sport_key)
            sports[sport_key] = {
                'key': calendar['key'],
                'name': calendar['name'],
                'season': current_status,
                'last_updated': datetime.utcnow().isoformat()
            }
        return sports

    def get_available_sports(self) -> List[Dict[str, Any]]:
        """Get comprehensive list of supported sports with current season status"""
        sports_list = []
        for key, info in self.available_sports.items():
            sports_list.append({
                'key': key,
                'name': info['name'],
                'active': info['season'] == 'active',
                'season_status': info['season'],
                'has_live_games': True,
                'has_upcoming_games': True
            })
        
        return sports_list

    def _generate_accurate_games(self, sport_key: str, count: int = 5) -> List[Dict[str, Any]]:
        """Generate accurate games with real team names and proper scheduling, preferring live API data"""
        
        # Try to fetch live data first
        if self.use_live_api:
            logger.info(f"Attempting to fetch live data for {sport_key}")
            live_data = self._fetch_live_odds_data(sport_key)
            if live_data:
                converted_games = self._convert_api_data_to_standard_format(live_data, sport_key)
                if converted_games:
                    logger.info(f"Using {len(converted_games)} live games for {sport_key}")
                    return converted_games[:count]
                else:
                    logger.warning(f"No valid games from API data for {sport_key}")
            else:
                logger.warning(f"Failed to fetch live data for {sport_key}, returning empty array")
        
        # No mock data generation - return empty array when API fails
        logger.info(f"No live data available for {sport_key}, returning empty array")
        return []

    def get_all_games(self, limit_per_sport: int = 3, show_upcoming: bool = True) -> Dict[str, Any]:
        """Get games from all sports combined with accurate data"""
        try:
            all_games = []
            sports_summary = {}
            
            for sport_key, sport_info in self.available_sports.items():
                try:
                    if sport_info['season'] != 'active':
                        continue  # Skip inactive seasons
                        
                    games = self._generate_accurate_games(sport_key, limit_per_sport)
                    
                    # Enhance with live data 
                    logger.info(f"Calling _enhance_with_live_data for {sport_key} with {len(games)} games")
                    games = self._enhance_with_live_data(games, sport_key)
                    logger.info(f"After enhancement: {len(games)} games, checking for live_data...")
                    
                    if not show_upcoming:
                        # Filter to live games only
                        games = [g for g in games if g['status'] == 'live' or 
                                (g.get('live_data', {}).get('status') == 'live') or
                                datetime.fromisoformat(g['commence_time'].replace('Z', '')) < 
                                datetime.utcnow() + timedelta(hours=3)]
                    
                    all_games.extend(games)
                    sports_summary[sport_key] = {
                        'name': sport_info['name'],
                        'games_count': len(games),
                        'season_status': sport_info['season']
                    }
                except Exception as sport_error:
                    logger.error(f"Error processing sport {sport_key}: {str(sport_error)}")
                    continue
            
            # Sort all games by start time chronologically
            if all_games:
                all_games.sort(key=lambda x: x.get('commence_time', ''))
            
            return {
                'success': True,
                'games': all_games,
                'total_games': len(all_games),
                'sports_included': len(sports_summary),
                'sports_summary': sports_summary,
                'show_upcoming': show_upcoming,
                'data_source': 'live_api' if self.use_live_api else 'no_data',
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"All games error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to fetch all games: {str(e)}',
                'games': [],
                'total_games': 0
            }

    def get_live_odds(self, sport: str, limit: int = 10) -> Dict[str, Any]:
        """Get live odds for a specific sport with accurate team names"""
        try:
            if sport.lower() not in self.sport_calendars:
                return {
                    'success': False,
                    'error': f'Unsupported sport: {sport}',
                    'games': []
                }
            
            # Get real-time season status
            season_status = self._get_current_season_status(sport.lower())
            sport_info = self.sport_calendars[sport.lower()]
            
            # Check if sport is out of season - show appropriate message
            if season_status in ['offseason', 'preseason']:
                return {
                    'success': True,
                    'sport': sport_info['name'],
                    'sport_key': sport.lower(),
                    'games': [],
                    'total_games': 0,
                    'season_status': season_status,
                    'season_message': self._get_season_message(sport_info['name'], season_status),
                    'data_source': 'season_status_check',
                    'last_updated': datetime.utcnow().isoformat()
                }
            
            # Generate accurate games for active season
            games = self._generate_accurate_games(sport.lower(), min(limit, 10))
            
            # Enhance games with live scores and status
            enhanced_games = self._enhance_with_live_data(games, sport.lower())
            
            # Filter to show only live/starting soon games
            live_games = [g for g in enhanced_games if g['status'] == 'live' or 
                         (g.get('live_data', {}).get('status') == 'live') or
                         datetime.fromisoformat(g['commence_time'].replace('Z', '')) < 
                         datetime.utcnow() + timedelta(hours=3)]
            
            return {
                'success': True,
                'sport': sport_info['name'],
                'sport_key': sport.lower(),
                'games': live_games,
                'total_games': len(live_games),
                'data_source': 'live_api' if self.use_live_api else 'no_data',
                'last_updated': datetime.utcnow().isoformat(),
                'season_status': season_status
            }
            
        except Exception as e:
            logger.error(f'Failed to fetch live odds for {sport}: {str(e)}')
            return {
                'success': False,
                'error': f'Failed to fetch live odds: {str(e)}',
                'games': []
            }

    def get_upcoming_games(self, sport: str, days_ahead: int = 7, limit: int = 20) -> Dict[str, Any]:
        """Get upcoming games for a specific sport in chronological order"""
        try:
            if sport.lower() not in self.available_sports:
                return {
                    'success': False,
                    'error': f'Unsupported sport: {sport}',
                    'games': []
                }
            
            # Generate games for upcoming days
            all_games = self._generate_accurate_games(sport.lower(), min(limit, 25))
            
            # Filter for upcoming games (not live/starting soon)
            cutoff_time = datetime.utcnow() + timedelta(hours=3)
            upcoming_games = [g for g in all_games if 
                             datetime.fromisoformat(g['commence_time'].replace('Z', '')) > cutoff_time and
                             datetime.fromisoformat(g['commence_time'].replace('Z', '')) < 
                             datetime.utcnow() + timedelta(days=days_ahead)]
            
            # Sort by game time chronologically
            upcoming_games.sort(key=lambda x: x['commence_time'])
            
            return {
                'success': True,
                'sport': self.available_sports[sport.lower()]['name'],
                'sport_key': sport.lower(),
                'games': upcoming_games,
                'total_upcoming': len(upcoming_games),
                'days_ahead': days_ahead,
                'data_source': 'accurate_schedule_data',
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f'Failed to fetch upcoming games for {sport}: {str(e)}')
            return {
                'success': False,
                'error': f'Failed to fetch upcoming games: {str(e)}',
                'games': []
            }

    def get_odds_comparison(self, sport: str, limit: int = 10) -> Dict[str, Any]:
        """Get comprehensive odds comparison for a sport with accurate data"""
        try:
            if sport.lower() not in self.sport_calendars:
                return {
                    'success': False,
                    'error': f'Unsupported sport: {sport}',
                    'games': []
                }
            
            # Get real-time season status
            season_status = self._get_current_season_status(sport.lower())
            sport_info = self.sport_calendars[sport.lower()]
            
            # Check if sport is out of season
            if season_status in ['offseason', 'preseason']:
                return {
                    'success': True,
                    'sport': sport_info['name'],
                    'sport_key': sport.lower(),
                    'games': [],
                    'season_status': season_status,
                    'season_message': self._get_season_message(sport_info['name'], season_status),
                    'comparison_summary': {
                        'total_games': 0,
                        'season_note': f'{sport_info["name"]} is currently in {season_status}'
                    },
                    'data_source': 'season_status_check',
                    'last_updated': datetime.utcnow().isoformat()
                }
            
            games = self._generate_accurate_games(sport.lower(), limit)
            
            # Sort games chronologically from soonest to latest
            games.sort(key=lambda x: x['commence_time'])
            
            # Add best odds analysis for each game
            for game in games:
                # Find best moneyline odds for each team
                home_odds = []
                away_odds = []
                
                for book_name, book_odds in game['sportsbooks'].items():
                    if 'moneyline' in book_odds:
                        if 'home' in book_odds['moneyline']:
                            home_odds.append((book_name, book_odds['moneyline']['home']))
                        if 'away' in book_odds['moneyline']:
                            away_odds.append((book_name, book_odds['moneyline']['away']))
                
                # Find best odds (highest positive or least negative)
                if home_odds:
                    best_home = max(home_odds, key=lambda x: x[1]) if any(odd[1] > 0 for odd in home_odds) else min(home_odds, key=lambda x: abs(x[1]))
                    game['best_home_odds'] = {'sportsbook': best_home[0], 'odds': best_home[1]}
                
                if away_odds:
                    best_away = max(away_odds, key=lambda x: x[1]) if any(odd[1] > 0 for odd in away_odds) else min(away_odds, key=lambda x: abs(x[1]))
                    game['best_away_odds'] = {'sportsbook': best_away[0], 'odds': best_away[1]}
            
            return {
                'success': True,
                'sport': self.available_sports[sport.lower()]['name'],
                'sport_key': sport.lower(),
                'games': games,
                'data_source': 'live_api' if self.use_live_api else 'no_data',
                'comparison_summary': {
                    'total_games': len(games),
                    'sportsbooks_compared': len(set().union(*[game['sportsbooks'].keys() for game in games])) if games else 0,
                    'best_value_opportunities': sum(1 for game in games if 'best_home_odds' in game or 'best_away_odds' in game),
                    'data_accuracy': 'high'
                },
                'last_updated': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f'Failed to get odds comparison for {sport}: {str(e)}')
            return {
                'success': False,
                'error': f'Failed to get comparison: {str(e)}',
                'games': []
            }

    def get_season_statuses(self) -> Dict[str, Any]:
        """Get current season status for all sports"""
        try:
            # Refresh statuses
            current_statuses = self._get_available_sports()
            
            detailed_statuses = {}
            current_date = datetime.utcnow()
            
            for sport_key, sport_info in current_statuses.items():
                calendar = self.sport_calendars[sport_key]
                status = sport_info['season']
                
                detailed_statuses[sport_key] = {
                    'name': sport_info['name'],
                    'current_status': status,
                    'last_updated': sport_info['last_updated'],
                    'is_active': status == 'active'
                }
            
            return {
                'success': True,
                'current_date': current_date.isoformat(),
                'sports': detailed_statuses,
                'total_sports': len(detailed_statuses),
                'auto_detection': True
            }
            
        except Exception as e:
            logger.error(f'Failed to get season statuses: {str(e)}')
            return {
                'success': False,
                'error': f'Failed to get season statuses: {str(e)}'
            }

    def refresh_season_statuses(self) -> Dict[str, Any]:
        """Manually refresh season statuses for all sports"""
        try:
            self.available_sports = self._get_available_sports()
            
            return {
                'success': True,
                'message': 'Season statuses refreshed successfully',
                'updated_sports': len(self.available_sports),
                'statuses': {sport: info['season'] for sport, info in self.available_sports.items()},
                'refresh_time': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f'Failed to refresh season statuses: {str(e)}')
            return {
                'success': False,
                'error': f'Failed to refresh season statuses: {str(e)}'
            }

    def _get_season_message(self, sport_name: str, season_status: str) -> Dict[str, str]:
        """Generate professional season status messages"""
        messages = {
            'offseason': {
                'title': f'{sport_name} Season Concluded',
                'description': f'The {sport_name} season has concluded. Check back during the regular season for live games and odds.',
                'action': 'Season will resume according to the official schedule.'
            },
            'preseason': {
                'title': f'{sport_name} Preseason',
                'description': f'The {sport_name} regular season is approaching. Preseason games may be available.',
                'action': 'Regular season games and full odds coverage coming soon.'
            }
        }
        
        return messages.get(season_status, {
            'title': f'{sport_name} season status unavailable',
            'description': 'We\'re updating our schedule information for this sport.',
            'action': 'Please check back shortly for the latest game information.'
        })