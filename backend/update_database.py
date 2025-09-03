#!/usr/bin/env python3
"""
Database update script to add missing columns to existing tables
"""

from app import create_app
from app.models.user import db, User, UserProfile, UserSession
import sqlite3
import os

def update_database():
    """Update database schema to match current models"""
    app = create_app()
    
    with app.app_context():
        # Get the database URI
        db_uri = app.config['SQLALCHEMY_DATABASE_URI']
        db_path = db_uri.replace('sqlite:///', '')
        
        print(f"Updating database at: {db_path}")
        
        # Connect to the database directly
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        try:
            # Check existing columns in users table
            cursor.execute("PRAGMA table_info(users);")
            columns = [column[1] for column in cursor.fetchall()]
            print(f"Existing columns in users table: {columns}")
            
            # Add missing columns to users table (without UNIQUE constraint initially)
            missing_columns = [
                ('firebase_uid', 'TEXT'),
                ('registration_method', 'TEXT DEFAULT "email" NOT NULL'),
                ('is_email_verified', 'BOOLEAN DEFAULT 0 NOT NULL'),
                ('verification_token', 'TEXT'),
                ('password_reset_token', 'TEXT'),
                ('password_reset_expires', 'TIMESTAMP')
            ]
            
            for column_name, column_def in missing_columns:
                if column_name not in columns:
                    try:
                        cursor.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_def};")
                        print(f"Added column {column_name} to users table")
                    except sqlite3.OperationalError as e:
                        if "duplicate column name" in str(e).lower():
                            print(f"Column {column_name} already exists")
                        else:
                            print(f"Error adding column {column_name}: {e}")
            
            # Update password_hash to be nullable for Firebase users
            # SQLite doesn't support ALTER COLUMN directly, so we'll need to recreate the table
            cursor.execute("PRAGMA table_info(users);")
            original_columns = cursor.fetchall()
            
            # Check if password_hash is nullable
            password_hash_nullable = False
            for col in original_columns:
                if col[1] == 'password_hash' and col[3] == 0:  # notnull = 0 means nullable
                    password_hash_nullable = True
                    break
            
            if not password_hash_nullable:
                print("Making password_hash nullable for Firebase users...")
                
                # Backup data
                cursor.execute("CREATE TABLE users_backup AS SELECT * FROM users;")
                
                # Drop and recreate users table with nullable password_hash
                cursor.execute("DROP TABLE users;")
                
                cursor.execute("""
                CREATE TABLE users (
                    id INTEGER PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT,  -- Made nullable
                    name TEXT NOT NULL,
                    firebase_uid TEXT,
                    registration_method TEXT DEFAULT 'email' NOT NULL,
                    is_email_verified BOOLEAN DEFAULT 0 NOT NULL,
                    is_active BOOLEAN DEFAULT 1 NOT NULL,
                    is_verified BOOLEAN DEFAULT 0 NOT NULL,
                    subscription_tier TEXT DEFAULT 'free' NOT NULL,
                    subscription_status TEXT DEFAULT 'active' NOT NULL,
                    stripe_customer_id TEXT UNIQUE,
                    stripe_subscription_id TEXT,
                    last_payment_date TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    last_login_at TIMESTAMP,
                    verification_token TEXT,
                    password_reset_token TEXT,
                    password_reset_expires TIMESTAMP
                );
                """)
                
                # Restore data, handling missing columns
                cursor.execute("""
                INSERT INTO users (id, email, password_hash, name, firebase_uid, registration_method, 
                                 is_email_verified, is_active, is_verified, subscription_tier, 
                                 subscription_status, stripe_customer_id, stripe_subscription_id, 
                                 last_payment_date, created_at, updated_at, last_login_at, 
                                 verification_token, password_reset_token, password_reset_expires)
                SELECT id, email, password_hash, name, 
                       COALESCE(firebase_uid, NULL) as firebase_uid,
                       COALESCE(registration_method, 'email') as registration_method,
                       COALESCE(is_email_verified, 0) as is_email_verified,
                       COALESCE(is_active, 1) as is_active,
                       COALESCE(is_verified, 0) as is_verified,
                       COALESCE(subscription_tier, 'free') as subscription_tier,
                       COALESCE(subscription_status, 'active') as subscription_status,
                       stripe_customer_id, stripe_subscription_id, last_payment_date,
                       COALESCE(created_at, CURRENT_TIMESTAMP) as created_at,
                       COALESCE(updated_at, CURRENT_TIMESTAMP) as updated_at,
                       last_login_at, 
                       COALESCE(verification_token, NULL) as verification_token,
                       COALESCE(password_reset_token, NULL) as password_reset_token,
                       COALESCE(password_reset_expires, NULL) as password_reset_expires
                FROM users_backup;
                """)
                
                # Drop backup table
                cursor.execute("DROP TABLE users_backup;")
                print("Updated users table to make password_hash nullable")
            
            # Create indexes
            try:
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_firebase_uid ON users(firebase_uid);")
                cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
                print("Created indexes")
            except Exception as e:
                print(f"Error creating indexes: {e}")
            
            # Commit changes
            conn.commit()
            print("Database update completed successfully!")
            
        except Exception as e:
            conn.rollback()
            print(f"Database update error: {e}")
            raise
        finally:
            conn.close()

if __name__ == "__main__":
    update_database()