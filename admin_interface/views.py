from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
import time
import pandas as pd
from .models import User, Teacher, Student, Notification, Parent, ExamResult, SchoolFee, Document, Role
from .serializers import (
    TeacherSerializer, StudentSerializer, NotificationSerializer,
    ParentSerializer, ParentRegistrationSerializer, 
    ExamResultSerializer, SchoolFeeSerializer, 
    StudentDetailSerializer, RegisterSerializer, LoginSerializer,
    UserSerializer, DocumentSerializer
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

class RegisterView(APIView):
    """Handles user registration."""
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
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

class TeacherViewSet(viewsets.ModelViewSet):
    """ViewSet for Teacher operations"""
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

    def get_permissions(self):
        if self.action in ['create']:
            # Allow teacher self-registration
            return [AllowAny()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Only admin can modify/delete teachers
            return [IsAdmin()]
        # Authenticated users can view teachers
        return [IsAuthenticated()]

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
        if user.role == Role.ADMIN or user.role == Role.TEACHER:
            return Student.objects.all()
        elif user.role == Role.PARENT:
            return Student.objects.filter(parent=user)
        return Student.objects.none()

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated(), IsAdminOrTeacherOrParent()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminOrTeacher()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        if self.request.user.role == Role.PARENT:
            # If parent is creating, automatically set parent field
            serializer.save(parent=self.request.user)
        else:
            serializer.save()

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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"message": "Student deleted successfully"},
            status=status.HTTP_204_NO_CONTENT
        )

class ParentViewSet(viewsets.ModelViewSet):
    """ViewSet for Parent operations"""
    queryset = Parent.objects.all()
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name', 'email']

    def get_serializer_class(self):
        if self.action == 'create':
            return ParentRegistrationSerializer
        return ParentSerializer

    @action(detail=False, methods=['post'])
    def login(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        try:
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

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        parent = self.get_object()
        children = Student.objects.filter(parent=parent)
        serializer = StudentDetailSerializer(children, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['put'], permission_classes=[IsParent])
    def update_profile(self, request, pk=None):
        """Update parent profile"""
        try:
            parent = self.get_object()
            serializer = ParentSerializer(parent, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'parent': serializer.data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['put'], permission_classes=[IsParent])
    def update_contact_info(self, request, pk=None):
        """Update contact information"""
        try:
            parent = self.get_object()
            phone = request.data.get('phone_number')
            email = request.data.get('email')
            
            if phone:
                parent.phone_number = phone
            if email:
                parent.email = email
            parent.save()
            
            return Response({
                'message': 'Contact information updated successfully',
                'parent': ParentSerializer(parent).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ExamResultViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamResult operations"""
    queryset = ExamResult.objects.all()
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__name', 'subject', 'exam_name']
    ordering_fields = ['created_at', 'marks', 'year', 'term']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsTeacher()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'], permission_classes=[IsParent])
    def download_results(self, request):
        student_id = request.query_params.get('student_id')
        year = request.query_params.get('year')
        term = request.query_params.get('term')
        
        # Verify parent has access to this student
        if not Student.objects.filter(id=student_id, parent=request.user).exists():
            return Response(
                {'error': 'Unauthorized access'}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
        results = ExamResult.objects.filter(
            student_id=student_id,
            year=year,
            term=term
        )
        
        # Convert to DataFrame and then to Excel
        data = []
        for result in results:
            data.append({
                'Subject': result.subject,
                'Marks': result.marks,
                'Grade': result.grade,
                'Remarks': result.remarks
            })
            
        df = pd.DataFrame(data)
        response = HttpResponse(content_type='application/vnd.ms-excel')
        response['Content-Disposition'] = f'attachment; filename=results_{year}_{term}.xlsx'
        df.to_excel(response, index=False)
        return response

    @action(detail=True, methods=['patch'])
    def edit_marks(self, request, pk=None):
        """Edit exam marks and grade"""
        result = self.get_object()
        try:
            if 'marks' in request.data:
                result.marks = request.data['marks']
            if 'grade' in request.data:
                result.grade = request.data['grade']
            if 'remarks' in request.data:
                result.remarks = request.data['remarks']
            result.save()
            return Response({
                'message': 'Exam result updated',
                'result': ExamResultSerializer(result).data
            })
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class SchoolFeeViewSet(viewsets.ModelViewSet):
    """ViewSet for SchoolFee operations"""
    queryset = SchoolFee.objects.all()
    serializer_class = SchoolFeeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['student__name', 'transaction_id', 'status']
    ordering_fields = ['payment_date', 'amount', 'created_at']

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
        queryset = super().get_queryset()
        target_group = self.request.query_params.get('target_group', None)
        if target_group:
            queryset = queryset.filter(target_group=target_group)
        return queryset

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

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
    """Get school statistics."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = {
            'total_teachers': Teacher.objects.count(),
            'total_students': Student.objects.count(),
            'students_per_grade': Student.objects.values('grade')
                                       .annotate(count=models.Count('id')),
            'recent_notifications': Notification.objects.order_by('-created_at')[:5]
                                              .values('message', 'target_group', 'created_at')
        }
        return Response(stats, status=status.HTTP_200_OK)

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
    """Get all children for a parent"""
    serializer_class = StudentDetailSerializer
    permission_classes = [IsAuthenticated]

    def get(self, request, parent_id):
        children = Student.objects.filter(parent_id=parent_id)
        serializer = self.serializer_class(children, many=True)
        return Response(serializer.data)

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

class ExamResultView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ExamResultSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
