#!/usr/bin/env python3
"""
Security Test Suite for Free Tier Implementation
Tests for vulnerabilities, input validation, and security best practices
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models.user import db, User, UserUsage
from app.services.tier_service import TierService
import threading
import time

def test_input_validation():
    """Test input validation and injection prevention"""
    print("🛡️  Testing Input Validation")
    print("-" * 30)
    
    app = create_app('development')
    with app.app_context():
        # Test invalid user IDs
        test_cases = [
            (-1, "Negative user ID"),
            (0, "Zero user ID"),
            ("abc", "String user ID"),
            (None, "None user ID"),
            (999999, "Non-existent user ID")
        ]
        
        for user_id, description in test_cases:
            try:
                result = TierService.get_usage_status(user_id)
                if 'error' in result:
                    print(f"   ✅ {description}: Properly rejected")
                else:
                    print(f"   ❌ {description}: Should have been rejected!")
            except Exception as e:
                print(f"   ✅ {description}: Exception caught - {str(e)}")
        
        # Test invalid feature types
        test_user = User.query.filter_by(email="test@prizmbets.com").first()
        if test_user:
            invalid_features = [
                "'; DROP TABLE users; --",
                "<script>alert('xss')</script>",
                "../../etc/passwd",
                "invalid_feature",
                ""
            ]
            
            for feature in invalid_features:
                can_access, result = TierService.check_feature_access(test_user.id, feature)
                if 'error' in result:
                    print(f"   ✅ Invalid feature '{feature[:20]}...': Properly rejected")
                else:
                    print(f"   ❌ Invalid feature '{feature[:20]}...': Should have been rejected!")

def test_race_conditions():
    """Test race condition handling in usage tracking"""
    print("\n🏃 Testing Race Condition Prevention")
    print("-" * 35)
    
    app = create_app('development')
    
    def create_usage_record(user_id, thread_id):
        """Function to create usage record in a thread"""
        with app.app_context():
            try:
                usage = UserUsage.get_or_create_today(user_id)
                print(f"   Thread {thread_id}: Created/Retrieved usage record {usage.id}")
                return usage.id
            except Exception as e:
                print(f"   Thread {thread_id}: Error - {str(e)}")
                return None
    
    with app.app_context():
        # Create test user
        test_user = User.query.filter_by(email="race_test@test.com").first()
        if not test_user:
            test_user = User(
                email="race_test@test.com",
                password="test123",
                name="Race Test User"
            )
            db.session.add(test_user)
            db.session.commit()
        
        # Remove existing usage record
        existing_usage = UserUsage.query.filter_by(user_id=test_user.id).first()
        if existing_usage:
            db.session.delete(existing_usage)
            db.session.commit()
        
        # Start multiple threads to create usage records simultaneously
        threads = []
        results = []
        
        for i in range(5):
            thread = threading.Thread(
                target=lambda i=i: results.append(create_usage_record(test_user.id, i))
            )
            threads.append(thread)
        
        # Start all threads at once
        for thread in threads:
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # Check if only one usage record was created
        usage_count = UserUsage.query.filter_by(user_id=test_user.id).count()
        if usage_count == 1:
            print(f"   ✅ Race condition handled: Only 1 usage record created")
        else:
            print(f"   ❌ Race condition issue: {usage_count} usage records created")

def test_authorization_bypass():
    """Test for authorization bypass attempts"""
    print("\n🔐 Testing Authorization Controls")
    print("-" * 32)
    
    app = create_app('development')
    with app.app_context():
        # Create test users with different tiers
        free_user = User.query.filter_by(email="free@prizmbets.com").first()
        
        if free_user:
            # Test legitimate usage
            usage = UserUsage.get_or_create_today(free_user.id)
            
            # Use up all free evaluations
            for i in range(3):
                result = TierService.track_feature_usage(free_user.id, 'parlay_evaluations')
                if result.get('success'):
                    print(f"   Usage {i+1}: ✅ Tracked successfully")
            
            # Try to exceed limit
            result = TierService.track_feature_usage(free_user.id, 'parlay_evaluations')
            if not result.get('success'):
                print("   ✅ Limit enforcement: Additional usage properly blocked")
            else:
                print("   ❌ Limit bypass: Should have been blocked!")
            
            # Test tier escalation attempt (shouldn't work without proper payment)
            can_access, tier_info = TierService.check_feature_access(free_user.id, 'parlay_evaluations')
            if not can_access and tier_info.get('upgrade_required'):
                print("   ✅ Tier enforcement: Upgrade required message shown")
            else:
                print("   ❌ Tier bypass: Should require upgrade!")

def test_data_exposure():
    """Test for sensitive data exposure"""
    print("\n🔍 Testing Data Exposure Prevention")
    print("-" * 34)
    
    app = create_app('development')
    with app.app_context():
        test_user = User.query.filter_by(email="test@prizmbets.com").first()
        
        if test_user:
            # Get usage status
            usage_status = TierService.get_usage_status(test_user.id)
            
            # Check that sensitive data is not exposed
            sensitive_fields = ['password', 'password_hash', 'verification_token', 'jwt_secret']
            
            def check_nested_dict(data, path=""):
                for key, value in data.items():
                    current_path = f"{path}.{key}" if path else key
                    
                    if any(sensitive in key.lower() for sensitive in sensitive_fields):
                        print(f"   ❌ Sensitive data exposed: {current_path}")
                        return False
                    
                    if isinstance(value, dict):
                        if not check_nested_dict(value, current_path):
                            return False
                
                return True
            
            if check_nested_dict(usage_status):
                print("   ✅ No sensitive data exposed in usage status")
            
            # Test tier information
            tier_info = TierService.get_all_tiers()
            if check_nested_dict(tier_info):
                print("   ✅ No sensitive data exposed in tier information")

if __name__ == "__main__":
    print("🔒 PRIZMBETS SECURITY AUDIT")
    print("="*50)
    
    test_input_validation()
    test_race_conditions()
    test_authorization_bypass()
    test_data_exposure()
    
    print("\n🎉 Security Audit Complete!")
    print("="*50)