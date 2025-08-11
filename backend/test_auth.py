#!/usr/bin/env python3
"""
Test script for SmartBets 2.0 authentication system
Tests registration, login, token refresh, and other auth endpoints
"""

import requests
import json
import sys
import time

# Configuration
BASE_URL = 'http://localhost:5000'
TEST_EMAIL = 'testuser@smartbets.com'
TEST_PASSWORD = 'TestPassword123!'
TEST_NAME = 'Test User'

class AuthTester:
    def __init__(self, base_url):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        self.refresh_token = None
        self.user_id = None
    
    def test_health_check(self):
        """Test if the API is running"""
        print("🔍 Testing API health check...")
        try:
            response = self.session.get(f"{self.base_url}/health")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ API is healthy: {data}")
                return True
            else:
                print(f"❌ API health check failed: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API health check error: {str(e)}")
            return False
    
    def test_register(self):
        """Test user registration"""
        print("\n🔍 Testing user registration...")
        
        # First, try to delete existing test user (ignore errors)
        try:
            # Note: In production, you'd need an admin endpoint to delete users
            pass
        except:
            pass
        
        registration_data = {
            'email': TEST_EMAIL,
            'password': TEST_PASSWORD,
            'confirm_password': TEST_PASSWORD,
            'name': TEST_NAME,
            'terms_accepted': True,
            'marketing_emails': False
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/register",
                json=registration_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 201:
                data = response.json()
                print(f"✅ Registration successful: {data['message']}")
                self.user_id = data['user']['id']
                return True
            elif response.status_code == 409:
                print("ℹ️  User already exists, proceeding with login test")
                return True
            else:
                print(f"❌ Registration failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Registration error: {str(e)}")
            return False
    
    def test_login(self):
        """Test user login"""
        print("\n🔍 Testing user login...")
        
        login_data = {
            'email': TEST_EMAIL,
            'password': TEST_PASSWORD,
            'remember_me': True
        }
        
        try:
            response = self.session.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Login successful: {data['message']}")
                
                # Store tokens
                self.access_token = data['access_token']
                self.refresh_token = data['refresh_token']
                self.user_id = data['user']['id']
                
                print(f"   User ID: {self.user_id}")
                print(f"   Access token: {self.access_token[:50]}...")
                print(f"   Refresh token: {self.refresh_token[:50]}...")
                
                return True
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False
    
    def test_get_user_info(self):
        """Test getting current user info"""
        print("\n🔍 Testing get user info...")
        
        if not self.access_token:
            print("❌ No access token available")
            return False
        
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            response = self.session.get(
                f"{self.base_url}/api/auth/me",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ User info retrieved successfully")
                print(f"   Name: {data['user']['name']}")
                print(f"   Email: {data['user']['email']}")
                print(f"   Subscription: {data['user']['subscription_tier']}")
                return True
            else:
                print(f"❌ Get user info failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get user info error: {str(e)}")
            return False
    
    def test_token_refresh(self):
        """Test token refresh"""
        print("\n🔍 Testing token refresh...")
        
        if not self.refresh_token:
            print("❌ No refresh token available")
            return False
        
        try:
            headers = {
                'Authorization': f'Bearer {self.refresh_token}',
                'Content-Type': 'application/json'
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/refresh",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Token refresh successful")
                
                # Update access token
                old_token = self.access_token[:50] if self.access_token else 'None'
                self.access_token = data['access_token']
                new_token = self.access_token[:50]
                
                print(f"   Old token: {old_token}...")
                print(f"   New token: {new_token}...")
                
                return True
            else:
                print(f"❌ Token refresh failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Token refresh error: {str(e)}")
            return False
    
    def test_profile_update(self):
        """Test profile update"""
        print("\n🔍 Testing profile update...")
        
        if not self.access_token:
            print("❌ No access token available")
            return False
        
        profile_data = {
            'name': 'Updated Test User',
            'timezone': 'America/New_York',
            'favorite_sports': ['nfl', 'nba'],
            'preferred_sportsbooks': ['draftkings', 'fanduel'],
            'default_bet_amount': 50.00,
            'risk_tolerance': 'medium',
            'email_notifications': True
        }
        
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            response = self.session.put(
                f"{self.base_url}/api/auth/profile",
                json=profile_data,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Profile update successful")
                print(f"   Updated name: {data['user']['name']}")
                print(f"   Favorite sports: {data['profile']['favorite_sports']}")
                return True
            else:
                print(f"❌ Profile update failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Profile update error: {str(e)}")
            return False
    
    def test_sessions(self):
        """Test session management"""
        print("\n🔍 Testing session management...")
        
        if not self.access_token:
            print("❌ No access token available")
            return False
        
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            response = self.session.get(
                f"{self.base_url}/api/auth/sessions",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                sessions = data['sessions']
                print(f"✅ Sessions retrieved: {len(sessions)} active sessions")
                
                for i, session in enumerate(sessions[:3]):  # Show first 3
                    print(f"   Session {i+1}: IP {session.get('ip_address', 'unknown')}, "
                          f"Created: {session.get('created_at', 'unknown')[:19]}")
                
                return True
            else:
                print(f"❌ Get sessions failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get sessions error: {str(e)}")
            return False
    
    def test_logout(self):
        """Test user logout"""
        print("\n🔍 Testing user logout...")
        
        if not self.access_token:
            print("❌ No access token available")
            return False
        
        try:
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            response = self.session.post(
                f"{self.base_url}/api/auth/logout",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Logout successful: {data['message']}")
                
                # Clear tokens
                self.access_token = None
                self.refresh_token = None
                
                return True
            else:
                print(f"❌ Logout failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Logout error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all authentication tests"""
        print("SmartBets 2.0 Authentication System Test")
        print("=" * 50)
        
        tests = [
            ('Health Check', self.test_health_check),
            ('User Registration', self.test_register),
            ('User Login', self.test_login),
            ('Get User Info', self.test_get_user_info),
            ('Token Refresh', self.test_token_refresh),
            ('Profile Update', self.test_profile_update),
            ('Session Management', self.test_sessions),
            ('User Logout', self.test_logout),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
                time.sleep(0.5)  # Small delay between tests
            except Exception as e:
                print(f"❌ {test_name} failed with exception: {str(e)}")
        
        print("\n" + "=" * 50)
        print(f"Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All authentication tests passed successfully!")
            return True
        else:
            print(f"⚠️  {total - passed} test(s) failed")
            return False

if __name__ == '__main__':
    print("Make sure the Flask development server is running on http://localhost:5000")
    print("Run: python run.py")
    print()
    
    input("Press Enter when ready to start testing...")
    
    tester = AuthTester(BASE_URL)
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ Authentication system is working correctly!")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Check the server logs for more details.")
        sys.exit(1)