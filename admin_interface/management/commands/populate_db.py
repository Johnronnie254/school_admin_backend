from django.core.management.base import BaseCommand
from faker import Faker
from admin_interface.models import Teacher, Student, Notification, LeaveRequest, SalaryAdvanceRequest
from random import randint, choice
from datetime import timedelta
import random

class Command(BaseCommand):
    help = 'Populate the database with fake data'

    def handle(self, *args, **kwargs):
        fake = Faker()

        # Create 10 Teachers
        for _ in range(10):
            teacher = Teacher.objects.create(
                name=fake.name(),
                subject=fake.word(),
                leave_status=choice([True, False])
            )
            self.stdout.write(f"Created teacher: {teacher.name}")

        # Create 10 Students
        for _ in range(10):
            student = Student.objects.create(
                name=fake.name(),
                grade=fake.word(),
                attendance=round(random.uniform(70.0, 100.0), 2)
            )
            self.stdout.write(f"Created student: {student.name}")

        # Create 10 Notifications
        for _ in range(10):
            notification = Notification.objects.create(
                message=fake.text(),
                target_group=choice(['Teachers', 'Students']),
                date=fake.date_this_year()
            )
            self.stdout.write(f"Created notification: {notification.message[:20]}...")

        # Create 10 Leave Requests
        teachers = Teacher.objects.all()
        for _ in range(10):
            leave_request = LeaveRequest.objects.create(
                teacher=choice(teachers),
                start_date=fake.date_this_year(),
                end_date=fake.date_this_year(),
                approved=choice([True, False]),
                reason=fake.text()
            )
            self.stdout.write(f"Created leave request: {leave_request.teacher.name} - {leave_request.approved}")

        # Create 10 Salary Advance Requests
        for _ in range(10):
            salary_advance = SalaryAdvanceRequest.objects.create(
                teacher=choice(teachers),
                amount_requested=round(random.uniform(5000, 20000), 2),
                approved=choice([True, False]),
                reason=fake.text()
            )
            self.stdout.write(f"Created salary advance request: {salary_advance.teacher.name} - {salary_advance.approved}")
