#!/usr/bin/env python3
"""
Mock subscription server for SmartBets 2.0
Provides subscription tier data without requiring Stripe integration
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004'])

# Mock subscription tiers data
SUBSCRIPTION_TIERS = {
    'free': {
        'name': 'Free Plan',
        'price': 0,
        'features': [
            'basic parlay analysis',
            'limited odds comparison',
            'community insights'
        ],
        'monthly_evaluations': 10,
        'description': 'Perfect for getting started with smart betting'
    },
    'pro': {
        'name': 'Pro Plan',
        'price': 19.99,
        'features': [
            'advanced AI analysis',
            'comprehensive odds comparison',
            'real-time notifications',
            'priority customer support',
            'advanced statistics',
            'profit tracking'
        ],
        'monthly_evaluations': 500,
        'description': 'Ideal for serious bettors who want professional insights'
    },
    'premium': {
        'name': 'Premium Plan',
        'price': 39.99,
        'features': [
            'all pro features',
            'expert betting strategies',
            'personalized recommendations',
            'risk management tools',
            'live betting alerts',
            'exclusive market insights',
            'white-glove support'
        ],
        'monthly_evaluations': 'unlimited',
        'description': 'For professional bettors and serious enthusiasts'
    }
}

@app.route('/')
def home():
    return jsonify({
        'message': 'SmartBets 2.0 - Subscription Service',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': [
            '/api/payments/subscription/tiers',
            '/api/payments/subscription/create',
            '/api/payments/subscription/status'
        ]
    })

@app.route('/health')
def health():
    return jsonify({
        'status': 'healthy',
        'service': 'Subscription Mock Service'
    })

@app.route('/api/payments/subscription/tiers', methods=['GET'])
def get_subscription_tiers():
    """Get available subscription tiers"""
    try:
        logger.info("Fetching subscription tiers")
        
        return jsonify({
            'success': True,
            'tiers': SUBSCRIPTION_TIERS,
            'total_tiers': len(SUBSCRIPTION_TIERS),
            'currency': 'USD'
        })
        
    except Exception as e:
        logger.error(f"Error fetching tiers: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch subscription tiers'
        }), 500

@app.route('/api/payments/subscription/create', methods=['POST'])
def create_subscription():
    """Mock subscription creation"""
    try:
        data = request.get_json()
        tier = data.get('tier', 'free')
        
        if tier not in SUBSCRIPTION_TIERS:
            return jsonify({
                'success': False,
                'error': 'Invalid subscription tier'
            }), 400
        
        logger.info(f"Creating mock subscription for tier: {tier}")
        
        # Mock successful subscription creation
        return jsonify({
            'success': True,
            'subscription': {
                'tier': tier,
                'status': 'active',
                'created_at': '2025-08-05T21:00:00Z',
                'next_billing_date': '2025-09-05T21:00:00Z',
                'price': SUBSCRIPTION_TIERS[tier]['price']
            },
            'message': f'Successfully subscribed to {SUBSCRIPTION_TIERS[tier]["name"]}',
            'mock': True
        })
        
    except Exception as e:
        logger.error(f"Error creating subscription: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to create subscription'
        }), 500

@app.route('/api/payments/subscription/status/<user_id>', methods=['GET'])
def get_subscription_status(user_id):
    """Get user's subscription status"""
    try:
        logger.info(f"Fetching subscription status for user: {user_id}")
        
        # Mock user subscription status
        return jsonify({
            'success': True,
            'subscription': {
                'tier': 'free',
                'status': 'active',
                'evaluations_used': 3,
                'evaluations_remaining': 7,
                'next_billing_date': None,
                'can_upgrade': True
            },
            'available_upgrades': ['pro', 'premium']
        })
        
    except Exception as e:
        logger.error(f"Error fetching subscription status: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Failed to fetch subscription status'
        }), 500

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Subscription endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Subscription service error'}), 500

if __name__ == '__main__':
    print("=" * 60)
    print("STARTING SMARTBETS 2.0 SUBSCRIPTION MOCK SERVICE")
    print("=" * 60)
    print("Server: http://localhost:5003")
    print("Features: Mock subscription tiers, creation, status")
    print("Note: This is a mock service for development/testing")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5003)