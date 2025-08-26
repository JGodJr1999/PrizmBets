#!/usr/bin/env python3
"""
Test script for the email parser consent flow
"""
import requests
import json

BASE_URL = 'http://localhost:5001'

def test_consent_flow():
    """Test the complete consent flow"""
    print("🧪 Testing Email Parser Consent Flow\n")
    
    # 1. Test client IP endpoint (no auth required)
    print("1. Testing client IP endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/user/client-ip")
        print(f"✅ Status: {response.status_code}")
        print(f"✅ Response: {response.json()}\n")
    except Exception as e:
        print(f"❌ Error: {e}\n")
    
    # 2. Create a test user (simplified registration)
    print("2. Testing user registration...")
    registration_data = {
        "name": "Test User",
        "email": "testuser123@example.com",
        "password": "TestPass123!",
        "confirm_password": "TestPass123!",
        "terms_accepted": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/auth/register", json=registration_data)
        print(f"📝 Registration Status: {response.status_code}")
        if response.status_code == 201:
            print("✅ Registration successful")
        else:
            print(f"⚠️ Registration response: {response.json()}")
    except Exception as e:
        print(f"❌ Registration Error: {e}")
    
    # 3. Login to get token
    print("\n3. Testing login...")
    login_data = {
        "email": "testuser123@example.com",
        "password": "TestPass123!"
    }
    
    token = None
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
        print(f"🔐 Login Status: {response.status_code}")
        if response.status_code == 200:
            login_result = response.json()
            token = login_result.get('access_token')
            print("✅ Login successful")
            print(f"🔑 Token: {token[:20]}...")
            print(f"🔑 Full response: {login_result}")
            
            # Try to decode the token to see what's in it
            try:
                import jwt
                decoded = jwt.decode(token, options={"verify_signature": False})
                print(f"🔍 Token contents: {decoded}")
            except Exception as e:
                print(f"⚠️ Could not decode token: {e}")
        else:
            print(f"⚠️ Login response: {response.json()}")
            return
    except Exception as e:
        print(f"❌ Login Error: {e}")
        return
    
    if not token:
        print("❌ No token received, cannot continue")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # 4. Test email tracking status (should be disabled initially)
    print("\n4. Testing initial email tracking status...")
    try:
        response = requests.get(f"{BASE_URL}/api/user/email-tracking-status", headers=headers)
        print(f"📊 Status: {response.status_code}")
        print(f"📊 Response: {response.json()}\n")
    except Exception as e:
        print(f"❌ Error: {e}\n")
    
    # 5. Test enabling email tracking (with consent)
    print("5. Testing consent recording and email tracking enable...")
    consent_data = {
        "consented": True,
        "timestamp": "2025-01-25T12:00:00Z",
        "ip_address": "127.0.0.1",
        "user_agent": "Test Script"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/user/enable-email-tracking", 
                               json=consent_data, headers=headers)
        print(f"✅ Enable Status: {response.status_code}")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Email tracking enabled!")
            print(f"📧 Unique email: {result.get('unique_email')}")
            print(f"🆔 Consent ID: {result.get('consent_id')}")
        else:
            print(f"⚠️ Enable response: {response.json()}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 6. Test email tracking status (should be enabled now)
    print("\n6. Testing email tracking status after enabling...")
    try:
        response = requests.get(f"{BASE_URL}/api/user/email-tracking-status", headers=headers)
        print(f"📊 Status: {response.status_code}")
        print(f"📊 Response: {response.json()}\n")
    except Exception as e:
        print(f"❌ Error: {e}\n")
    
    # 7. Test getting user consents
    print("7. Testing user consents retrieval...")
    try:
        response = requests.get(f"{BASE_URL}/api/user/consents", headers=headers)
        print(f"📋 Status: {response.status_code}")
        result = response.json()
        print(f"📋 Consents count: {result.get('count', 0)}")
        if result.get('consents'):
            for consent in result['consents']:
                print(f"  - Feature: {consent.get('feature')}")
                print(f"    Status: {'Active' if consent.get('consented') else 'Revoked'}")
                print(f"    Created: {consent.get('created_at')}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 8. Test storing bet data
    print("\n8. Testing bet data storage...")
    bet_data = {
        "bet_data": {
            "teams": ["Team A", "Team B"],
            "bet_type": "parlay",
            "odds": "+150",
            "wager": 100.00,
            "sportsbook": "DraftKings"
        },
        "source": "manual_entry",
        "sportsbook": "DraftKings"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/user/store-bet", 
                               json=bet_data, headers=headers)
        print(f"💰 Status: {response.status_code}")
        result = response.json()
        print(f"💰 Response: {result}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 9. Test getting bet data
    print("\n9. Testing bet data retrieval...")
    try:
        response = requests.get(f"{BASE_URL}/api/user/bet-data?decrypt=true", headers=headers)
        print(f"🎲 Status: {response.status_code}")
        result = response.json()
        print(f"🎲 Bet data count: {result.get('count', 0)}")
        print(f"🎲 Decrypted: {result.get('decrypted', False)}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # 10. Test consent audit log
    print("\n10. Testing consent audit log...")
    try:
        response = requests.get(f"{BASE_URL}/api/user/consent-audit", headers=headers)
        print(f"📝 Status: {response.status_code}")
        result = response.json()
        print(f"📝 Audit log count: {result.get('count', 0)}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n🎉 Consent flow testing completed!")

if __name__ == "__main__":
    test_consent_flow()