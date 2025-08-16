"""
Production Database Configuration and Management
Handles PostgreSQL setup, migrations, and production database operations
"""

import os
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProductionDatabaseManager:
    """Manages production database operations"""
    
    def __init__(self, app=None):
        self.app = app
        self.db = None
        self.migrate = None
        
    def init_app(self, app: Flask):
        """Initialize database with Flask app"""
        self.app = app
        self.db = SQLAlchemy(app)
        self.migrate = Migrate(app, self.db)
        
    def create_database_if_not_exists(self):
        """Create PostgreSQL database if it doesn't exist"""
        database_url = os.environ.get('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL environment variable is required")
            
        # Parse database URL
        from urllib.parse import urlparse
        parsed = urlparse(database_url)
        
        db_name = parsed.path[1:]  # Remove leading slash
        host = parsed.hostname
        port = parsed.port or 5432
        username = parsed.username
        password = parsed.password
        
        # Connect to PostgreSQL server (not specific database)
        server_url = f"postgresql://{username}:{password}@{host}:{port}/postgres"
        
        try:
            # Connect to PostgreSQL server
            conn = psycopg2.connect(
                host=host,
                port=port,
                user=username,
                password=password,
                database='postgres'
            )
            conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
            cursor = conn.cursor()
            
            # Check if database exists
            cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (db_name,))
            exists = cursor.fetchone()
            
            if not exists:
                logger.info(f"Creating database: {db_name}")
                cursor.execute(f'CREATE DATABASE "{db_name}"')
                logger.info(f"Database {db_name} created successfully")
            else:
                logger.info(f"Database {db_name} already exists")
                
            cursor.close()
            conn.close()
            
        except Exception as e:
            logger.error(f"Error creating database: {e}")
            raise
            
    def setup_production_database(self):
        """Set up production database with optimized settings"""
        if not self.app:
            raise ValueError("Flask app not initialized")
            
        with self.app.app_context():
            # Create database if it doesn't exist
            self.create_database_if_not_exists()
            
            # Run migrations
            from flask_migrate import upgrade
            try:
                upgrade()
                logger.info("Database migrations applied successfully")
            except Exception as e:
                logger.error(f"Error applying migrations: {e}")
                raise
                
    def optimize_database(self):
        """Apply production database optimizations"""
        optimizations = [
            # Connection pooling settings
            "ALTER SYSTEM SET max_connections = 200;",
            "ALTER SYSTEM SET shared_buffers = '256MB';",
            "ALTER SYSTEM SET effective_cache_size = '1GB';",
            "ALTER SYSTEM SET work_mem = '4MB';",
            "ALTER SYSTEM SET maintenance_work_mem = '64MB';",
            
            # Performance settings
            "ALTER SYSTEM SET checkpoint_completion_target = 0.9;",
            "ALTER SYSTEM SET wal_buffers = '16MB';",
            "ALTER SYSTEM SET default_statistics_target = 100;",
            "ALTER SYSTEM SET random_page_cost = 1.1;",
            
            # Logging settings
            "ALTER SYSTEM SET log_min_duration_statement = 1000;",
            "ALTER SYSTEM SET log_checkpoints = on;",
            "ALTER SYSTEM SET log_connections = on;",
            "ALTER SYSTEM SET log_disconnections = on;",
        ]
        
        try:
            engine = create_engine(os.environ.get('DATABASE_URL'))
            with engine.connect() as conn:
                for sql in optimizations:
                    try:
                        conn.execute(text(sql))
                        logger.info(f"Applied optimization: {sql}")
                    except Exception as e:
                        logger.warning(f"Could not apply optimization {sql}: {e}")
                        
                # Reload configuration
                conn.execute(text("SELECT pg_reload_conf();"))
                logger.info("PostgreSQL configuration reloaded")
                
        except Exception as e:
            logger.error(f"Error optimizing database: {e}")
            raise
            
    def create_indexes(self):
        """Create production-optimized database indexes"""
        indexes = [
            # User table indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_active ON users(is_active);",
            
            # Parlay table indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parlays_user_id ON parlays(user_id);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parlays_created_at ON parlays(created_at);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parlays_status ON parlays(status);",
            
            # Sports cache indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sports_cache_sport_type ON sports_cache(sport_type);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sports_cache_last_updated ON sports_cache(last_updated);",
            
            # Pick'em pools indexes
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pickem_pools_owner_id ON pickem_pools(owner_id);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pickem_pools_created_at ON pickem_pools(created_at);",
            "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pickem_pools_is_active ON pickem_pools(is_active);",
        ]
        
        try:
            engine = create_engine(os.environ.get('DATABASE_URL'))
            with engine.connect() as conn:
                for sql in indexes:
                    try:
                        conn.execute(text(sql))
                        logger.info(f"Created index: {sql}")
                    except Exception as e:
                        logger.warning(f"Could not create index {sql}: {e}")
                        
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
            raise
            
    def backup_database(self, backup_path: str = None):
        """Create database backup"""
        if not backup_path:
            from datetime import datetime
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = f"/backups/prizmbets_backup_{timestamp}.sql"
            
        database_url = os.environ.get('DATABASE_URL')
        
        # Use pg_dump for backup
        import subprocess
        try:
            cmd = [
                'pg_dump',
                '--verbose',
                '--clean',
                '--no-acl',
                '--no-owner',
                '-f', backup_path,
                database_url
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                logger.info(f"Database backup created: {backup_path}")
                return backup_path
            else:
                logger.error(f"Backup failed: {result.stderr}")
                raise Exception(f"Backup failed: {result.stderr}")
                
        except Exception as e:
            logger.error(f"Error creating backup: {e}")
            raise
            
    def health_check(self):
        """Perform database health check"""
        try:
            engine = create_engine(os.environ.get('DATABASE_URL'))
            with engine.connect() as conn:
                # Test basic connectivity
                result = conn.execute(text("SELECT 1"))
                assert result.fetchone()[0] == 1
                
                # Check database size
                size_result = conn.execute(text("""
                    SELECT pg_size_pretty(pg_database_size(current_database()))
                """))
                db_size = size_result.fetchone()[0]
                
                # Check active connections
                conn_result = conn.execute(text("""
                    SELECT count(*) FROM pg_stat_activity 
                    WHERE state = 'active'
                """))
                active_connections = conn_result.fetchone()[0]
                
                logger.info(f"Database health check passed")
                logger.info(f"Database size: {db_size}")
                logger.info(f"Active connections: {active_connections}")
                
                return {
                    'status': 'healthy',
                    'database_size': db_size,
                    'active_connections': active_connections
                }
                
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                'status': 'unhealthy',
                'error': str(e)
            }

# Global instance
db_manager = ProductionDatabaseManager()

def init_production_database(app: Flask):
    """Initialize production database"""
    db_manager.init_app(app)
    
    if os.environ.get('FLASK_ENV') == 'production':
        try:
            db_manager.setup_production_database()
            db_manager.create_indexes()
            logger.info("Production database initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize production database: {e}")
            raise
            
    return db_manager