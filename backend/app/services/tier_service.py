"""
PrizmBets - Subscription Tier and Usage Management Service
Handles free tier limits, usage tracking, and upgrade prompts
"""

import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from flask import g
from sqlalchemy import func

from app.models.user import User, UserUsage, db

logger = logging.getLogger(__name__)

class TierService:
    """Service to manage subscription tiers and usage limits"""
    
    # Tier configuration
    TIER_LIMITS = {
        'free': {
            'parlay_evaluations': 3,
            'odds_comparisons': 10,
            'name': 'Free',
            'price': 0,
            'features': [
                '3 daily parlay evaluations',
                '10 daily odds comparisons',
                'Basic AI insights',
                'Community access'
            ]
        },
        'pro': {
            'parlay_evaluations': -1,  # unlimited
            'odds_comparisons': -1,
            'name': 'Pro',
            'price': 9.99,
            'features': [
                'Unlimited parlay evaluations',
                'Unlimited odds comparisons', 
                'Advanced AI insights',
                'Priority support',
                'Export betting history',
                'Custom alerts'
            ]
        },
        'premium': {
            'parlay_evaluations': -1,
            'odds_comparisons': -1,
            'name': 'Premium',
            'price': 19.99,
            'features': [
                'All Pro features',
                'Real-time odds alerts',
                'Exclusive betting strategies',
                'Personal betting consultant',
                'White-label API access',
                'Advanced analytics dashboard'
            ]
        }
    }
    
    @staticmethod
    def get_user_tier_info(user: User) -> Dict[str, Any]:
        """Get comprehensive tier information for a user"""
        tier = user.subscription_tier or 'free'
        tier_config = TierService.TIER_LIMITS.get(tier, TierService.TIER_LIMITS['free'])
        
        return {
            'current_tier': tier,
            'tier_name': tier_config['name'],
            'monthly_price': tier_config['price'],
            'features': tier_config['features'],
            'limits': {
                'parlay_evaluations': tier_config['parlay_evaluations'],
                'odds_comparisons': tier_config['odds_comparisons']
            }
        }
    
    @staticmethod
    def get_usage_status(user_id: int) -> Dict[str, Any]:
        """Get current usage status for a user"""
        try:
            user = User.query.get(user_id)
            if not user:
                return {'error': 'User not found'}
            
            # Get today's usage
            usage = UserUsage.get_or_create_today(user_id)
            tier = user.subscription_tier or 'free'
            
            # Calculate remaining usage for each feature
            remaining_parlays = usage.get_remaining_usage('parlay_evaluations', tier)
            remaining_odds = usage.get_remaining_usage('odds_comparisons', tier)
            
            return {
                'user_id': user_id,
                'tier': tier,
                'date': usage.date.isoformat(),
                'usage': {
                    'parlay_evaluations': {
                        'used': usage.parlay_evaluations,
                        'remaining': remaining_parlays,
                        'limit': TierService.TIER_LIMITS[tier]['parlay_evaluations'],
                        'unlimited': remaining_parlays == -1
                    },
                    'odds_comparisons': {
                        'used': usage.odds_comparisons,
                        'remaining': remaining_odds,
                        'limit': TierService.TIER_LIMITS[tier]['odds_comparisons'],
                        'unlimited': remaining_odds == -1
                    }
                },
                'can_upgrade': tier == 'free',
                'next_tier': 'pro' if tier == 'free' else 'premium' if tier == 'pro' else None
            }
            
        except Exception as e:
            logger.error(f"Error getting usage status for user {user_id}: {str(e)}")
            return {'error': 'Unable to retrieve usage status'}
    
    @staticmethod
    def check_feature_access(user_id: int, feature_type: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Check if user can access a feature and return usage info
        Returns: (can_access, usage_info)
        """
        try:
            # Validate inputs
            if not isinstance(user_id, int) or user_id <= 0:
                return False, {'error': 'Invalid user ID'}
            
            # Whitelist allowed feature types
            allowed_features = ['parlay_evaluations', 'odds_comparisons']
            if feature_type not in allowed_features:
                logger.warning(f"Invalid feature type attempted: {feature_type}")
                return False, {'error': 'Invalid feature type'}
            
            user = User.query.get(user_id)
            if not user:
                return False, {'error': 'User not found'}
            
            # Get usage record
            usage = UserUsage.get_or_create_today(user_id)
            tier = user.subscription_tier or 'free'
            
            # Check if feature is allowed
            can_use = usage.can_use_feature(feature_type, tier)
            remaining = usage.get_remaining_usage(feature_type, tier)
            
            usage_info = {
                'can_access': can_use,
                'tier': tier,
                'feature': feature_type,
                'used_today': getattr(usage, feature_type, 0),
                'remaining': remaining,
                'unlimited': remaining == -1,
                'limit': TierService.TIER_LIMITS[tier].get(feature_type, 0)
            }
            
            # Add upgrade info if limit reached
            if not can_use and tier == 'free':
                usage_info['upgrade_required'] = True
                limit_value = TierService.TIER_LIMITS.get(tier, {}).get(feature_type, 0)
                feature_name = feature_type.replace('_', ' ')
                usage_info['upgrade_message'] = f"You've reached your daily limit of {limit_value} {feature_name}. Upgrade to Pro for unlimited access!"
                usage_info['upgrade_tier'] = 'pro'
                usage_info['upgrade_price'] = TierService.TIER_LIMITS['pro']['price']
            
            return can_use, usage_info
            
        except Exception as e:
            logger.error(f"Error checking feature access for user {user_id}, feature {feature_type}: {str(e)}")
            return False, {'error': 'Unable to check feature access'}
    
    @staticmethod
    def track_feature_usage(user_id: int, feature_type: str) -> Dict[str, Any]:
        """Track usage of a feature and return updated usage info"""
        try:
            # Validate inputs
            if not isinstance(user_id, int) or user_id <= 0:
                return {'error': 'Invalid user ID'}
            
            # Whitelist allowed feature types
            allowed_features = ['parlay_evaluations', 'odds_comparisons']
            if feature_type not in allowed_features:
                logger.warning(f"Invalid feature type attempted: {feature_type}")
                return {'error': 'Invalid feature type'}
            
            user = User.query.get(user_id)
            if not user:
                return {'error': 'User not found'}
            
            # Get usage record
            usage = UserUsage.get_or_create_today(user_id)
            tier = user.subscription_tier or 'free'
            
            # Check if user can use feature before incrementing
            if not usage.can_use_feature(feature_type, tier):
                return {
                    'success': False,
                    'error': 'Feature limit reached',
                    'upgrade_required': tier == 'free'
                }
            
            # Increment usage
            if feature_type == 'parlay_evaluations':
                new_count = usage.increment_parlay_usage()
            elif feature_type == 'odds_comparisons':
                new_count = usage.increment_odds_usage()
            else:
                return {'error': f'Unknown feature type: {feature_type}'}
            
            # Get updated status
            remaining = usage.get_remaining_usage(feature_type, tier)
            
            # Send email notification if approaching or at limit (free tier only)
            if tier == 'free':
                limit = TierService.TIER_LIMITS[tier].get(feature_type, 0)
                if limit > 0:  # Only for limited features
                    try:
                        from app import mail
                        from app.services.email_service import EmailService
                        
                        email_service = EmailService(mail)
                        
                        # Check if notification should be sent
                        should_notify = False
                        if new_count >= limit:  # Limit reached
                            should_notify = True
                        elif new_count >= int(limit * 0.8):  # 80% reached
                            should_notify = True
                        
                        if should_notify:
                            email_service.send_usage_limit_notification(
                                user, feature_type, new_count, limit
                            )
                            logger.info(f"Usage notification sent to {user.email} for {feature_type}")
                            
                    except Exception as email_error:
                        logger.warning(f"Failed to send usage notification to {user.email}: {str(email_error)}")
                        # Don't fail the usage tracking if email fails
            
            return {
                'success': True,
                'feature': feature_type,
                'used_today': new_count,
                'remaining': remaining,
                'unlimited': remaining == -1,
                'tier': tier
            }
            
        except Exception as e:
            logger.error(f"Error tracking usage for user {user_id}, feature {feature_type}: {str(e)}")
            return {'error': 'Unable to track usage'}
    
    @staticmethod
    def get_upgrade_recommendations(user_id: int) -> Dict[str, Any]:
        """Get personalized upgrade recommendations based on usage patterns"""
        try:
            user = User.query.get(user_id)
            if not user or user.subscription_tier != 'free':
                return {'recommendations': []}
            
            # Get usage history for last 7 days
            seven_days_ago = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            seven_days_ago = seven_days_ago.replace(day=seven_days_ago.day - 7)
            
            usage_history = UserUsage.query.filter(
                UserUsage.user_id == user_id,
                UserUsage.date >= seven_days_ago
            ).all()
            
            # Analyze usage patterns
            total_parlays = sum(u.parlay_evaluations for u in usage_history)
            total_odds = sum(u.odds_comparisons for u in usage_history)
            days_hit_limit = sum(1 for u in usage_history if u.parlay_evaluations >= 3)
            
            recommendations = []
            
            if days_hit_limit >= 3:
                recommendations.append({
                    'type': 'heavy_usage',
                    'title': 'Heavy User Detected! 🔥',
                    'message': f"You've hit your daily limit {days_hit_limit} times this week. Upgrade to Pro for unlimited access!",
                    'savings': f"Save time with unlimited evaluations - no more waiting until tomorrow!",
                    'cta': 'Upgrade to Pro - $9.99/month'
                })
            
            if total_parlays >= 15:
                recommendations.append({
                    'type': 'volume_user',
                    'title': 'Volume Bettor Special 📊',
                    'message': f"You've evaluated {total_parlays} parlays this week! Pro users get advanced analytics.",
                    'savings': f"Track your performance and optimize your strategy with Pro features.",
                    'cta': 'See Pro Analytics Features'
                })
            
            if total_odds >= 50:
                recommendations.append({
                    'type': 'odds_shopper',
                    'title': 'Smart Odds Shopper 💰',
                    'message': f"You've compared odds {total_odds} times! Pro users get real-time alerts.",
                    'savings': f"Never miss line movements with instant notifications.",
                    'cta': 'Get Real-time Alerts'
                })
            
            # Default recommendation for all free users
            if not recommendations:
                recommendations.append({
                    'type': 'general',
                    'title': 'Unlock Your Full Potential 🚀',
                    'message': "Ready to take your betting to the next level?",
                    'savings': "Unlimited access to all features for less than $0.33 per day.",
                    'cta': 'Try Pro Free for 7 Days'
                })
            
            return {
                'user_id': user_id,
                'tier': 'free',
                'usage_summary': {
                    'total_parlays_week': total_parlays,
                    'total_odds_week': total_odds,
                    'days_hit_limit': days_hit_limit
                },
                'recommendations': recommendations
            }
            
        except Exception as e:
            logger.error(f"Error getting upgrade recommendations for user {user_id}: {str(e)}")
            return {'error': 'Unable to generate recommendations'}
    
    @staticmethod
    def get_all_tiers() -> Dict[str, Any]:
        """Get information about all available tiers"""
        return {
            'tiers': TierService.TIER_LIMITS,
            'current_promotions': [
                {
                    'tier': 'pro',
                    'discount': '7-day free trial',
                    'description': 'Try Pro features free for 7 days!'
                }
            ]
        }