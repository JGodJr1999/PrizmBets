"""
NFL Pick'em Pools Service for SmartBets 2.0
Business logic for pool management, picks, standings, and NFL data integration
"""

import logging
import secrets
import string
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy import and_, func, desc
from sqlalchemy.exc import SQLAlchemyError

from ..models.pickem_pools import (
    PickEmPool, PoolMembership, NFLWeek, NFLGame, 
    PoolPick, WeeklyStandings, db
)
from ..models.user import User

logger = logging.getLogger(__name__)

class PickEmService:
    """Service class for NFL Pick'em Pools functionality"""
    
    def __init__(self):
        self.current_season = datetime.now().year
        
    # Pool Management Methods
    
    def create_pool(self, creator_id: int, name: str, description: str = None, settings: dict = None) -> Dict[str, Any]:
        """Create a new Pick'em pool"""
        try:
            # Validate creator exists
            creator = User.query.get(creator_id)
            if not creator:
                return {'success': False, 'error': 'Creator not found'}
            
            # Create pool with default settings
            default_settings = {
                'pick_type': 'straight_up',
                'include_playoffs': True,
                'tiebreaker_method': 'head_to_head',
                'late_pick_penalty': False,
                'weekly_prizes': False
            }
            
            if settings:
                default_settings.update(settings)
            
            # Generate unique invite code
            invite_code = self._generate_unique_invite_code()
            
            pool = PickEmPool(
                name=name.strip(),
                description=description.strip() if description else None,
                creator_id=creator_id,
                invite_code=invite_code,
                season_year=self.current_season,
                settings=default_settings
            )
            
            db.session.add(pool)
            db.session.flush()  # Get the pool ID
            
            # Add creator as admin member
            membership = PoolMembership(
                pool_id=pool.id,
                user_id=creator_id,
                display_name=creator.name,
                is_admin=True
            )
            
            db.session.add(membership)
            db.session.commit()
            
            logger.info(f"Created pool {pool.id} by user {creator_id}")
            
            return {
                'success': True,
                'pool': pool.to_dict(),
                'invite_code': invite_code
            }
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error creating pool: {e}")
            return {'success': False, 'error': 'Database error'}
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error creating pool: {e}")
            return {'success': False, 'error': 'Failed to create pool'}
    
    def join_pool(self, user_id: int, invite_code: str, display_name: str = None) -> Dict[str, Any]:
        """Join a pool using invite code"""
        try:
            # Find pool by invite code
            pool = PickEmPool.query.filter_by(
                invite_code=invite_code.upper(),
                is_active=True
            ).first()
            
            if not pool:
                return {'success': False, 'error': 'Invalid invite code'}
            
            # Check if user already a member
            existing_membership = PoolMembership.query.filter_by(
                pool_id=pool.id,
                user_id=user_id
            ).first()
            
            if existing_membership:
                if existing_membership.is_active:
                    return {'success': False, 'error': 'Already a member of this pool'}
                else:
                    # Reactivate membership
                    existing_membership.is_active = True
                    existing_membership.joined_at = datetime.utcnow()
                    db.session.commit()
                    return {'success': True, 'pool': pool.to_dict()}
            
            # Check pool capacity
            if pool.member_count >= pool.max_members:
                return {'success': False, 'error': 'Pool is full'}
            
            # Get user info
            user = User.query.get(user_id)
            if not user:
                return {'success': False, 'error': 'User not found'}
            
            # Create membership
            membership = PoolMembership(
                pool_id=pool.id,
                user_id=user_id,
                display_name=display_name or user.name,
                is_admin=False
            )
            
            db.session.add(membership)
            db.session.commit()
            
            logger.info(f"User {user_id} joined pool {pool.id}")
            
            return {
                'success': True,
                'pool': pool.to_dict(),
                'membership': membership.to_dict()
            }
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error joining pool: {e}")
            return {'success': False, 'error': 'Database error'}
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error joining pool: {e}")
            return {'success': False, 'error': 'Failed to join pool'}
    
    def get_user_pools(self, user_id: int) -> Dict[str, Any]:
        """Get all pools for a user"""
        try:
            memberships = PoolMembership.query.filter_by(
                user_id=user_id,
                is_active=True
            ).join(PickEmPool).filter(PickEmPool.is_active == True).all()
            
            pools = []
            for membership in memberships:
                pool_data = membership.pool.to_dict()
                pool_data['user_role'] = 'admin' if membership.is_admin else 'member'
                pool_data['display_name'] = membership.display_name
                pools.append(pool_data)
            
            return {
                'success': True,
                'pools': pools,
                'total_pools': len(pools)
            }
            
        except Exception as e:
            logger.error(f"Error getting user pools: {e}")
            return {'success': False, 'error': 'Failed to get pools'}
    
    def get_pool_details(self, pool_id: int, user_id: int) -> Dict[str, Any]:
        """Get detailed pool information"""
        try:
            # Verify user is a member
            membership = PoolMembership.query.filter_by(
                pool_id=pool_id,
                user_id=user_id,
                is_active=True
            ).first()
            
            if not membership:
                return {'success': False, 'error': 'Access denied'}
            
            pool = PickEmPool.query.get(pool_id)
            if not pool or not pool.is_active:
                return {'success': False, 'error': 'Pool not found'}
            
            # Get current week
            current_week = self.get_current_nfl_week()
            
            # Get pool members
            members = PoolMembership.query.filter_by(
                pool_id=pool_id,
                is_active=True
            ).join(User).all()
            
            member_list = [m.to_dict() for m in members]
            
            pool_data = pool.to_dict()
            pool_data['current_week'] = current_week.to_dict() if current_week else None
            pool_data['members'] = member_list
            pool_data['user_role'] = 'admin' if membership.is_admin else 'member'
            
            return {
                'success': True,
                'pool': pool_data
            }
            
        except Exception as e:
            logger.error(f"Error getting pool details: {e}")
            return {'success': False, 'error': 'Failed to get pool details'}
    
    # NFL Week/Game Management
    
    def get_current_nfl_week(self) -> Optional[NFLWeek]:
        """Get the current active NFL week"""
        return NFLWeek.query.filter_by(
            season_year=self.current_season,
            is_active=True
        ).first()
    
    def get_nfl_week_games(self, week_number: int, season_year: int = None) -> Dict[str, Any]:
        """Get all games for a specific NFL week"""
        try:
            if season_year is None:
                season_year = self.current_season
            
            week = NFLWeek.query.filter_by(
                week_number=week_number,
                season_year=season_year
            ).first()
            
            if not week:
                return {'success': False, 'error': 'Week not found'}
            
            games = NFLGame.query.filter_by(week_id=week.id).order_by(NFLGame.game_time).all()
            
            return {
                'success': True,
                'week': week.to_dict(),
                'games': [game.to_dict() for game in games]
            }
            
        except Exception as e:
            logger.error(f"Error getting week games: {e}")
            return {'success': False, 'error': 'Failed to get games'}
    
    # Pick Management
    
    def submit_picks(self, pool_id: int, user_id: int, picks: List[Dict]) -> Dict[str, Any]:
        """Submit picks for a user in a pool"""
        try:
            # Verify pool membership
            membership = PoolMembership.query.filter_by(
                pool_id=pool_id,
                user_id=user_id,
                is_active=True
            ).first()
            
            if not membership:
                return {'success': False, 'error': 'Access denied'}
            
            # Get current week
            current_week = self.get_current_nfl_week()
            if not current_week:
                return {'success': False, 'error': 'No active NFL week'}
            
            # Check deadline
            if current_week.is_pick_deadline_passed:
                return {'success': False, 'error': 'Pick deadline has passed'}
            
            picks_submitted = []
            picks_updated = []
            
            for pick_data in picks:
                game_id = pick_data.get('game_id')
                predicted_winner = pick_data.get('predicted_winner')
                
                if not game_id or not predicted_winner:
                    continue
                
                # Verify game exists and belongs to current week
                game = NFLGame.query.filter_by(
                    id=game_id,
                    week_id=current_week.id
                ).first()
                
                if not game:
                    continue
                
                # Check if game has started
                if game.has_started:
                    continue
                
                # Check for existing pick
                existing_pick = PoolPick.query.filter_by(
                    pool_id=pool_id,
                    user_id=user_id,
                    game_id=game_id
                ).first()
                
                if existing_pick:
                    # Update existing pick
                    existing_pick.predicted_winner = predicted_winner
                    existing_pick.last_modified = datetime.utcnow()
                    picks_updated.append(existing_pick.to_dict())
                else:
                    # Create new pick
                    new_pick = PoolPick(
                        pool_id=pool_id,
                        user_id=user_id,
                        game_id=game_id,
                        predicted_winner=predicted_winner
                    )
                    db.session.add(new_pick)
                    picks_submitted.append(pick_data)
            
            db.session.commit()
            
            logger.info(f"User {user_id} submitted {len(picks_submitted)} picks, updated {len(picks_updated)} for pool {pool_id}")
            
            return {
                'success': True,
                'picks_submitted': len(picks_submitted),
                'picks_updated': len(picks_updated),
                'message': f'Successfully processed {len(picks_submitted + picks_updated)} picks'
            }
            
        except SQLAlchemyError as e:
            db.session.rollback()
            logger.error(f"Database error submitting picks: {e}")
            return {'success': False, 'error': 'Database error'}
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error submitting picks: {e}")
            return {'success': False, 'error': 'Failed to submit picks'}
    
    def get_user_picks(self, pool_id: int, user_id: int, week_number: int = None) -> Dict[str, Any]:
        """Get user's picks for a specific week"""
        try:
            # Verify access
            membership = PoolMembership.query.filter_by(
                pool_id=pool_id,
                user_id=user_id,
                is_active=True
            ).first()
            
            if not membership:
                return {'success': False, 'error': 'Access denied'}
            
            # Get week
            if week_number is None:
                week = self.get_current_nfl_week()
            else:
                week = NFLWeek.query.filter_by(
                    week_number=week_number,
                    season_year=self.current_season
                ).first()
            
            if not week:
                return {'success': False, 'error': 'Week not found'}
            
            # Get picks with game information
            picks = db.session.query(PoolPick).join(NFLGame).filter(
                PoolPick.pool_id == pool_id,
                PoolPick.user_id == user_id,
                NFLGame.week_id == week.id
            ).all()
            
            return {
                'success': True,
                'week': week.to_dict(),
                'picks': [pick.to_dict() for pick in picks]
            }
            
        except Exception as e:
            logger.error(f"Error getting user picks: {e}")
            return {'success': False, 'error': 'Failed to get picks'}
    
    # Standings and Scoring
    
    def calculate_weekly_standings(self, pool_id: int, week_id: int) -> Dict[str, Any]:
        """Calculate standings for a specific week"""
        try:
            week = NFLWeek.query.get(week_id)
            if not week or not week.is_completed:
                return {'success': False, 'error': 'Week not completed'}
            
            # Get all members
            members = PoolMembership.query.filter_by(
                pool_id=pool_id,
                is_active=True
            ).all()
            
            standings = []
            
            for member in members:
                # Get member's picks for this week
                picks = db.session.query(PoolPick).join(NFLGame).filter(
                    PoolPick.pool_id == pool_id,
                    PoolPick.user_id == member.user_id,
                    NFLGame.week_id == week_id
                ).all()
                
                # Calculate results
                correct_picks = 0
                total_picks = len(picks)
                points_earned = 0
                
                for pick in picks:
                    if pick.evaluate_pick():
                        correct_picks += 1
                    points_earned += pick.points_earned
                
                # Update or create weekly standing
                standing = WeeklyStandings.query.filter_by(
                    pool_id=pool_id,
                    user_id=member.user_id,
                    week_id=week_id
                ).first()
                
                if not standing:
                    standing = WeeklyStandings(
                        pool_id=pool_id,
                        user_id=member.user_id,
                        week_id=week_id
                    )
                    db.session.add(standing)
                
                standing.correct_picks = correct_picks
                standing.total_picks = total_picks
                standing.points_earned = points_earned
                standing.calculated_at = datetime.utcnow()
                
                # Update member stats
                member.update_stats(correct_picks, total_picks)
                
                standings.append({
                    'user_id': member.user_id,
                    'display_name': member.display_name,
                    'correct_picks': correct_picks,
                    'total_picks': total_picks,
                    'points_earned': points_earned,
                    'win_percentage': round((correct_picks / max(total_picks, 1)) * 100, 1)
                })
            
            # Sort by points earned, then by correct picks
            standings.sort(key=lambda x: (x['points_earned'], x['correct_picks']), reverse=True)
            
            # Assign ranks
            for i, standing_data in enumerate(standings, 1):
                standing = WeeklyStandings.query.filter_by(
                    pool_id=pool_id,
                    user_id=standing_data['user_id'],
                    week_id=week_id
                ).first()
                if standing:
                    standing.week_rank = i
                    standing_data['week_rank'] = i
            
            db.session.commit()
            
            return {
                'success': True,
                'week': week.to_dict(),
                'standings': standings
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error calculating standings: {e}")
            return {'success': False, 'error': 'Failed to calculate standings'}
    
    def get_pool_leaderboard(self, pool_id: int) -> Dict[str, Any]:
        """Get overall season leaderboard for a pool"""
        try:
            members = PoolMembership.query.filter_by(
                pool_id=pool_id,
                is_active=True
            ).order_by(desc(PoolMembership.total_correct_picks)).all()
            
            leaderboard = []
            
            for i, member in enumerate(members, 1):
                leaderboard.append({
                    'rank': i,
                    'user_id': member.user_id,
                    'display_name': member.display_name,
                    'total_correct_picks': member.total_correct_picks,
                    'total_picks_made': member.total_picks_made,
                    'win_percentage': member.win_percentage,
                    'current_streak': member.current_streak,
                    'best_week_score': member.best_week_score
                })
            
            return {
                'success': True,
                'leaderboard': leaderboard,
                'total_members': len(leaderboard)
            }
            
        except Exception as e:
            logger.error(f"Error getting leaderboard: {e}")
            return {'success': False, 'error': 'Failed to get leaderboard'}
    
    # Utility Methods
    
    def _generate_unique_invite_code(self, length: int = 8) -> str:
        """Generate a unique invite code"""
        while True:
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
            existing = PickEmPool.query.filter_by(invite_code=code).first()
            if not existing:
                return code
    
    def update_game_results(self, game_id: int, winner: str, home_score: int = None, away_score: int = None) -> Dict[str, Any]:
        """Update game results (admin function)"""
        try:
            game = NFLGame.query.get(game_id)
            if not game:
                return {'success': False, 'error': 'Game not found'}
            
            game.is_completed = True
            game.actual_winner = winner
            game.home_score = home_score
            game.away_score = away_score
            game.last_updated = datetime.utcnow()
            
            # Evaluate all picks for this game
            picks = PoolPick.query.filter_by(game_id=game_id).all()
            for pick in picks:
                pick.evaluate_pick()
            
            db.session.commit()
            
            return {'success': True, 'message': 'Game results updated'}
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error updating game results: {e}")
            return {'success': False, 'error': 'Failed to update results'}