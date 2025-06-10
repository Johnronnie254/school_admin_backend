from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from admin_interface.models import User, Teacher, Role
from django.db import transaction


class Command(BaseCommand):
    help = 'Fix all teacher passwords to match their email addresses'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making actual changes',
        )
        parser.add_argument(
            '--verify-only',
            action='store_true',
            help='Only verify existing passwords without changing them',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        verify_only = options['verify_only']
        
        self.stdout.write("=" * 60)
        self.stdout.write("🔐 Teacher Password Management Tool")
        self.stdout.write("=" * 60)
        
        # Get all teacher users
        teacher_users = User.objects.filter(role=Role.TEACHER).order_by('email')
        total_teachers = teacher_users.count()
        
        self.stdout.write(f"\n📊 Found {total_teachers} teachers in the system")
        
        if verify_only:
            self.stdout.write("\n🔍 Verifying existing passwords...")
            self._verify_passwords(teacher_users)
            return
        
        if dry_run:
            self.stdout.write("\n🧪 DRY RUN MODE - No changes will be made")
            self._show_dry_run(teacher_users)
            return
        
        # Actual password fixing
        self.stdout.write(f"\n🔧 Fixing passwords for all {total_teachers} teachers...")
        self.stdout.write("Setting password = email for each teacher\n")
        
        success_count = 0
        failed_count = 0
        
        with transaction.atomic():
            for i, user in enumerate(teacher_users, 1):
                try:
                    # Set password to match email
                    user.set_password(user.email)
                    user.save()
                    
                    # Verify authentication works
                    auth_user = authenticate(username=user.email, password=user.email)
                    
                    if auth_user:
                        self.stdout.write(
                            f"✅ [{i:2d}/{total_teachers}] {user.email:<30} - Password fixed"
                        )
                        success_count += 1
                    else:
                        self.stdout.write(
                            f"❌ [{i:2d}/{total_teachers}] {user.email:<30} - Auth failed after fix"
                        )
                        failed_count += 1
                        
                except Exception as e:
                    self.stdout.write(
                        f"💥 [{i:2d}/{total_teachers}] {user.email:<30} - Error: {str(e)}"
                    )
                    failed_count += 1
        
        # Summary
        self.stdout.write("\n" + "=" * 60)
        self.stdout.write("📈 SUMMARY")
        self.stdout.write("=" * 60)
        self.stdout.write(f"✅ Successfully fixed: {success_count}")
        self.stdout.write(f"❌ Failed to fix: {failed_count}")
        self.stdout.write(f"📊 Total processed: {total_teachers}")
        
        if success_count > 0:
            self.stdout.write(f"\n🎉 {success_count} teachers can now login with their email as password!")
            
        if failed_count > 0:
            self.stdout.write(f"\n⚠️  {failed_count} teachers still have issues - check logs above")
            
        # Test a few random logins
        self.stdout.write("\n🧪 Testing random teacher logins...")
        import random
        test_users = list(teacher_users.filter(is_active=True)[:5])
        
        for user in test_users:
            auth_user = authenticate(username=user.email, password=user.email)
            status = "✅ PASS" if auth_user else "❌ FAIL"
            self.stdout.write(f"   {status} - {user.email}")

    def _verify_passwords(self, teacher_users):
        """Verify which teachers can currently login with email as password"""
        working_count = 0
        broken_count = 0
        
        for i, user in enumerate(teacher_users, 1):
            auth_user = authenticate(username=user.email, password=user.email)
            
            if auth_user:
                self.stdout.write(
                    f"✅ [{i:2d}] {user.email:<30} - Can login with email as password"
                )
                working_count += 1
            else:
                self.stdout.write(
                    f"❌ [{i:2d}] {user.email:<30} - Cannot login with email as password"
                )
                broken_count += 1
        
        self.stdout.write(f"\n📊 Working logins: {working_count}")
        self.stdout.write(f"📊 Broken logins: {broken_count}")
        
        if broken_count > 0:
            self.stdout.write(f"\n💡 Run without --verify-only to fix {broken_count} teachers")

    def _show_dry_run(self, teacher_users):
        """Show what would be changed in dry run mode"""
        would_fix_count = 0
        already_working_count = 0
        
        for i, user in enumerate(teacher_users, 1):
            auth_user = authenticate(username=user.email, password=user.email)
            
            if auth_user:
                self.stdout.write(
                    f"⏭️  [{i:2d}] {user.email:<30} - Already working, skip"
                )
                already_working_count += 1
            else:
                self.stdout.write(
                    f"🔧 [{i:2d}] {user.email:<30} - Would fix password"
                )
                would_fix_count += 1
        
        self.stdout.write(f"\n📊 Would fix: {would_fix_count} teachers")
        self.stdout.write(f"📊 Already working: {already_working_count} teachers")
        
        if would_fix_count > 0:
            self.stdout.write(f"\n💡 Run without --dry-run to fix {would_fix_count} teachers")

    def success(self, message):
        """Override success to add emoji"""
        self.stdout.write(f"🎉 {message}")

    def warning(self, message):
        """Override warning to add emoji"""
        self.stdout.write(f"⚠️  {message}") 