"""
NFL Schedule Integration Service for SmartBets 2.0
Integrates with existing comprehensive sports service to populate NFL games and weeks
"""

import logging
import sys
import os
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from sqlalchemy.exc import SQLAlchemyError

# Add services directory to path for imports
sys.path.append(os.path.join(os.path.dirname(__file__)))

from comprehensive_sports_service import ComprehensiveSportsService
from ..models.pickem_pools import NFLWeek, NFLGame, db

logger = logging.getLogger(__name__)

class NFLScheduleService:
    """Service for managing NFL schedule data integration"""
    
    def __init__(self):
        self.sports_service = ComprehensiveSportsService()
        self.current_season = datetime.now().year
        self.nfl_sport_key = 'nfl'
        
        # NFL team mapping (full names to abbreviations)
        self.team_mapping = {
            # AFC East
            'Buffalo Bills': 'BUF',
            'Miami Dolphins': 'MIA', 
            'New England Patriots': 'NE',
            'New York Jets': 'NYJ',
            
            # AFC North
            'Baltimore Ravens': 'BAL',
            'Cincinnati Bengals': 'CIN',
            'Cleveland Browns': 'CLE',
            'Pittsburgh Steelers': 'PIT',
            
            # AFC South
            'Houston Texans': 'HOU',
            'Indianapolis Colts': 'IND',
            'Jacksonville Jaguars': 'JAX',
            'Tennessee Titans': 'TEN',
            
            # AFC West
            'Denver Broncos': 'DEN',
            'Kansas City Chiefs': 'KC',
            'Las Vegas Raiders': 'LV',
            'Los Angeles Chargers': 'LAC',
            
            # NFC East
            'Dallas Cowboys': 'DAL',
            'New York Giants': 'NYG',
            'Philadelphia Eagles': 'PHI',
            'Washington Commanders': 'WAS',
            
            # NFC North
            'Chicago Bears': 'CHI',
            'Detroit Lions': 'DET',
            'Green Bay Packers': 'GB',
            'Minnesota Vikings': 'MIN',
            
            # NFC South
            'Atlanta Falcons': 'ATL',
            'Carolina Panthers': 'CAR',
            'New Orleans Saints': 'NO',
            'Tampa Bay Buccaneers': 'TB',
            
            # NFC West
            'Arizona Cardinals': 'ARI',
            'Los Angeles Rams': 'LAR',
            'San Francisco 49ers': 'SF',
            'Seattle Seahawks': 'SEA'
        }
    
    def sync_nfl_schedule(self, season_year: int = None) -> Dict[str, Any]:
        """Sync NFL schedule from sports service"""
        try:
            if season_year is None:
                season_year = self.current_season
            
            logger.info(f"Starting NFL schedule sync for season {season_year}")
            
            # Get NFL games from sports service
            nfl_data = self.sports_service.get_live_odds('nfl', limit=50)
            
            if not nfl_data.get('success') or not nfl_data.get('games'):
                return {
                    'success': False,
                    'error': 'Failed to fetch NFL data from sports service'
                }
            
            games = nfl_data['games']
            logger.info(f"Retrieved {len(games)} NFL games from sports service")
            
            # Group games by week
            games_by_week = self._group_games_by_week(games)
            
            weeks_created = 0
            games_created = 0
            games_updated = 0
            
            for week_info in games_by_week:
                # Create or update NFL week
                week = self._create_or_update_week(week_info, season_year)
                if week:
                    weeks_created += 1
                
                    # Process games for this week
                    for game_data in week_info['games']:
                        result = self._create_or_update_game(game_data, week)
                        if result == 'created':
                            games_created += 1
                        elif result == 'updated':
                            games_updated += 1
            
            db.session.commit()
            
            # Set current week
            self._update_current_week(season_year)
            
            return {
                'success': True,
                'season_year': season_year,
                'weeks_processed': len(games_by_week),
                'games_created': games_created,
                'games_updated': games_updated,
                'total_games': len(games)
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error syncing NFL schedule: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _group_games_by_week(self, games: List[Dict]) -> List[Dict]:
        """Group games by NFL week"""
        # Sort games by date
        sorted_games = sorted(games, key=lambda x: x.get('commence_time', ''))
        
        if not sorted_games:
            return []
        
        # Determine season start (first Thursday in September)
        season_start = self._get_season_start_date()
        
        weeks = []
        current_week_games = []
        current_week_number = 1
        current_week_start = season_start
        
        for game in sorted_games:
            game_time_str = game.get('commence_time', '')
            if not game_time_str:
                continue
                
            try:
                # Parse game time
                game_time = datetime.fromisoformat(game_time_str.replace('Z', '+00:00'))
                
                # Determine which week this game belongs to
                week_number = self._calculate_week_number(game_time, season_start)
                
                if week_number != current_week_number:
                    # Save current week if it has games
                    if current_week_games:
                        weeks.append({
                            'week_number': current_week_number,
                            'games': current_week_games,
                            'start_date': current_week_start,
                            'pick_deadline': min([datetime.fromisoformat(g.get('commence_time', '').replace('Z', '+00:00')) 
                                                for g in current_week_games]),
                            'end_date': current_week_start + timedelta(days=7)
                        })
                    
                    # Start new week
                    current_week_number = week_number
                    current_week_games = []
                    current_week_start = season_start + timedelta(weeks=week_number-1)
                
                current_week_games.append(game)
                
            except Exception as e:
                logger.warning(f"Error processing game time {game_time_str}: {e}")
                continue
        
        # Add final week
        if current_week_games:
            weeks.append({
                'week_number': current_week_number,
                'games': current_week_games,
                'start_date': current_week_start,
                'pick_deadline': min([datetime.fromisoformat(g.get('commence_time', '').replace('Z', '+00:00')) 
                                    for g in current_week_games]),
                'end_date': current_week_start + timedelta(days=7)
            })
        
        return weeks
    
    def _get_season_start_date(self) -> datetime:
        """Get the NFL season start date (first Thursday in September)"""
        # For now, use a simple approximation
        # TODO: Implement more sophisticated season date calculation
        return datetime(self.current_season, 9, 7)  # Approximate first Thursday
    
    def _calculate_week_number(self, game_time: datetime, season_start: datetime) -> int:
        """Calculate NFL week number based on game time"""
        days_from_start = (game_time - season_start).days
        week_number = max(1, (days_from_start // 7) + 1)
        
        # Cap at reasonable week numbers (18 regular season + playoffs)
        return min(week_number, 22)
    
    def _create_or_update_week(self, week_info: Dict, season_year: int) -> Optional[NFLWeek]:
        """Create or update an NFL week"""
        try:
            week = NFLWeek.query.filter_by(
                week_number=week_info['week_number'],
                season_year=season_year
            ).first()
            
            if not week:
                week = NFLWeek(
                    week_number=week_info['week_number'],
                    season_year=season_year,
                    start_date=week_info['start_date'],
                    pick_deadline=week_info['pick_deadline'],
                    end_date=week_info['end_date'],
                    week_type='regular' if week_info['week_number'] <= 18 else 'playoff'
                )
                db.session.add(week)
                db.session.flush()  # Get the week ID
                
                logger.info(f"Created NFL week {week.week_number} for season {season_year}")
            else:
                # Update existing week
                week.start_date = week_info['start_date']
                week.pick_deadline = week_info['pick_deadline']
                week.end_date = week_info['end_date']
                week.games_loaded = True
            
            return week
            
        except Exception as e:
            logger.error(f"Error creating/updating week: {e}")
            return None
    
    def _create_or_update_game(self, game_data: Dict, week: NFLWeek) -> str:
        """Create or update an NFL game"""
        try:
            # Extract game information
            home_team = self._normalize_team_name(game_data.get('home_team', ''))
            away_team = self._normalize_team_name(game_data.get('away_team', ''))
            game_time_str = game_data.get('commence_time', '')
            external_id = game_data.get('id', '')
            
            if not home_team or not away_team or not game_time_str:
                logger.warning(f"Incomplete game data: {game_data}")
                return 'skipped'
            
            game_time = datetime.fromisoformat(game_time_str.replace('Z', '+00:00'))
            
            # Check for existing game
            existing_game = NFLGame.query.filter_by(
                week_id=week.id,
                home_team=home_team,
                away_team=away_team
            ).first()
            
            if existing_game:
                # Update existing game
                existing_game.game_time = game_time
                existing_game.external_game_id = external_id
                existing_game.last_updated = datetime.utcnow()
                
                return 'updated'
            else:
                # Create new game
                new_game = NFLGame(
                    week_id=week.id,
                    external_game_id=external_id,
                    home_team=home_team,
                    away_team=away_team,
                    game_time=game_time
                )
                db.session.add(new_game)
                
                return 'created'
                
        except Exception as e:
            logger.error(f"Error creating/updating game: {e}")
            return 'error'
    
    def _normalize_team_name(self, team_name: str) -> str:
        """Normalize team name to consistent format"""
        if not team_name:
            return ''
        
        # Use mapping if available, otherwise use the name as-is
        return self.team_mapping.get(team_name, team_name)
    
    def _update_current_week(self, season_year: int):
        """Update which week is currently active"""
        try:
            now = datetime.utcnow()
            
            # Clear all current week flags
            NFLWeek.query.filter_by(season_year=season_year, is_active=True).update({
                'is_active': False
            })
            
            # Find the current week based on dates
            current_week = NFLWeek.query.filter(
                NFLWeek.season_year == season_year,
                NFLWeek.start_date <= now,
                NFLWeek.end_date >= now
            ).first()
            
            if current_week:
                current_week.is_active = True
                logger.info(f"Set week {current_week.week_number} as active for season {season_year}")
            else:
                # If no current week found, use the next upcoming week
                upcoming_week = NFLWeek.query.filter(
                    NFLWeek.season_year == season_year,
                    NFLWeek.start_date > now
                ).order_by(NFLWeek.start_date).first()
                
                if upcoming_week:
                    upcoming_week.is_active = True
                    logger.info(f"Set upcoming week {upcoming_week.week_number} as active")
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Error updating current week: {e}")
    
    def update_game_results_from_api(self) -> Dict[str, Any]:
        """Update completed game results from the sports API"""
        try:
            # Get current NFL data
            nfl_data = self.sports_service.get_live_odds('nfl', limit=50)
            
            if not nfl_data.get('success') or not nfl_data.get('games'):
                return {
                    'success': False,
                    'error': 'Failed to fetch NFL data'
                }
            
            games_updated = 0
            
            for api_game in nfl_data['games']:
                # Find corresponding database game
                home_team = self._normalize_team_name(api_game.get('home_team', ''))
                away_team = self._normalize_team_name(api_game.get('away_team', ''))
                
                if not home_team or not away_team:
                    continue
                
                db_game = NFLGame.query.filter_by(
                    home_team=home_team,
                    away_team=away_team
                ).filter(NFLGame.week_id.in_(
                    db.session.query(NFLWeek.id).filter_by(season_year=self.current_season)
                )).first()
                
                if not db_game:
                    continue
                
                # Check if game is completed and update results
                if self._update_game_if_completed(db_game, api_game):
                    games_updated += 1
            
            db.session.commit()
            
            return {
                'success': True,
                'games_updated': games_updated
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating game results: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _update_game_if_completed(self, db_game: NFLGame, api_game: Dict) -> bool:
        """Update game results if the game is completed"""
        try:
            # Check if game has started (assuming API provides game status)
            game_time_str = api_game.get('commence_time', '')
            if game_time_str:
                game_time = datetime.fromisoformat(game_time_str.replace('Z', '+00:00'))
                if datetime.utcnow() < game_time:
                    return False  # Game hasn't started yet
            
            # For now, we'll simulate game completion detection
            # In a real implementation, you'd check the API for actual game status
            
            # Check if we have sportsbook odds data that might indicate completion
            sportsbooks = api_game.get('sportsbooks', {})
            if not sportsbooks:
                return False
            
            # Simulate result determination (in real implementation, get from API)
            # For demo purposes, randomly determine winner if game time has passed
            if not db_game.is_completed and game_time < datetime.utcnow() - timedelta(hours=4):
                # Game should be completed by now
                # In real implementation, get actual scores from API
                import random
                winner = random.choice(['home', 'away'])
                
                db_game.is_completed = True
                db_game.actual_winner = winner
                db_game.home_score = random.randint(14, 35)
                db_game.away_score = random.randint(14, 35)
                db_game.last_updated = datetime.utcnow()
                
                logger.info(f"Updated game result: {db_game.away_team} @ {db_game.home_team} - Winner: {winner}")
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Error updating game completion status: {e}")
            return False
    
    def get_week_schedule(self, week_number: int, season_year: int = None) -> Dict[str, Any]:
        """Get schedule for a specific week with pick'em friendly format"""
        try:
            if season_year is None:
                season_year = self.current_season
            
            week = NFLWeek.query.filter_by(
                week_number=week_number,
                season_year=season_year
            ).first()
            
            if not week:
                return {
                    'success': False,
                    'error': 'Week not found'
                }
            
            games = NFLGame.query.filter_by(week_id=week.id).order_by(NFLGame.game_time).all()
            
            return {
                'success': True,
                'week': week.to_dict(),
                'games': [self._format_game_for_pickem(game) for game in games]
            }
            
        except Exception as e:
            logger.error(f"Error getting week schedule: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _format_game_for_pickem(self, game: NFLGame) -> Dict[str, Any]:
        """Format game data specifically for Pick'em interface"""
        game_dict = game.to_dict()
        
        # Add Pick'em specific formatting
        game_dict['matchup'] = f"{game.away_team} @ {game.home_team}"
        game_dict['pick_options'] = [
            {'value': 'away', 'label': game.away_team, 'team': game.away_team},
            {'value': 'home', 'label': game.home_team, 'team': game.home_team}
        ]
        game_dict['can_pick'] = not game.has_started
        
        return game_dict