#!/usr/bin/env python3
"""
Test Password Reset API Directly on Live Server
"""

import os
import sys
import django
import json

# Setup Django
sys.path.append('/root/school_admin_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_admin.settings')
django.setup()

from django.test.client import Client
from django.conf import settings

def test_password_reset_api():
    """Test password reset API using Django test client"""
    print("🧪 Testing Password Reset API on Live Server...")
    print(f"🔧 DEBUG Mode: {settings.DEBUG}")
    print(f"🔧 ALLOWED_HOSTS: {settings.ALLOWED_HOSTS}")
    print(f"🔧 FRONTEND_URL: {settings.FRONTEND_URL}")
    print()
    
    # Create test client
    client = Client()
    
    # Test data
    test_data = {
        "email": "nyasimiphilip@gmail.com"
    }
    
    try:
        # Make POST request to password reset endpoint
        response = client.post(
            '/api/auth/password/reset/',
            data=json.dumps(test_data),
            content_type='application/json',
            HTTP_HOST='educitebackend.co.ke'  # Set the host header
        )
        
        print(f"📡 Response Status: {response.status_code}")
        print(f"📡 Response Headers: {dict(response.items())}")
        print(f"📡 Response Content-Type: {response.get('Content-Type', 'Not set')}")
        
        if response.status_code == 200:
            try:
                response_data = json.loads(response.content.decode())
                print(f"📡 Response JSON: {response_data}")
                print("✅ API test successful!")
                return True
            except json.JSONDecodeError:
                print(f"❌ Response is not JSON: {response.content.decode()[:500]}")
                return False
        else:
            print(f"❌ API returned error status: {response.status_code}")
            print(f"📋 Response content: {response.content.decode()[:500]}")
            return False
            
    except Exception as e:
        print(f"❌ API test failed with exception: {str(e)}")
        import traceback
        print(f"📋 Full traceback: {traceback.format_exc()}")
        return False

def check_url_configuration():
    """Check URL configuration"""
    print("\n🔍 Checking URL Configuration...")
    
    try:
        from django.urls import resolve, reverse
        from django.conf.urls import include
        
        # Try to resolve the password reset URL
        try:
            resolved = resolve('/api/auth/password/reset/')
            print(f"✅ URL resolves to: {resolved.func}")
            print(f"✅ View name: {resolved.view_name}")
            print(f"✅ App name: {resolved.app_name}")
        except Exception as e:
            print(f"❌ URL resolution failed: {str(e)}")
            
        # Check if URL is accessible
        from django.test import Client
        client = Client()
        response = client.get('/api/auth/password/reset/')
        print(f"📡 GET request status: {response.status_code} (should be 405 Method Not Allowed)")
        
        return True
        
    except Exception as e:
        print(f"❌ URL configuration check failed: {str(e)}")
        return False

def check_middleware():
    """Check middleware configuration"""
    print("\n🔍 Checking Middleware...")
    print(f"🔧 Middleware: {settings.MIDDLEWARE}")
    
    # Check if our custom middleware is loaded
    custom_middleware = 'admin_interface.middleware.APIErrorMiddleware'
    if custom_middleware in settings.MIDDLEWARE:
        print(f"✅ Custom API middleware is loaded")
    else:
        print(f"⚠️ Custom API middleware not found in MIDDLEWARE")
    
    return True

if __name__ == "__main__":
    print("🚀 Starting Live API Tests\n")
    
    # Test 1: Check settings
    print("⚙️ Checking Django Settings...")
    print(f"   DEBUG: {settings.DEBUG}")
    print(f"   EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"   EMAIL_HOST: {settings.EMAIL_HOST}")
    print(f"   EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    print(f"   FRONTEND_URL: {settings.FRONTEND_URL}")
    print(f"   MIDDLEWARE: {len(settings.MIDDLEWARE)} items")
    
    # Test 2: URL Configuration
    url_works = check_url_configuration()
    
    # Test 3: Middleware
    middleware_works = check_middleware()
    
    # Test 4: API Endpoint
    api_works = test_password_reset_api()
    
    print(f"\n📊 Test Results Summary:")
    print(f"🔍 URL Configuration: {'✅ PASS' if url_works else '❌ FAIL'}")
    print(f"🔍 Middleware: {'✅ PASS' if middleware_works else '❌ FAIL'}")
    print(f"📡 Password Reset API: {'✅ PASS' if api_works else '❌ FAIL'}")
    
    if not api_works:
        print(f"\n💡 Suggested next steps:")
        print(f"1. Check Django logs: sudo journalctl -u gunicorn -f")
        print(f"2. Check nginx logs: sudo tail -f /var/log/nginx/error.log")
        print(f"3. Restart services: sudo systemctl restart gunicorn nginx")
        print(f"4. Check if DEBUG=True helps identify the issue") 