#!/usr/bin/env python3
"""Test Stripe payment integration endpoints"""

from flask import Flask, jsonify
from flask_cors import CORS
from app.routes.payments import payments_bp
from app.services.payment_service import SubscriptionTier
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

# Register payments blueprint
app.register_blueprint(payments_bp, url_prefix='/api/payments')

@app.route('/')
def home():
    return jsonify({
        'message': 'PrizmBets Payment Test Server',
        'status': 'success',
        'stripe_configured': bool(os.environ.get('STRIPE_SECRET_KEY')),
        'endpoints': [
            '/api/payments/subscription/tiers',
            '/api/payments/subscription/create',
            '/api/payments/subscription/status'
        ]
    })

@app.route('/api/health')
def health():
    return jsonify({
        'status': 'healthy',
        'payments': 'enabled',
        'stripe_key_configured': bool(os.environ.get('STRIPE_SECRET_KEY'))
    })

if __name__ == '__main__':
    print("Starting PrizmBets Payment Test Server...")
    print("Testing Stripe integration endpoints")
    print("Available at: http://localhost:5002")
    app.run(debug=True, host='0.0.0.0', port=5002)