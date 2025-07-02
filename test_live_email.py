#!/usr/bin/env python3
"""
Test Email Configuration on Live Server
Run this script on your live server to test if email sending works.
"""

import os
import sys
import django

# Setup Django (adjust path if needed)
sys.path.append('/root/school_admin_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_admin.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings

def test_email_sending():
    """Test email sending with current configuration"""
    print("🧪 Testing Email Configuration on Live Server...")
    print(f"📧 SMTP Host: {settings.EMAIL_HOST}")
    print(f"📧 SMTP Port: {settings.EMAIL_PORT}")
    print(f"📧 SMTP User: {settings.EMAIL_HOST_USER}")
    print(f"📧 Use TLS: {settings.EMAIL_USE_TLS}")
    print()
    
    try:
        # Test simple email
        send_mail(
            subject='Live Server Email Test',
            message='This is a test email from your live Django server.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['nyasimiphilip@gmail.com'],
            fail_silently=False
        )
        print("✅ Email test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Email test failed: {str(e)}")
        import traceback
        print(f"📋 Full traceback: {traceback.format_exc()}")
        return False

def test_password_reset_view():
    """Test the password reset view directly"""
    print("\n🔍 Testing Password Reset View...")
    
    try:
        from admin_interface.views import PasswordResetRequestView
        from admin_interface.models import User
        from django.test import RequestFactory
        from rest_framework.test import APIRequestFactory
        import json
        
        # Check if user exists
        try:
            user = User.objects.get(email='nyasimiphilip@gmail.com')
            print(f"✅ User found: {user.email} (Role: {user.role})")
        except User.DoesNotExist:
            print("❌ User not found in database")
            return False
        
        # Test the view
        factory = APIRequestFactory()
        request = factory.post(
            '/api/auth/password/reset/',
            data=json.dumps({'email': 'nyasimiphilip@gmail.com'}),
            content_type='application/json'
        )
        
        view = PasswordResetRequestView()
        response = view.post(request)
        
        print(f"📡 View Response Status: {response.status_code}")
        print(f"📡 View Response Data: {response.data}")
        
        return response.status_code == 200
        
    except Exception as e:
        print(f"❌ Password reset view test failed: {str(e)}")
        import traceback
        print(f"📋 Full traceback: {traceback.format_exc()}")
        return False

if __name__ == "__main__":
    print("🚀 Starting Live Server Tests\n")
    
    # Test 1: Email Configuration
    email_works = test_email_sending()
    
    # Test 2: Password Reset View
    view_works = test_password_reset_view()
    
    print(f"\n📊 Test Results Summary:")
    print(f"📧 Email Configuration: {'✅ PASS' if email_works else '❌ FAIL'}")
    print(f"🔍 Password Reset View: {'✅ PASS' if view_works else '❌ FAIL'}")
    
    if not email_works:
        print("\n💡 Email configuration issues detected!")
        print("   Check your SMTP credentials and network connectivity.")
    
    if not view_works:
        print("\n💡 Password reset view issues detected!")
        print("   Check the full traceback above for details.") 