from rest_framework import generics, permissions
from .models import Teacher, Student, Notification, User
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer, 
    TeacherSerializer, StudentSerializer, NotificationSerializer
)
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from rest_framework.views import APIView

class RegisterView(generics.CreateAPIView):
    """Handles user registration."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer

class LoginView(APIView):
    """Handles user login and returns JWT tokens."""
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)

class LogoutView(APIView):
    """Handles user logout."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Logged out successfully"}, status=200)
        except Exception as e:
            return Response({"error": "Invalid token"}, status=400)

class TeacherListView(generics.ListCreateAPIView):
    """Handles listing and creating teachers."""
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

class StudentListView(generics.ListCreateAPIView):
    """Handles listing and creating students."""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

class StudentByGradeView(APIView):
    """Filters students by grade."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, grade):
        students = Student.objects.filter(grade=grade)
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)

class NotificationListView(generics.ListCreateAPIView):
    """Handles listing and creating notifications."""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
