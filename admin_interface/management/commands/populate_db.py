from django.core.management.base import BaseCommand
from faker import Faker
from admin_interface.models import Teacher, Student, Parent, ExamResult, SchoolFee, Notification, User, Role
from django.contrib.auth.hashers import make_password
import random
from datetime import datetime, timedelta
import uuid

class Command(BaseCommand):
    help = 'Populate the database with fake data'

    def generate_phone(self):
        """Generate a valid 10-digit phone number"""
        return f"07{random.randint(10000000, 99999999)}"  # Format: 07XXXXXXXX

    def handle(self, *args, **kwargs):
        fake = Faker()

        # First create parent users
        parent_users = []
        for _ in range(10):
            parent_user = User.objects.create_user(
                email=fake.unique.email(),
                password='password123',
                first_name=fake.name(),
                role=Role.PARENT
            )
            parent_users.append(parent_user)
            self.stdout.write(f"Created parent user: {parent_user.email}")

        # Create parent profiles
        parents = []
        for parent_user in parent_users:
            parent = Parent.objects.create(
                name=parent_user.first_name,
                email=parent_user.email,
                phone_number=self.generate_phone(),
                password=make_password('password123')
            )
            parents.append(parent)
            self.stdout.write(f"Created parent profile: {parent.name}")

        # Create teachers
        subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography']
        for _ in range(10):
            teacher = Teacher.objects.create(
                name=fake.name(),
                email=fake.unique.email(),
                phone_number=self.generate_phone(),
                class_assigned=f"Grade {random.randint(1, 12)}",
                subjects=random.sample(subjects, random.randint(1, 3))
            )
            self.stdout.write(f"Created teacher: {teacher.name}")

        # Create students - now linking to parent users instead of parent profiles
        students = []
        for _ in range(20):
            parent_user = random.choice(parent_users)  # Select a random parent user
            student = Student.objects.create(
                name=fake.name(),
                guardian=parent_user.first_name,
                contact=self.generate_phone(),
                grade=random.randint(1, 12),
                class_assigned=f"{random.randint(1, 12)}-{random.choice(['A', 'B', 'C'])}",
                parent=parent_user  # Link to User model instead of Parent model
            )
            students.append(student)
            self.stdout.write(f"Created student: {student.name}")

        # Create Exam Results
        for student in students:
            for subject in subjects[:3]:  # Create results for 3 subjects
                ExamResult.objects.create(
                    student=student,
                    exam_name=f"Term {random.randint(1,3)} Exam",
                    subject=subject,
                    marks=random.uniform(50.0, 100.0),
                    grade=random.choice(['A', 'B', 'C', 'D']),
                    term=f"Term {random.randint(1,3)}",
                    year=2024,
                    remarks=fake.sentence()
                )

        # Create School Fees Records
        for student in students:
            SchoolFee.objects.create(
                student=student,
                amount=random.uniform(10000.0, 50000.0),
                term=f"Term {random.randint(1,3)}",
                year=2024,
                payment_date=fake.date_this_year(),
                payment_method=random.choice(['mpesa', 'bank', 'cash']),
                transaction_id=uuid.uuid4(),
                status=random.choice(['pending', 'completed', 'failed'])
            )

        # Create 10 Notifications
        target_choices = ["teachers", "students", "both"]
        for _ in range(10):
            notification = Notification.objects.create(
                message=fake.text(),
                target_group=random.choice(target_choices)
            )
            self.stdout.write(f"Created notification: {notification.message[:30]}...")

        self.stdout.write(self.style.SUCCESS('Successfully populated the database'))
