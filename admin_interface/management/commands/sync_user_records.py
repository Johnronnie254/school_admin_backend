from django.core.management.base import BaseCommand
from django.db import transaction
from admin_interface.models import User, Teacher, Parent, Role
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Sync Teacher and Parent records with User records to fix messaging issues'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be created without actually creating records',
        )
        parser.add_argument(
            '--fix-all',
            action='store_true',
            help='Fix all inconsistencies (create missing User records)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        fix_all = options['fix_all']
        
        self.stdout.write(self.style.SUCCESS('Starting User record synchronization...'))
        
        # Check Teachers without User records
        teachers_without_users = []
        for teacher in Teacher.objects.all():
            try:
                User.objects.get(id=teacher.id)
            except User.DoesNotExist:
                teachers_without_users.append(teacher)
        
        # Check Parents without User records
        parents_without_users = []
        for parent in Parent.objects.all():
            try:
                User.objects.get(id=parent.id)
            except User.DoesNotExist:
                parents_without_users.append(parent)
        
        self.stdout.write(f"Found {len(teachers_without_users)} teachers without User records")
        self.stdout.write(f"Found {len(parents_without_users)} parents without User records")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN - No changes will be made"))
            
            if teachers_without_users:
                self.stdout.write("Teachers that would get User records:")
                for teacher in teachers_without_users:
                    self.stdout.write(f"  - {teacher.name} ({teacher.email}) - ID: {teacher.id}")
            
            if parents_without_users:
                self.stdout.write("Parents that would get User records:")
                for parent in parents_without_users:
                    self.stdout.write(f"  - {parent.name} ({parent.email}) - ID: {parent.id}")
            
            return
        
        if not fix_all:
            self.stdout.write(self.style.WARNING("Use --fix-all to actually create the missing User records"))
            return
        
        created_count = 0
        
        # Create User records for Teachers
        with transaction.atomic():
            for teacher in teachers_without_users:
                try:
                    user = User(
                        id=teacher.id,
                        email=teacher.email,
                        first_name=teacher.name,
                        role=Role.TEACHER,
                        school=teacher.school,
                        is_active=True
                    )
                    user.set_password(User.objects.make_random_password())
                    user.save()
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Created User record for Teacher: {teacher.name} ({teacher.email})"
                        )
                    )
                    created_count += 1
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Failed to create User for Teacher {teacher.name}: {str(e)}"
                        )
                    )
        
        # Create User records for Parents
        with transaction.atomic():
            for parent in parents_without_users:
                try:
                    user = User(
                        id=parent.id,
                        email=parent.email,
                        first_name=parent.name,
                        role=Role.PARENT,
                        school=parent.school,
                        is_active=True
                    )
                    user.set_password(User.objects.make_random_password())
                    user.save()
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Created User record for Parent: {parent.name} ({parent.email})"
                        )
                    )
                    created_count += 1
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f"Failed to create User for Parent {parent.name}: {str(e)}"
                        )
                    )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Synchronization complete! Created {created_count} User records."
            )
        ) 