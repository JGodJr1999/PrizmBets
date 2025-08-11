#!/usr/bin/env python3
"""
Simple Authentication Server for SmartBets 2.0
Provides basic user authentication for testing Pick'em functionality
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
import secrets
import time
from datetime import datetime, timedelta
import sqlite3
import os

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'])

# Simple SQLite database for users
DB_PATH = 'auth_users.db'

def init_auth_database():
    """Initialize simple user database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    # Create active sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def hash_password(password):
    """Simple password hashing"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
    return f"{salt}:{password_hash.hex()}"

def verify_password(password, stored_hash):
    """Verify password against hash"""
    try:
        salt, hash_value = stored_hash.split(':')
        password_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000)
        return hash_value == password_hash.hex()
    except:
        return False

def generate_tokens():
    """Generate access and refresh tokens"""
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    return access_token, refresh_token

def validate_token(token):
    """Validate access token and return user info"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT u.id, u.name, u.email, s.expires_at 
            FROM users u 
            JOIN user_sessions s ON u.id = s.user_id 
            WHERE s.access_token = ?
        ''', (token,))
        
        result = cursor.fetchone()
        conn.close()
        
        if not result:
            return None
        
        user_id, name, email, expires_at = result
        
        # Check if token is expired
        if datetime.fromisoformat(expires_at) < datetime.utcnow():
            return None
        
        return {
            'id': user_id,
            'name': name,
            'email': email
        }
    except Exception as e:
        print(f"Token validation error: {e}")
        return None

@app.route('/api/register', methods=['POST'])
def register():
    """User registration"""
    try:
        data = request.get_json()
        
        if not data or 'email' not in data or 'password' not in data or 'name' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        name = data['name'].strip()
        
        # Basic validation
        if len(password) < 6:
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        if '@' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            conn.close()
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        password_hash = hash_password(password)
        created_at = datetime.utcnow().isoformat()
        
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, created_at)
            VALUES (?, ?, ?, ?)
        ''', (name, email, password_hash, created_at))
        
        user_id = cursor.lastrowid
        
        # Generate tokens
        access_token, refresh_token = generate_tokens()
        expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        
        cursor.execute('''
            INSERT INTO user_sessions (user_id, access_token, refresh_token, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, access_token, refresh_token, expires_at, created_at))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Registration successful',
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        })
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'Registration failed'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({'error': 'Email and password required'}), 400
        
        email = data['email'].lower().strip()
        password = data['password']
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Find user
        cursor.execute('SELECT id, name, email, password_hash FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        
        if not user or not verify_password(password, user[3]):
            conn.close()
            return jsonify({'error': 'Invalid email or password'}), 401
        
        user_id, name, email, _ = user
        
        # Generate tokens
        access_token, refresh_token = generate_tokens()
        expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        created_at = datetime.utcnow().isoformat()
        
        # Store session
        cursor.execute('''
            INSERT INTO user_sessions (user_id, access_token, refresh_token, expires_at, created_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (user_id, access_token, refresh_token, expires_at, created_at))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Login successful',
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            },
            'access_token': access_token,
            'refresh_token': refresh_token
        })
        
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': 'Login failed'}), 500

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Get current user info"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header required'}), 401
        
        token = auth_header.split(' ')[1]
        user = validate_token(token)
        
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        return jsonify({
            'success': True,
            'user': user
        })
        
    except Exception as e:
        print(f"Get user error: {e}")
        return jsonify({'error': 'Failed to get user'}), 500

@app.route('/api/auth/refresh', methods=['POST'])
def refresh_token():
    """Refresh access token"""
    try:
        data = request.get_json()
        if not data or 'refresh_token' not in data:
            return jsonify({'error': 'Refresh token required'}), 400
        
        refresh_token = data['refresh_token']
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Find session with refresh token
        cursor.execute('''
            SELECT u.id, u.name, u.email, s.id as session_id
            FROM users u 
            JOIN user_sessions s ON u.id = s.user_id 
            WHERE s.refresh_token = ?
        ''', (refresh_token,))
        
        result = cursor.fetchone()
        
        if not result:
            conn.close()
            return jsonify({'error': 'Invalid refresh token'}), 401
        
        user_id, name, email, session_id = result
        
        # Generate new tokens
        new_access_token, new_refresh_token = generate_tokens()
        expires_at = (datetime.utcnow() + timedelta(hours=24)).isoformat()
        
        # Update session
        cursor.execute('''
            UPDATE user_sessions 
            SET access_token = ?, refresh_token = ?, expires_at = ?
            WHERE id = ?
        ''', (new_access_token, new_refresh_token, expires_at, session_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'user': {
                'id': user_id,
                'name': name,
                'email': email
            },
            'access_token': new_access_token,
            'refresh_token': new_refresh_token
        })
        
    except Exception as e:
        print(f"Refresh token error: {e}")
        return jsonify({'error': 'Token refresh failed'}), 500

@app.route('/api/logout', methods=['POST'])
def logout():
    """User logout"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization header required'}), 401
        
        token = auth_header.split(' ')[1]
        
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Delete session
        cursor.execute('DELETE FROM user_sessions WHERE access_token = ?', (token,))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Logged out successfully'
        })
        
    except Exception as e:
        print(f"Logout error: {e}")
        return jsonify({'error': 'Logout failed'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'SmartBets Auth Server',
        'timestamp': datetime.utcnow().isoformat()
    })

if __name__ == '__main__':
    print("=" * 60)
    print("SMARTBETS 2.0 AUTHENTICATION SERVER")
    print("=" * 60)
    print("Server: http://localhost:5001")
    print("Endpoints: /api/register, /api/login, /api/auth/me, /api/logout")
    print("Database: SQLite (auth_users.db)")
    print("=" * 60)
    
    # Initialize database
    init_auth_database()
    print("[OK] Authentication database initialized")
    
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5001)