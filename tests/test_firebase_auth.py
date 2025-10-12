#!/usr/bin/env python3
"""
Test script for Firebase Authentication integration
Tests the deployed agent endpoints with proper authentication
"""

import requests
import json
import sys

# Your deployed function URLs
BASE_URL = "https://us-central1-smartbets-5c06f.cloudfunctions.net"

def test_agent_dashboard_auth():
    """Test agent dashboard requires authentication"""
    print("🧪 Testing agent dashboard authentication...")
    print("⚠️  Note: api_agents_dashboard not found in deployed functions")

    # Test if the function exists
    try:
        response = requests.get(f"{BASE_URL}/api_agents_dashboard", timeout=5)
        print(f"Dashboard response: {response.status_code} - {response.text[:100]}")
    except requests.exceptions.RequestException as e:
        print(f"Dashboard not accessible: {e}")

def test_agent_init_auth():
    """Test agent initialization requires authentication"""
    print("🧪 Testing agent initialization authentication...")

    response = requests.post(f"{BASE_URL}/api_agents_init")
    print(f"No auth: {response.status_code} - {response.text[:100]}")

def test_evaluate_auth():
    """Test parlay evaluation requires authentication"""
    print("🧪 Testing parlay evaluation authentication...")

    test_data = {
        "bets": [
            {
                "team": "Lakers",
                "opponent": "Warriors",
                "bet_type": "moneyline",
                "odds": -110
            }
        ]
    }

    response = requests.post(f"{BASE_URL}/api_evaluate", json=test_data)
    print(f"No auth: {response.status_code} - {response.text[:100]}")

def test_public_endpoints():
    """Test endpoints that should be publicly accessible"""
    print("🧪 Testing public endpoints...")

    # Test if functions are deployed and accessible
    try:
        response = requests.get(f"{BASE_URL}/api_agents_dashboard", timeout=10)
        print(f"Dashboard accessible: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Dashboard connection error: {e}")

if __name__ == "__main__":
    print("🚀 Testing Firebase Authentication Integration")
    print("=" * 50)

    test_public_endpoints()
    print()
    test_agent_dashboard_auth()
    print()
    test_agent_init_auth()
    print()
    test_evaluate_auth()

    print("\n✅ Authentication tests completed!")
    print("\n📝 Next Steps:")
    print("1. Set up service account in Google Cloud Console")
    print("2. Configure IAM permissions for function access")
    print("3. Test with valid Firebase tokens from frontend")