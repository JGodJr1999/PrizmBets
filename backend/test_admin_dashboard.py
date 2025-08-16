#!/usr/bin/env python3
"""
Test script for Admin Dashboard
Tests admin service functionality and security
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models.user import db, User, UserUsage
from app.services.admin_service import AdminService
from app.services.tier_service import TierService
import json
from datetime import datetime, timezone

def test_admin_service():
    """Test the admin service functionality"""
    app = create_app('development')
    
    with app.app_context():
        print("🔧 Testing Admin Dashboard Service")
        print("=" * 50)
        
        # Test 1: Dashboard Overview
        print("\n📊 Test 1: Dashboard Overview")
        overview = AdminService.get_dashboard_overview()
        print(f"   Users: {overview.get('overview', {}).get('total_users', 0)}")
        print(f"   Active today: {overview.get('overview', {}).get('active_users_today', 0)}")
        print(f"   Revenue estimate: ${overview.get('overview', {}).get('revenue_estimate_monthly', 0)}")
        
        # Test 2: User Analytics
        print("\n👥 Test 2: User Analytics")
        user_analytics = AdminService.get_user_analytics(limit=5)
        if 'users' in user_analytics:
            print(f"   Retrieved {len(user_analytics['users'])} users")
            print(f"   Total users in system: {user_analytics.get('pagination', {}).get('total', 0)}")
            
            # Show first user as example
            if user_analytics['users']:
                first_user = user_analytics['users'][0]
                print(f"   Example user: {first_user['email']} (Tier: {first_user['tier']})")
        
        # Test 3: System Health
        print("\n🏥 Test 3: System Health")
        health = AdminService.get_system_health()
        if 'system_health' in health:
            print(f"   Database: {health['system_health'].get('database', 'unknown')}")
            print(f"   Active sessions: {health['system_health'].get('active_sessions', 0)}")
            print(f"   Overall status: {health['system_health'].get('status', 'unknown')}")
        
        # Test 4: Usage Trends
        print("\n📈 Test 4: Usage Trends (7 days)")
        trends = AdminService.get_usage_trends(days=7)
        if 'usage_trends' in trends:
            print(f"   Data points: {len(trends['usage_trends'])}")
            total_parlays = sum(day['parlay_evaluations'] for day in trends['usage_trends'])
            print(f"   Total parlays (7d): {total_parlays}")
        
        # Test 5: User Detail
        print("\n🔍 Test 5: User Detail")
        admin_user = User.query.filter_by(email="admin@prizmbets.com").first()
        if admin_user:
            detail = AdminService.get_user_detail(admin_user.id)
            if 'user' in detail:
                print(f"   User: {detail['user']['email']}")
                print(f"   Tier: {detail['user']['subscription_tier']}")
                print(f"   Usage history records: {len(detail.get('usage_history', []))}")
        
        # Test 6: Admin Permissions
        print("\n🔒 Test 6: Admin Permissions")
        if admin_user:
            has_admin = AdminService.check_admin_permission(admin_user, 'user_management')
            print(f"   Admin user has permissions: {has_admin}")
        
        regular_user = User.query.filter_by(email="test@prizmbets.com").first()
        if regular_user:
            has_regular = AdminService.check_admin_permission(regular_user, 'user_management')
            print(f"   Regular user has permissions: {has_regular}")

def test_admin_security():
    """Test admin security controls"""
    print("\n🔐 Testing Admin Security Controls")
    print("=" * 40)
    
    app = create_app('development')
    with app.app_context():
        # Test unauthorized access
        print("\n🚫 Test 1: Unauthorized Access")
        regular_user = User.query.filter_by(email="free@prizmbets.com").first()
        if regular_user:
            has_permission = AdminService.check_admin_permission(regular_user, 'user_management')
            if not has_permission:
                print("   ✅ Unauthorized user properly blocked")
            else:
                print("   ❌ Unauthorized user allowed access!")
        
        # Test input validation
        print("\n🛡️ Test 2: Input Validation")
        invalid_user_id_tests = [-1, 0, "abc", None, 999999]
        for invalid_id in invalid_user_id_tests:
            try:
                result = AdminService.get_user_detail(invalid_id)
                if 'error' in result:
                    print(f"   ✅ Invalid ID {invalid_id}: Properly rejected")
                else:
                    print(f"   ❌ Invalid ID {invalid_id}: Should have been rejected!")
            except Exception as e:
                print(f"   ✅ Invalid ID {invalid_id}: Exception caught - {str(e)}")
        
        # Test pagination limits
        print("\n📄 Test 3: Pagination Security")
        # Test extreme limits
        result = AdminService.get_user_analytics(limit=9999, offset=-1)
        if 'users' in result:
            actual_limit = len(result['users'])
            if actual_limit <= 1000:  # Should be capped at 1000
                print(f"   ✅ Pagination limit enforced: {actual_limit} users returned")
            else:
                print(f"   ❌ Pagination limit bypass: {actual_limit} users returned")

def create_sample_data():
    """Create sample data for dashboard testing"""
    app = create_app('development')
    
    with app.app_context():
        print("\n📋 Creating Sample Dashboard Data")
        print("-" * 35)
        
        # Create some usage data for existing users
        users = User.query.limit(3).all()
        
        for user in users:
            # Create today's usage
            usage = UserUsage.get_or_create_today(user.id)
            
            # Add some sample usage
            if user.email.startswith('admin'):
                usage.parlay_evaluations = 5
                usage.odds_comparisons = 15
            elif user.email.startswith('test'):
                usage.parlay_evaluations = 2
                usage.odds_comparisons = 8
            else:
                usage.parlay_evaluations = 3  # Hit the free limit
                usage.odds_comparisons = 7
            
            db.session.commit()
            print(f"   ✅ Created usage data for {user.email}")

if __name__ == "__main__":
    print("🎛️ PRIZMBETS ADMIN DASHBOARD TESTING")
    print("="*50)
    
    # Create sample data first
    create_sample_data()
    
    # Test admin service
    test_admin_service()
    
    # Test security
    test_admin_security()
    
    print("\n🎉 Admin Dashboard Testing Complete!")
    print("="*50)
    print("💡 To test API endpoints:")
    print("   1. Start server: python run.py")
    print("   2. Login as admin@prizmbets.com")
    print("   3. Access: GET /api/admin/dashboard")
    print("   4. Try: GET /api/admin/users")
    print("   5. Check: GET /api/admin/system/health")