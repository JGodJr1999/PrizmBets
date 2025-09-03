#!/usr/bin/env python3
"""
Database initialization script for PrizmBets
Creates the SQLite database and all required tables
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app import create_app, db
from app.models.user import User, UserProfile, UserSession
from dotenv import load_dotenv

def init_database():
    """Initialize the database with all tables"""
    
    # Load environment variables
    load_dotenv()
    
    # Create Flask app
    app = create_app()
    
    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        
        print("All tables created successfully!")
        
        print("Database initialization completed successfully!")
        print(f"Database location: {app.config['SQLALCHEMY_DATABASE_URI']}")

if __name__ == '__main__':
    init_database()