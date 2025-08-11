#!/usr/bin/env python3
"""
Database initialization script for SmartBets 2.0
Creates database tables and sets up initial data
"""

import os
import sys
from flask import Flask
from flask_migrate import init, migrate, upgrade

# Add the backend directory to Python path
backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)

from app import create_app
from app.models.user import db, User, UserProfile, BettingHistory, UserSession
from app.models.parlay import Parlay

def init_database():
    """Initialize database with tables and migrations"""
    
    app = create_app('development')
    
    with app.app_context():
        print("🚀 Initializing SmartBets 2.0 Database...")
        
        try:
            # Check if migrations directory exists
            migrations_dir = os.path.join(backend_dir, 'migrations')
            
            if not os.path.exists(migrations_dir):
                print("📁 Creating migrations directory...")
                init()
                print("✅ Migrations directory created")
            else:
                print("📁 Migrations directory already exists")
            
            # Create migration for current models
            print("📝 Creating database migration...")
            migrate(message="Initial database schema with authentication and parlay models")
            print("✅ Migration created successfully")
            
            # Apply migrations to create tables
            print("🔨 Applying migrations to create database tables...")
            upgrade()
            print("✅ Database tables created successfully")
            
            # Verify tables were created
            print("🔍 Verifying database tables...")
            inspector = db.inspect(db.engine)
            tables = inspector.get_table_names()
            
            expected_tables = ['users', 'user_profiles', 'betting_history', 'user_sessions', 'parlays']
            missing_tables = [table for table in expected_tables if table not in tables]
            
            if missing_tables:
                print(f"⚠️  Missing tables: {missing_tables}")
                return False
            else:
                print(f"✅ All expected tables created: {tables}")
            
            print("\n🎉 Database initialization completed successfully!")
            print("\n📊 Database Schema Summary:")
            print(f"   - Users table: Authentication and user management")
            print(f"   - User Profiles table: Extended user preferences and settings")
            print(f"   - Betting History table: Track parlay evaluations and results")
            print(f"   - User Sessions table: JWT token and session management")
            print(f"   - Parlays table: Store and track parlay bets")
            
            return True
            
        except Exception as e:
            print(f"❌ Error initializing database: {str(e)}")
            return False

def create_test_data():
    """Create some test data for development"""
    
    app = create_app('development')
    
    with app.app_context():
        print("\n🧪 Creating test data...")
        
        try:
            # Check if test user already exists
            test_user = User.query.filter_by(email='test@smartbets.com').first()
            
            if not test_user:
                # Create test user
                test_user = User(
                    email='test@smartbets.com',
                    password='TestPassword123!',
                    name='Test User'
                )
                test_user.is_verified = True
                db.session.add(test_user)
                db.session.commit()
                
                # Create test user profile
                test_profile = UserProfile(
                    user_id=test_user.id,
                    timezone='America/New_York',
                    favorite_sports=['nfl', 'nba'],
                    preferred_sportsbooks=['draftkings', 'fanduel'],
                    default_bet_amount=25.00,
                    risk_tolerance='medium'
                )
                db.session.add(test_profile)
                db.session.commit()
                
                print("✅ Test user created: test@smartbets.com (password: TestPassword123!)")
            else:
                print("ℹ️  Test user already exists")
            
            print("✅ Test data setup completed")
            return True
            
        except Exception as e:
            print(f"❌ Error creating test data: {str(e)}")
            db.session.rollback()
            return False

if __name__ == '__main__':
    print("SmartBets 2.0 Database Initialization")
    print("=" * 50)
    
    # Initialize database
    if init_database():
        # Create test data
        create_test_data()
        print("\n🎯 Next Steps:")
        print("   1. Run 'python run.py' to start the development server")
        print("   2. Test authentication endpoints at http://localhost:5000/api/auth/")
        print("   3. Use test@smartbets.com / TestPassword123! for testing")
    else:
        print("\n❌ Database initialization failed")
        sys.exit(1)