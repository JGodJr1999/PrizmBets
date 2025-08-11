#!/usr/bin/env python3
"""Simple Stripe integration test without database dependencies"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import stripe
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# Initialize Stripe
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY', 'sk_test_mock_key_for_testing')

@app.route('/')
def home():
    return jsonify({
        'message': 'SmartBets 2.0 Stripe Test',
        'status': 'success',
        'stripe_configured': bool(os.environ.get('STRIPE_SECRET_KEY'))
    })

@app.route('/api/payments/subscription/tiers', methods=['GET'])
def get_subscription_tiers():
    """Get available subscription tiers"""
    return jsonify({
        'success': True,
        'tiers': {
            'free': {
                'name': 'Free',
                'price': 0,
                'monthly_evaluations': 5,
                'features': [
                    'Basic odds comparison',
                    'Parlay builder',
                    '5 parlay evaluations per month'
                ]
            },
            'pro': {
                'name': 'Pro',
                'price': 9.99,
                'monthly_evaluations': 'unlimited',
                'features': [
                    'Unlimited parlay evaluations',
                    'Advanced analytics dashboard',
                    'Line movement alerts',
                    'Best odds highlighting',
                    'Savings calculator'
                ]
            },
            'premium': {
                'name': 'Premium',  
                'price': 29.99,
                'monthly_evaluations': 'unlimited',
                'features': [
                    'All Pro features',
                    'Personal betting consultant',
                    'Custom betting strategies',
                    'Priority customer support',
                    'Advanced AI recommendations'
                ]
            }
        }
    })

@app.route('/api/payments/subscription/create', methods=['POST'])
def create_subscription():
    """Test subscription creation"""
    data = request.get_json()
    tier = data.get('tier')
    
    if tier not in ['pro', 'premium']:
        return jsonify({'error': 'Invalid subscription tier'}), 400
    
    # Mock successful subscription creation
    return jsonify({
        'success': True,
        'subscription_id': f'sub_mock_{tier}_123',
        'client_secret': f'pi_mock_client_secret_for_{tier}',
        'message': f'Mock subscription created for {tier} tier'
    })

@app.route('/api/payments/subscription/status', methods=['GET']) 
def get_subscription_status():
    """Test subscription status"""
    return jsonify({
        'success': True,
        'subscription': {
            'user_id': 1,
            'subscription_tier': 'free',
            'monthly_limit': 5,
            'current_usage': 0,
            'billing_period_start': '2025-08-01T00:00:00Z',
            'billing_period_end': '2025-09-01T00:00:00Z'
        }
    })

@app.route('/api/payments/test-stripe', methods=['GET'])
def test_stripe_connection():
    """Test Stripe API connection"""
    try:
        # Try to list products (this will test API key)
        products = stripe.Product.list(limit=1)
        return jsonify({
            'success': True,
            'message': 'Stripe connection successful',
            'products_count': len(products.data)
        })
    except stripe.error.AuthenticationError:
        return jsonify({
            'success': False,
            'error': 'Stripe authentication failed - check API key'
        }), 401
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Stripe connection failed: {str(e)}'
        }), 500

if __name__ == '__main__':
    print("Starting Stripe Integration Test Server...")
    print("Available at: http://localhost:5003")
    print(f"Stripe Key Configured: {bool(os.environ.get('STRIPE_SECRET_KEY'))}")
    app.run(debug=True, host='0.0.0.0', port=5003)