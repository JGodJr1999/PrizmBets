"""
SmartBets 2.0 - Payment Service with Stripe Integration
Handles subscription management, payment processing, and billing operations
"""

import stripe
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from flask import current_app
from ..models.user import User, db

# Load Stripe configuration
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

class SubscriptionTier:
    """Subscription tier definitions"""
    FREE = 'free'
    PRO = 'pro'
    PREMIUM = 'premium'
    
    PRICING = {
        FREE: {'price': 0, 'monthly_evaluations': 5, 'features': ['basic_odds', 'parlay_builder']},
        PRO: {'price': 999, 'monthly_evaluations': -1, 'features': ['unlimited_evaluations', 'advanced_analytics', 'line_movement']},  # $9.99
        PREMIUM: {'price': 2999, 'monthly_evaluations': -1, 'features': ['all_pro_features', 'personal_consultant', 'custom_strategies']}  # $29.99
    }

class PaymentService:
    """Stripe payment integration service"""
    
    def __init__(self):
        self.stripe = stripe
        
    def create_customer(self, user_id: int, email: str, name: str = None) -> Dict[str, Any]:
        """Create Stripe customer for user"""
        try:
            customer = self.stripe.Customer.create(
                email=email,
                name=name,
                metadata={'user_id': str(user_id)}
            )
            
            # Update user with Stripe customer ID
            user = User.query.get(user_id)
            if user:
                user.stripe_customer_id = customer.id
                db.session.commit()
            
            return {
                'success': True,
                'customer_id': customer.id,
                'customer': customer
            }
        except stripe.error.StripeError as e:
            current_app.logger.error(f"Stripe customer creation failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def create_subscription(self, user_id: int, tier: str) -> Dict[str, Any]:
        """Create subscription for user"""
        try:
            user = User.query.get(user_id)
            if not user or not user.stripe_customer_id:
                # Create customer if doesn't exist
                customer_result = self.create_customer(user_id, user.email, user.name)
                if not customer_result['success']:
                    return customer_result
            
            # Get price ID based on tier
            price_ids = {
                SubscriptionTier.PRO: os.environ.get('STRIPE_PRO_PRICE_ID'),
                SubscriptionTier.PREMIUM: os.environ.get('STRIPE_PREMIUM_PRICE_ID')
            }
            
            if tier not in price_ids:
                return {'success': False, 'error': 'Invalid subscription tier'}
            
            subscription = self.stripe.Subscription.create(
                customer=user.stripe_customer_id,
                items=[{'price': price_ids[tier]}],
                payment_behavior='default_incomplete',
                payment_settings={'save_default_payment_method': 'on_subscription'},
                expand=['latest_invoice.payment_intent'],
                metadata={'user_id': str(user_id), 'tier': tier}
            )
            
            # Update user subscription status
            user.subscription_tier = tier
            user.subscription_status = 'incomplete'
            user.stripe_subscription_id = subscription.id
            db.session.commit()
            
            return {
                'success': True,
                'subscription_id': subscription.id,
                'client_secret': subscription.latest_invoice.payment_intent.client_secret,
                'subscription': subscription
            }
            
        except stripe.error.StripeError as e:
            current_app.logger.error(f"Subscription creation failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def cancel_subscription(self, user_id: int) -> Dict[str, Any]:
        """Cancel user subscription"""
        try:
            user = User.query.get(user_id)
            if not user or not user.stripe_subscription_id:
                return {'success': False, 'error': 'No active subscription found'}
            
            subscription = self.stripe.Subscription.cancel(user.stripe_subscription_id)
            
            # Update user status
            user.subscription_status = 'canceled'
            user.subscription_tier = SubscriptionTier.FREE
            db.session.commit()
            
            return {
                'success': True,
                'subscription': subscription
            }
            
        except stripe.error.StripeError as e:
            current_app.logger.error(f"Subscription cancellation failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def update_subscription(self, user_id: int, new_tier: str) -> Dict[str, Any]:
        """Update user subscription tier"""
        try:
            user = User.query.get(user_id)
            if not user or not user.stripe_subscription_id:
                return {'success': False, 'error': 'No active subscription found'}
            
            # Get new price ID
            price_ids = {
                SubscriptionTier.PRO: os.environ.get('STRIPE_PRO_PRICE_ID'),
                SubscriptionTier.PREMIUM: os.environ.get('STRIPE_PREMIUM_PRICE_ID')
            }
            
            if new_tier not in price_ids:
                return {'success': False, 'error': 'Invalid subscription tier'}
            
            # Update subscription
            subscription = self.stripe.Subscription.retrieve(user.stripe_subscription_id)
            self.stripe.Subscription.modify(
                user.stripe_subscription_id,
                items=[{
                    'id': subscription['items']['data'][0].id,
                    'price': price_ids[new_tier],
                }],
                proration_behavior='immediate_with_remaining_time'
            )
            
            # Update user
            user.subscription_tier = new_tier
            db.session.commit()
            
            return {'success': True}
            
        except stripe.error.StripeError as e:
            current_app.logger.error(f"Subscription update failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def handle_webhook(self, event: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Stripe webhook events"""
        try:
            if event['type'] == 'invoice.payment_succeeded':
                self._handle_successful_payment(event['data']['object'])
            elif event['type'] == 'invoice.payment_failed':
                self._handle_failed_payment(event['data']['object'])
            elif event['type'] == 'customer.subscription.updated':
                self._handle_subscription_updated(event['data']['object'])
            elif event['type'] == 'customer.subscription.deleted':
                self._handle_subscription_deleted(event['data']['object'])
            
            return {'success': True}
            
        except Exception as e:
            current_app.logger.error(f"Webhook handling failed: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _handle_successful_payment(self, invoice: Dict[str, Any]):
        """Handle successful payment"""
        user_id = int(invoice['subscription_object']['metadata']['user_id'])
        user = User.query.get(user_id)
        
        if user:
            user.subscription_status = 'active'
            user.last_payment_date = datetime.utcnow()
            db.session.commit()
    
    def _handle_failed_payment(self, invoice: Dict[str, Any]):
        """Handle failed payment"""
        user_id = int(invoice['subscription_object']['metadata']['user_id'])
        user = User.query.get(user_id)
        
        if user:
            user.subscription_status = 'past_due'
            db.session.commit()
    
    def _handle_subscription_updated(self, subscription: Dict[str, Any]):
        """Handle subscription updates"""
        user_id = int(subscription['metadata']['user_id'])
        user = User.query.get(user_id)
        
        if user:
            user.subscription_status = subscription['status']
            db.session.commit()
    
    def _handle_subscription_deleted(self, subscription: Dict[str, Any]):
        """Handle subscription deletion"""
        user_id = int(subscription['metadata']['user_id'])
        user = User.query.get(user_id)
        
        if user:
            user.subscription_status = 'canceled'
            user.subscription_tier = SubscriptionTier.FREE
            db.session.commit()
    
    def get_usage_stats(self, user_id: int) -> Dict[str, Any]:
        """Get user usage statistics for billing"""
        user = User.query.get(user_id)
        if not user:
            return {'error': 'User not found'}
        
        # Calculate current month usage
        current_month = datetime.utcnow().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # This would query betting history for actual usage
        # For now, return mock data
        return {
            'user_id': user_id,
            'subscription_tier': user.subscription_tier,
            'monthly_limit': SubscriptionTier.PRICING[user.subscription_tier]['monthly_evaluations'],
            'current_usage': 0,  # Would be calculated from betting history
            'billing_period_start': current_month.isoformat(),
            'billing_period_end': (current_month + timedelta(days=32)).replace(day=1).isoformat()
        }
    
    def check_feature_access(self, user_id: int, feature: str) -> bool:
        """Check if user has access to specific feature"""
        user = User.query.get(user_id)
        if not user:
            return False
        
        tier_features = SubscriptionTier.PRICING[user.subscription_tier]['features']
        return feature in tier_features or 'all_features' in tier_features

# Initialize payment service
payment_service = PaymentService()