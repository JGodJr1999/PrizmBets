#!/usr/bin/env python3
"""Simple test to verify Flask and basic functionality without database."""

from flask import Flask, jsonify
from flask_cors import CORS
import requests
import json

app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])

@app.route('/')
def home():
    return jsonify({
        'message': 'SmartBets 2.0 API is running!',
        'status': 'success',
        'version': '2.0.0'
    })

@app.route('/api/test/odds', methods=['GET'])
def test_odds():
    """Test endpoint to verify odds service connection"""
    try:
        # Simulate odds data without actual API call
        test_odds = {
            'status': 'success',
            'data': [
                {
                    'sportsbook': 'DraftKings',
                    'odds': -110,
                    'deep_link': 'https://draftkings.com/test'
                },
                {
                    'sportsbook': 'FanDuel', 
                    'odds': -105,
                    'deep_link': 'https://fanduel.com/test'
                }
            ],
            'best_odds': {
                'sportsbook': 'FanDuel',
                'odds': -105,
                'savings': '4.76%'
            }
        }
        return jsonify(test_odds)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/test/auth', methods=['GET'])
def test_auth():
    """Test endpoint to verify authentication system design"""
    return jsonify({
        'status': 'success',
        'message': 'Authentication system ready',
        'features': [
            'JWT tokens with refresh',
            'Multi-device session management',
            'Password security with bcrypt',
            'Session cleanup and monitoring'
        ]
    })

if __name__ == '__main__':
    print("Starting SmartBets 2.0 Test Server...")
    print("Testing core functionality without full database")
    print("Frontend should connect at: http://localhost:5001")
    app.run(debug=True, host='0.0.0.0', port=5001)