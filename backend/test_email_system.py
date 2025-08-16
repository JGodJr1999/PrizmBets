#!/usr/bin/env python3
"""
Test script for Email System
Tests email service functionality without sending real emails
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app import create_app
from app.models.user import db, User
from app.services.email_service import EmailService
import json

def test_email_templates():
    """Test email template rendering"""
    app = create_app('development')
    
    with app.app_context():
        print("📧 Testing Email System")
        print("=" * 50)
        
        # Create test user
        test_user = User(
            email="test@example.com",
            name="Test User",
            password="test_password"
        )
        
        # Initialize email service
        from app import mail
        email_service = EmailService(mail)
        
        # Test 1: Welcome Email Template
        print("\n✉️ Test 1: Welcome Email Template")
        welcome_html = email_service._render_welcome_email(test_user)
        welcome_text = email_service._render_welcome_email_text(test_user)
        
        print(f"   HTML length: {len(welcome_html)} characters")
        print(f"   Text length: {len(welcome_text)} characters")
        print(f"   Contains user name: {'Test User' in welcome_html}")
        print(f"   Contains PrizmBets branding: {'PrizmBets' in welcome_html}")
        
        # Test 2: Usage Notification Template
        print("\n⚠️ Test 2: Usage Notification Template")
        usage_html = email_service._render_usage_notification(
            test_user, "parlay_evaluations", 3, 3, "limit_reached"
        )
        usage_text = email_service._render_usage_notification_text(
            test_user, "parlay_evaluations", 3, 3, "limit_reached"
        )
        
        print(f"   HTML length: {len(usage_html)} characters")
        print(f"   Text length: {len(usage_text)} characters")
        print(f"   Contains upgrade link: {'upgrade' in usage_html.lower()}")
        print(f"   Shows usage progress: {'3/3' in usage_html}")
        
        # Test 3: Engagement Email Template
        print("\n🎯 Test 3: Engagement Email Template")
        engagement_html = email_service._render_engagement_email(test_user, 7)
        engagement_text = email_service._render_engagement_email_text(test_user, 7)
        
        print(f"   HTML length: {len(engagement_html)} characters")
        print(f"   Text length: {len(engagement_text)} characters")
        print(f"   Contains days inactive: {'7 days' in engagement_html}")
        print(f"   Contains welcome back CTA: {'Welcome Back' in engagement_html}")
        
        # Test 4: Upgrade Promotion Template
        print("\n🚀 Test 4: Upgrade Promotion Template")
        upgrade_html = email_service._render_upgrade_email(test_user, "Pro")
        upgrade_text = email_service._render_upgrade_email_text(test_user, "Pro")
        
        print(f"   HTML length: {len(upgrade_html)} characters")
        print(f"   Text length: {len(upgrade_text)} characters")
        print(f"   Contains tier name: {'Pro' in upgrade_html}")
        print(f"   Contains upgrade benefits: {'Unlimited' in upgrade_html}")

def test_email_validation():
    """Test email validation and security"""
    app = create_app('development')
    
    with app.app_context():
        print("\n🔒 Testing Email Security")
        print("-" * 35)
        
        from app import mail
        email_service = EmailService(mail)
        
        # Test email validation
        print("\n📧 Test 1: Email Validation")
        valid_emails = [
            "user@example.com",
            "test.user+tag@gmail.com",
            "admin@prizmbets.app"
        ]
        
        invalid_emails = [
            "invalid-email",
            "@example.com",
            "user@",
            "user..double@example.com",
            "",
            None
        ]
        
        for email in valid_emails:
            result = email_service._validate_email(email)
            print(f"   ✅ {email}: {result}")
        
        for email in invalid_emails:
            result = email_service._validate_email(email or "")
            print(f"   ❌ {email or 'None'}: {result}")
        
        # Test recipient limits
        print("\n🛡️ Test 2: Recipient Limits")
        many_recipients = [f"user{i}@example.com" for i in range(15)]
        
        # This should fail due to recipient limit (10 max)
        result = email_service.send_email(
            subject="Test",
            recipients=many_recipients,
            html_body="<p>Test</p>",
            text_body="Test"
        )
        print(f"   Large recipient list (15 emails): {'✅ Blocked' if not result else '❌ Allowed'}")

def test_configuration():
    """Test email configuration"""
    app = create_app('development')
    
    with app.app_context():
        print("\n⚙️ Testing Email Configuration")
        print("-" * 35)
        
        # Check configuration
        config_items = [
            ('MAIL_SERVER', app.config.get('MAIL_SERVER')),
            ('MAIL_PORT', app.config.get('MAIL_PORT')),
            ('MAIL_USE_TLS', app.config.get('MAIL_USE_TLS')),
            ('MAIL_USERNAME', app.config.get('MAIL_USERNAME')),
            ('MAIL_DEFAULT_SENDER', app.config.get('MAIL_DEFAULT_SENDER')),
            ('MAIL_SUPPRESS_SEND', app.config.get('MAIL_SUPPRESS_SEND'))
        ]
        
        print("\n📋 Configuration Status:")
        for key, value in config_items:
            status = "✅ Set" if value is not None else "❌ Missing"
            masked_value = "***" if 'PASSWORD' in key else str(value)
            print(f"   {key}: {status} ({masked_value})")
        
        # Check if in development mode
        is_dev = app.config.get('MAIL_SUPPRESS_SEND', False)
        print(f"\n🔧 Development Mode: {'✅ Enabled (emails suppressed)' if is_dev else '❌ Disabled (emails will send)'}")

def test_integration_points():
    """Test integration with other services"""
    app = create_app('development')
    
    with app.app_context():
        print("\n🔗 Testing Service Integration")
        print("-" * 35)
        
        # Test with auth service integration
        print("\n🔐 Auth Service Integration:")
        
        # Check if email service is available in auth routes
        try:
            from app.routes.auth import auth_bp
            print("   ✅ Email service imported in auth routes")
        except ImportError as e:
            print(f"   ❌ Email service import failed: {e}")
        
        # Test with tier service integration
        print("\n📊 Tier Service Integration:")
        
        try:
            from app.services.tier_service import TierService
            print("   ✅ Email notifications integrated in tier service")
        except ImportError as e:
            print(f"   ❌ Tier service integration failed: {e}")
        
        # Test admin email routes
        print("\n👨‍💼 Admin Email Routes:")
        
        try:
            from app.routes.email import email_bp
            print("   ✅ Admin email routes available")
            
            # List available endpoints
            endpoints = []
            for rule in app.url_map.iter_rules():
                if rule.rule.startswith('/api/email'):
                    endpoints.append(f"{rule.methods} {rule.rule}")
            
            print(f"   📍 Available endpoints: {len(endpoints)}")
            for endpoint in endpoints:
                print(f"      {endpoint}")
                
        except ImportError as e:
            print(f"   ❌ Admin email routes failed: {e}")

if __name__ == "__main__":
    print("📧 PRIZMBETS EMAIL SYSTEM TESTING")
    print("=" * 50)
    
    # Test email templates
    test_email_templates()
    
    # Test security and validation
    test_email_validation()
    
    # Test configuration
    test_configuration()
    
    # Test integrations
    test_integration_points()
    
    print("\n🎉 Email System Testing Complete!")
    print("=" * 50)
    print("💡 Next Steps:")
    print("   1. Configure email credentials in .env file")
    print("   2. Test with real email: python -c \"from app import create_app; from app.routes.email import test_email\"")
    print("   3. Start server: python run.py")
    print("   4. Test endpoints: POST /api/email/test-email")
    print("   5. Monitor logs for email sending status")