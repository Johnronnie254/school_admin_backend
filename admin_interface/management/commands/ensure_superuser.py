from django.core.management.base import BaseCommand
from django.db import transaction
from admin_interface.models import User, Role

class Command(BaseCommand):
    help = 'Ensures that a superuser exists with the predefined credentials'

    def handle(self, *args, **kwargs):
        email = 'educite@gmail.com'
        password = 'educite@gmail.com'
        
        try:
            with transaction.atomic():
                if User.objects.filter(email=email).exists():
                    user = User.objects.get(email=email)
                    # Update the user to ensure it's a superuser with the correct role
                    user.is_staff = True
                    user.is_superuser = True
                    user.role = Role.SUPERUSER
                    user.set_password(password)
                    user.save()
                    self.stdout.write(self.style.SUCCESS(f'Superuser "{email}" updated successfully'))
                else:
                    # Create the superuser if it doesn't exist
                    User.objects.create_superuser(
                        email=email,
                        password=password,
                        first_name='Super',
                        last_name='User',
                        role=Role.SUPERUSER
                    )
                    self.stdout.write(self.style.SUCCESS(f'Superuser "{email}" created successfully'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to ensure superuser: {e}')) 