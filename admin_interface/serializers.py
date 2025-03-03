from rest_framework import serializers
from .models import User, Teacher, Student, Notification, Parent, ExamResult, SchoolFee, Role, Document
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User (Admins)"""
    class Meta:
        model = User
        fields = ('id', 'email')

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for registering Users"""
    class Meta:
        model = User
        fields = ('id', 'email', 'password', 'role')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', Role.PARENT)
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
        fields = ['id', 'message', 'target_group', 'created_at', 'created_by']
        read_only_fields = ['created_by']

class ParentSerializer(serializers.ModelSerializer):
    """Serializer for Parent model"""
    class Meta:
        model = Parent
        fields = ('id', 'name', 'email', 'phone_number', 'created_at')

class ParentRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for Parent registration"""
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Parent
        fields = ('id', 'name', 'email', 'phone_number', 'password')

    def create(self, validated_data):
        password = validated_data.pop('password')
        # Hash the password before saving
        validated_data['password'] = make_password(password)
        return super().create(validated_data)

class ExamResultSerializer(serializers.ModelSerializer):
    """Serializer for exam results"""
    class Meta:
        model = ExamResult
        fields = '__all__'

class SchoolFeeSerializer(serializers.ModelSerializer):
    """Serializer for school fees"""
    class Meta:
        model = SchoolFee
        fields = '__all__'

class StudentDetailSerializer(serializers.ModelSerializer):
    """Detailed Student serializer including exam results"""
    exam_results = ExamResultSerializer(many=True, read_only=True)
    fee_records = SchoolFeeSerializer(many=True, read_only=True)

    class Meta:
        model = Student
        fields = '__all__'

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'document_type', 
            'uploaded_by', 'student', 'created_at'
        ]
        read_only_fields = ['uploaded_by', 'created_at']
