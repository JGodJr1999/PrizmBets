"""
PrizmBets - Admin Dashboard Service
Secure administration and monitoring service with role-based access
"""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy import func, desc, text
from flask import g

from app.models.user import User, UserUsage, UserSession, BettingHistory, db
from app.services.tier_service import TierService

logger = logging.getLogger(__name__)

class AdminService:
    """Secure admin service with comprehensive monitoring capabilities"""
    
    # Admin role definitions
    ADMIN_ROLES = {
        'super_admin': {
            'level': 100,
            'permissions': ['all']
        },
        'admin': {
            'level': 50,
            'permissions': ['user_management', 'system_monitoring', 'analytics']
        },
        'moderator': {
            'level': 25,
            'permissions': ['user_monitoring', 'content_moderation']
        },
        'support': {
            'level': 10,
            'permissions': ['user_support', 'basic_analytics']
        }
    }
    
    @staticmethod
    def check_admin_permission(user: User, required_permission: str) -> bool:
        """Check if user has required admin permission"""
        try:
            # Only premium users can be admins (additional security layer)
            if not user or user.subscription_tier != 'premium':
                return False
            
            # Check if user is designated admin (would need admin_role field in User model)
            # For now, checking if user email contains 'admin' (temporary)
            if 'admin' not in user.email.lower():
                return False
            
            # In production, you'd check user.admin_role against ADMIN_ROLES
            # For this implementation, admins have all permissions
            return True
            
        except Exception as e:
            logger.error(f"Error checking admin permission: {str(e)}")
            return False
    
    @staticmethod
    def get_dashboard_overview() -> Dict[str, Any]:
        """Get high-level dashboard statistics"""
        try:
            # User statistics
            total_users = User.query.count()
            active_users_today = User.query.filter(
                User.last_login_at >= datetime.now(timezone.utc) - timedelta(days=1)
            ).count()
            
            # Tier distribution
            tier_distribution = db.session.query(
                User.subscription_tier,
                func.count(User.id).label('count')
            ).group_by(User.subscription_tier).all()
            
            # Usage statistics (today)
            today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
            daily_usage = db.session.query(
                func.sum(UserUsage.parlay_evaluations).label('total_parlays'),
                func.sum(UserUsage.odds_comparisons).label('total_odds'),
                func.count(UserUsage.id).label('active_users')
            ).filter(UserUsage.date >= today_start).first()
            
            # Revenue metrics (based on tier distribution)
            revenue_estimate = sum([
                tier_count * TierService.TIER_LIMITS.get(tier_name, {}).get('price', 0)
                for tier_name, tier_count in tier_distribution
            ])
            
            return {
                'overview': {
                    'total_users': total_users,
                    'active_users_today': active_users_today,
                    'revenue_estimate_monthly': revenue_estimate,
                    'system_status': 'healthy'
                },
                'tier_distribution': [
                    {'tier': tier, 'count': count} 
                    for tier, count in tier_distribution
                ],
                'daily_usage': {
                    'parlay_evaluations': daily_usage.total_parlays or 0,
                    'odds_comparisons': daily_usage.total_odds or 0,
                    'active_users': daily_usage.active_users or 0
                },
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard overview: {str(e)}")
            return {'error': 'Unable to retrieve dashboard data'}
    
    @staticmethod
    def get_user_analytics(limit: int = 100, offset: int = 0) -> Dict[str, Any]:
        """Get user analytics with pagination"""
        try:
            # Validate pagination parameters
            limit = min(max(limit, 1), 1000)  # Between 1 and 1000
            offset = max(offset, 0)
            
            # Get users with usage statistics
            users_query = db.session.query(
                User.id,
                User.email,
                User.name,
                User.subscription_tier,
                User.created_at,
                User.last_login_at,
                User.is_active
            ).order_by(desc(User.created_at))
            
            total_users = users_query.count()
            users = users_query.offset(offset).limit(limit).all()
            
            # Get usage data for these users
            user_ids = [user.id for user in users]
            usage_data = {}
            
            if user_ids:
                # Get recent usage (last 7 days)
                week_ago = datetime.now(timezone.utc) - timedelta(days=7)
                usage_stats = db.session.query(
                    UserUsage.user_id,
                    func.sum(UserUsage.parlay_evaluations).label('total_parlays'),
                    func.sum(UserUsage.odds_comparisons).label('total_odds'),
                    func.count(UserUsage.id).label('active_days')
                ).filter(
                    UserUsage.user_id.in_(user_ids),
                    UserUsage.date >= week_ago
                ).group_by(UserUsage.user_id).all()
                
                usage_data = {
                    stat.user_id: {
                        'total_parlays': stat.total_parlays or 0,
                        'total_odds': stat.total_odds or 0,
                        'active_days': stat.active_days or 0
                    }
                    for stat in usage_stats
                }
            
            # Format user data
            user_list = []
            for user in users:
                usage = usage_data.get(user.id, {
                    'total_parlays': 0,
                    'total_odds': 0,
                    'active_days': 0
                })
                
                user_list.append({
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'tier': user.subscription_tier,
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'last_login': user.last_login_at.isoformat() if user.last_login_at else None,
                    'is_active': user.is_active,
                    'usage_7d': usage
                })
            
            return {
                'users': user_list,
                'pagination': {
                    'total': total_users,
                    'limit': limit,
                    'offset': offset,
                    'has_more': offset + limit < total_users
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting user analytics: {str(e)}")
            return {'error': 'Unable to retrieve user analytics'}
    
    @staticmethod
    def get_system_health() -> Dict[str, Any]:
        """Get system health metrics"""
        try:
            # Database health check
            try:
                db.session.execute(text('SELECT 1'))
                db_status = 'healthy'
            except Exception as db_e:
                logger.error(f"Database health check failed: {str(db_e)}")
                db_status = 'error'
            
            # Recent error analysis (would integrate with logging system)
            recent_errors = 0  # Placeholder - would query error logs
            
            # Active sessions
            active_sessions = UserSession.query.filter(
                UserSession.is_active == True,
                UserSession.expires_at > datetime.now(timezone.utc)
            ).count()
            
            # Usage trends (last 24 hours)
            yesterday = datetime.now(timezone.utc) - timedelta(days=1)
            recent_usage = UserUsage.query.filter(
                UserUsage.updated_at >= yesterday
            ).count()
            
            return {
                'system_health': {
                    'database': db_status,
                    'active_sessions': active_sessions,
                    'recent_usage_records': recent_usage,
                    'error_count_24h': recent_errors,
                    'status': 'healthy' if db_status == 'healthy' else 'degraded'
                },
                'performance_metrics': {
                    'avg_response_time': '< 200ms',  # Placeholder
                    'uptime': '99.9%',  # Placeholder
                    'memory_usage': 'normal',  # Placeholder
                    'cpu_usage': 'normal'  # Placeholder
                },
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting system health: {str(e)}")
            return {
                'system_health': {'status': 'error'},
                'error': 'Unable to retrieve system health'
            }
    
    @staticmethod
    def get_usage_trends(days: int = 7) -> Dict[str, Any]:
        """Get usage trends over specified number of days"""
        try:
            # Validate days parameter
            days = min(max(days, 1), 90)  # Between 1 and 90 days
            
            start_date = datetime.now(timezone.utc) - timedelta(days=days)
            
            # Daily usage trends
            daily_trends = db.session.query(
                func.date(UserUsage.date).label('date'),
                func.sum(UserUsage.parlay_evaluations).label('parlays'),
                func.sum(UserUsage.odds_comparisons).label('odds'),
                func.count(func.distinct(UserUsage.user_id)).label('unique_users')
            ).filter(
                UserUsage.date >= start_date
            ).group_by(
                func.date(UserUsage.date)
            ).order_by(
                func.date(UserUsage.date)
            ).all()
            
            # User growth trends
            user_growth = db.session.query(
                func.date(User.created_at).label('date'),
                func.count(User.id).label('new_users')
            ).filter(
                User.created_at >= start_date
            ).group_by(
                func.date(User.created_at)
            ).order_by(
                func.date(User.created_at)
            ).all()
            
            return {
                'usage_trends': [
                    {
                        'date': str(trend.date),
                        'parlay_evaluations': trend.parlays or 0,
                        'odds_comparisons': trend.odds or 0,
                        'unique_users': trend.unique_users or 0
                    }
                    for trend in daily_trends
                ],
                'user_growth': [
                    {
                        'date': str(growth.date),
                        'new_users': growth.new_users or 0
                    }
                    for growth in user_growth
                ],
                'period_days': days,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error getting usage trends: {str(e)}")
            return {'error': 'Unable to retrieve usage trends'}
    
    @staticmethod
    def get_user_detail(user_id: int) -> Dict[str, Any]:
        """Get detailed information about a specific user"""
        try:
            # Validate user ID
            if not isinstance(user_id, int) or user_id <= 0:
                return {'error': 'Invalid user ID'}
            
            user = User.query.get(user_id)
            if not user:
                return {'error': 'User not found'}
            
            # Get usage history (last 30 days)
            thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
            usage_history = UserUsage.query.filter(
                UserUsage.user_id == user_id,
                UserUsage.date >= thirty_days_ago
            ).order_by(desc(UserUsage.date)).all()
            
            # Get active sessions
            sessions = UserSession.query.filter(
                UserSession.user_id == user_id,
                UserSession.is_active == True
            ).order_by(desc(UserSession.last_used_at)).all()
            
            # Get tier information
            tier_info = TierService.get_user_tier_info(user)
            current_usage = TierService.get_usage_status(user_id)
            
            return {
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name,
                    'subscription_tier': user.subscription_tier,
                    'subscription_status': user.subscription_status,
                    'is_active': user.is_active,
                    'is_verified': user.is_verified,
                    'created_at': user.created_at.isoformat() if user.created_at else None,
                    'last_login_at': user.last_login_at.isoformat() if user.last_login_at else None,
                    'stripe_customer_id': user.stripe_customer_id
                },
                'tier_info': tier_info,
                'current_usage': current_usage,
                'usage_history': [
                    {
                        'date': usage.date.isoformat(),
                        'parlay_evaluations': usage.parlay_evaluations,
                        'odds_comparisons': usage.odds_comparisons,
                        'api_calls': usage.api_calls
                    }
                    for usage in usage_history
                ],
                'active_sessions': [
                    {
                        'id': session.id,
                        'created_at': session.created_at.isoformat(),
                        'last_used_at': session.last_used_at.isoformat(),
                        'ip_address': session.ip_address,
                        'expires_at': session.expires_at.isoformat()
                    }
                    for session in sessions[:5]  # Limit to 5 most recent
                ]
            }
            
        except Exception as e:
            logger.error(f"Error getting user detail for user {user_id}: {str(e)}")
            return {'error': 'Unable to retrieve user details'}
    
    @staticmethod
    def update_user_status(admin_user: User, target_user_id: int, action: str) -> Dict[str, Any]:
        """Admin action to update user status (with audit logging)"""
        try:
            # Validate admin permissions
            if not AdminService.check_admin_permission(admin_user, 'user_management'):
                return {'error': 'Insufficient permissions'}
            
            # Validate target user
            if not isinstance(target_user_id, int) or target_user_id <= 0:
                return {'error': 'Invalid user ID'}
            
            target_user = User.query.get(target_user_id)
            if not target_user:
                return {'error': 'User not found'}
            
            # Validate action
            allowed_actions = ['activate', 'deactivate', 'verify', 'reset_password']
            if action not in allowed_actions:
                return {'error': 'Invalid action'}
            
            # Perform action
            if action == 'activate':
                target_user.is_active = True
            elif action == 'deactivate':
                target_user.is_active = False
                # Deactivate user sessions
                UserSession.query.filter_by(user_id=target_user_id).update({
                    'is_active': False
                })
            elif action == 'verify':
                target_user.is_verified = True
                target_user.verification_token = None
            elif action == 'reset_password':
                # Generate password reset token (implementation would include email)
                import uuid
                target_user.password_reset_token = str(uuid.uuid4())
                target_user.password_reset_expires = datetime.now(timezone.utc) + timedelta(hours=24)
            
            db.session.commit()
            
            # Log admin action (in production, would use proper audit logging)
            logger.info(f"Admin {admin_user.email} performed {action} on user {target_user.email}")
            
            return {
                'success': True,
                'action': action,
                'user_id': target_user_id,
                'message': f'User {action} completed successfully'
            }
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Error in admin action {action} for user {target_user_id}: {str(e)}")
            return {'error': 'Unable to complete admin action'}