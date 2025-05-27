from rest_framework import serializers
from .models import User, Teacher, Student, Notification, Parent, ExamResult, SchoolFee, Role, Document, Message, LeaveApplication, Product, ExamPDF, SchoolEvent, TeacherParentAssociation, School, TimeTable
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
import uuid

class UserSerializer(serializers.ModelSerializer):
    """Serializer for User (Admins)"""
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'role')
        read_only_fields = ('id', 'email', 'first_name', 'role')

    def to_representation(self, instance):
        """Custom representation to include name and role"""
        data = super().to_representation(instance)
        data['name'] = instance.first_name
        return data

class SchoolSerializer(serializers.ModelSerializer):
    """Serializer for School model"""
    class Meta:
        model = School
        fields = ['id', 'name', 'address', 'phone_number', 'email', 
                 'website', 'logo', 'registration_number', 
                 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['created_at', 'updated_at']

    def validate_registration_number(self, value):
        """Ensure registration number is unique"""
        # Get the current instance if this is an update operation
        instance = getattr(self, 'instance', None)
        
        # Check if registration number exists, excluding the current instance
        exists = School.objects.filter(registration_number=value)
        if instance:
            exists = exists.exclude(pk=instance.pk)
            
        if exists.exists():
            raise serializers.ValidationError("A school with this registration number already exists.")
        return value

class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for registering Users"""
    name = serializers.CharField(max_length=255)
    password_confirmation = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('id', 'name', 'email', 'password', 'password_confirmation', 'role')
        extra_kwargs = {
            'password': {'write_only': True},
            'role': {'default': Role.PARENT}
        }

    def validate(self, data):
        """
        Check that the passwords match and validate role
        """
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        
        # Validate role
        if data['role'] not in [Role.ADMIN, Role.TEACHER, Role.PARENT]:
            raise serializers.ValidationError({
                "role": "Invalid role. Must be admin, teacher, or parent."
            })
            
        return data

    def create(self, validated_data):
        # Remove password_confirmation from the data
        validated_data.pop('password_confirmation')
        # Get the name from validated data
        name = validated_data.pop('name')

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role')
        )
        
        # Set the first_name field with the provided name
        user.first_name = name
        user.save()
        
        return user

class LoginSerializer(serializers.Serializer):
    """Serializer for User Login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        """Validate user credentials"""
        email = data.get('email')
        password = data.get('password')

        user = authenticate(username=email, password=password)
        if not user:
            raise serializers.ValidationError("Invalid email or password.")  # Simple error message

        refresh = RefreshToken.for_user(user)
        return {
            "status": "success",
            "message": "Login successful",
            "user": {
                'id': user.id,
                'name': user.first_name,
                'email': user.email,
                'role': user.role
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token)
            }
        }

class TeacherSerializer(serializers.ModelSerializer):
    """Serializer for Teachers"""
    class Meta:
        model = Teacher
        fields = '__all__'

    def validate_email(self, value):
        """Ensure email is unique"""
        instance = getattr(self, 'instance', None)
        if Teacher.objects.filter(email=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("A teacher with this email already exists.")
        return value
        
    def create(self, validated_data):
        """Override create to ensure a User record is created with the same UUID"""
        # First create the Teacher record
        email = validated_data.get('email')
        name = validated_data.get('name')
        school = validated_data.get('school')
        
        # Check if a User already exists with this email
        try:
            user = User.objects.get(email=email)
            # If user exists, use their UUID for the teacher
            teacher_id = user.id
        except User.DoesNotExist:
            # Generate UUID for both Teacher and User
            teacher_id = uuid.uuid4()
            # Create User with same UUID
            user = User.objects.create_user(
                id=teacher_id,
                email=email,
                password=User.objects.make_random_password(),
                role=Role.TEACHER,
                first_name=name,
                school=school
            )
        
        # Create Teacher with the same UUID
        validated_data['id'] = teacher_id
        teacher = Teacher.objects.create(**validated_data)
        return teacher

class StudentSerializer(serializers.ModelSerializer):
    """Serializer for Students"""
    class Meta:
        model = Student
        fields = '__all__'
        extra_kwargs = {
            'guardian': {'required': False},  # Make guardian optional
            'contact': {'required': False},   # Make contact optional
            'grade': {'required': False},     # Make grade optional
            'class_assigned': {'required': False},  # Make class_assigned optional
            'parent': {'required': False}     # Make parent optional
        }

    def validate_contact(self, value):
        """Ensure contact is unique"""
        instance = getattr(self, 'instance', None)
        if Student.objects.filter(contact=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("A student with this contact already exists.")
        return value

    def update(self, instance, validated_data):
        """Allow partial updates"""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notifications"""
    class Meta:
        model = Notification
        fields = ['id', 'message', 'target_group', 'created_at', 'created_by']
        read_only_fields = ['created_by']

class ParentSerializer(serializers.ModelSerializer):
    """Serializer for Parent model"""
    children = serializers.SerializerMethodField()

    class Meta:
        model = Parent
        fields = ('id', 'name', 'email', 'phone_number', 'created_at', 'children')

    def get_children(self, obj):
        # Get children from context if available
        parent_children = self.context.get('parent_children', {})
        if obj.id in parent_children:
            return StudentSerializer(parent_children[obj.id], many=True).data
        return []

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Add any additional fields or transformations here if needed
        return data

class ParentRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for Parent registration"""
    password = serializers.CharField(write_only=True)
    password_confirmation = serializers.CharField(write_only=True)

    class Meta:
        model = Parent
        fields = ('id', 'name', 'email', 'phone_number', 'password', 'password_confirmation')

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })

        # Check if email already exists in User model
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({
                "email": "A user with this email already exists."
            })
        
        return data

    def create(self, validated_data):
        # Remove password_confirmation from the data
        validated_data.pop('password_confirmation')
        password = validated_data.pop('password')
        
        # Generate a UUID to use for both Parent and User
        parent_id = uuid.uuid4()
        
        # Create the Parent record with the specified UUID
        validated_data['id'] = parent_id
        parent = Parent.objects.create(
            **validated_data,
            password=make_password(password)  # Properly hash the password
        )

        # Create a User account with the same UUID
        user = User.objects.create_user(
            id=parent_id,  # Use the same UUID
            email=parent.email,
            password=password,
            role=Role.PARENT,
            first_name=parent.name
        )

        # Link the user to the parent's school if applicable
        if 'school' in validated_data and validated_data['school']:
            user.school = validated_data['school']
            user.save()

        return parent

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

class StudentRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for student self-registration"""
    password = serializers.CharField(write_only=True)
    password_confirmation = serializers.CharField(write_only=True)

    class Meta:
        model = Student
        fields = ['name', 'guardian', 'contact', 'grade', 'password', 'password_confirmation']

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return data

class TeacherRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for teacher self-registration"""
    password = serializers.CharField(write_only=True)
    password_confirmation = serializers.CharField(write_only=True)

    class Meta:
        model = Teacher
        fields = ['name', 'email', 'phone_number', 'subjects', 'password', 'password_confirmation']

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return data

class MessageSerializer(serializers.ModelSerializer):
    receiver_email = serializers.EmailField(write_only=True, required=False)
    receiver_role = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Message
        fields = ['id', 'sender', 'receiver', 'teacher', 'parent', 'content', 'is_read', 'school', 'created_at', 'receiver_email', 'receiver_role']
        read_only_fields = ['sender', 'created_at']
        
    def create(self, validated_data):
        """Custom create method to handle teacher and parent direct connections"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Extract non-model fields
        receiver_email = validated_data.pop('receiver_email', None)
        receiver_role = validated_data.pop('receiver_role', None)
        
        logger.error(f"🔍 CREATE - RECEIVER EMAIL: {receiver_email}, ROLE: {receiver_role}")
        
        # Get receiver from validated data if it exists
        receiver = validated_data.get('receiver', None)
        
        # If no direct receiver and we have email/role, try to find direct models
        if not receiver and receiver_email and receiver_role:
            if receiver_role == 'teacher':
                try:
                    # Find teacher directly
                    teacher = Teacher.objects.get(email=receiver_email)
                    logger.error(f"✅ FOUND TEACHER DIRECTLY: {teacher.id}")
                    validated_data['teacher'] = teacher
                    # Create a basic User if needed for compatibility
                    user, created = User.objects.get_or_create(
                        email=teacher.email,
                        defaults={
                            'first_name': teacher.name,
                            'role': Role.TEACHER,
                            'school': teacher.school
                        }
                    )
                    validated_data['receiver'] = user
                except Teacher.DoesNotExist:
                    logger.error(f"❌ NO TEACHER FOUND WITH EMAIL: {receiver_email}")
                    # Try by ID if provided in receiver field
                    if 'receiver' in validated_data and validated_data['receiver']:
                        try:
                            teacher_id = validated_data['receiver']
                            teacher = Teacher.objects.get(id=teacher_id)
                            logger.error(f"✅ FOUND TEACHER BY ID: {teacher.id}")
                            validated_data['teacher'] = teacher
                        except Teacher.DoesNotExist:
                            logger.error(f"❌ NO TEACHER FOUND WITH ID: {teacher_id}")
            elif receiver_role == 'parent':
                try:
                    # Find parent directly
                    parent = Parent.objects.get(email=receiver_email)
                    logger.error(f"✅ FOUND PARENT DIRECTLY: {parent.id}")
                    validated_data['parent'] = parent
                    # Create a basic User if needed for compatibility
                    user, created = User.objects.get_or_create(
                        email=parent.email,
                        defaults={
                            'first_name': parent.name,
                            'role': Role.PARENT,
                            'school': parent.school
                        }
                    )
                    validated_data['receiver'] = user
                except Parent.DoesNotExist:
                    logger.error(f"❌ NO PARENT FOUND WITH EMAIL: {receiver_email}")
                    # Try by ID if provided in receiver field
                    if 'receiver' in validated_data and validated_data['receiver']:
                        try:
                            parent_id = validated_data['receiver']
                            parent = Parent.objects.get(id=parent_id)
                            logger.error(f"✅ FOUND PARENT BY ID: {parent.id}")
                            validated_data['parent'] = parent
                        except Parent.DoesNotExist:
                            logger.error(f"❌ NO PARENT FOUND WITH ID: {parent_id}")
        
        # Create the message
        message = Message.objects.create(**validated_data)
        return message
        
    def validate_receiver(self, value):
        """Allow receiver to be specified as a Teacher or Parent ID"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Log all initial data to see what's being sent
        logger.error(f"🔍 VALIDATING RECEIVER - INITIAL DATA: {self.initial_data}")
        logger.error(f"🔍 RECEIVER VALUE: {value}, TYPE: {type(value)}")
        
        receiver_email = self.initial_data.get('receiver_email')
        receiver_role = self.initial_data.get('receiver_role')
        receiver_id = str(value) if value else None
        
        # If we have a receiver ID, check if it's a Teacher or Parent ID directly
        if receiver_id:
            logger.error(f"🔍 CHECKING IF RECEIVER ID IS A TEACHER/PARENT: {receiver_id}")
            try:
                teacher = Teacher.objects.get(id=receiver_id)
                logger.error(f"✅ FOUND TEACHER DIRECTLY BY ID: {teacher.id}")
                # We'll handle this in create() - just pass the value through
                return value
            except Teacher.DoesNotExist:
                logger.error(f"❌ NOT A TEACHER ID")
                
            try:
                parent = Parent.objects.get(id=receiver_id)
                logger.error(f"✅ FOUND PARENT DIRECTLY BY ID: {parent.id}")
                # We'll handle this in create() - just pass the value through
                return value
            except Parent.DoesNotExist:
                logger.error(f"❌ NOT A PARENT ID")
        
        # If email is provided, just pass through and handle in create()
        if receiver_email:
            logger.error(f"🔍 EMAIL PROVIDED, WILL HANDLE IN CREATE(): {receiver_email}")
            return value
                
        # Legacy behavior - try to find a User
        try:
            user = User.objects.get(id=receiver_id)
            logger.error(f"✅ FOUND USER DIRECTLY: {user.id}")
            return user
        except User.DoesNotExist:
            logger.error(f"❌ NOT A USER ID")
            # Just pass the value through to be handled in create()
            return value

class TeacherParentAssociationSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    parent_name = serializers.CharField(source='parent.first_name', read_only=True)
    teacher_email = serializers.EmailField(source='teacher.email', read_only=True)
    parent_email = serializers.EmailField(source='parent.email', read_only=True)

    class Meta:
        model = TeacherParentAssociation
        fields = ['id', 'teacher', 'parent', 'teacher_name', 'parent_name', 
                 'teacher_email', 'parent_email', 'created_at', 'is_active']
        read_only_fields = ['created_at']

    def validate(self, data):
        # Ensure teacher and parent are valid
        teacher = data.get('teacher')
        parent = data.get('parent')

        if not teacher or not parent:
            raise serializers.ValidationError("Both teacher and parent are required")

        # Check if parent is actually a parent
        if parent.role != Role.PARENT:
            raise serializers.ValidationError("The specified user is not a parent")

        # Check if teacher exists
        if not Teacher.objects.filter(id=teacher.id).exists():
            raise serializers.ValidationError("The specified teacher does not exist")

        return data

class LeaveApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveApplication
        fields = '__all__'
        read_only_fields = ['teacher']

class ProductSerializer(serializers.ModelSerializer):
    """Serializer for products in the school shop"""
    image = serializers.ImageField(required=True, allow_null=False)

    class Meta:
        model = Product
        fields = '__all__'

    def update(self, instance, validated_data):
        # If no new image is provided and there's an existing image, keep the existing one
        if 'image' not in validated_data and instance.image:
            validated_data['image'] = instance.image
        return super().update(instance, validated_data)

class ExamPDFSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamPDF
        fields = ['id', 'teacher', 'teacher_name', 'exam_name', 'subject', 'class_assigned', 
                  'exam_date', 'file', 'download_url', 'created_at']
        read_only_fields = ['teacher', 'created_at']
        
    def get_download_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
        
    def get_teacher_name(self, obj):
        return obj.teacher.name if obj.teacher else None

class SchoolEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SchoolEvent
        fields = '__all__'
        read_only_fields = ['created_by']

class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField()

class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True)
    password_confirmation = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({
                "password": "Password fields didn't match."
            })
        return data

class TimeTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimeTable
        fields = ['id', 'grade', 'day', 'period', 'subject', 'teacher', 'start_time', 'end_time', 'room', 'school']
