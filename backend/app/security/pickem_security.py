#!/usr/bin/env python3
"""
NFL Pick'em Pools Security and Anti-Cheating System
Comprehensive security measures for SmartBets 2.0 Pick'em
"""

import hashlib
import hmac
import secrets
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
import sqlite3
import logging
from functools import wraps
from flask import request, jsonify, g

logger = logging.getLogger(__name__)

class PickEmSecurityManager:
    """Comprehensive security manager for Pick'em pools"""
    
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.security_key = secrets.token_hex(32)
        self.max_pick_attempts = 5  # Max pick submission attempts per minute
        self.pick_window_minutes = 1
        
    def validate_pick_integrity(self, pick_data: Dict, user_id: int, pool_id: int) -> Tuple[bool, str]:
        """
        Validate pick data integrity and prevent tampering
        """
        try:
            required_fields = ['game_id', 'selected_team']
            
            # Check required fields
            for field in required_fields:
                if field not in pick_data:
                    return False, f"Missing required field: {field}"
            
            # Validate data types
            if not isinstance(pick_data['game_id'], int):
                return False, "Invalid game_id format"
                
            if not isinstance(pick_data['selected_team'], str):
                return False, "Invalid selected_team format"
            
            # Check for suspicious patterns
            if len(pick_data['selected_team']) > 50:
                return False, "Team name too long"
                
            # Validate confidence points if present
            if 'confidence_points' in pick_data:
                confidence = pick_data['confidence_points']
                if not isinstance(confidence, int) or confidence < 1 or confidence > 16:
                    return False, "Invalid confidence points"
            
            return True, "Valid"
            
        except Exception as e:
            logger.error(f"Pick validation error: {e}")
            return False, "Validation failed"
    
    def check_pick_deadline(self, game_id: int, game_time: str) -> bool:
        """
        Ensure picks are submitted before game deadline
        """
        try:
            # Parse game time
            if game_time:
                game_datetime = datetime.fromisoformat(game_time.replace('Z', '+00:00'))
                current_time = datetime.utcnow().replace(tzinfo=game_datetime.tzinfo)
                
                # Picks must be submitted at least 5 minutes before game start
                deadline = game_datetime - timedelta(minutes=5)
                
                if current_time >= deadline:
                    logger.warning(f"Late pick attempt for game {game_id}")
                    return False
            
            return True
            
        except Exception as e:
            logger.error(f"Deadline check error: {e}")
            return False
    
    def detect_rapid_fire_submissions(self, user_id: int, pool_id: int) -> bool:
        """
        Detect and prevent rapid-fire pick submissions
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check submissions in last minute
            one_minute_ago = (datetime.utcnow() - timedelta(minutes=self.pick_window_minutes)).isoformat()
            
            cursor.execute("""
                SELECT COUNT(*) FROM pick_submission_log 
                WHERE user_id = ? AND pool_id = ? AND created_at > ?
            """, (user_id, pool_id, one_minute_ago))
            
            recent_attempts = cursor.fetchone()[0]
            conn.close()
            
            if recent_attempts >= self.max_pick_attempts:
                logger.warning(f"Rate limit exceeded for user {user_id}")
                return True  # Detected rapid fire
                
            return False
            
        except Exception as e:
            logger.error(f"Rate limiting check error: {e}")
            return False
    
    def log_pick_submission(self, user_id: int, pool_id: int, pick_data: Dict, ip_address: str = None):
        """
        Log all pick submissions for audit trail
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Create audit log table if not exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS pick_submission_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    pool_id INTEGER NOT NULL,
                    game_id INTEGER,
                    selected_team TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at TEXT NOT NULL,
                    data_hash TEXT
                )
            """)
            
            # Create data hash for integrity
            pick_string = f"{pick_data.get('game_id', '')}{pick_data.get('selected_team', '')}{user_id}{pool_id}"
            data_hash = hashlib.sha256(pick_string.encode()).hexdigest()
            
            cursor.execute("""
                INSERT INTO pick_submission_log 
                (user_id, pool_id, game_id, selected_team, ip_address, user_agent, created_at, data_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                pool_id,
                pick_data.get('game_id'),
                pick_data.get('selected_team'),
                ip_address,
                request.headers.get('User-Agent', '') if request else '',
                datetime.utcnow().isoformat(),
                data_hash
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Pick logging error: {e}")
    
    def detect_suspicious_patterns(self, user_id: int, pool_id: int) -> List[str]:
        """
        Detect suspicious betting patterns that might indicate cheating
        """
        suspicious_indicators = []
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check for identical pick patterns across multiple users
            cursor.execute("""
                SELECT DISTINCT up2.user_id 
                FROM user_picks up1
                JOIN user_picks up2 ON up1.game_id = up2.game_id 
                    AND up1.selected_team = up2.selected_team
                    AND up1.pool_id = up2.pool_id
                    AND up1.week_id = up2.week_id
                WHERE up1.user_id = ? AND up1.pool_id = ? 
                    AND up2.user_id != up1.user_id
                GROUP BY up2.user_id
                HAVING COUNT(*) > 10
            """, (user_id, pool_id))
            
            duplicate_users = cursor.fetchall()
            if duplicate_users:
                suspicious_indicators.append("Identical pick patterns detected")
            
            # Check for last-minute pick changes (potential insider info)
            cursor.execute("""
                SELECT COUNT(*) FROM pick_submission_log
                WHERE user_id = ? AND pool_id = ? 
                    AND created_at > datetime('now', '-30 minutes')
            """, (user_id, pool_id))
            
            recent_changes = cursor.fetchone()[0]
            if recent_changes > 3:
                suspicious_indicators.append("Excessive last-minute changes")
            
            # Check for impossible win streaks (statistical anomaly)
            cursor.execute("""
                SELECT COUNT(*) as correct_picks, 
                       COUNT(*) as total_picks
                FROM user_picks 
                WHERE user_id = ? AND pool_id = ? AND is_correct = 1
            """, (user_id, pool_id))
            
            pick_stats = cursor.fetchone()
            if pick_stats and pick_stats[0] > 0:
                win_rate = pick_stats[0] / pick_stats[1] if pick_stats[1] > 0 else 0
                if win_rate > 0.85 and pick_stats[1] > 20:  # 85%+ over 20+ picks
                    suspicious_indicators.append("Statistically improbable win rate")
            
            conn.close()
            
            if suspicious_indicators:
                logger.warning(f"Suspicious patterns detected for user {user_id}: {suspicious_indicators}")
            
            return suspicious_indicators
            
        except Exception as e:
            logger.error(f"Pattern detection error: {e}")
            return []
    
    def validate_pool_membership(self, user_id: int, pool_id: int) -> bool:
        """
        Validate user is legitimate member of pool
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT role, is_active, joined_at 
                FROM pool_memberships 
                WHERE user_id = ? AND pool_id = ?
            """, (user_id, pool_id))
            
            membership = cursor.fetchone()
            conn.close()
            
            if not membership:
                return False
            
            role, is_active, joined_at = membership
            
            # Check if membership is active
            if not is_active:
                return False
            
            # Check for brand new accounts making picks immediately
            if joined_at:
                join_time = datetime.fromisoformat(joined_at)
                time_since_join = datetime.utcnow() - join_time
                
                if time_since_join.total_seconds() < 300:  # 5 minutes
                    logger.warning(f"New account {user_id} making immediate picks")
            
            return True
            
        except Exception as e:
            logger.error(f"Membership validation error: {e}")
            return False
    
    def generate_pick_token(self, user_id: int, pool_id: int, game_id: int) -> str:
        """
        Generate secure token for pick submission to prevent CSRF
        """
        timestamp = str(int(time.time()))
        data = f"{user_id}:{pool_id}:{game_id}:{timestamp}"
        signature = hmac.new(
            self.security_key.encode(),
            data.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return f"{data}:{signature}"
    
    def validate_pick_token(self, token: str, user_id: int, pool_id: int, game_id: int) -> bool:
        """
        Validate pick submission token
        """
        try:
            parts = token.split(':')
            if len(parts) != 4:
                return False
            
            token_user_id, token_pool_id, token_game_id, timestamp, signature = parts
            
            # Check if IDs match
            if int(token_user_id) != user_id or int(token_pool_id) != pool_id or int(token_game_id) != game_id:
                return False
            
            # Check timestamp (token valid for 1 hour)
            token_time = int(timestamp)
            current_time = int(time.time())
            
            if current_time - token_time > 3600:  # 1 hour
                return False
            
            # Validate signature
            data = f"{token_user_id}:{token_pool_id}:{token_game_id}:{timestamp}"
            expected_signature = hmac.new(
                self.security_key.encode(),
                data.encode(),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"Token validation error: {e}")
            return False

def security_required(f):
    """
    Decorator for Pick'em endpoints requiring security validation
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Initialize security manager
            security = PickEmSecurityManager('pickem_pools.db')
            
            # Basic request validation
            if not hasattr(g, 'current_user_id'):
                return jsonify({'error': 'Authentication required'}), 401
            
            user_id = g.current_user_id
            
            # Rate limiting check
            if hasattr(g, 'json_data') and 'pool_id' in g.json_data:
                pool_id = g.json_data['pool_id']
                
                if security.detect_rapid_fire_submissions(user_id, pool_id):
                    return jsonify({'error': 'Rate limit exceeded'}), 429
                
                # Validate pool membership
                if not security.validate_pool_membership(user_id, pool_id):
                    return jsonify({'error': 'Invalid pool membership'}), 403
                
                # Check for suspicious patterns
                suspicious_patterns = security.detect_suspicious_patterns(user_id, pool_id)
                if suspicious_patterns:
                    logger.warning(f"Suspicious activity from user {user_id}: {suspicious_patterns}")
            
            # Attach security manager to request context
            g.security_manager = security
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Security validation error: {e}")
            return jsonify({'error': 'Security validation failed'}), 500
    
    return decorated_function