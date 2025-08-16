#!/usr/bin/env python3
"""
Usage tracking API routes
"""

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.tier_service import TierService
from app.models.user import User, UserUsage
# from app.utils.decorators import validate_json  # Not needed for current routes
from marshmallow import Schema, fields
from datetime import datetime, timedelta

usage_bp = Blueprint('usage', __name__)

class UsageResponseSchema(Schema):
    parlay_evaluations = fields.Integer()
    parlay_limit = fields.Integer()
    odds_comparisons = fields.Integer() 
    odds_limit = fields.Integer()
    tier = fields.String()
    date = fields.Date()

@usage_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_usage():
    """Get current user's daily usage"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Get today's usage
        usage_record = UserUsage.get_or_create_today(user_id)
        
        # Get tier limits
        tier_limits = TierService.get_tier_limits(user.tier)
        
        usage_data = {
            'parlay_evaluations': usage_record.parlay_evaluations,
            'parlay_limit': tier_limits['parlay_evaluations'],
            'odds_comparisons': usage_record.odds_comparisons,
            'odds_limit': tier_limits['odds_comparisons'],
            'tier': user.tier,
            'date': usage_record.date.isoformat()
        }
        
        return jsonify(usage_data), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@usage_bp.route('/history', methods=['GET'])
@jwt_required()
def get_usage_history():
    """Get user's usage history"""
    try:
        user_id = get_jwt_identity()
        days = request.args.get('days', 30, type=int)
        
        # Limit to reasonable range
        days = min(max(days, 1), 90)
        
        start_date = datetime.utcnow().date() - timedelta(days=days-1)
        
        usage_records = UserUsage.query.filter(
            UserUsage.user_id == user_id,
            UserUsage.date >= start_date
        ).order_by(UserUsage.date.desc()).all()
        
        schema = UsageResponseSchema(many=True)
        usage_history = []
        
        for record in usage_records:
            usage_history.append({
                'parlay_evaluations': record.parlay_evaluations,
                'odds_comparisons': record.odds_comparisons,
                'date': record.date.isoformat()
            })
        
        return jsonify({
            'usage_history': usage_history,
            'total_days': len(usage_history)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@usage_bp.route('/increment/parlay', methods=['POST'])
@jwt_required()
def increment_parlay_usage():
    """Increment parlay evaluation usage"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user can perform this action
        can_evaluate, remaining = TierService.can_evaluate_parlay(user_id)
        
        if not can_evaluate:
            return jsonify({
                'error': 'Daily parlay evaluation limit reached',
                'limit_reached': True
            }), 429
        
        # Increment usage
        usage_record = UserUsage.get_or_create_today(user_id)
        usage_record.parlay_evaluations += 1
        usage_record.save()
        
        return jsonify({
            'success': True,
            'remaining_evaluations': remaining - 1
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@usage_bp.route('/increment/odds', methods=['POST'])
@jwt_required()
def increment_odds_usage():
    """Increment odds comparison usage"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Check if user can perform this action
        can_compare, remaining = TierService.can_compare_odds(user_id)
        
        if not can_compare:
            return jsonify({
                'error': 'Daily odds comparison limit reached',
                'limit_reached': True
            }), 429
        
        # Increment usage
        usage_record = UserUsage.get_or_create_today(user_id)
        usage_record.odds_comparisons += 1
        usage_record.save()
        
        return jsonify({
            'success': True,
            'remaining_comparisons': remaining - 1
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500