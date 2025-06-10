#!/usr/bin/env python
"""
Simple script to fix all teacher passwords to match their email addresses.
Run this from the Django project root directory.

Usage:
    python fix_teacher_passwords.py
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_admin.settings')
django.setup()

from django.contrib.auth import authenticate
from admin_interface.models import User, Role


def fix_all_teacher_passwords():
    """Fix all teacher passwords to match their email addresses"""
    
    print("🔐 Starting Teacher Password Fix")
    print("=" * 50)
    
    # Get all teacher users
    teachers = User.objects.filter(role=Role.TEACHER).order_by('email')
    total = teachers.count()
    
    print(f"📊 Found {total} teachers")
    print("🔧 Setting password = email for each teacher...\n")
    
    success_count = 0
    failed_count = 0
    
    for i, teacher in enumerate(teachers, 1):
        try:
            # Set password to email
            teacher.set_password(teacher.email)
            teacher.save()
            
            # Verify it works
            auth_user = authenticate(username=teacher.email, password=teacher.email)
            
            if auth_user:
                print(f"✅ [{i:2d}/{total}] {teacher.email}")
                success_count += 1
            else:
                print(f"❌ [{i:2d}/{total}] {teacher.email} - Auth failed")
                failed_count += 1
                
        except Exception as e:
            print(f"💥 [{i:2d}/{total}] {teacher.email} - Error: {e}")
            failed_count += 1
    
    # Summary
    print("\n" + "=" * 50)
    print("📈 RESULTS")
    print("=" * 50)
    print(f"✅ Success: {success_count}")
    print(f"❌ Failed:  {failed_count}")
    print(f"📊 Total:   {total}")
    
    if success_count > 0:
        print(f"\n🎉 {success_count} teachers can now login with email as password!")
        
        # Test a few logins
        print("\n🧪 Testing some logins:")
        test_teachers = teachers.filter(is_active=True)[:3]
        for teacher in test_teachers:
            auth = authenticate(username=teacher.email, password=teacher.email)
            status = "✅" if auth else "❌"
            print(f"   {status} {teacher.email}")
    
    if failed_count > 0:
        print(f"\n⚠️  {failed_count} teachers still have issues")
    
    print("\n🚀 All done! Teachers can now login with:")
    print("   📧 Email: their_email@domain.com")
    print("   🔑 Password: their_email@domain.com")


if __name__ == "__main__":
    try:
        fix_all_teacher_passwords()
    except Exception as e:
        print(f"💥 Error: {e}")
        sys.exit(1) 