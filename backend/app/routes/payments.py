"""
SmartBets 2.0 - Payment Routes
Handles subscription management, billing, and Stripe webhook endpoints
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import stripe
import os
from ..services.payment_service import payment_service, SubscriptionTier
from ..utils.validation import validate_json, validate_required_fields
from ..utils.auth_decorators import require_subscription

payments_bp = Blueprint('payments', __name__)

@payments_bp.route('/subscription/tiers', methods=['GET'])
def get_subscription_tiers():
    """Get available subscription tiers and pricing"""
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

@payments_bp.route('/subscription/create', methods=['POST'])
@jwt_required()
@validate_json
def create_subscription():
    """Create new subscription for user"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Validate required fields
    if not validate_required_fields(data, ['tier']):
        return jsonify({'error': 'Missing required field: tier'}), 400
    
    tier = data['tier']
    if tier not in [SubscriptionTier.PRO, SubscriptionTier.PREMIUM]:
        return jsonify({'error': 'Invalid subscription tier'}), 400
    
    result = payment_service.create_subscription(user_id, tier)
    
    if result['success']:
        return jsonify({
            'success': True,
            'subscription_id': result['subscription_id'],
            'client_secret': result['client_secret'],
            'message': f'Subscription created successfully for {tier} tier'
        })
    else:
        return jsonify({'error': result['error']}), 400

@payments_bp.route('/subscription/cancel', methods=['POST'])
@jwt_required()
def cancel_subscription():
    """Cancel user subscription"""
    user_id = get_jwt_identity()
    
    result = payment_service.cancel_subscription(user_id)
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': 'Subscription canceled successfully'
        })
    else:
        return jsonify({'error': result['error']}), 400

@payments_bp.route('/subscription/update', methods=['POST'])
@jwt_required()
@validate_json
def update_subscription():
    """Update user subscription tier"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not validate_required_fields(data, ['tier']):
        return jsonify({'error': 'Missing required field: tier'}), 400
    
    tier = data['tier']
    if tier not in [SubscriptionTier.PRO, SubscriptionTier.PREMIUM]:
        return jsonify({'error': 'Invalid subscription tier'}), 400
    
    result = payment_service.update_subscription(user_id, tier)
    
    if result['success']:
        return jsonify({
            'success': True,
            'message': f'Subscription updated to {tier} tier'
        })
    else:
        return jsonify({'error': result['error']}), 400

@payments_bp.route('/subscription/status', methods=['GET'])
@jwt_required()
def get_subscription_status():
    """Get user subscription status and usage"""
    user_id = get_jwt_identity()
    
    usage_stats = payment_service.get_usage_stats(user_id)
    
    return jsonify({
        'success': True,
        'subscription': usage_stats
    })

@payments_bp.route('/payment-intent', methods=['POST'])
@jwt_required()
@validate_json
def create_payment_intent():
    """Create payment intent for one-time payments"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not validate_required_fields(data, ['amount', 'currency']):
        return jsonify({'error': 'Missing required fields: amount, currency'}), 400
    
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(data['amount'] * 100),  # Convert to cents
            currency=data['currency'],
            metadata={'user_id': str(user_id)}
        )
        
        return jsonify({
            'success': True,
            'client_secret': intent.client_secret
        })
        
    except stripe.error.StripeError as e:
        current_app.logger.error(f"Payment intent creation failed: {str(e)}")
        return jsonify({'error': str(e)}), 400

@payments_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """Handle Stripe webhook events"""
    payload = request.get_data(as_text=True)
    sig_header = request.headers.get('Stripe-Signature')
    endpoint_secret = os.environ.get('STRIPE_WEBHOOK_SECRET')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        current_app.logger.error(f"Invalid payload: {str(e)}")
        return jsonify({'error': 'Invalid payload'}), 400
    except stripe.error.SignatureVerificationError as e:
        current_app.logger.error(f"Invalid signature: {str(e)}")
        return jsonify({'error': 'Invalid signature'}), 400
    
    # Handle the event
    result = payment_service.handle_webhook(event)
    
    if result['success']:
        return jsonify({'success': True})
    else:
        return jsonify({'error': result['error']}), 400

@payments_bp.route('/feature-access/<feature>', methods=['GET'])
@jwt_required()
def check_feature_access(feature):
    """Check if user has access to specific feature"""
    user_id = get_jwt_identity()
    
    has_access = payment_service.check_feature_access(user_id, feature)
    
    return jsonify({
        'success': True,
        'feature': feature,
        'has_access': has_access
    })

# Premium feature example
@payments_bp.route('/premium/analytics', methods=['GET'])
@jwt_required()
@require_subscription(['pro', 'premium'])
def get_premium_analytics():
    """Premium analytics endpoint (Pro/Premium only)"""
    user_id = get_jwt_identity()
    
    # Mock premium analytics data
    analytics = {
        'success': True,
        'analytics': {
            'total_bets_analyzed': 150,
            'average_odds_improvement': '8.5%',
            'total_savings': '$347.50',
            'win_rate_improvement': '12%',
            'best_performing_sports': ['NFL', 'NBA', 'MLB'],
            'monthly_roi': '15.2%'
        },
        'recommendations': [
            'Focus on NFL spreads for better value',
            'Avoid betting on heavy favorites in NBA',
            'Consider more MLB totals bets'
        ]
    }
    
    return jsonify(analytics)

@payments_bp.route('/premium/personal-consultant', methods=['POST'])
@jwt_required()
@require_subscription(['premium'])
def get_personal_consultation():
    """Personal consultant feature (Premium only)"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Mock personal consultant response
    consultation = {
        'success': True,
        'consultant_response': {
            'message': 'Based on your betting history, I recommend focusing on underdogs in NFL games this week.',
            'specific_recommendations': [
                'Kansas City Chiefs +3.5 vs Buffalo Bills',
                'Under 47.5 in Dolphins vs Jets game',
                'Player prop: Josh Allen over 1.5 TD passes'
            ],
            'bankroll_advice': 'Limit each bet to 2% of your total bankroll',
            'next_consultation': '2025-08-11T10:00:00Z'
        }
    }
    
    return jsonify(consultation)