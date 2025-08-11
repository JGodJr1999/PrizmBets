"""
Initialize all databases for SmartBets 2.0
Creates tables and adds test data for development
"""

import os
import sys
from datetime import datetime, timedelta
from app import create_app
from app.models.user import db, User, UserProfile
from app.models.parlay import Parlay
from app.models.pickem_pools import PickEmPool, PoolMembership, NFLGame, PoolPick
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize all database tables"""
    app = create_app('development')
    
    with app.app_context():
        try:
            # Create all tables
            logger.info("Creating database tables...")
            db.create_all()
            logger.info("Database tables created successfully!")
            
            # Check if we already have data
            if User.query.first():
                logger.info("Database already contains data. Skipping initialization.")
                return
            
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
                parlay_id=f"parlay_{admin_user.id}_{datetime.utcnow().timestamp()}",
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
                    role='admin' if user.id == admin_user.id else 'member',
                    total_points=0,
                    correct_picks=0,
                    total_picks=0
                )
                db.session.add(member)
            
            db.session.commit()
            
            # Create sample NFL games
            logger.info("Creating sample NFL games...")
            games = [
                {
                    'week_number': 1,
                    'home_team': 'Chiefs',
                    'away_team': 'Lions',
                    'home_spread': -3.5,
                    'away_spread': 3.5,
                    'over_under': 48.5,
                    'game_time': datetime.utcnow() + timedelta(days=3),
                    'status': 'scheduled'
                },
                {
                    'week_number': 1,
                    'home_team': 'Cowboys',
                    'away_team': 'Giants',
                    'home_spread': -7.0,
                    'away_spread': 7.0,
                    'over_under': 44.5,
                    'game_time': datetime.utcnow() + timedelta(days=3, hours=3),
                    'status': 'scheduled'
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