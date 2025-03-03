from django.core.management.base import BaseCommand
from faker import Faker
from admin_interface.models import Teacher, Student, Parent, ExamResult, SchoolFee, Notification
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

        # Create 10 Parents
        parents = []
        for _ in range(10):
            parent = Parent.objects.create(
                name=fake.name(),
                email=fake.unique.email(),
                phone_number=self.generate_phone(),  # Using custom phone generator
                password=make_password('password123')
            )
            parents.append(parent)
            self.stdout.write(f"Created parent: {parent.name}")

        # Create 10 Teachers
        subjects = ['Mathematics', 'English', 'Science', 'History', 'Geography']
        for _ in range(10):
            teacher = Teacher.objects.create(
                name=fake.name(),
                email=fake.unique.email(),
                phone_number=self.generate_phone(),  # Using custom phone generator
                class_assigned=f"Grade {random.randint(1, 12)}",
                subjects=random.sample(subjects, random.randint(1, 3))
            )
            self.stdout.write(f"Created teacher: {teacher.name}")

        # Create 20 Students
        students = []
        for _ in range(20):
            student = Student.objects.create(
                name=fake.name(),
                guardian=fake.name(),
                contact=self.generate_phone(),  # Using custom phone generator
                grade=random.randint(1, 12),
                class_assigned=f"{random.randint(1, 12)}-{random.choice(['A', 'B', 'C'])}",
                parent=random.choice(parents)
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
