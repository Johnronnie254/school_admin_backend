#!/usr/bin/env python3
"""
Debug Password Reset Issue
This script tests the password reset functionality locally to identify the exact problem.
"""

import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_admin.settings')
django.setup()

from django.test import RequestFactory, Client
from django.contrib.auth import get_user_model
from admin_interface.views import PasswordResetRequestView
from admin_interface.models import User, PasswordResetToken

def test_password_reset_locally():
    """Test password reset functionality locally"""
    print("🔍 Testing Password Reset Locally...\n")
    
    # Create a test client
    client = Client()
    
    # Test data
    test_email = 'nyasimiphilip@gmail.com'
    
    # 1. Test the view directly
    print("1️⃣ Testing View Directly...")
    try:
        factory = RequestFactory()
        request = factory.post('/api/auth/password/reset/', 
                             json.dumps({'email': test_email}),
                             content_type='application/json')
        
        view = PasswordResetRequestView()
        response = view.post(request)
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response Data: {response.data}")
        
    except Exception as e:
        print(f"   ❌ Direct view test failed: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # 2. Test through Django test client
    print("\n2️⃣ Testing Through Django Client...")
    try:
        response = client.post('/api/auth/password/reset/', 
                             json.dumps({'email': test_email}),
                             content_type='application/json')
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Content Type: {response.get('Content-Type', 'Not set')}")
        print(f"   Response Content: {response.content.decode()}")
        
    except Exception as e:
        print(f"   ❌ Django client test failed: {str(e)}")
        import traceback
        traceback.print_exc()
    
    # 3. Check if tokens are being created
    print("\n3️⃣ Checking Token Creation...")
    try:
        # Clear any existing tokens for this user
        user = User.objects.get(email=test_email)
        PasswordResetToken.objects.filter(user=user).delete()
        
        # Run the request again
        response = client.post('/api/auth/password/reset/', 
                             json.dumps({'email': test_email}),
                             content_type='application/json')
        
        # Check if token was created
        tokens = PasswordResetToken.objects.filter(user=user)
        print(f"   Tokens created: {tokens.count()}")
        
        if tokens.exists():
            token = tokens.first()
            print(f"   Token: {token.token}")
            print(f"   Expires: {token.expires_at}")
            print(f"   Used: {token.used}")
            
    except Exception as e:
        print(f"   ❌ Token check failed: {str(e)}")
        import traceback
        traceback.print_exc()

def check_django_settings():
    """Check Django settings that might affect password reset"""
    print("\n⚙️ Checking Django Settings...")
    
    from django.conf import settings
    
    print(f"   DEBUG: {settings.DEBUG}")
    print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"   FRONTEND_URL: {settings.FRONTEND_URL}")
    print(f"   MIDDLEWARE: {[m for m in settings.MIDDLEWARE if 'API' in m or 'Error' in m]}")
    
def check_url_routing():
    """Check URL routing"""
    print("\n🌐 Checking URL Routing...")
    
    from django.urls import resolve
    from django.urls.exceptions import Resolver404
    
    try:
        match = resolve('/api/auth/password/reset/')
        print(f"   URL resolves to: {match.func}")
        print(f"   View name: {match.url_name}")
        print(f"   App name: {match.app_name}")
    except Resolver404:
        print("   ❌ URL does not resolve!")
    except Exception as e:
        print(f"   ❌ URL check failed: {str(e)}")

def main():
    print("🚀 Password Reset Debug Tool\n")
    
    check_django_settings()
    check_url_routing()
    test_password_reset_locally()
    
    print("\n✅ Debug complete! Check the output above for issues.")

if __name__ == '__main__':
    main() 