#!/usr/bin/env python3
"""
Test Script for Email Configuration and Password Reset
This script helps debug the 500 error in password reset functionality.
"""

import os
import sys
import django
import json

# Add the project directory to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_admin.settings')

# Setup Django
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from admin_interface.models import User, Role, School
from django.core.management import execute_from_command_line

def test_email_configuration():
    """Test basic email configuration"""
    print("🧪 Testing Email Configuration...")
    print(f"📧 SMTP Host: {settings.EMAIL_HOST}")
    print(f"📧 SMTP Port: {settings.EMAIL_PORT}")
    print(f"📧 SMTP User: {settings.EMAIL_HOST_USER}")
    print(f"📧 Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"📧 Frontend URL: {settings.FRONTEND_URL}")
    
    try:
        # Test sending a simple email
        send_mail(
            subject='Test Email Configuration',
            message='This is a test email to verify SMTP configuration.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['nyasimiphilip@gmail.com'],
            fail_silently=False,
        )
        print("✅ Email configuration test passed!")
        return True
    except Exception as e:
        print(f"❌ Email configuration test failed: {str(e)}")
        return False

def test_user_exists():
    """Test if the user exists in database"""
    print("\n🔍 Testing User Database...")
    try:
        email = 'nyasimiphilip@gmail.com'
        try:
            user = User.objects.get(email=email)
            print(f"✅ User found: {user.email} (Role: {user.role})")
            print(f"   - First Name: {user.first_name}")
            print(f"   - School: {user.school.name if user.school else 'No school'}")
            print(f"   - Is Active: {user.is_active}")
            return True
        except User.DoesNotExist:
            print(f"❌ User not found: {email}")
            return False
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        return False

def test_password_reset_api():
    """Test the password reset API endpoint"""
    print("\n🌐 Testing Password Reset API...")
    try:
        import requests
        url = 'https://educitebackend.co.ke/api/auth/password/reset/'
        data = {'email': 'nyasimiphilip@gmail.com'}
        
        print(f"📡 Making request to: {url}")
        print(f"📤 Request data: {data}")
        
        response = requests.post(url, json=data, headers={
            'Content-Type': 'application/json'
        })
        
        print(f"📡 Response Status: {response.status_code}")
        print(f"📡 Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"📡 Response Data: {json.dumps(response_data, indent=2)}")
        except:
            print(f"📡 Response Text: {response.text}")
            
        return response.status_code == 200
        
    except Exception as e:
        print(f"❌ API test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("🚀 Starting Email and Password Reset Tests\n")
    
    email_ok = test_email_configuration()
    user_ok = test_user_exists()
    api_ok = test_password_reset_api()
    
    print("\n📊 Test Results Summary:")
    print(f"📧 Email Configuration: {'✅ PASS' if email_ok else '❌ FAIL'}")
    print(f"👤 User Database: {'✅ PASS' if user_ok else '❌ FAIL'}")
    print(f"🌐 API Endpoint: {'✅ PASS' if api_ok else '❌ FAIL'}")
    
    if all([email_ok, user_ok, api_ok]):
        print("\n🎉 All tests passed! Password reset should work.")
    else:
        print("\n⚠️ Some tests failed. Check the issues above.")

if __name__ == '__main__':
    main() 