"""
Initialize PrizmBets Production Database
Sets up PostgreSQL database with proper indexes and constraints
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
from app.models.user import db, User, UserProfile, UserUsage
from app.models.parlay import Parlay
from app.models.pickem_pools import PickEmPool, PoolMembership, NFLGame, NFLWeek, PoolPick
import logging
from sqlalchemy import text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_production_database():
    """Initialize production database with PostgreSQL optimizations"""
    app = create_app('production')
    
    with app.app_context():
        try:
            logger.info("Creating production database tables...")
            db.create_all()
            
            # Add PostgreSQL-specific indexes for performance
            logger.info("Creating performance indexes...")
            
            # User table indexes
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
                CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
                CREATE INDEX IF NOT EXISTS idx_users_tier ON users(current_tier);
            """))
            
            # User usage indexes
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
                CREATE INDEX IF NOT EXISTS idx_user_usage_date ON user_usage(date);
                CREATE INDEX IF NOT EXISTS idx_user_usage_user_date ON user_usage(user_id, date);
            """))
            
            # Parlay indexes
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_parlays_user_id ON parlays(user_id);
                CREATE INDEX IF NOT EXISTS idx_parlays_created_at ON parlays(created_at);
                CREATE INDEX IF NOT EXISTS idx_parlays_status ON parlays(status);
            """))
            
            # Pick'em pool indexes
            db.session.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_pools_creator_id ON pick_em_pools(creator_id);
                CREATE INDEX IF NOT EXISTS idx_pools_status ON pick_em_pools(status);
                CREATE INDEX IF NOT EXISTS idx_pool_memberships_user_id ON pool_memberships(user_id);
                CREATE INDEX IF NOT EXISTS idx_pool_memberships_pool_id ON pool_memberships(pool_id);
            """))
            
            logger.info("Creating admin user...")
            # Create admin user for production
            admin_email = os.environ.get('ADMIN_EMAIL', 'admin@prizmbets.app')
            admin_password = os.environ.get('ADMIN_PASSWORD')
            
            if admin_password:
                admin_user = User.query.filter_by(email=admin_email).first()
                if not admin_user:
                    admin_user = User(
                        email=admin_email,
                        name='PrizmBets Admin',
                        current_tier='admin',
                        is_admin=True,
                        email_verified=True,
                        created_at=datetime.now(UTC)
                    )
                    admin_user.set_password(admin_password)
                    db.session.add(admin_user)
                    
                    # Create admin profile
                    admin_profile = UserProfile(
                        user_id=admin_user.id,
                        created_at=datetime.now(UTC)
                    )
                    db.session.add(admin_profile)
                    logger.info(f"Created admin user: {admin_email}")
                else:
                    logger.info(f"Admin user already exists: {admin_email}")
            else:
                logger.warning("No ADMIN_PASSWORD provided, skipping admin user creation")
            
            db.session.commit()
            logger.info("✅ Production database initialized successfully!")
            
            # Test connection
            result = db.session.execute(text('SELECT COUNT(*) FROM users')).scalar()
            logger.info(f"Database verification: {result} users in system")
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            db.session.rollback()
            raise
        finally:
            db.session.close()

def create_migration_script():
    """Create database migration from SQLite to PostgreSQL"""
    logger.info("Creating migration script for SQLite to PostgreSQL...")
    
    migration_sql = """
    -- Migration script from SQLite to PostgreSQL
    -- Run this script to migrate data from development to production
    
    -- 1. Export data from SQLite (run in development environment)
    -- sqlite3 instance/prizmbets.db ".dump users" > users_export.sql
    -- sqlite3 instance/prizmbets.db ".dump user_profiles" > profiles_export.sql
    -- sqlite3 instance/prizmbets.db ".dump user_usage" > usage_export.sql
    -- sqlite3 instance/prizmbets.db ".dump parlays" > parlays_export.sql
    
    -- 2. Convert SQLite syntax to PostgreSQL syntax
    -- sed -i 's/AUTOINCREMENT/SERIAL/g' *.sql
    -- sed -i 's/INTEGER PRIMARY KEY/SERIAL PRIMARY KEY/g' *.sql
    
    -- 3. Import to PostgreSQL (run in production environment)
    -- psql $DATABASE_URL -f users_export.sql
    -- psql $DATABASE_URL -f profiles_export.sql
    -- psql $DATABASE_URL -f usage_export.sql
    -- psql $DATABASE_URL -f parlays_export.sql
    """
    
    with open('migration_guide.sql', 'w') as f:
        f.write(migration_sql)
    logger.info("Created migration_guide.sql")

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == '--migration-guide':
        create_migration_script()
    else:
        init_production_database()