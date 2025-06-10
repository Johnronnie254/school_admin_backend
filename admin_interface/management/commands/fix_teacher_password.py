from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from admin_interface.models import User, Teacher, Role


class Command(BaseCommand):
    help = 'Fix teacher password by setting email as password'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Teacher email to fix password for',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Fix passwords for all teachers',
        )

    def handle(self, *args, **options):
        email = options['email']
        fix_all = options['all']
        
        if fix_all:
            # Fix all teacher passwords
            teacher_users = User.objects.filter(role=Role.TEACHER)
            self.stdout.write(f"🔧 Fixing passwords for {teacher_users.count()} teachers...")
            
            fixed_count = 0
            for user in teacher_users:
                user.set_password(user.email)  # Set email as password
                user.save()
                
                # Test authentication
                auth_user = authenticate(username=user.email, password=user.email)
                if auth_user:
                    self.stdout.write(f"✅ Fixed password for {user.email}")
                    fixed_count += 1
                else:
                    self.stdout.write(f"❌ Failed to fix password for {user.email}")
            
            self.stdout.write(f"\n🎉 Fixed passwords for {fixed_count}/{teacher_users.count()} teachers")
            
        elif email:
            # Fix specific teacher password
            try:
                user = User.objects.get(email=email, role=Role.TEACHER)
                
                self.stdout.write(f"🔧 Fixing password for: {email}")
                
                # Set email as password
                user.set_password(email)
                user.save()
                
                # Test authentication
                auth_user = authenticate(username=email, password=email)
                if auth_user:
                    self.stdout.write(f"✅ Password fixed successfully!")
                    self.stdout.write(f"✅ Authentication test passed!")
                    
                    # Test the login endpoint data format
                    from rest_framework_simplejwt.tokens import RefreshToken
                    refresh = RefreshToken.for_user(auth_user)
                    
                    self.stdout.write(f"\n📱 Expected login response:")
                    self.stdout.write(f"Status: 200 OK")
                    self.stdout.write(f"Response body should contain:")
                    self.stdout.write(f"  - status: success")
                    self.stdout.write(f"  - user.id: {auth_user.id}")
                    self.stdout.write(f"  - user.email: {auth_user.email}")
                    self.stdout.write(f"  - user.role: {auth_user.role}")
                    self.stdout.write(f"  - tokens.access: [JWT Token]")
                    self.stdout.write(f"  - tokens.refresh: [JWT Token]")
                    
                else:
                    self.stdout.write(f"❌ Authentication still failing after password reset!")
                    
            except User.DoesNotExist:
                self.stdout.write(f"❌ Teacher user not found: {email}")
                
        else:
            self.stdout.write(f"❌ Please provide --email or use --all")
            self.stdout.write(f"Examples:")
            self.stdout.write(f"  python manage.py fix_teacher_password --email=onyago@gmail.com")
            self.stdout.write(f"  python manage.py fix_teacher_password --all") 