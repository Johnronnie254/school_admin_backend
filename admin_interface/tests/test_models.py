from django.test import TestCase
from admin_interface.models import (
    User, Teacher, Student, Parent, ExamResult, SchoolFee,
    Notification, TimeTable, Document, SchoolEvent, Attendance, Role
)
from django.contrib.auth.hashers import make_password
import uuid
from datetime import datetime, timedelta

class UserModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='test123',
            role=Role.ADMIN
        )

    def test_user_creation(self):
        self.assertEqual(self.user.email, 'test@example.com')
        self.assertEqual(self.user.role, Role.ADMIN)

    def test_user_str_representation(self):
        expected = f" ({self.user.email})"
        self.assertEqual(str(self.user), expected)

    def test_create_superuser(self):
        admin = User.objects.create_superuser(
            email='admin@example.com',
            password='admin123'
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)

    def test_user_without_email(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(email='', password='test123')

class TeacherModelTest(TestCase):
    def setUp(self):
        self.teacher_data = {
            'name': "John Doe",
            'email': "john@example.com",
            'phone_number': "0712345678",
            'class_assigned': "Grade 7",
            'subjects': ['Mathematics', 'Physics']
        }
        self.teacher = Teacher.objects.create(**self.teacher_data)

    def test_teacher_creation(self):
        self.assertEqual(self.teacher.name, self.teacher_data['name'])
        self.assertEqual(self.teacher.email, self.teacher_data['email'])
        self.assertEqual(self.teacher.subjects, self.teacher_data['subjects'])

    def test_teacher_str_representation(self):
        self.assertEqual(str(self.teacher), self.teacher_data['name'])

    def test_unique_email_constraint(self):
        with self.assertRaises(Exception):
            Teacher.objects.create(**self.teacher_data)

    def test_teacher_update(self):
        new_class = "Grade 8"
        self.teacher.class_assigned = new_class
        self.teacher.save()
        self.assertEqual(self.teacher.class_assigned, new_class)

    def test_invalid_phone_number(self):
        with self.assertRaises(Exception):
            Teacher.objects.create(
                name="Test Teacher",
                email="test@example.com",
                phone_number="invalid",
                class_assigned="Grade 1"
            )

class StudentModelTest(TestCase):
    def setUp(self):
        # Create parent first
        self.parent = Parent.objects.create(
            name="Parent Name",
            email="parent@example.com",
            phone_number="0712345678",
            password=make_password("password123")
        )
        
        # Create parent user that matches the parent
        self.parent_user = User.objects.create_user(
            email=self.parent.email,
            password="password123",
            role=Role.PARENT,
            first_name=self.parent.name
        )
        
        self.student_data = {
            'name': "Jane Doe",
            'guardian': "Parent Name",
            'contact': "0712345679",
            'grade': 7,
            'class_assigned': "7A",
            'parent': self.parent_user  # Link to User instance
        }
        self.student = Student.objects.create(**self.student_data)

    def test_student_creation(self):
        self.assertEqual(self.student.name, self.student_data['name'])
        self.assertEqual(self.student.grade, self.student_data['grade'])
        self.assertEqual(self.student.parent, self.parent_user)

    def test_student_str_representation(self):
        expected = f"{self.student.name} - Grade {self.student.grade}"
        self.assertEqual(str(self.student), expected)

    def test_unique_contact_constraint(self):
        with self.assertRaises(Exception):
            Student.objects.create(**self.student_data)

    def test_invalid_grade(self):
        with self.assertRaises(Exception):
            Student.objects.create(
                name="Test Student",
                guardian="Test Guardian",
                contact="0712345680",
                grade=-1,
                parent=self.parent_user
            )

class ExamResultModelTest(TestCase):
    def setUp(self):
        # Create parent user first
        self.parent_user = User.objects.create_user(
            email="parent@example.com",
            password="password123",
            role=Role.PARENT,
            first_name="Parent Name"
        )
        
        self.student = Student.objects.create(
            name="Jane Doe",
            guardian="Parent Name",
            contact="0712345679",
            grade=7,
            class_assigned="7A",
            parent=self.parent_user  # Link to User instance
        )
        self.exam_data = {
            'student': self.student,
            'exam_name': "Mid Term",
            'subject': "Mathematics",
            'marks': 85.5,
            'grade': "A",
            'term': "Term 1",
            'year': 2024,
            'remarks': "Excellent performance"
        }
        self.exam_result = ExamResult.objects.create(**self.exam_data)

    def test_exam_result_creation(self):
        self.assertEqual(self.exam_result.student, self.student)
        self.assertEqual(self.exam_result.marks, self.exam_data['marks'])
        self.assertEqual(self.exam_result.grade, self.exam_data['grade'])

    def test_exam_result_str_representation(self):
        expected = f"{self.student.name} - Mathematics (Mid Term)"
        self.assertEqual(str(self.exam_result), expected)

class AttendanceModelTest(TestCase):
    def setUp(self):
        # Create parent user first
        self.parent_user = User.objects.create_user(
            email="parent@example.com",
            password="password123",
            role=Role.PARENT,
            first_name="Parent Name"
        )
        
        self.student = Student.objects.create(
            name="Jane Doe",
            guardian="Parent Name",
            contact="0712345679",
            grade=7,
            parent=self.parent_user  # Link to User instance
        )
        self.teacher = Teacher.objects.create(
            name="Jane Doe",
            email="jane@example.com",
            phone_number="0712345678",
            subjects=['English']
        )
        self.attendance_data = {
            'student': self.student,
            'date': datetime.now().date(),
            'status': 'present',
            'recorded_by': self.teacher
        }
        self.attendance = Attendance.objects.create(**self.attendance_data)

    def test_attendance_creation(self):
        self.assertEqual(self.attendance.student, self.student)
        self.assertEqual(self.attendance.status, 'present')
        self.assertEqual(self.attendance.recorded_by, self.teacher)

    def test_duplicate_attendance(self):
        with self.assertRaises(Exception):
            Attendance.objects.create(**self.attendance_data)

    def test_invalid_status(self):
        with self.assertRaises(Exception):
            Attendance.objects.create(
                student=self.student,
                date=datetime.now().date(),
                status='invalid_status',
                recorded_by=self.teacher
            )

class SchoolFeeModelTest(TestCase):
    def setUp(self):
        # Create parent user first
        self.parent_user = User.objects.create_user(
            email="parent@example.com",
            password="password123",
            role=Role.PARENT,
            first_name="Parent Name"
        )
        
        self.student = Student.objects.create(
            name="Jane Doe",
            contact="0712345679",
            grade=7,
            parent=self.parent_user  # Link to User instance
        )
        self.fee_data = {
            'student': self.student,
            'amount': 15000.00,
            'term': 'Term 1',
            'year': 2024,
            'payment_date': datetime.now().date(),
            'payment_method': 'mpesa',
            'transaction_id': uuid.uuid4(),
            'status': 'pending'
        }
        self.fee = SchoolFee.objects.create(**self.fee_data)

    def test_fee_creation(self):
        self.assertEqual(self.fee.amount, self.fee_data['amount'])
        self.assertEqual(self.fee.status, 'pending')

    def test_fee_completion(self):
        self.fee.status = 'completed'
        self.fee.save()
        self.assertEqual(self.fee.status, 'completed')

    def test_invalid_amount(self):
        with self.assertRaises(Exception):
            SchoolFee.objects.create(
                student=self.student,
                amount=-1000,  # Invalid negative amount
                term='Term 1',
                year=2024
            )

class DocumentModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='test123',
            role=Role.ADMIN
        )
        self.student = Student.objects.create(
            name="Jane Doe",
            contact="0712345679",
            grade=7
        )
        self.doc_data = {
            'title': 'Test Document',
            'file': 'documents/2024/03/test.pdf',
            'document_type': 'report',
            'uploaded_by': self.user,
            'student': self.student
        }
        self.document = Document.objects.create(**self.doc_data)

    def test_document_creation(self):
        self.assertEqual(self.document.title, self.doc_data['title'])
        self.assertEqual(self.document.document_type, 'report')

    def test_document_str_representation(self):
        expected = f"{self.doc_data['title']} - {self.student.name}"
        self.assertEqual(str(self.document), expected)

class NotificationModelTest(TestCase):
    def setUp(self):
        self.notification_data = {
            'message': 'Test notification',
            'target_group': 'teachers',
        }
        self.notification = Notification.objects.create(**self.notification_data)

    def test_notification_creation(self):
        self.assertEqual(
            self.notification.message, 
            self.notification_data['message']
        )
        self.assertEqual(
            self.notification.target_group, 
            self.notification_data['target_group']
        )

    def test_invalid_target_group(self):
        with self.assertRaises(Exception):
            Notification.objects.create(
                message='Test',
                target_group='invalid_group'  # Invalid target group
            )

class TimeTableModelTest(TestCase):
    def setUp(self):
        self.teacher = Teacher.objects.create(
            name="John Smith",
            email="john.smith@example.com",
            phone_number="0712345678",
            subjects=['Mathematics']
        )
        self.timetable_data = {
            'grade': 7,
            'day': 'Monday',
            'period': 1,
            'subject': 'Mathematics',
            'teacher': self.teacher,
            'start_time': '08:00:00',
            'end_time': '09:00:00',
            'room': 'Room 101'
        }
        self.timetable = TimeTable.objects.create(**self.timetable_data)

    def test_timetable_creation(self):
        self.assertEqual(self.timetable.subject, self.timetable_data['subject'])
        self.assertEqual(self.timetable.teacher, self.teacher)

    def test_unique_period_constraint(self):
        # Test that we can't create another class in the same period
        with self.assertRaises(Exception):
            TimeTable.objects.create(**self.timetable_data)

    def test_invalid_time_range(self):
        with self.assertRaises(Exception):
            TimeTable.objects.create(
                grade=7,
                day='Monday',
                period=2,
                subject='English',
                teacher=self.teacher,
                start_time='10:00:00',
                end_time='09:00:00',  # End time before start time
                room='Room 102'
            )

# Add more test classes...