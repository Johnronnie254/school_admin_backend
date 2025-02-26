from rest_framework import serializers
from .models import User, Teacher, Student, Notification
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User (Admins)"""
    class Meta:
        model = User
        fields = ('id', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for registering Admin Users"""
    class Meta:
        model = User
        fields = ('id', 'email', 'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        """Create a new user with encrypted password"""
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user

class LoginSerializer(serializers.Serializer):
    """Serializer for Admin User Login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        """Validate user credentials"""
        email = data.get('email')
        password = data.get('password')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")

        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }

class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for Teachers"""
    class Meta:
        model = Teacher
        fields = '__all__'

    def validate_email(self, value):
        """Ensure email is unique"""
        if Teacher.objects.filter(email=value).exists():
            raise serializers.ValidationError("A teacher with this email already exists.")
        return value

class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Students"""
    class Meta:
        model = Student
        fields = '__all__'

    def validate_contact(self, value):
        """Ensure contact is unique"""
        if Student.objects.filter(contact=value).exists():
            raise serializers.ValidationError("A student with this contact already exists.")
        return value

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notifications"""
    class Meta:
        model = Notification
        fields = '__all__'
