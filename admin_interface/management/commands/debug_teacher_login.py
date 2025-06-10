from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from admin_interface.models import User, Teacher, Role


class Command(BaseCommand):
    help = 'Debug teacher login issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Teacher email to debug',
        )

    def handle(self, *args, **options):
        email = options['email']
        
        if not email:
            email = 'onyago@gmail.com'  # Default to the failing email
            
        self.stdout.write(f"🔍 Debugging login for: {email}")
        self.stdout.write("=" * 50)
        
        # Check if User exists
        try:
            user = User.objects.get(email=email)
            self.stdout.write(f"✅ User found:")
            self.stdout.write(f"   - ID: {user.id}")
            self.stdout.write(f"   - Email: {user.email}")
            self.stdout.write(f"   - First Name: {user.first_name}")
            self.stdout.write(f"   - Role: {user.role}")
            self.stdout.write(f"   - Is Active: {user.is_active}")
            self.stdout.write(f"   - Is Staff: {user.is_staff}")
            self.stdout.write(f"   - School: {user.school}")
            self.stdout.write(f"   - Has Usable Password: {user.has_usable_password()}")
            
            # Check password
            password = email  # Since you're using email as password
            self.stdout.write(f"\n🔐 Testing password authentication...")
            
            # Test direct authentication
            auth_user = authenticate(username=email, password=password)
            if auth_user:
                self.stdout.write(f"✅ Authentication successful!")
            else:
                self.stdout.write(f"❌ Authentication failed!")
                
                # Try to check password manually
                if user.check_password(password):
                    self.stdout.write(f"✅ Password check passed - issue might be elsewhere")
                else:
                    self.stdout.write(f"❌ Password check failed")
                    
                    # Check if account is inactive
                    if not user.is_active:
                        self.stdout.write(f"⚠️  Account is INACTIVE")
                    
                    # Check if school is inactive
                    if user.school and not user.school.is_active:
                        self.stdout.write(f"⚠️  School is INACTIVE: {user.school.name}")
                        
        except User.DoesNotExist:
            self.stdout.write(f"❌ User not found with email: {email}")
            
        # Check if Teacher exists
        self.stdout.write(f"\n👨‍🏫 Checking Teacher record...")
        try:
            teacher = Teacher.objects.get(email=email)
            self.stdout.write(f"✅ Teacher found:")
            self.stdout.write(f"   - ID: {teacher.id}")
            self.stdout.write(f"   - Name: {teacher.name}")
            self.stdout.write(f"   - Email: {teacher.email}")
            self.stdout.write(f"   - School: {teacher.school}")
            self.stdout.write(f"   - Class: {teacher.class_assigned}")
            self.stdout.write(f"   - Subjects: {teacher.subjects}")
        except Teacher.DoesNotExist:
            self.stdout.write(f"❌ Teacher not found with email: {email}")
            
        # List all teachers for comparison
        self.stdout.write(f"\n📋 All Teachers in database:")
        teachers = Teacher.objects.all()[:10]  # First 10
        for teacher in teachers:
            user_exists = User.objects.filter(email=teacher.email).exists()
            self.stdout.write(f"   - {teacher.email} (User exists: {user_exists})")
            
        # List all users with teacher role
        self.stdout.write(f"\n👥 All Users with teacher role:")
        teacher_users = User.objects.filter(role=Role.TEACHER)[:10]  # First 10
        for user in teacher_users:
            teacher_exists = Teacher.objects.filter(email=user.email).exists()
            self.stdout.write(f"   - {user.email} (Teacher exists: {teacher_exists}, Active: {user.is_active})")
            
        self.stdout.write("\n" + "=" * 50)
        self.stdout.write("🔧 Suggested fixes:")
        
        try:
            user = User.objects.get(email=email)
            if not user.is_active:
                self.stdout.write(f"1. Activate user account:")
                self.stdout.write(f"   User.objects.filter(email='{email}').update(is_active=True)")
                
            if user.school and not user.school.is_active:
                self.stdout.write(f"2. Activate school:")
                self.stdout.write(f"   School.objects.filter(id='{user.school.id}').update(is_active=True)")
                
            if not user.has_usable_password():
                self.stdout.write(f"3. Set password:")
                self.stdout.write(f"   user = User.objects.get(email='{email}')")
                self.stdout.write(f"   user.set_password('{email}')")
                self.stdout.write(f"   user.save()")
                
        except User.DoesNotExist:
            self.stdout.write(f"1. Create User account:")
            self.stdout.write(f"   from admin_interface.models import User, Role")
            self.stdout.write(f"   User.objects.create_user(")
            self.stdout.write(f"       email='{email}',")
            self.stdout.write(f"       password='{email}',")
            self.stdout.write(f"       role=Role.TEACHER,")
            self.stdout.write(f"       first_name='Teacher Name'")
            self.stdout.write(f"   )") 