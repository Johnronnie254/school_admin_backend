from rest_framework import generics, permissions, status
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
    permission_classes = [permissions.AllowAny]

class LoginView(APIView):
    """Handles user login and returns JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data.get("user")
        refresh = serializer.validated_data.get("refresh")
        access = serializer.validated_data.get("access")

        return Response({
            "refresh": refresh,
            "access": access,
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

class LogoutView(APIView):
    """Handles user logout."""
    permission_classes = [permissions.IsAuthenticated]

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

class TeacherListView(generics.ListCreateAPIView):
    """Handles listing and creating teachers."""
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """Ensure email uniqueness before creating a teacher."""
        email = request.data.get("email")
        if Teacher.objects.filter(email=email).exists():
            return Response({"error": "A teacher with this email already exists."}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

class StudentListView(generics.ListCreateAPIView):
    """Handles listing and creating students."""
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """Ensure contact uniqueness before creating a student."""
        contact = request.data.get("contact")
        if Student.objects.filter(contact=contact).exists():
            return Response({"error": "A student with this contact already exists."}, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

class StudentByGradeView(generics.ListAPIView):
    """Filters students by grade."""
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Ensure the grade is valid and fetch students accordingly."""
        grade = self.kwargs.get("grade")
        if not grade.isdigit():
            return Student.objects.none()  # Return empty queryset if grade is invalid
        return Student.objects.filter(grade=int(grade))

class NotificationListView(generics.ListCreateAPIView):
    """Handles listing and creating notifications."""
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
