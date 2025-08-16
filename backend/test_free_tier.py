#!/usr/bin/env python3
"""
Test script for Free Tier Logic
Tests the tier service and usage tracking functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models.user import db, User, UserUsage
from app.services.tier_service import TierService
import requests
import json

def test_tier_service():
    """Test the tier service functionality"""
    app = create_app('development')
    
    with app.app_context():
        print("🧪 Testing Free Tier Logic")
        print("=" * 50)
        
        # Create test user
        test_email = "freetier@test.com"
        existing_user = User.query.filter_by(email=test_email).first()
        if existing_user:
            db.session.delete(existing_user)
            db.session.commit()
        
        test_user = User(
            email=test_email,
            password="test123",
            name="Free Tier Tester"
        )
        db.session.add(test_user)
        db.session.commit()
        
        print(f"✅ Created test user: {test_user.email} (ID: {test_user.id})")
        print(f"   Subscription tier: {test_user.subscription_tier}")
        
        # Test 1: Get initial usage status
        print("\n📊 Test 1: Initial Usage Status")
        usage_status = TierService.get_usage_status(test_user.id)
        print(f"   Result: {json.dumps(usage_status, indent=2)}")
        
        # Test 2: Check feature access (should be allowed initially)
        print("\n🔓 Test 2: Feature Access Check")
        can_access, tier_info = TierService.check_feature_access(test_user.id, 'parlay_evaluations')
        print(f"   Can access: {can_access}")
        print(f"   Tier info: {json.dumps(tier_info, indent=2)}")
        
        # Test 3: Track usage 3 times (free limit)
        print("\n📈 Test 3: Track Usage (3 times)")
        for i in range(3):
            usage_result = TierService.track_feature_usage(test_user.id, 'parlay_evaluations')
            print(f"   Usage {i+1}: {usage_result}")
        
        # Test 4: Try to use feature after limit
        print("\n🚫 Test 4: Access After Limit")
        can_access, tier_info = TierService.check_feature_access(test_user.id, 'parlay_evaluations')
        print(f"   Can access: {can_access}")
        print(f"   Tier info: {json.dumps(tier_info, indent=2)}")
        
        # Test 5: Get upgrade recommendations
        print("\n💡 Test 5: Upgrade Recommendations")
        recommendations = TierService.get_upgrade_recommendations(test_user.id)
        print(f"   Recommendations: {json.dumps(recommendations, indent=2)}")
        
        # Test 6: Test Pro user (unlimited)
        print("\n🎯 Test 6: Pro User Test")
        test_user.subscription_tier = 'pro'
        db.session.commit()
        
        can_access, tier_info = TierService.check_feature_access(test_user.id, 'parlay_evaluations')
        print(f"   Pro user can access: {can_access}")
        print(f"   Pro tier info: {json.dumps(tier_info, indent=2)}")
        
        print("\n🎉 All tests completed!")

def test_api_endpoints():
    """Test the API endpoints"""
    print("\n🌐 Testing API Endpoints")
    print("=" * 50)
    
    base_url = "http://localhost:5001/api"
    
    # Test demo endpoint
    print("📡 Testing demo endpoint...")
    demo_data = {
        "bets": [
            {
                "team": "Lakers",
                "bet_type": "moneyline",
                "odds": -150,
                "amount": 100
            }
        ],
        "total_amount": 100
    }
    
    try:
        response = requests.post(f"{base_url}/demo", json=demo_data)
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # Test tiers endpoint
    print("\n📊 Testing tiers endpoint...")
    try:
        response = requests.get(f"{base_url}/tiers")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    print("🚀 PrizmBets Free Tier Testing")
    print("Make sure the backend server is NOT running for database tests")
    
    # Test tier service
    test_tier_service()
    
    # Uncomment to test API endpoints (requires running server)
    # print("\n" + "="*50)
    # print("To test API endpoints, start the server with: python run.py")
    # print("Then run this script again with --api flag")
    
    if "--api" in sys.argv:
        test_api_endpoints()