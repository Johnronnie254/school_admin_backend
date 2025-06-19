from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
import time
import pandas as pd
from .models import User, Teacher, Student, Notification, Parent, ExamResult, SchoolFee, Document, Role, Message, LeaveApplication, TimeTable, Product, ExamPDF, SchoolEvent, PasswordResetToken, TeacherParentAssociation, School, AdminCredential
from .serializers import (
    TeacherSerializer, StudentSerializer, NotificationSerializer,
    ParentSerializer, ParentRegistrationSerializer, 
    ExamResultSerializer, SchoolFeeSerializer, 
    StudentDetailSerializer, RegisterSerializer, LoginSerializer,
    UserSerializer, DocumentSerializer, MessageSerializer, LeaveApplicationSerializer, ProductSerializer,
    ExamPDFSerializer, SchoolEventSerializer, PasswordResetRequestSerializer, PasswordResetConfirmSerializer,
    TeacherParentAssociationSerializer, SchoolSerializer, TimeTableSerializer
)
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from django.db import transaction
from django.db import models
from .permissions import IsAdmin, IsTeacher, IsParent, IsAdminOrTeacherOrParent, IsAdminOrTeacher
from django.http import HttpResponse
import uuid
from rest_framework import serializers
from django.shortcuts import get_object_or_404
from django.urls import path
from django.core.mail import send_mail
from django.conf import settings
from rest_framework.exceptions import PermissionDenied
from django.db import IntegrityError
from django.db.models import Q
from django.db import connection
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

class RegisterView(APIView):
    """Handles user registration."""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            
            # If registering a parent, also create a Parent record
            if user.role == Role.PARENT:
                try:
                    # Create a Parent record linked to this user
                    Parent.objects.get_or_create(
                        email=user.email,
                        defaults={
                            'name': user.first_name,
                            'phone_number': request.data.get('phone_number', ''),
                            'password': '',  # Not needed since auth happens through User model
                            'school': user.school  # Link to the same school
                        }
                    )
                except Exception as e:
                    print(f"Error creating parent record: {str(e)}")
                    # Continue even if parent record creation fails
            
            return Response({
                'user': {
                    'id': user.id,
                    'name': user.first_name,
                    'email': user.email,
                    'role': user.role
                },
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class LoginView(APIView):
    """Handles user login and returns JWT tokens."""
    permission_classes = [AllowAny]
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            return Response(serializer.validated_data, status=status.HTTP_200_OK)
        except serializers.ValidationError:
            return Response({
                "status": "error",
                "message": "Invalid email or password."
            }, status=status.HTTP_401_UNAUTHORIZED)

class LogoutView(APIView):
    """Handles user logout."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"error": "Refresh token is required"}, status=status.HTTP_400_BAD_REQUEST)

            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Invalid token"}, status=status.HTTP_400_BAD_REQUEST)

class AdminViewSet(viewsets.ViewSet):
    """ViewSet for administrative operations"""
    permission_classes = [IsAdmin]

    @action(detail=False, methods=['post'])
    def clear_exam_results(self, request):
        year = request.data.get('year')
        term = request.data.get('term')
        
        queryset = ExamResult.objects.all()
        if hasattr(request.user, 'school') and request.user.school:
            queryset = queryset.filter(school=request.user.school)
        
        if year:
            queryset = queryset.filter(year=year)
        if term:
            queryset = queryset.filter(term=term)
            
        count = queryset.count()
        queryset.delete()
        return Response({
            'message': f'Deleted {count} exam results',
            'year': year,
            'term': term
        })

    @action(detail=False, methods=['post'])
    def clear_fee_records(self, request):
        year = request.data.get('year')
        status_type = request.data.get('status')
        
        queryset = SchoolFee.objects.all()
        if hasattr(request.user, 'school') and request.user.school:
            queryset = queryset.filter(school=request.user.school)
            
        if year:
            queryset = queryset.filter(year=year)
        if status_type:
            queryset = queryset.filter(status=status_type)
            
        count = queryset.count()
        queryset.delete()
        return Response({
            'message': f'Deleted {count} fee records',
            'year': year,
            'status': status_type
        })

    @action(detail=False, methods=['put'])
    def update_school_settings(self, request):
        """Update school-wide settings"""
        try:
            # Example: Update term dates, fee structure, etc.
            return Response({
                'message': 'Settings updated successfully'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def bulk_promote_students(self, request):
        """Promote students to next grade"""
        try:
            from_grade = request.data.get('from_grade')
            to_grade = request.data.get('to_grade')
            
            students = Student.objects.filter(grade=from_grade)
            count = students.count()
            students.update(grade=to_grade)
            
            return Response({
                'message': f'Promoted {count} students from grade {from_grade} to {to_grade}'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def users(self, request):
        """Get all users (teachers and parents)"""
        teachers = User.objects.filter(role=Role.TEACHER)
        parents = User.objects.filter(role=Role.PARENT)
        
        teacher_serializer = UserSerializer(teachers, many=True)
        parent_serializer = UserSerializer(parents, many=True)
        
        return Response({
            'teachers': teacher_serializer.data,
            'parents': parent_serializer.data
        })

class SchoolViewSet(viewsets.ModelViewSet):
    """ViewSet for School operations"""
    queryset = School.objects.all()
    serializer_class = SchoolSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'registration_number', 'email']

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.SUPERUSER:
            return School.objects.all()
        elif hasattr(user, 'school') and user.school:
            return School.objects.filter(id=user.school.id)
        return School.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'toggle_status']:
            return [IsSuperUser()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save()
        
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """
        Toggle a school's active status and update all user credentials associated with the school.
        When deactivated, users can't login with a message about subscription ending.
        When activated, user credentials are restored.
        """
        school = self.get_object()
        # Toggle the school's active status
        school.is_active = not school.is_active
        school.save()
        
        if school.is_active:
            # School was activated - restore login credentials
            User.objects.filter(school=school).update(is_active=True)
            
            # Create notification for all users in this school
            Notification.objects.create(
                message="Your school subscription has been renewed. You can now access all Educite features.",
                target_group="all",
                school=school,
                created_by=request.user
            )
            
            return Response({
                'status': 'success',
                'message': f'School "{school.name}" has been activated and all user credentials have been restored.',
                'is_active': True
            })
        else:
            # School was deactivated - invalidate login credentials
            User.objects.filter(school=school).update(is_active=False)
            
            # Create notification for all users in this school
            Notification.objects.create(
                message="Your subscription has ended. Please renew to access Educite features.",
                target_group="all",
                school=school,
                created_by=request.user
            )
            
            return Response({
                'status': 'success',
                'message': f'School "{school.name}" has been deactivated and all user credentials have been invalidated.',
                'is_active': False
            })

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """Get school statistics"""
        school = self.get_object()
        stats = {
            'total_teachers': Teacher.objects.filter(school=school).count(),
            'total_students': Student.objects.filter(school=school).count(),
            'total_parents': User.objects.filter(school=school, role=Role.PARENT).count(),
            'active_users': User.objects.filter(school=school, is_active=True).count()
        }
        return Response(stats)

    @action(detail=True, methods=['get'])
    def teachers(self, request, pk=None):
        """Get all teachers in the school"""
        school = self.get_object()
        teachers = Teacher.objects.filter(school=school)
        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def parents(self, request, pk=None):
        """Get all parents in the school"""
        school = self.get_object()
        parents = User.objects.filter(school=school, role=Role.PARENT)
        serializer = UserSerializer(parents, many=True)
        return Response(serializer.data)

class TeacherViewSet(viewsets.ModelViewSet):
    """ViewSet for Teacher operations"""
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]  # Changed from IsAdminUser to IsAuthenticated

    def get_queryset(self):
        """Filter teachers by school"""
        user = self.request.user
        queryset = Teacher.objects.all()
        
        # Filter by school if user has a school
        if user.school:
            queryset = queryset.filter(school=user.school)
            
        return queryset

    def get_permissions(self):
        if self.action in ['create']:
            # Allow any authenticated user to create a teacher profile
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only admin can modify/delete teachers
            return [IsAdmin()]
        # Authenticated users can view teachers
        return [IsAuthenticated()]
        
    def perform_create(self, serializer):
        """Ensure teacher can only create profile with their own email and set the school"""
        user = self.request.user
        email = self.request.data.get('email')
        
        # Admin can create any teacher profile
        if user.role == Role.ADMIN:
            # Set the teacher's school to the admin's school
            school = user.school
            teacher = serializer.save(school=school) if school else serializer.save()
            
            # Ensure a User record exists for this teacher
            try:
                User.objects.get(id=teacher.id)
            except User.DoesNotExist:
                # Create User record with same ID
                try:
                    user_record = User(
                        id=teacher.id,
                        email=teacher.email,
                        first_name=teacher.name,
                        role=Role.TEACHER,
                        school=teacher.school,
                        is_active=True
                    )
                    user_record.set_password(User.objects.make_random_password())
                    user_record.save()
                except Exception as e:
                    print(f"Failed to create User record for teacher: {str(e)}")
                    
        # Teacher can only create their own profile
        elif user.role == Role.TEACHER and user.email == email:
            # Set the teacher's school to the teacher's school
            school = user.school
            teacher = serializer.save(school=school) if school else serializer.save()
            
            # Ensure a User record exists for this teacher
            try:
                User.objects.get(id=teacher.id)
            except User.DoesNotExist:
                # Create User record with same ID
                try:
                    user_record = User(
                        id=teacher.id,
                        email=teacher.email,
                        first_name=teacher.name,
                        role=Role.TEACHER,
                        school=teacher.school,
                        is_active=True
                    )
                    user_record.set_password(User.objects.make_random_password())
                    user_record.save()
                except Exception as e:
                    print(f"Failed to create User record for teacher: {str(e)}")
        else:
            raise serializers.ValidationError({"error": "You can only create a teacher profile with your own email address"})

    @action(detail=False, methods=['get'], permission_classes=[IsTeacher])
    def available_parents(self, request):
        """Get parents of students in teacher's assigned class"""
        user = request.user
        if not user.school:
            return Response({"error": "Teacher must be associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            teacher = Teacher.objects.get(email=user.email)
            
            if not teacher.class_assigned:
                return Response(
                    {"error": "Teacher is not assigned to any class"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Get students in the teacher's assigned class
            students_in_class = Student.objects.filter(
                class_assigned=teacher.class_assigned,
                school=teacher.school,
                parent__isnull=False
            ).select_related('parent')
            
            # Get unique parents from these students
            parent_data = {}
            for student in students_in_class:
                if student.parent:
                    parent_id = str(student.parent.id)
                    if parent_id not in parent_data:
                        parent_data[parent_id] = {
                            'id': parent_id,
                            'first_name': student.parent.first_name,
                            'email': student.parent.email,
                            'children': []
                        }
                    parent_data[parent_id]['children'].append({
                        'id': str(student.id),
                        'name': student.name,
                        'grade': student.grade
                    })
            
            return Response({
                'parents': list(parent_data.values()),
                'count': len(parent_data),
                'class_name': teacher.class_assigned
            })
            
        except Teacher.DoesNotExist:
            return Response(
                {"error": "Teacher profile not found"},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['post'])
    def bulk_upload(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_csv(file) if file.name.endswith('.csv') else pd.read_excel(file)
            Teacher.objects.bulk_create([
                Teacher(**row) for row in df.to_dict('records')
            ])
            return Response({"message": "Teachers uploaded successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsTeacher])
    def upload_results(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_csv(file) if file.name.endswith('.csv') else pd.read_excel(file)
            results = []
            for _, row in df.iterrows():
                result = ExamResult.objects.create(
                    student_id=row['student_id'],
                    exam_name=row['exam_name'],
                    subject=row['subject'],
                    marks=row['marks'],
                    grade=row['grade'],
                    term=row['term'],
                    year=row['year'],
                    remarks=row.get('remarks', '')
                )
                results.append(result)
            
            return Response({
                'message': f'Successfully uploaded {len(results)} results',
                'exam_name': results[0].exam_name if results else None
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], permission_classes=[IsTeacher])
    def add_feedback(self, request):
        try:
            student_id = request.data.get('student_id')
            exam_id = request.data.get('exam_id')
            feedback = request.data.get('feedback')
            
            if not all([student_id, exam_id, feedback]):
                return Response(
                    {'error': 'student_id, exam_id and feedback are required'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                # Validate UUIDs
                uuid.UUID(str(exam_id))
                uuid.UUID(str(student_id))
            except ValueError:
                return Response(
                    {'error': 'Invalid UUID format'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            result = ExamResult.objects.get(id=exam_id, student_id=student_id)
            result.remarks = feedback
            result.save()
            
            return Response({
                'message': 'Feedback added successfully',
                'student': result.student.name,
                'exam': result.exam_name
            })
        except ExamResult.DoesNotExist:
            return Response(
                {'error': 'Exam result not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['put'], permission_classes=[IsTeacher])
    def update_results(self, request):
        """Update existing exam results"""
        try:
            exam_id = request.data.get('exam_id')
            marks = request.data.get('marks')
            grade = request.data.get('grade')
            remarks = request.data.get('remarks')
            
            result = ExamResult.objects.get(id=exam_id)
            result.marks = marks
            result.grade = grade
            result.remarks = remarks
            result.save()
            
            return Response({
                'message': 'Result updated successfully',
                'result': ExamResultSerializer(result).data
            })
        except ExamResult.DoesNotExist:
            return Response(
                {'error': 'Exam result not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['put'], permission_classes=[IsTeacher])
    def update_class_assignment(self, request):
        """Update class assignments for multiple students"""
        try:
            student_ids = request.data.get('student_ids', [])  # Get list of student IDs
            new_class = request.data.get('new_class')         # Get new class name
            
            # Update all specified students to the new class
            students = Student.objects.filter(id__in=student_ids)
            students.update(class_assigned=new_class)
            
            return Response({
                'message': f'Updated class assignment for {len(student_ids)} students'
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def edit_subjects(self, request, pk=None):
        """Edit teacher's subjects"""
        teacher = self.get_object()
        subjects = request.data.get('subjects', [])
        try:
            teacher.subjects = subjects
            teacher.save()
            return Response({
                'message': 'Subjects updated successfully',
                'subjects': teacher.subjects
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def edit_class(self, request, pk=None):
        """Edit teacher's assigned class"""
        teacher = self.get_object()
        new_class = request.data.get('class_assigned')
        try:
            teacher.class_assigned = new_class
            teacher.save()
            return Response({
                'message': 'Class assignment updated',
                'class_assigned': teacher.class_assigned
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StudentViewSet(viewsets.ModelViewSet):
    """ViewSet for Student operations"""
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]
    queryset = Student.objects.none()
    pagination_class = None
    
    def get_queryset(self):
        user = self.request.user
        if user.role == Role.ADMIN:
            # Admin should only see students from their school
            if user.school:
                return Student.objects.filter(school=user.school)
            return Student.objects.all()
        elif user.role == Role.TEACHER:
            # Teacher should only see students from their school
            if user.school:
                return Student.objects.filter(school=user.school)
            return Student.objects.all()
        elif user.role == Role.PARENT:
            return Student.objects.filter(parent=user)
        return Student.objects.none()

    def get_permissions(self):
        if self.action in ['create', 'create_student']:
            return [IsAuthenticated(), IsAdminOrTeacherOrParent()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Ensure proper parent-student relationship when creating a student"""
        user = self.request.user
        
        # If parent is creating, automatically set parent field
        if user.role == Role.PARENT:
            serializer.save(parent=user)
        elif user.role in [Role.ADMIN, Role.TEACHER]:
            # For admin or teacher users, validate parent exists and has correct role
            parent_email = self.request.data.get('parent_email')
            if not parent_email:
                raise serializers.ValidationError({"parent_email": "Parent email is required"})
                
            try:
                parent = User.objects.get(email=parent_email, role=Role.PARENT)
                if user.school and parent.school and user.school != parent.school:
                    raise serializers.ValidationError({
                        "parent_email": "Parent must belong to the same school"
                    })
                serializer.save(parent=parent, school=user.school)
            except User.DoesNotExist:
                raise serializers.ValidationError({
                    "parent_email": "Parent not found or does not have parent role"
                })
        else:
            raise serializers.ValidationError({
                "error": "Only parents, teachers, and admins can create students"
            })

    def perform_update(self, serializer):
        """Ensure users can only update students they have permission for"""
        instance = self.get_object()
        user = self.request.user
        
        # Check if user has permission to update this student
        if user.role == Role.PARENT and instance.parent != user:
            raise PermissionDenied("You can only update your own children's records")
        elif user.role not in [Role.ADMIN, Role.TEACHER, Role.PARENT]:
            raise PermissionDenied("You do not have permission to update student records")
            
        # Validate parent if being changed
        if 'parent' in serializer.validated_data:
            parent = serializer.validated_data['parent']
            if parent.role != Role.PARENT:
                raise serializers.ValidationError({
                    "parent": "The selected user must have a parent role"
                })
            if user.school and parent.school and user.school != parent.school:
                raise serializers.ValidationError({
                    "parent": "Parent must belong to the same school"
                })
            
        serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Ensure users can only delete students they have permission for"""
        instance = self.get_object()
        user = request.user

        # Check if user has permission to delete this student
        if user.role == Role.PARENT and instance.parent != user:
            raise PermissionDenied("You can only delete your own children's records")
        elif user.role not in [Role.ADMIN, Role.TEACHER, Role.PARENT]:
            raise PermissionDenied("You do not have permission to delete student records")

        self.perform_destroy(instance)
        return Response(
            {"message": "Student deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

    @action(detail=False, methods=['post'])
    def create_student(self, request):
        """Create a student associated with a parent using parent_email"""
        try:
            # If parent is creating, use their ID
            if request.user.role == Role.PARENT:
                parent = request.user
            else:
                # For admin/teacher creating student, parent_email should be provided
                parent_email = request.data.get('parent_email')
                if not parent_email:
                    return Response(
                        {'error': 'parent_email is required'}, 
                        status=status.HTTP_400_BAD_REQUEST
                    )
                try:
                    parent = User.objects.get(email=parent_email, role=Role.PARENT)
                except User.DoesNotExist:
                    return Response(
                        {'error': 'Parent not found'}, 
                        status=status.HTTP_404_NOT_FOUND
                    )

            # Create student with parent association
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save(parent=parent, school=request.user.school)

            return Response({
                'message': 'Student created successfully',
                'student': serializer.data
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['get'])
    def exam_results(self, request, pk=None):
        student = self.get_object()
        queryset = student.exam_results.filter(
            year=request.query_params.get('year', None),
            term=request.query_params.get('term', None)
        )
        serializer = ExamResultSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def fee_records(self, request, pk=None):
        student = self.get_object()
        queryset = student.fee_records.filter(
            year=request.query_params.get('year', None),
            term=request.query_params.get('term', None)
        )
        serializer = SchoolFeeSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def initiate_payment(self, request, pk=None):
        student = self.get_object()
        try:
            payment = SchoolFee.objects.create(
                student=student,
                amount=request.data.get('amount'),
                term=request.data.get('term'),
                year=request.data.get('year'),
                payment_method=request.data.get('payment_method'),
                payment_date=timezone.now(),
                transaction_id=uuid.uuid4(),
                status='pending'
            )
            return Response({
                'payment_id': payment.id,
                'transaction_id': payment.transaction_id,
                'amount': payment.amount
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put'], permission_classes=[IsTeacher|IsAdmin])
    def update_student_details(self, request, pk=None):
        """Update student details"""
        try:
            student = self.get_object()
            serializer = StudentSerializer(student, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({
                'message': 'Student details updated successfully',
                'student': serializer.data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def edit_grade(self, request, pk=None):
        """Edit student's grade"""
        student = self.get_object()
        new_grade = request.data.get('grade')
        try:
            student.grade = new_grade
            student.save()
            return Response({
                'message': 'Grade updated successfully',
                'grade': student.grade
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ParentViewSet(viewsets.ModelViewSet):
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.ADMIN:
            return Parent.objects.filter(school=user.school)
        elif user.role == Role.TEACHER:
            return Parent.objects.filter(school=user.school)
        elif user.role == Role.PARENT:
            return Parent.objects.filter(user=user)
        return Parent.objects.none()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        # Get all parents in the queryset
        parents = self.get_queryset()
        # Get the corresponding User IDs for these parents
        parent_users = User.objects.filter(email__in=[parent.email for parent in parents], role=Role.PARENT)
        # Get students for these parent users
        students = Student.objects.filter(parent_id__in=parent_users.values_list('id', flat=True))
        # Create a mapping of parent email to their children
        parent_children = {}
        for student in students:
            parent_user = User.objects.get(id=student.parent_id)
            if parent_user.email not in parent_children:
                parent_children[parent_user.email] = []
            parent_children[parent_user.email].append(student)
        context['parent_children'] = parent_children
        return context

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAdminOrTeacher]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def perform_create(self, serializer):
        """Create Parent and corresponding User record"""
        try:
            # Create parent first to get the ID
            parent = serializer.save(school=self.request.user.school)
            
            # Then create User with the same ID
            user = User(
                id=parent.id,
                email=parent.email,
                first_name=parent.name,
                role=Role.PARENT,
                school=self.request.user.school,
                is_active=True
            )
            user.set_password(serializer.validated_data['password'])
            user.save()
        except IntegrityError:
            raise ValidationError({'email': 'A user with this email already exists'})

    def destroy(self, request, *args, **kwargs):
        parent = self.get_object()
        # The cascade delete will automatically delete all associated students
        # due to the CASCADE setting in the Student model
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        try:
            # Try to find parent in User model first
            try:
                user = User.objects.get(email=email, role=Role.PARENT)
                if user.check_password(password):
                    # Create or get Parent record
                    parent, created = Parent.objects.get_or_create(
                        email=email,
                        defaults={
                            'name': user.first_name,
                            'phone_number': '',  # Empty phone number for now
                            'password': ''
                        }
                    )
                    refresh = RefreshToken.for_user(user)
                    return Response({
                        'token': str(refresh.access_token),
                        'parent': ParentSerializer(parent).data
                    })
            except User.DoesNotExist:
                # Fall back to Parent model
                parent = Parent.objects.get(email=email)
                if check_password(password, parent.password):
                    refresh = RefreshToken.for_user(parent)
                    return Response({
                        'token': str(refresh.access_token),
                        'parent': ParentSerializer(parent).data
                    })
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        except Parent.DoesNotExist:
            return Response({'error': 'Parent not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['put'], permission_classes=[IsParent])
    def update_profile(self, request, pk=None):
        """Update parent profile"""
        try:
            parent = self.get_object()
            serializer = ParentSerializer(parent, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            # Also update the User record if it exists
            try:
                user = User.objects.get(email=parent.email, role=Role.PARENT)
                user.first_name = parent.name
                user.save()
            except User.DoesNotExist:
                pass
                
            return Response({
                'message': 'Profile updated successfully',
                'parent': serializer.data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put'], permission_classes=[IsParent])
    def update_contact_info(self, request, pk=None):
        """Update parent contact information"""
        parent = self.get_object()
        
        # Check if the parent belongs to the authenticated user
        if parent.id != request.user.id:
            return Response(
                {"detail": "You can only update your own contact information."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Update only specific fields
        allowed_fields = ['phone_number', 'email']
        for field in allowed_fields:
            if field in request.data:
                setattr(parent, field, request.data[field])
        
        parent.save()
        serializer = self.get_serializer(parent)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[IsParent])
    def available_teachers(self, request):
        """Get teachers of classes where parent's children are enrolled"""
        user = request.user
        if not user.school:
            return Response({"error": "Parent must be associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get children of this parent
            children = Student.objects.filter(parent=user).select_related('school')
            
            if not children.exists():
                return Response({
                    'teachers': [],
                    'count': 0,
                    'message': 'No children found for this parent'
                })
            
            # Get unique classes of the children
            child_classes = set()
            child_data = {}
            for child in children:
                if child.class_assigned:
                    child_classes.add(child.class_assigned)
                    if child.class_assigned not in child_data:
                        child_data[child.class_assigned] = []
                    child_data[child.class_assigned].append({
                        'id': str(child.id),
                        'name': child.name,
                        'grade': child.grade
                    })
            
            # Get teachers assigned to these classes
            teachers_data = []
            teachers_in_classes = Teacher.objects.filter(
                class_assigned__in=child_classes,
                school=user.school
            )
            
            for teacher in teachers_in_classes:
                teachers_data.append({
                    'id': str(teacher.id),
                    'name': teacher.name,
                    'email': teacher.email,
                    'subjects': teacher.subjects if teacher.subjects else [],
                    'class_assigned': teacher.class_assigned,
                    'children_in_class': child_data.get(teacher.class_assigned, [])
                })
            
            return Response({
                'teachers': teachers_data,
                'count': len(teachers_data),
                'children_classes': list(child_classes)
            })
            
        except Exception as e:
            return Response(
                {"error": f"Error fetching available teachers: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def create(self, request, *args, **kwargs):
        """Override create to set the school automatically"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set school for parent based on admin's school
        if request.user.role == Role.ADMIN and request.user.school:
            self.perform_create(serializer, school=request.user.school)
        else:
            self.perform_create(serializer)
            
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
            
    def perform_create(self, serializer, school=None):
        """Save with school if provided"""
        # Create the parent object with school if provided
        if school:
            parent_data = serializer.validated_data.copy()
            
            # Get password before popping out unnecessary fields
            password = parent_data.pop('password', None)
            parent_data.pop('password_confirmation', None)
            
            # Create the Parent record
            parent = serializer.save(school=school)
            
            # Create a User record with the same information
            if parent and password:
                # Check if a User with this email already exists
                if not User.objects.filter(email=parent.email).exists():
                    try:
                        user = User(
                            id=parent.id,  # Use same ID as parent
                            email=parent.email,
                            first_name=parent.name,
                            role=Role.PARENT,
                            school=school,
                            is_active=True
                        )
                        user.set_password(password)
                        user.save()
                    except Exception as e:
                        print(f"Failed to create User record for parent: {str(e)}")
        else:
            serializer.save()

class ExamResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Retrieve all exam results, optionally filtered by school"""
        queryset = ExamResult.objects.all()
        
        # Filter by school if user has a school
        if request.user.school:
            queryset = queryset.filter(school=request.user.school)
            
        # Optional query parameters for filtering
        year = request.query_params.get('year')
        term = request.query_params.get('term')
        student_id = request.query_params.get('student_id')
        
        if year:
            queryset = queryset.filter(year=year)
        if term:
            queryset = queryset.filter(term=term)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
            
        serializer = ExamResultSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ExamResultSerializer(data=request.data)
        if serializer.is_valid():
            # Set the school when creating a new exam result
            if request.user.school:
                serializer.save(school=request.user.school)
            else:
                serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class SchoolFeeViewSet(viewsets.ModelViewSet):
    """ViewSet for SchoolFee operations"""
    queryset = SchoolFee.objects.all()
    serializer_class = SchoolFeeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__name', 'transaction_id', 'status']
    ordering_fields = ['payment_date', 'amount', 'created_at']
    
    def get_queryset(self):
        """Filter fee records by school"""
        user = self.request.user
        queryset = SchoolFee.objects.all()
        
        # Filter by school if user has a school
        if user.school:
            queryset = queryset.filter(school=user.school)
            
        return queryset
        
    def perform_create(self, serializer):
        """Set the school field when creating new fee records"""
        user = self.request.user
        if user.school:
            serializer.save(school=user.school)
        else:
            serializer.save()

    @action(detail=True, methods=['patch'])
    def edit_payment_status(self, request, pk=None):
        """Edit payment status"""
        payment = self.get_object()
        try:
            payment.status = request.data.get('status', payment.status)
            payment.save()
            return Response({
                'message': 'Payment status updated',
                'payment': SchoolFeeSerializer(payment).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class NotificationView(viewsets.ModelViewSet):
    """ViewSet for managing notifications"""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['message', 'target_group']
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        # Filter by school if user has a school
        if user.school:
            queryset = queryset.filter(school=user.school)
            
        # Filter by target_group if provided in query params
        target_group = self.request.query_params.get('target_group', None)
        if target_group:
            queryset = queryset.filter(target_group=target_group)
            
        return queryset

    def perform_create(self, serializer):
        """Set the created_by and school fields for notification"""
        user = self.request.user
        school = user.school
        if school:
            serializer.save(created_by=user, school=school)
        else:
            serializer.save(created_by=user)

class StudentDetailView(APIView):
    """Handles retrieving, updating, and deleting a student."""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        student = self.get_object()
        serializer = self.serializer_class(student)
        return Response(serializer.data)

    def put(self, request, pk):
        student = self.get_object()
        serializer = self.serializer_class(student, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        student = self.get_object()
        student.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class StudentByGradeView(APIView):
    """Filters students by grade."""
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, grade):
        """Fetch students of the given grade."""
        students = Student.objects.filter(grade=grade)
        serializer = self.serializer_class(students, many=True)
        return Response(serializer.data)

class StudentUploadView(APIView):
    """Handles bulk student uploads via CSV/Excel file."""
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def post(self, request, grade):
        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if file.name.endswith('.csv'):
                df = pd.read_csv(file)
            elif file.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(file)
            else:
                return Response({"error": "Invalid file format. Please upload CSV or Excel file."}, 
                             status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                for _, row in df.iterrows():
                    Student.objects.create(
                        name=row['name'],
                        guardian=row['guardian'],
                        contact=row['contact'],
                        grade=grade,
                        class_assigned=row.get('class_assigned')
                    )

            return Response({"message": "Students uploaded successfully!"}, 
                          status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class TeachersBySubjectView(APIView):
    """Filter teachers by subject."""
    serializer_class = TeacherSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, subject):
        teachers = Teacher.objects.filter(subjects__contains=[subject])
        serializer = self.serializer_class(teachers, many=True)
        return Response(serializer.data)

class SchoolStatisticsView(APIView):
    """Get school statistics for the current user's school."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get statistics related to the user's school"""
        try:
            # Get the user's school
            school = request.user.school
            if not school:
                return Response(
                    {"error": "No school associated with this user"},
                    status=status.HTTP_404_NOT_FOUND
                )
                
            # Get teacher count for this school
            total_teachers = Teacher.objects.filter(school=school).count()
            
            # Get student count for this school
            total_students = Student.objects.filter(school=school).count()
            
            # Get parent count for this school
            parent_count = Parent.objects.filter(school=school).count()
            
            # Calculate active users
            active_users = total_teachers + total_students + parent_count
            
            # Get students per grade
            students_per_grade = []
            grades = Student.objects.filter(school=school).values('grade').distinct()
            for grade_dict in grades:
                grade = grade_dict['grade']
                count = Student.objects.filter(school=school, grade=grade).count()
                students_per_grade.append({'grade': grade, 'count': count})
            
            # Get recent notifications
            recent_notifications = Notification.objects.filter(school=school).order_by('-created_at')[:5]
            notification_list = []
            for notification in recent_notifications:
                notification_list.append({
                    'message': notification.message,
                    'target_group': notification.target_group,
                    'created_at': notification.created_at.isoformat()
                })
            
            # Return statistics
            return Response({
                'total_teachers': total_teachers,
                'total_students': total_students,
                'total_parents': parent_count,
                'active_users': active_users,
                'students_per_grade': students_per_grade,
                'recent_notifications': notification_list,
                'school_name': school.name
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ParentRegistrationView(APIView):
    """Handle parent registration"""
    serializer_class = ParentRegistrationSerializer
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ParentLoginView(APIView):
    """Handle parent login"""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            parent = Parent.objects.get(email=email)
            if check_password(password, parent.password):
                # Create JWT token for parent
                refresh = RefreshToken.for_user(parent)
                return Response({
                    'token': str(refresh.access_token),
                    'parent': ParentSerializer(parent).data
                })
            else:
                return Response(
                    {'error': 'Invalid credentials'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Parent.DoesNotExist:
            return Response(
                {'error': 'Parent not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class ParentChildrenView(APIView):
    """Get, Update and Delete children for a parent"""
    serializer_class = StudentDetailSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, parent_id=None):
        try:
            # If no parent_id is provided, use the authenticated user's ID
            if not parent_id:
                parent_id = request.user.id

            # If user is not admin and trying to access other parent's children
            if request.user.role != Role.ADMIN and str(request.user.id) != str(parent_id):
                return Response(
                    {"error": "You do not have permission to view these students"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Verify parent exists and is a parent
            try:
                parent = User.objects.get(id=parent_id, role=Role.PARENT)
            except User.DoesNotExist:
                return Response(
                    {"error": "Parent not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Get all children for the parent
            children = Student.objects.filter(parent=parent).order_by('name')
            serializer = self.serializer_class(children, many=True)

            return Response({
                "parent": {
                    "id": parent.id,
                    "name": parent.first_name,
                    "email": parent.email
                },
                "children": serializer.data
            })

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def put(self, request, student_id):
        """Update a specific student"""
        try:
            # Get the student and verify ownership
            try:
                student = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                return Response(
                    {"error": "Student not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if the authenticated user is the parent of this student
            if request.user.role != Role.ADMIN and student.parent != request.user:
                return Response(
                    {"error": "You can only update your own children's records"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Update the student
            serializer = StudentSerializer(student, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    "message": "Student updated successfully",
                    "student": serializer.data
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def delete(self, request, student_id):
        """Delete a specific student"""
        try:
            # Get the student and verify ownership
            try:
                student = Student.objects.get(id=student_id)
            except Student.DoesNotExist:
                return Response(
                    {"error": "Student not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # Check if the authenticated user is the parent of this student
            if request.user.role != Role.ADMIN and student.parent != request.user:
                return Response(
                    {"error": "You can only delete your own children's records"},
                    status=status.HTTP_403_FORBIDDEN
                )

            # Delete the student
            student.delete()
            return Response(
                {"message": "Student deleted successfully"},
                status=status.HTTP_204_NO_CONTENT
            )

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class StudentExamResultsView(APIView):
    """Get exam results for a student"""
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        year = request.query_params.get('year')
        term = request.query_params.get('term')
        
        queryset = ExamResult.objects.filter(student_id=student_id)
        if year:
            queryset = queryset.filter(year=year)
        if term:
            queryset = queryset.filter(term=term)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

class StudentFeeRecordsView(APIView):
    """Get fee records for a student"""
    serializer_class = SchoolFeeSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        year = request.query_params.get('year')
        term = request.query_params.get('term')
        
        queryset = SchoolFee.objects.filter(student_id=student_id)
        if year:
            queryset = queryset.filter(year=year)
        if term:
            queryset = queryset.filter(term=term)
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data)

class InitiateFeesPaymentView(APIView):
    """Initiate a new fee payment"""
    permission_classes = [IsAuthenticated]

    def post(self, request, student_id):
        try:
            student = Student.objects.get(id=student_id)
            amount = request.data.get('amount')
            term = request.data.get('term')
            year = request.data.get('year')
            payment_method = request.data.get('payment_method')

            # Create a pending payment record
            payment = SchoolFee.objects.create(
                student=student,
                amount=amount,
                term=term,
                year=year,
                payment_method=payment_method,
                payment_date=timezone.now(),
                transaction_id=uuid.uuid4(),
                status='pending'
            )

            # Here you would integrate with your payment gateway
            # For now, we'll just return the payment details
            return Response({
                'payment_id': payment.id,
                'transaction_id': payment.transaction_id,
                'amount': payment.amount,
                # Add payment gateway specific details here
            })

        except Student.DoesNotExist:
            return Response(
                {'error': 'Student not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        serializer = DocumentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(uploaded_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class FeePaymentView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def initiate_payment(self, request):
        data = request.data.copy()
        if 'payment_date' not in data:
            data['payment_date'] = timezone.now().date()
            
        serializer = SchoolFeeSerializer(data=data)
        if serializer.is_valid():
            fee = serializer.save()
            return Response({
                'transaction_id': str(fee.transaction_id),
                'status': 'pending'
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def confirm_payment(self, request):
        transaction_id = request.data.get('transaction_id')
        try:
            fee = SchoolFee.objects.get(transaction_id=transaction_id)
            fee.status = 'completed'
            fee.save()
            return Response({'status': 'completed'})
        except SchoolFee.DoesNotExist:
            return Response(
                {'error': 'Payment not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )

class MessageViewSet(viewsets.ModelViewSet):
    """ViewSet for chat messages"""
    queryset = Message.objects.all()
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # Base filter: messages where the user is sender or receiver
        queryset = Message.objects.filter(Q(sender=user) | Q(receiver=user))
        
        # Further filter by school if user has a school
        if user.school:
            queryset = queryset.filter(school=user.school)
            
        return queryset

    def _ensure_user_exists(self, target_id, target_email=None, target_role=None):
        """
        Helper method to ensure a User record exists for Teacher/Parent
        Returns the User object or raises ValidationError
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # First try to find existing User by ID
        try:
            user = User.objects.get(id=target_id)
            logger.error(f"✅ Found existing User with ID: {target_id}")
            return user
        except User.DoesNotExist:
            logger.error(f"❌ No User found with ID: {target_id}")
        
        # Try to find in Teacher or Parent models
        teacher = None
        parent = None
        
        try:
            teacher = Teacher.objects.get(id=target_id)
            logger.error(f"✅ Found Teacher with ID: {target_id}")
        except Teacher.DoesNotExist:
            pass
            
        try:
            parent = Parent.objects.get(id=target_id)
            logger.error(f"✅ Found Parent with ID: {target_id}")
        except Parent.DoesNotExist:
            pass
        
        # If we found a Teacher or Parent, check if User with same email already exists
        source_record = teacher or parent
        if source_record:
            # Check if User with this email already exists
            try:
                existing_user = User.objects.get(email=source_record.email)
                logger.error(f"✅ Found existing User with email {source_record.email}: {existing_user.id}")
                
                # If the existing user has different ID, we need to return the existing user
                # This handles the case where Teacher/Parent ID != User ID but same email
                if str(existing_user.id) != str(target_id):
                    logger.error(f"⚠️ User ID mismatch: Teacher/Parent ID: {target_id}, User ID: {existing_user.id}")
                    # Return the existing user - messaging will work with their actual User ID
                    return existing_user
                else:
                    # This shouldn't happen since we already checked by ID above, but just in case
                    return existing_user
                    
            except User.DoesNotExist:
                # No User with this email exists, safe to create one
                logger.error(f"✅ No User found with email {source_record.email}, creating new one...")
                
                if teacher:
                    try:
                        # Create User record for teacher using the ORM properly
                        user = User(
                            id=target_id,  # Use the same ID
                            email=teacher.email,
                            first_name=teacher.name,
                            role=Role.TEACHER,
                            school=teacher.school,
                            is_active=True
                        )
                        user.set_password(User.objects.make_random_password())
                        user.save()
                        
                        logger.error(f"✅ Created User for Teacher with ID: {target_id}")
                        return user
                    except Exception as e:
                        logger.error(f"❌ Failed to create User for Teacher: {str(e)}")
                        raise serializers.ValidationError({
                            "receiver": f"Could not create user account for teacher: {str(e)}"
                        })
                        
                elif parent:
                    try:
                        # Create User record for parent using the ORM properly
                        user = User(
                            id=target_id,  # Use the same ID
                            email=parent.email,
                            first_name=parent.name,
                            role=Role.PARENT,
                            school=parent.school,
                            is_active=True
                        )
                        user.set_password(User.objects.make_random_password())
                        user.save()
                        
                        logger.error(f"✅ Created User for Parent with ID: {target_id}")
                        return user
                    except Exception as e:
                        logger.error(f"❌ Failed to create User for Parent: {str(e)}")
                        raise serializers.ValidationError({
                            "receiver": f"Could not create user account for parent: {str(e)}"
                        })
        
        # No Teacher or Parent found, this is an error
        logger.error(f"❌ No Teacher or Parent found with ID: {target_id}")
        raise serializers.ValidationError({
            "receiver": f"No user, teacher or parent found with ID {target_id}"
        })

    def perform_create(self, serializer):
        """Create message with proper User lookup"""
        import logging
        logger = logging.getLogger(__name__)
        
        user = self.request.user
        receiver_id = self.request.data.get('receiver')
        
        logger.error(f"💬 CREATING MESSAGE - From: {user.id} To: {receiver_id}")
        
        try:
            # Ensure receiver User exists
            receiver = self._ensure_user_exists(
                target_id=receiver_id,
                target_email=self.request.data.get('receiver_email'),
                target_role=self.request.data.get('receiver_role')
            )
            
            # Save message with proper receiver
            if user.school:
                serializer.save(sender=user, receiver=receiver, school=user.school)
            else:
                serializer.save(sender=user, receiver=receiver)
                
            logger.error(f"✅ Message created successfully")
                
        except serializers.ValidationError:
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected error creating message: {str(e)}")
            import traceback
            traceback.print_exc()
            raise serializers.ValidationError({
                "error": f"Failed to create message: {str(e)}"
            })

    @action(detail=False, methods=['get'])
    def get_chat_history(self, request, user_id=None):
        """Get chat history with a specific user"""
        try:
            if not user_id:
                user_id = request.query_params.get('user_id')

            if not user_id:
                return Response(
                    {"error": "User ID is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Ensure the other user exists
            try:
                other_user = self._ensure_user_exists(user_id)
            except serializers.ValidationError as e:
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check school permissions
            if request.user.school and other_user.school and request.user.school.id != other_user.school.id:
                return Response(
                    {"error": "You can only view chat history with users in your school"},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Get messages between users
            messages = Message.objects.filter(
                Q(
                    (Q(sender=request.user) & Q(receiver=other_user)) |
                    (Q(sender=other_user) & Q(receiver=request.user))
                )
            ).order_by('created_at')
            
            # Filter by school
            if request.user.school:
                messages = messages.filter(school=request.user.school)
            
            serializer = self.get_serializer(messages, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def direct_message(self, request):
        """Direct message creation endpoint"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            content = request.data.get('content')
            receiver_id = request.data.get('receiver')
            sender = request.user
            
            if not content or not receiver_id:
                return Response(
                    {"error": "Content and receiver ID are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.error(f"📝 DIRECT MESSAGE - From: {sender.id} To: {receiver_id}")
            
            # Ensure receiver User exists
            receiver = self._ensure_user_exists(
                target_id=receiver_id,
                target_email=request.data.get('receiver_email'),
                target_role=request.data.get('receiver_role')
            )
            
            # Create message
            message = Message.objects.create(
                content=content,
                sender=sender,
                receiver=receiver,
                is_read=False,
                school=sender.school
            )
            
            logger.error(f"✅ Direct message created: {message.id}")
            
            return Response({
                "id": str(message.id),
                "content": message.content,
                "created_at": message.created_at,
                "sender": str(message.sender.id),
                "receiver": str(message.receiver.id),
                "is_read": message.is_read
            })
                
        except serializers.ValidationError as e:
            logger.error(f"❌ Validation error: {str(e)}")
            return Response(e.detail, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"❌ Direct message error: {str(e)}")
            import traceback
            traceback.print_exc()
            
            return Response({
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['get'])
    def filtered_chat_contacts(self, request):
        """Get chat contacts filtered by class assignments"""
        try:
            user = request.user
            contacts = []

            if user.role == Role.TEACHER:
                # Teacher sees parents of students in their assigned class
                try:
                    teacher = Teacher.objects.get(email=user.email)
                    
                    if not teacher.class_assigned:
                        return Response(
                            {"error": "Teacher is not assigned to any class"},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    # Get students in the teacher's assigned class
                    students_in_class = Student.objects.filter(
                        class_assigned=teacher.class_assigned,
                        school=teacher.school,
                        parent__isnull=False  # Only students with parents
                    ).select_related('parent')
                    
                    # Extract unique parents from these students
                    seen_parents = set()
                    for student in students_in_class:
                        parent_user = student.parent
                        if parent_user and parent_user.id not in seen_parents:
                            try:
                                # Try to get the actual Parent model record
                                parent_record = Parent.objects.get(email=parent_user.email)
                                contacts.append({
                                    'id': str(parent_record.id),
                                    'name': parent_record.name,
                                    'email': parent_record.email,
                                    'role': 'parent',
                                    'class_name': teacher.class_assigned,
                                    'children_in_class': [
                                        {
                                            'student_id': str(s.id),
                                            'student_name': s.name,
                                            'student_grade': s.grade
                                        }
                                        for s in students_in_class if s.parent_id == parent_user.id
                                    ]
                                })
                                seen_parents.add(parent_user.id)
                            except Parent.DoesNotExist:
                                # Fallback to User record
                                contacts.append({
                                    'id': str(parent_user.id),
                                    'name': parent_user.first_name,
                                    'email': parent_user.email,
                                    'role': 'parent',
                                    'class_name': teacher.class_assigned,
                                    'children_in_class': [
                                        {
                                            'student_id': str(s.id),
                                            'student_name': s.name,
                                            'student_grade': s.grade
                                        }
                                        for s in students_in_class if s.parent_id == parent_user.id
                                    ]
                                })
                                seen_parents.add(parent_user.id)
                    
                except Teacher.DoesNotExist:
                    return Response(
                        {"error": "Teacher profile not found"},
                        status=status.HTTP_404_NOT_FOUND
                    )

            elif user.role == Role.PARENT:
                # Parent sees teachers of classes their children are in
                try:
                    # Get children of this parent
                    children = Student.objects.filter(parent=user).select_related('school')
                    
                    if not children.exists():
                        return Response({'contacts': []}, status=status.HTTP_200_OK)
                    
                    # Get unique classes of the children
                    child_classes = set()
                    child_data = {}
                    for child in children:
                        if child.class_assigned:
                            child_classes.add(child.class_assigned)
                            if child.class_assigned not in child_data:
                                child_data[child.class_assigned] = []
                            child_data[child.class_assigned].append({
                                'student_id': str(child.id),
                                'student_name': child.name,
                                'student_grade': child.grade
                            })
                    
                    # Get teachers assigned to these classes
                    seen_teachers = set()
                    teachers_in_classes = Teacher.objects.filter(
                        class_assigned__in=child_classes,
                        school=user.school
                    )
                    
                    for teacher in teachers_in_classes:
                        if teacher.id not in seen_teachers:
                            contacts.append({
                                'id': str(teacher.id),
                                'name': teacher.name,
                                'email': teacher.email,
                                'role': 'teacher',
                                'class_name': teacher.class_assigned,
                                'subjects': teacher.subjects if teacher.subjects else [],
                                'children_in_class': child_data.get(teacher.class_assigned, [])
                            })
                            seen_teachers.add(teacher.id)
                    
                except Exception as e:
                    return Response(
                        {"error": f"Error fetching parent's children: {str(e)}"},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

            else:
                # Admin or other roles - show all (fallback to original behavior)
                teachers_qs = Teacher.objects.filter(school=user.school) if user.school else Teacher.objects.all()
                parents_qs = Parent.objects.filter(school=user.school) if user.school else Parent.objects.all()
                
                for teacher in teachers_qs:
                    contacts.append({
                        'id': str(teacher.id),
                        'name': teacher.name,
                        'email': teacher.email,
                        'role': 'teacher',
                        'class_name': teacher.class_assigned,
                        'subjects': teacher.subjects if teacher.subjects else []
                    })
                
                for parent in parents_qs:
                    contacts.append({
                        'id': str(parent.id),
                        'name': parent.name,
                        'email': parent.email,
                        'role': 'parent'
                    })

            return Response({'contacts': contacts}, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"error": f"Failed to get filtered contacts: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def resolve_user_id(self, request):
        """
        Resolve the correct User ID for a Teacher or Parent ID
        This helps frontend handle ID mismatches between Teacher/Parent and User records
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            target_id = request.data.get('target_id')
            target_email = request.data.get('email')
            target_role = request.data.get('role')
            
            if not target_id:
                return Response(
                    {"error": "target_id is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.error(f"🔍 RESOLVING USER ID - Target: {target_id}, Email: {target_email}, Role: {target_role}")
            
            # Use our helper method to find or create the User
            try:
                user = self._ensure_user_exists(
                    target_id=target_id,
                    target_email=target_email,
                    target_role=target_role
                )
                
                return Response({
                    "resolved_user_id": str(user.id),
                    "email": user.email,
                    "name": user.first_name,
                    "role": user.role,
                    "original_id": str(target_id),
                    "id_match": str(user.id) == str(target_id)
                })
                
            except serializers.ValidationError as e:
                return Response(
                    {"error": str(e.detail)},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            logger.error(f"❌ Error resolving user ID: {str(e)}")
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class TeacherParentAssociationViewSet(viewsets.ModelViewSet):
    queryset = TeacherParentAssociation.objects.all()
    serializer_class = TeacherParentAssociationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.TEACHER:
            return TeacherParentAssociation.objects.filter(teacher=user.teacher)
        elif user.role == Role.PARENT:
            return TeacherParentAssociation.objects.filter(parent=user)
        return TeacherParentAssociation.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == Role.TEACHER:
            serializer.save(teacher=user.teacher)
        elif user.role == Role.PARENT:
            serializer.save(parent=user)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == Role.TEACHER:
            serializer.save(teacher=user.teacher)
        elif user.role == Role.PARENT:
            serializer.save(parent=user)

class LeaveApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet for teacher leave applications"""
    serializer_class = LeaveApplicationSerializer
    permission_classes = [IsAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        if user.role == Role.TEACHER:
            # Teachers can only see their own applications
            try:
                teacher = Teacher.objects.get(email=user.email)
                return LeaveApplication.objects.filter(teacher=teacher)
            except Teacher.DoesNotExist:
                return LeaveApplication.objects.none()
        elif user.role == Role.ADMIN:
            # Admins can see all applications
            return LeaveApplication.objects.all()
        return LeaveApplication.objects.none()
        
    def perform_create(self, serializer):
        """Teachers and admins can create leave applications"""
        user = self.request.user
        
        if user.role == Role.TEACHER:
            try:
                teacher = Teacher.objects.get(email=user.email)
                # Add the school field to the leave application
                if user.school:
                    serializer.save(teacher=teacher, school=user.school)
                else:
                    serializer.save(teacher=teacher)
            except Teacher.DoesNotExist:
                raise serializers.ValidationError({"error": "Your teacher profile could not be found. Please contact an administrator."})
        elif user.role == Role.ADMIN:
            # For testing: Allow admins to create leave applications
            # Get the first teacher from the database
            try:
                teacher = Teacher.objects.first()
                if not teacher:
                    raise serializers.ValidationError({"error": "No teachers found in the system. Please create a teacher first."})
                
                # Add the school field to the leave application
                if user.school:
                    serializer.save(teacher=teacher, school=user.school)
                else:
                    serializer.save(teacher=teacher)
            except Exception as e:
                raise serializers.ValidationError({"error": f"Could not create leave application: {str(e)}"})
        else:
            raise serializers.ValidationError({"error": "Only teachers and admins can create leave applications."})
            
    def update(self, request, *args, **kwargs):
        """Handle updates based on user role"""
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        
        if request.user.role == Role.TEACHER:
            # Teachers can only update their own applications
            try:
                teacher = Teacher.objects.get(email=request.user.email)
                if instance.teacher.id != teacher.id:
                    return Response(
                        {"detail": "You do not have permission to update this leave application."},
                        status=status.HTTP_403_FORBIDDEN
                    )
            except Teacher.DoesNotExist:
                return Response(
                    {"error": "Your teacher profile could not be found."},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif request.user.role == Role.ADMIN:
            # Admins can update any application
            pass
        else:
            return Response(
                {"detail": "You do not have permission to update leave applications."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Admin-only action to approve a leave application"""
        if request.user.role != Role.ADMIN:
            return Response(
                {"detail": "Only administrators can approve leave applications."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        application = self.get_object()
        application.status = 'approved'
        application.save()
        return Response({"status": "approved"})

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Admin-only action to reject a leave application"""
        if request.user.role != Role.ADMIN:
            return Response(
                {"detail": "Only administrators can reject leave applications."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        application = self.get_object()
        application.status = 'rejected'
        application.save()
        return Response({"status": "rejected"})

class TeacherScheduleView(APIView):
    """View for teacher's daily schedule"""
    permission_classes = [IsTeacher]

    def get(self, request):
        teacher = request.user
        today = timezone.now().date()
        schedule = TimeTable.objects.filter(
            teacher=teacher,
            day=today.strftime('%A')
        ).order_by('period')
        return Response({
            'schedule': TimeTableSerializer(schedule, many=True).data,
            'exams': ExamResult.objects.filter(
                created_at__date=today
            ).values('exam_name', 'subject', 'student__class_assigned')
        })

class TeacherProfilePicView(APIView):
    """View for handling teacher profile pictures"""
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get the profile picture of the authenticated teacher"""
        try:
            if request.user.role != Role.TEACHER:
                return Response({"error": "Only teachers can access this endpoint"}, status=status.HTTP_403_FORBIDDEN)
                
            teacher = Teacher.objects.get(email=request.user.email)
            if teacher.profile_pic:
                return Response({
                    "profile_pic": request.build_absolute_uri(teacher.profile_pic.url)
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "No profile picture found"}, status=status.HTTP_404_NOT_FOUND)
        except Teacher.DoesNotExist:
            return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        """Upload a new profile picture for the authenticated teacher"""
        try:
            if request.user.role != Role.TEACHER:
                return Response({"error": "Only teachers can update their profile pictures"}, status=status.HTTP_403_FORBIDDEN)
                
            teacher = Teacher.objects.get(email=request.user.email)
            
            if 'profile_pic' not in request.FILES:
                return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
                
            # Delete old profile pic if it exists
            if teacher.profile_pic:
                teacher.profile_pic.delete(save=False)
                
            teacher.profile_pic = request.FILES['profile_pic']
            teacher.save()
            
            return Response({
                "message": "Profile picture updated successfully",
                "profile_pic": request.build_absolute_uri(teacher.profile_pic.url)
            }, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response({"error": "Teacher not found"}, status=status.HTTP_404_NOT_FOUND)
            
    def put(self, request):
        """Update existing profile picture (same as POST)"""
        return self.post(request)

class ProductViewSet(viewsets.ModelViewSet):
    """ViewSet for school shop products"""
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'description']

    def get_queryset(self):
        """Filter products by school"""
        user = self.request.user
        queryset = Product.objects.all()
        
        # Filter by school if user has a school
        if user.school:
            queryset = queryset.filter(school=user.school)
            
        return queryset
        
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Handle the case where no new image is provided
        if not request.FILES.get('image') and instance.image:
            # If no new image is provided and keep_existing_image flag is set, don't update image
            if request.data.get('keep_existing_image') == 'true':
                data = request.data.copy()
                if 'image' in data:
                    del data['image']
                serializer = self.get_serializer(instance, data=data, partial=partial)
            else:
                serializer = self.get_serializer(instance, data=request.data, partial=partial)
        else:
            serializer = self.get_serializer(instance, data=request.data, partial=partial)

        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        if getattr(instance, '_prefetched_objects_cache', None):
            instance._prefetched_objects_cache = {}

        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()

    def perform_create(self, serializer):
        """Set the school for the product based on admin's school"""
        user = self.request.user
        if user.school:
            serializer.save(school=user.school)
        else:
            serializer.save()

class TeacherExamViewSet(viewsets.ModelViewSet):
    """ViewSet for teacher exam PDFs"""
    serializer_class = ExamPDFSerializer
    permission_classes = [IsTeacher]
    parser_classes = (MultiPartParser, FormParser)
    
    def get_queryset(self):
        """Only return exam PDFs uploaded by the requesting teacher"""
        try:
            # Try to find the teacher object that matches the authenticated user
            teacher = Teacher.objects.get(email=self.request.user.email)
            return ExamPDF.objects.filter(teacher=teacher)
        except Teacher.DoesNotExist:
            return ExamPDF.objects.none()
    
    def perform_create(self, serializer):
        """Set the teacher as the authenticated user before saving"""
        try:
            teacher = Teacher.objects.get(email=self.request.user.email)
            serializer.save(teacher=teacher)
        except Teacher.DoesNotExist:
            raise serializers.ValidationError({"error": "Teacher profile not found for this user"})
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download the exam PDF file"""
        exam_pdf = self.get_object()
        if exam_pdf.file:
            return Response({
                "download_url": request.build_absolute_uri(exam_pdf.file.url)
            })
        return Response({"error": "File not found"}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent exam PDFs uploaded by the teacher"""
        queryset = self.get_queryset().order_by('-created_at')[:10]  # Last 10 exams
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

class SchoolEventViewSet(viewsets.ModelViewSet):
    """ViewSet for school events and calendar"""
    queryset = SchoolEvent.objects.all()
    serializer_class = SchoolEventSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'event_type']
    ordering_fields = ['start_date', 'end_date', 'created_at']

    def get_queryset(self):
        # Filter events based on user role and school
        user = self.request.user
        queryset = SchoolEvent.objects.all()
        
        # Filter by school if user has a school
        if user.school:
            queryset = queryset.filter(school=user.school)
        
        # Filter by date range if provided
        start = self.request.query_params.get('start', None)
        end = self.request.query_params.get('end', None)
        if start:
            queryset = queryset.filter(start_date__gte=start)
        if end:
            queryset = queryset.filter(end_date__lte=end)
            
        # Filter by event type if provided
        event_type = self.request.query_params.get('type', None)
        if event_type:
            queryset = queryset.filter(event_type=event_type)
            
        # If not admin, only show events relevant to the user's role
        if user.role != Role.ADMIN:
            queryset = queryset.filter(
                models.Q(participants='all') | models.Q(participants=user.role)
            )
            
        return queryset
        
    def perform_create(self, serializer):
        """Set the created_by and school fields"""
        user = self.request.user
        school = user.school
        if school:
            serializer.save(created_by=user, school=school)
        else:
            serializer.save(created_by=user)

@api_view(['GET', 'HEAD'])  # Add HEAD to allowed methods
@permission_classes([AllowAny])
def api_root(request):
    """
    API root view that lists all available endpoints.
    """
    return Response({
        'status': 'ok',
        'message': 'EduCite API is running',
        'version': '1.0.0',
    })

class PasswordResetRequestView(APIView):
    """Handle password reset requests"""
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']

        try:
            user = User.objects.get(email=email)
            # Create reset token that expires in 1 hour
            reset_token = PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timezone.timedelta(hours=1)
            )

            # Send email with reset link
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token.token}"
            subject = "Password Reset Request"
            message = f"""
            Hello {user.first_name},

            You have requested to reset your password. Please click the link below to reset your password:

            {reset_url}

            This link will expire in 1 hour.

            If you did not request this password reset, please ignore this email.

            Best regards,
            School Admin Team
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )

            return Response({
                "message": "Password reset link has been sent to your email"
            })

        except User.DoesNotExist:
            # We don't want to reveal if the email exists or not
            return Response({
                "message": "If an account exists with this email, a password reset link will be sent"
            })

class PasswordResetConfirmView(APIView):
    """Handle password reset confirmation"""
    permission_classes = [AllowAny]
    serializer_class = PasswordResetConfirmSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            reset_token = PasswordResetToken.objects.get(
                token=serializer.validated_data['token'],
                used=False
            )

            if not reset_token.is_valid():
                return Response(
                    {"error": "Reset token has expired"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Update password
            user = reset_token.user
            user.set_password(serializer.validated_data['password'])
            user.save()

            # Mark token as used
            reset_token.used = True
            reset_token.save()

            return Response({
                "message": "Password has been reset successfully"
            })

        except PasswordResetToken.DoesNotExist:
            return Response(
                {"error": "Invalid reset token"},
                status=status.HTTP_400_BAD_REQUEST
            )

# Create a custom permission for superuser
class IsSuperUser(IsAuthenticated):
    """
    Allows access only to super users.
    """
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == Role.SUPERUSER)

class SuperUserViewSet(viewsets.ViewSet):
    """ViewSet for superuser operations"""
    permission_classes = [IsSuperUser]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get superuser dashboard statistics"""
        school_count = School.objects.count()
        users_count = User.objects.count()
        teachers_count = Teacher.objects.count()
        students_count = Student.objects.count()
        
        return Response({
            'school_count': school_count,
            'users_count': users_count,
            'teachers_count': teachers_count,
            'students_count': students_count
        })
    
    @action(detail=False, methods=['post'])
    def create_school(self, request):
        """Create a new school"""
        serializer = SchoolSerializer(data=request.data)
        if serializer.is_valid():
            school = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def create_admin_for_school(self, request, pk=None):
        """Create an admin user for a school"""
        try:
            school = School.objects.get(pk=pk)
            data = request.data.copy()
            data['role'] = Role.ADMIN
            data['school'] = school.id
            
            # Store the original password
            original_password = data['password']
            
            serializer = RegisterSerializer(data=data)
            if serializer.is_valid():
                user = serializer.save()
                user.school = school
                user.save()
                
                # Store the credentials
                AdminCredential.objects.create(
                    admin=user,
                    password=original_password
                )
                
                return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def school_statistics(self, request, pk=None):
        """Get statistics for a specific school"""
        try:
            school = School.objects.get(pk=pk)
            admin_count = User.objects.filter(school=school, role=Role.ADMIN).count()
            teacher_count = Teacher.objects.filter(school=school).count()
            student_count = Student.objects.filter(school=school).count()
            parent_count = User.objects.filter(school=school, role=Role.PARENT).count()
            
            return Response({
                'school_name': school.name,
                'admin_count': admin_count,
                'teacher_count': teacher_count,
                'student_count': student_count,
                'parent_count': parent_count
            })
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def administrators(self, request, pk=None):
        """Get all administrators for a specific school with their login credentials"""
        try:
            school = School.objects.get(pk=pk)
            admins = User.objects.filter(school=school, role=Role.ADMIN)
            admin_data = []
            
            for admin in admins:
                # Try to get stored credentials
                try:
                    stored_cred = AdminCredential.objects.get(admin=admin)
                    password = stored_cred.password
                except AdminCredential.DoesNotExist:
                    password = "********"  # Password not available
                
                admin_info = {
                    'id': admin.id,
                    'first_name': admin.first_name,
                    'last_name': admin.last_name,
                    'email': admin.email,
                    'password': password
                }
                admin_data.append(admin_info)
            
            return Response(admin_data)
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def reset_admin_password(self, request, pk=None):
        """Reset an admin's password"""
        try:
            admin = User.objects.get(pk=request.data.get('admin_id'), role=Role.ADMIN)
            new_password = request.data.get('new_password')
            
            if not new_password:
                return Response({'error': 'New password is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Update the actual password
            admin.set_password(new_password)
            admin.save()
            
            # Update or create stored credentials
            AdminCredential.objects.update_or_create(
                admin=admin,
                defaults={'password': new_password}
            )
            
            return Response({'message': 'Password updated successfully'})
        except User.DoesNotExist:
            return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def delete_admin(self, request, pk=None):
        """Delete an admin user from a school"""
        try:
            school = School.objects.get(pk=pk)
            admin_id = request.data.get('admin_id')
            
            if not admin_id:
                return Response({'error': 'Admin ID is required'}, status=status.HTTP_400_BAD_REQUEST)
                
            try:
                admin = User.objects.get(id=admin_id, role=Role.ADMIN, school=school)
                # Delete associated credential first
                AdminCredential.objects.filter(admin=admin).delete()
                # Delete the admin user
                admin.delete()
                return Response({'message': 'Admin deleted successfully'})
            except User.DoesNotExist:
                return Response({'error': 'Admin not found'}, status=status.HTTP_404_NOT_FOUND)
                
        except School.DoesNotExist:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)

class CurrentSchoolView(APIView):
    """Get current school information for logged-in user"""
    permission_classes = [IsAuthenticated]
    serializer_class = SchoolSerializer

    def get(self, request):
        """Get current school information"""
        user = request.user
        if user.school:
            serializer = self.serializer_class(user.school)
            return Response(serializer.data)
        return Response({"error": "User is not associated with any school"}, status=status.HTTP_404_NOT_FOUND)

class DirectMessagingView(APIView):
    """Simplified messaging view for direct communication between teachers and parents"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get available contacts for messaging based on user role"""
        user = request.user
        
        if not user.school:
            return Response({"error": "User must be associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        
        contacts = []
        
        if user.role == Role.TEACHER:
            # Teachers can message all parents in their school
            parents = User.objects.filter(
                school=user.school,
                role=Role.PARENT,
                is_active=True
            ).values('id', 'first_name', 'email')
            
            contacts = [{
                'id': parent['id'],
                'name': parent['first_name'],
                'email': parent['email'],
                'role': 'parent'
            } for parent in parents]
            
        elif user.role == Role.PARENT:
            # Parents can message all teachers in their school
            teachers = Teacher.objects.filter(
                school=user.school
            ).values('id', 'name', 'email', 'subjects', 'class_assigned')
            
            contacts = [{
                'id': teacher['id'],
                'name': teacher['name'],
                'email': teacher['email'],
                'role': 'teacher',
                'subjects': teacher['subjects'],
                'class_assigned': teacher['class_assigned']
            } for teacher in teachers]
            
        elif user.role == Role.ADMIN:
            # Admins can message everyone in their school
            parents = User.objects.filter(
                school=user.school,
                role=Role.PARENT,
                is_active=True
            ).values('id', 'first_name', 'email')
            
            teachers = Teacher.objects.filter(
                school=user.school
            ).values('id', 'name', 'email', 'subjects', 'class_assigned')
            
            parent_contacts = [{
                'id': parent['id'],
                'name': parent['first_name'],
                'email': parent['email'],
                'role': 'parent'
            } for parent in parents]
            
            teacher_contacts = [{
                'id': teacher['id'],
                'name': teacher['name'],
                'email': teacher['email'],
                'role': 'teacher',
                'subjects': teacher['subjects'],
                'class_assigned': teacher['class_assigned']
            } for teacher in teachers]
            
            contacts = parent_contacts + teacher_contacts
        
        return Response({
            'contacts': contacts,
            'count': len(contacts),
            'user_role': user.role
        })
    
    def post(self, request):
        """Send a direct message to any contact in the school"""
        user = request.user
        
        if not user.school:
            return Response({"error": "User must be associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        
        receiver_id = request.data.get('receiver_id')
        content = request.data.get('content')
        
        if not receiver_id or not content:
            return Response({"error": "receiver_id and content are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Try to find the receiver as a User first
            try:
                receiver_user = User.objects.get(id=receiver_id, school=user.school)
                receiver = receiver_user
            except User.DoesNotExist:
                # If not found as User, try as Teacher
                try:
                    teacher = Teacher.objects.get(id=receiver_id, school=user.school)
                    # Create or get corresponding User record
                    receiver, created = User.objects.get_or_create(
                        email=teacher.email,
                        defaults={
                            'id': teacher.id,
                            'first_name': teacher.name,
                            'role': Role.TEACHER,
                            'school': teacher.school,
                            'is_active': True
                        }
                    )
                    if created:
                        receiver.set_password(User.objects.make_random_password())
                        receiver.save()
                except Teacher.DoesNotExist:
                    return Response({"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Verify both users are in the same school
            if receiver.school != user.school:
                return Response({"error": "You can only message users in your school"}, status=status.HTTP_403_FORBIDDEN)
            
            # Create the message
            message = Message.objects.create(
                sender=user,
                receiver=receiver,
                content=content,
                school=user.school
            )
            
            return Response({
                'message': 'Message sent successfully',
                'message_id': message.id,
                'sent_to': receiver.first_name,
                'content': content,
                'created_at': message.created_at
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class DirectMessagingView(APIView):
    """Simplified messaging view for direct communication between teachers and parents"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get available contacts for messaging based on user role"""
        user = request.user
        
        if not user.school:
            return Response({"error": "User must be associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        
        contacts = []
        
        if user.role == Role.TEACHER:
            # Teachers can message all parents in their school
            parents = User.objects.filter(
                school=user.school,
                role=Role.PARENT,
                is_active=True
            ).values('id', 'first_name', 'email')
            
            contacts = [{
                'id': parent['id'],
                'name': parent['first_name'],
                'email': parent['email'],
                'role': 'parent'
            } for parent in parents]
            
        elif user.role == Role.PARENT:
            # Parents can message all teachers in their school
            teachers = Teacher.objects.filter(
                school=user.school
            ).values('id', 'name', 'email', 'subjects', 'class_assigned')
            
            contacts = [{
                'id': teacher['id'],
                'name': teacher['name'],
                'email': teacher['email'],
                'role': 'teacher',
                'subjects': teacher['subjects'],
                'class_assigned': teacher['class_assigned']
            } for teacher in teachers]
            
        elif user.role == Role.ADMIN:
            # Admins can message everyone in their school
            parents = User.objects.filter(
                school=user.school,
                role=Role.PARENT,
                is_active=True
            ).values('id', 'first_name', 'email')
            
            teachers = Teacher.objects.filter(
                school=user.school
            ).values('id', 'name', 'email', 'subjects', 'class_assigned')
            
            parent_contacts = [{
                'id': parent['id'],
                'name': parent['first_name'],
                'email': parent['email'],
                'role': 'parent'
            } for parent in parents]
            
            teacher_contacts = [{
                'id': teacher['id'],
                'name': teacher['name'],
                'email': teacher['email'],
                'role': 'teacher',
                'subjects': teacher['subjects'],
                'class_assigned': teacher['class_assigned']
            } for teacher in teachers]
            
            contacts = parent_contacts + teacher_contacts
        
        return Response({
            'contacts': contacts,
            'count': len(contacts),
            'user_role': user.role
        })
    
    def post(self, request):
        """Send a direct message to any contact in the school"""
        user = request.user
        
        if not user.school:
            return Response({"error": "User must be associated with a school"}, status=status.HTTP_400_BAD_REQUEST)
        
        receiver_id = request.data.get('receiver_id')
        content = request.data.get('content')
        
        if not receiver_id or not content:
            return Response({"error": "receiver_id and content are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Try to find the receiver as a User first
            try:
                receiver_user = User.objects.get(id=receiver_id, school=user.school)
                receiver = receiver_user
            except User.DoesNotExist:
                # If not found as User, try as Teacher
                try:
                    teacher = Teacher.objects.get(id=receiver_id, school=user.school)
                    # Create or get corresponding User record
                    receiver, created = User.objects.get_or_create(
                        email=teacher.email,
                        defaults={
                            'id': teacher.id,
                            'first_name': teacher.name,
                            'role': Role.TEACHER,
                            'school': teacher.school,
                            'is_active': True
                        }
                    )
                    if created:
                        receiver.set_password(User.objects.make_random_password())
                        receiver.save()
                except Teacher.DoesNotExist:
                    return Response({"error": "Receiver not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Verify both users are in the same school
            if receiver.school != user.school:
                return Response({"error": "You can only message users in your school"}, status=status.HTTP_403_FORBIDDEN)
            
            # Create the message
            message = Message.objects.create(
                sender=user,
                receiver=receiver,
                content=content,
                school=user.school
            )
            
            return Response({
                'message': 'Message sent successfully',
                'message_id': message.id,
                'sent_to': receiver.first_name,
                'content': content,
                'created_at': message.created_at
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
