from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from admin_interface.models import (
    Teacher, Student, Parent, User, ExamResult, 
    SchoolFee, Notification, TimeTable, Role, Document
)
from django.contrib.auth.hashers import make_password
import uuid
from datetime import datetime
from rest_framework_simplejwt.tokens import RefreshToken

class AuthenticationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='test123',
            role=Role.ADMIN
        )
        self.login_url = reverse('token_obtain_pair')

    def test_successful_login(self):
        url = reverse('login')
        response = self.client.post(url, {
            'email': 'test@example.com',
            'password': 'test123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['email'], 'test@example.com')

    def test_failed_login(self):
        url = reverse('login')
        response = self.client.post(url, {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['status'], 'error')
        self.assertEqual(response.data['message'], 'Invalid email or password.')

    def test_register_user(self):
        url = reverse('register')
        data = {
            'name': 'Test User',
            'email': 'newuser@example.com',
            'password': 'password123',
            'password_confirmation': 'password123',
            'role': Role.TEACHER
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['name'], 'Test User')

    def test_register_with_mismatched_passwords(self):
        url = reverse('register')
        data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'password123',
            'password_confirmation': 'different_password',
            'role': Role.TEACHER
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class TeacherViewSetTest(APITestCase):
    def setUp(self):
        # Create users with different roles
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            role=Role.ADMIN
        )
        self.teacher_user = User.objects.create_user(
            email='teacher@example.com',
            password='teacher123',
            role=Role.TEACHER
        )
        
        # Create test data
        self.teacher = Teacher.objects.create(
            name="John Doe",
            email="john@example.com",
            phone_number="0712345678",
            class_assigned="Grade 7",
            subjects=['Mathematics', 'Physics']
        )

    def test_list_teachers_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('teacher-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_list_teachers_as_unauthorized(self):
        # Make sure to clear any existing authentication
        self.client.force_authenticate(user=None)
        url = reverse('teacher-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_teacher_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('teacher-list')
        data = {
            'name': 'Jane Smith',
            'email': 'jane@example.com',
            'phone_number': '0712345680',
            'class_assigned': 'Grade 8',
            'subjects': ['English', 'Literature']
        }
        response = self.client.post(
            url,
            data=data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_teacher_with_invalid_data(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('teacher-list')
        data = {
            'name': '',  # Invalid: empty name
            'email': 'invalid-email',  # Invalid email format
            'phone_number': '0712345680',
            'class_assigned': 'Grade 8'
        }
        response = self.client.post(
            url,
            data=data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_teacher_as_non_admin(self):
        self.client.force_authenticate(user=self.teacher_user)
        url = reverse('teacher-list')
        data = {
            'name': 'Jane Smith',
            'email': 'jane@example.com',
            'phone_number': '0712345680',
            'class_assigned': 'Grade 8'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_update_teacher(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('teacher-detail', kwargs={'pk': self.teacher.id})
        data = {'name': 'John Smith'}
        response = self.client.patch(
            url,
            data=data,
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'John Smith')

    def test_delete_teacher(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('teacher-detail', kwargs={'pk': self.teacher.id})
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

# Add more test classes...

class StudentViewSetTest(APITestCase):
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
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            role=Role.ADMIN
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_create_student(self):
        url = reverse('student-list')
        data = {
            'name': 'Student Name',
            'guardian': 'Guardian Name',
            'contact': '0712345679',
            'grade': 7,
            'class_assigned': '7A',
            'parent': str(self.parent_user.id)  # Use parent user's ID
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

class DocumentUploadViewTest(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            role=Role.ADMIN
        )
        self.student = Student.objects.create(
            name="Jane Doe",
            contact="0712345679",
            grade=7
        )
        self.client.force_authenticate(user=self.admin_user)
        
    def test_upload_document(self):
        url = reverse('document-upload')
        with open('test_file.pdf', 'wb') as f:
            f.write(b'test content')
        
        with open('test_file.pdf', 'rb') as f:
            data = {
                'title': 'Test Document',
                'file': f,
                'document_type': 'report',
                'student': str(self.student.id)
            }
            response = self.client.post(url, data, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Document.objects.filter(title='Test Document').exists())

class FeePaymentViewTest(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            role=Role.ADMIN
        )
        self.student = Student.objects.create(
            name="Jane Doe",
            contact="0712345679",
            grade=7
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_initiate_payment(self):
        url = reverse('initiate-fee-payment')
        data = {
            'student': str(self.student.id),
            'amount': 15000.00,
            'term': 'Term 1',
            'year': 2024,
            'payment_method': 'mpesa',
            'payment_date': datetime.now().date().isoformat()
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('transaction_id', response.data)

    def test_confirm_payment(self):
        # First create a pending payment
        fee = SchoolFee.objects.create(
            student=self.student,
            amount=15000.00,
            term='Term 1',
            year=2024,
            status='pending',
            transaction_id=uuid.uuid4(),
            payment_date=datetime.now().date(),
            payment_method='mpesa'
        )
        
        url = reverse('confirm-fee-payment')
        data = {
            'transaction_id': str(fee.transaction_id),
            'status': 'completed'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify payment was updated
        fee.refresh_from_db()
        self.assertEqual(fee.status, 'completed')

class ExamResultViewTest(APITestCase):
    def setUp(self):
        self.teacher_user = User.objects.create_user(
            email='teacher@example.com',
            password='teacher123',
            role=Role.TEACHER
        )
        self.student = Student.objects.create(
            name="Jane Doe",
            contact="0712345679",
            grade=7
        )
        self.client.force_authenticate(user=self.teacher_user)

    def test_record_exam_result(self):
        url = reverse('record-exam-result')
        data = {
            'student': str(self.student.id),
            'exam_name': 'Mid Term',
            'subject': 'Mathematics',
            'marks': 85.5,
            'grade': 'A',
            'term': 'Term 1',
            'year': 2024,
            'remarks': 'Excellent performance'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

class NotificationViewTest(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            role=Role.ADMIN
        )
        self.client.force_authenticate(user=self.admin_user)

    def test_send_notification(self):
        url = reverse('notification-list')
        data = {
            'message': 'Test notification',
            'target_group': 'teachers'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_notifications(self):
        # Create some test notifications
        Notification.objects.create(
            message='Test 1',
            target_group='teachers'
        )
        Notification.objects.create(
            message='Test 2',
            target_group='students'
        )
        
        url = reverse('notification-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2) 