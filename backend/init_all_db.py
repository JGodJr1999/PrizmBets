"""
Initialize all databases for PrizmBets
Creates tables and adds test data for development
"""

import os
import sys
from datetime import datetime, timedelta
try:
    from datetime import UTC
except ImportError:
    import datetime as dt
    UTC = dt.timezone.utc
from app import create_app
from app.models.user import db, User, UserProfile
from app.models.parlay import Parlay
from app.models.pickem_pools import PickEmPool, PoolMembership, NFLGame, NFLWeek, PoolPick
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize all database tables"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Drop and recreate all tables for clean init
            logger.info("Dropping existing tables...")
            db.drop_all()
            
            # Create all tables
            logger.info("Creating database tables...")
            db.create_all()
            logger.info("Database tables created successfully!")
            
            # Create test users
            logger.info("Creating test users...")
            test_users = [
                {
                    'email': 'admin@smartbets.com',
                    'password': 'admin123',
                    'name': 'Admin User',
                    'subscription_tier': 'premium'
                },
                {
                    'email': 'test@smartbets.com',
                    'password': 'test123',
                    'name': 'Test User',
                    'subscription_tier': 'pro'
                },
                {
                    'email': 'free@smartbets.com',
                    'password': 'free123',
                    'name': 'Free User',
                    'subscription_tier': 'free'
                }
            ]
            
            created_users = []
            for user_data in test_users:
                user = User(
                    email=user_data['email'],
                    password=user_data['password'],
                    name=user_data['name']
                )
                user.subscription_tier = user_data['subscription_tier']
                db.session.add(user)
                created_users.append(user)
                logger.info(f"Created user: {user_data['email']}")
            
            db.session.commit()
            
            # Create user profiles
            logger.info("Creating user profiles...")
            for user in created_users:
                profile = UserProfile(
                    user_id=user.id,
                    favorite_sports=['nfl', 'nba', 'mlb'],
                    preferred_sportsbooks=['draftkings', 'fanduel'],
                    default_bet_amount=50.00,
                    risk_tolerance='medium'
                )
                db.session.add(profile)
            
            db.session.commit()
            
            # Create sample parlays
            logger.info("Creating sample parlays...")
            admin_user = created_users[0]
            
            # Sample bets data (stored as JSON in parlay)
            bets_data = [
                {
                    'team': 'Lakers',
                    'odds': -110,
                    'bet_type': 'moneyline',
                    'amount': 50.00,
                    'sport': 'nba'
                },
                {
                    'team': 'Patriots',
                    'odds': 150,
                    'bet_type': 'spread',
                    'amount': 50.00,
                    'sport': 'nfl'
                }
            ]
            
            parlay1 = Parlay(
                parlay_id=f"parlay_{admin_user.id}_{datetime.now(UTC).timestamp()}",
                name="Sample Parlay",
                bets=bets_data,
                total_amount=100.00,
                potential_payout=350.00,
                ai_confidence=75.0,
                ai_recommendation="recommend",
                status='pending'
            )
            db.session.add(parlay1)
            
            db.session.commit()
            
            # Create sample Pick'em pool
            logger.info("Creating sample Pick'em pool...")
            pool = PickEmPool(
                name="Test NFL Pool",
                description="A test pool for development",
                creator_id=admin_user.id,
                settings={
                    'pick_type': 'straight_up',
                    'max_members': 20,
                    'entry_fee': 0
                },
                invite_code='TEST123'
            )
            db.session.add(pool)
            db.session.commit()
            
            # Add members to pool
            for user in created_users:
                member = PoolMembership(
                    pool_id=pool.id,
                    user_id=user.id,
                    display_name=user.name,
                    is_admin=(user.id == admin_user.id)
                )
                db.session.add(member)
            
            db.session.commit()
            
            # Create NFL Weeks for current season
            logger.info("Creating NFL weeks for current season...")
            current_season = datetime.now().year
            
            # Create 18 regular season weeks + 4 playoff weeks
            for week_num in range(1, 19):  # Weeks 1-18
                start_date = datetime.now(UTC) + timedelta(weeks=week_num-1)
                week = NFLWeek(
                    week_number=week_num,
                    season_year=current_season,
                    week_type='regular',
                    start_date=start_date,
                    pick_deadline=start_date + timedelta(hours=18),  # 6PM Thursday
                    end_date=start_date + timedelta(days=6),
                    is_active=(week_num == 1)  # Make week 1 active
                )
                db.session.add(week)
            
            db.session.commit()
            
            # Get the created weeks for games
            week1 = NFLWeek.query.filter_by(week_number=1, season_year=current_season).first()
            week2 = NFLWeek.query.filter_by(week_number=2, season_year=current_season).first()
            
            # Create sample NFL games
            logger.info("Creating sample NFL games...")
            games = [
                {
                    'week_id': week1.id,
                    'home_team': 'Kansas City Chiefs',
                    'away_team': 'Detroit Lions', 
                    'home_spread': -3.5,
                    'total_points': 48.5,
                    'game_time': datetime.now(UTC) + timedelta(days=3)
                },
                {
                    'week_id': week1.id,
                    'home_team': 'Dallas Cowboys',
                    'away_team': 'New York Giants',
                    'home_spread': -7.0,
                    'total_points': 44.5,
                    'game_time': datetime.now(UTC) + timedelta(days=3, hours=3)
                },
                {
                    'week_id': week1.id,
                    'home_team': 'Buffalo Bills',
                    'away_team': 'Miami Dolphins',
                    'home_spread': -4.0,
                    'total_points': 46.0,
                    'game_time': datetime.now(UTC) + timedelta(days=4)
                },
                {
                    'week_id': week2.id,
                    'home_team': 'Green Bay Packers',
                    'away_team': 'Chicago Bears',
                    'home_spread': -6.5,
                    'total_points': 42.0,
                    'game_time': datetime.now(UTC) + timedelta(days=10)
                }
            ]
            
            for game_data in games:
                game = NFLGame(**game_data)
                db.session.add(game)
            
            db.session.commit()
            
            logger.info("=" * 50)
            logger.info("Database initialization complete!")
            logger.info("=" * 50)
            logger.info("Test users created:")
            logger.info("  - admin@smartbets.com / admin123 (Premium)")
            logger.info("  - test@smartbets.com / test123 (Pro)")
            logger.info("  - free@smartbets.com / free123 (Free)")
            logger.info("=" * 50)
            
            return True
            
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            db.session.rollback()
            return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)