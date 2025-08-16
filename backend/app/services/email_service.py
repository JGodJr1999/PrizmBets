"""
PrizmBets - Email Service
Comprehensive email system for user communications
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from flask import current_app, render_template_string
from flask_mail import Mail, Message
from app.models.user import User
import os

logger = logging.getLogger(__name__)

class EmailService:
    """Secure email service for user communications"""
    
    def __init__(self, mail: Mail = None):
        self.mail = mail
        
    @staticmethod
    def init_mail(app):
        """Initialize Flask-Mail with the app"""
        mail = Mail(app)
        return mail
    
    def send_email(self, subject: str, recipients: List[str], 
                  html_body: str, text_body: str = None, 
                  sender: str = None) -> bool:
        """Send email with security validation"""
        try:
            # Validate recipients
            if not recipients or not all(self._validate_email(email) for email in recipients):
                logger.error("Invalid email recipients provided")
                return False
            
            # Create message
            msg = Message(
                subject=subject,
                recipients=recipients,
                sender=sender or current_app.config['MAIL_DEFAULT_SENDER'],
                html=html_body,
                body=text_body
            )
            
            # Security: Limit recipients to prevent spam
            if len(recipients) > 10:
                logger.warning(f"Blocked email with {len(recipients)} recipients (spam protection)")
                return False
            
            # Send email (respects MAIL_SUPPRESS_SEND in development)
            self.mail.send(msg)
            logger.info(f"Email sent successfully: {subject} to {len(recipients)} recipients")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email '{subject}': {str(e)}")
            return False
    
    def send_welcome_email(self, user: User) -> bool:
        """Send welcome email to new users"""
        try:
            if not user or not user.email:
                return False
            
            subject = "Welcome to PrizmBets - Your AI Sports Betting Assistant!"
            
            html_body = self._render_welcome_email(user)
            text_body = self._render_welcome_email_text(user)
            
            return self.send_email(
                subject=subject,
                recipients=[user.email],
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {str(e)}")
            return False
    
    def send_usage_limit_notification(self, user: User, usage_type: str, 
                                    current_usage: int, limit: int) -> bool:
        """Send usage limit notification"""
        try:
            if not user or not user.email:
                return False
            
            # Determine notification type
            percentage = (current_usage / limit) * 100
            
            if percentage >= 100:
                subject = "Usage Limit Reached - Upgrade to Continue"
                template_type = "limit_reached"
            elif percentage >= 80:
                subject = "Approaching Usage Limit - Consider Upgrading"
                template_type = "limit_warning"
            else:
                return True  # No notification needed
            
            html_body = self._render_usage_notification(
                user, usage_type, current_usage, limit, template_type
            )
            text_body = self._render_usage_notification_text(
                user, usage_type, current_usage, limit, template_type
            )
            
            return self.send_email(
                subject=subject,
                recipients=[user.email],
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"Failed to send usage notification to {user.email}: {str(e)}")
            return False
    
    def send_engagement_email(self, user: User, days_inactive: int) -> bool:
        """Send engagement email to inactive users"""
        try:
            if not user or not user.email:
                return False
            
            subject = "We Miss You at PrizmBets - New Features Available!"
            
            html_body = self._render_engagement_email(user, days_inactive)
            text_body = self._render_engagement_email_text(user, days_inactive)
            
            return self.send_email(
                subject=subject,
                recipients=[user.email],
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"Failed to send engagement email to {user.email}: {str(e)}")
            return False
    
    def send_upgrade_promotion(self, user: User, tier_recommendation: str) -> bool:
        """Send personalized upgrade promotion"""
        try:
            if not user or not user.email:
                return False
            
            subject = f"Unlock {tier_recommendation} Features - Special Offer Inside!"
            
            html_body = self._render_upgrade_email(user, tier_recommendation)
            text_body = self._render_upgrade_email_text(user, tier_recommendation)
            
            return self.send_email(
                subject=subject,
                recipients=[user.email],
                html_body=html_body,
                text_body=text_body
            )
            
        except Exception as e:
            logger.error(f"Failed to send upgrade email to {user.email}: {str(e)}")
            return False
    
    def _validate_email(self, email: str) -> bool:
        """Basic email validation"""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return bool(re.match(pattern, email))
    
    def _render_welcome_email(self, user: User) -> str:
        """Render welcome email HTML template"""
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to PrizmBets</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
                .cta { background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
                .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎯 Welcome to PrizmBets!</h1>
                <p>Your AI-Powered Sports Betting Assistant</p>
            </div>
            
            <div class="content">
                <h2>Hello {{ user_name }}!</h2>
                
                <p>Welcome to PrizmBets, where artificial intelligence meets sports betting strategy. You now have access to our powerful AI evaluation system!</p>
                
                <div class="feature">
                    <h3>🤖 AI Parlay Evaluation</h3>
                    <p>Get intelligent analysis of your parlay bets with confidence scores and recommendations.</p>
                </div>
                
                <div class="feature">
                    <h3>📊 Odds Comparison</h3>
                    <p>Compare odds across multiple sportsbooks to find the best value for your bets.</p>
                </div>
                
                <div class="feature">
                    <h3>🎯 Free Tier Benefits</h3>
                    <p>Enjoy <strong>3 free parlay evaluations</strong> and <strong>10 odds comparisons</strong> daily!</p>
                </div>
                
                <a href="https://prizmbets.app" class="cta">Start Analyzing Bets →</a>
                
                <p>Questions? Reply to this email and our team will help you get started.</p>
                
                <p>Best regards,<br>The PrizmBets Team</p>
            </div>
            
            <div class="footer">
                <p>© 2025 PrizmBets. All rights reserved.</p>
                <p>You received this email because you signed up for PrizmBets.</p>
            </div>
        </body>
        </html>
        """
        
        return render_template_string(template, user_name=user.name or "there")
    
    def _render_welcome_email_text(self, user: User) -> str:
        """Render welcome email text version"""
        return f"""
Welcome to PrizmBets, {user.name or "there"}!

Your AI-Powered Sports Betting Assistant is ready to go.

What you get with your free account:
• 3 AI parlay evaluations per day
• 10 odds comparisons per day  
• Access to our powerful betting analysis tools

Visit https://prizmbets.app to start analyzing your bets!

Questions? Reply to this email and we'll help you get started.

Best regards,
The PrizmBets Team

© 2025 PrizmBets. All rights reserved.
        """.strip()
    
    def _render_usage_notification(self, user: User, usage_type: str, 
                                 current_usage: int, limit: int, template_type: str) -> str:
        """Render usage notification HTML"""
        if template_type == "limit_reached":
            title = "Daily Limit Reached"
            message = f"You've used all {limit} of your daily {usage_type.replace('_', ' ')}."
            action = "Upgrade now to continue analyzing bets!"
        else:
            title = "Approaching Daily Limit"
            remaining = limit - current_usage
            message = f"You have {remaining} {usage_type.replace('_', ' ')} remaining today."
            action = "Consider upgrading for unlimited access!"
        
        template = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>{title} - PrizmBets</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }}
                .header {{ background: #ff6b35; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .usage-bar {{ background: #e9ecef; height: 20px; border-radius: 10px; margin: 15px 0; }}
                .usage-fill {{ background: #ff6b35; height: 100%; border-radius: 10px; width: {(current_usage/limit)*100}%; }}
                .cta {{ background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>⚠️ {title}</h1>
            </div>
            
            <div class="content">
                <h2>Hello {user.name or "there"}!</h2>
                
                <p>{message}</p>
                
                <div class="usage-bar">
                    <div class="usage-fill"></div>
                </div>
                <p><strong>Usage: {current_usage}/{limit}</strong></p>
                
                <p>{action}</p>
                
                <a href="https://prizmbets.app/upgrade" class="cta">View Upgrade Options →</a>
                
                <p>Best regards,<br>The PrizmBets Team</p>
            </div>
        </body>
        </html>
        """
        
        return template
    
    def _render_usage_notification_text(self, user: User, usage_type: str, 
                                      current_usage: int, limit: int, template_type: str) -> str:
        """Render usage notification text version"""
        if template_type == "limit_reached":
            return f"""
Hello {user.name or "there"}!

You've reached your daily limit of {limit} {usage_type.replace('_', ' ')}.

Upgrade to Pro or Premium for unlimited access to all PrizmBets features!

Visit https://prizmbets.app/upgrade to see your options.

Best regards,
The PrizmBets Team
            """.strip()
        else:
            remaining = limit - current_usage
            return f"""
Hello {user.name or "there"}!

Usage Update: {current_usage}/{limit} {usage_type.replace('_', ' ')} used today.
You have {remaining} remaining.

Consider upgrading for unlimited access!

Visit https://prizmbets.app/upgrade to see your options.

Best regards,
The PrizmBets Team
            """.strip()
    
    def _render_engagement_email(self, user: User, days_inactive: int) -> str:
        """Render engagement email HTML"""
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>We Miss You - PrizmBets</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .feature { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 5px; }
                .cta { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🎯 We Miss You!</h1>
                <p>New features are waiting for you</p>
            </div>
            
            <div class="content">
                <h2>Hello {{ user_name }}!</h2>
                
                <p>It's been {{ days_inactive }} days since your last visit. We've been busy improving PrizmBets with new features!</p>
                
                <div class="feature">
                    <h3>🆕 What's New</h3>
                    <p>• Enhanced AI analysis algorithms<br>
                    • More sportsbook integrations<br>
                    • Improved odds comparison tools</p>
                </div>
                
                <p>Your free daily limits are waiting:</p>
                <ul>
                    <li>3 AI parlay evaluations</li>
                    <li>10 odds comparisons</li>
                </ul>
                
                <a href="https://prizmbets.app" class="cta">Welcome Back →</a>
                
                <p>Best regards,<br>The PrizmBets Team</p>
            </div>
        </body>
        </html>
        """
        
        return render_template_string(template, user_name=user.name or "there", days_inactive=days_inactive)
    
    def _render_engagement_email_text(self, user: User, days_inactive: int) -> str:
        """Render engagement email text version"""
        return f"""
Hello {user.name or "there"}!

We miss you at PrizmBets! It's been {days_inactive} days since your last visit.

What's New:
• Enhanced AI analysis algorithms
• More sportsbook integrations  
• Improved odds comparison tools

Your free daily limits are waiting:
• 3 AI parlay evaluations
• 10 odds comparisons

Come back and see what's new: https://prizmbets.app

Best regards,
The PrizmBets Team
        """.strip()
    
    def _render_upgrade_email(self, user: User, tier_recommendation: str) -> str:
        """Render upgrade promotion HTML"""
        template = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Upgrade to {{ tier }} - PrizmBets</title>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .tier-box { background: #f8f9fa; border: 2px solid #28a745; padding: 20px; margin: 15px 0; border-radius: 10px; text-align: center; }
                .cta { background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; font-size: 18px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🚀 Unlock {{ tier }} Features!</h1>
                <p>Special offer just for you</p>
            </div>
            
            <div class="content">
                <h2>Hello {{ user_name }}!</h2>
                
                <p>Based on your usage patterns, {{ tier }} would be perfect for you!</p>
                
                <div class="tier-box">
                    <h3>{{ tier }} Benefits</h3>
                    <p>✅ Unlimited parlay evaluations<br>
                    ✅ Unlimited odds comparisons<br>
                    ✅ Priority support<br>
                    ✅ Advanced analytics</p>
                </div>
                
                <a href="https://prizmbets.app/upgrade?tier={{ tier.lower() }}" class="cta">Upgrade to {{ tier }} →</a>
                
                <p>Questions about upgrading? Reply to this email!</p>
                
                <p>Best regards,<br>The PrizmBets Team</p>
            </div>
        </body>
        </html>
        """
        
        return render_template_string(template, user_name=user.name or "there", tier=tier_recommendation)
    
    def _render_upgrade_email_text(self, user: User, tier_recommendation: str) -> str:
        """Render upgrade email text version"""
        return f"""
Hello {user.name or "there"}!

Based on your usage, {tier_recommendation} would be perfect for you!

{tier_recommendation} Benefits:
• Unlimited parlay evaluations
• Unlimited odds comparisons
• Priority support
• Advanced analytics

Upgrade now: https://prizmbets.app/upgrade?tier={tier_recommendation.lower()}

Questions? Reply to this email!

Best regards,
The PrizmBets Team
        """.strip()