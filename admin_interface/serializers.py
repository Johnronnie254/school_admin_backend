from rest_framework import serializers
from .models import User, Teacher, Student, Notification, Parent, ExamResult, Role, Document, Message, LeaveApplication, Product, ExamPDF, SchoolEvent, TeacherParentAssociation, School, TimeTable, Attendance, Order, OrderItem
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
import uuid
from django.utils import timezone

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
    password = serializers.CharField(write_only=True, required=False)
    password_confirmation = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = Teacher
        fields = '__all__'
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirmation': {'write_only': True}
        }

    def validate_email(self, value):
        """Ensure email is unique"""
        instance = getattr(self, 'instance', None)
        if Teacher.objects.filter(email=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("A teacher with this email already exists.")
        return value

    def validate(self, data):
        """Validate password confirmation if passwords are provided"""
        password = data.get('password')
        password_confirmation = data.get('password_confirmation')
        
        if password and password_confirmation:
            if password != password_confirmation:
                raise serializers.ValidationError({
                    "password": "Password fields didn't match."
                })
        
        return data
        
    def create(self, validated_data):
        """Override create to ensure a User record is created with the same UUID"""
        # Extract password fields
        password = validated_data.pop('password', None)
        validated_data.pop('password_confirmation', None)
        
        # First create the Teacher record
        email = validated_data.get('email')
        name = validated_data.get('name')
        school = validated_data.get('school')
        
        # Check if a User already exists with this email
        try:
            user = User.objects.get(email=email)
            # If user exists, use their UUID for the teacher
            teacher_id = user.id
            
            # Update the user's password if provided
            if password:
                user.set_password(password)
                user.save()
                
        except User.DoesNotExist:
            # Generate UUID for both Teacher and User
            teacher_id = uuid.uuid4()
            # Create User with same UUID
            user_password = password if password else User.objects.make_random_password()
            user = User.objects.create_user(
                id=teacher_id,
                email=email,
                password=user_password,
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
    password = serializers.CharField(write_only=True, required=False)
    password_confirmation = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = Parent
        fields = ['id', 'name', 'email', 'phone_number', 'children', 'password', 'password_confirmation']
        extra_kwargs = {
            'password': {'write_only': True},
            'password_confirmation': {'write_only': True}
        }

    def get_children(self, obj):
        """Get children data from context"""
        parent_children = self.context.get('parent_children', {})
        children = parent_children.get(obj.email, [])
        return StudentSerializer(children, many=True).data

    def validate(self, data):
        """Validate password confirmation"""
        if 'password' in data and 'password_confirmation' in data:
            if data['password'] != data['password_confirmation']:
                raise serializers.ValidationError({
                    "password": "Password fields didn't match."
                })
        return data

    def create(self, validated_data):
        """Create a new parent"""
        validated_data.pop('password_confirmation', None)
        return super().create(validated_data)

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
    student_name = serializers.CharField(source='student.name', read_only=True)
    
    class Meta:
        model = ExamResult
        fields = ['id', 'student', 'student_name', 'exam_name', 'subject', 'marks', 'grade', 'term', 'year', 'remarks', 'created_at']



class StudentDetailSerializer(serializers.ModelSerializer):
    """Detailed Student serializer including exam results"""
    exam_results = ExamResultSerializer(many=True, read_only=True)

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
    
    # ✅ Add sender and receiver details
    sender_name = serializers.CharField(source='sender.first_name', read_only=True)
    sender_role = serializers.CharField(source='sender.role', read_only=True)
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    
    receiver_name = serializers.CharField(source='receiver.first_name', read_only=True)
    receiver_role_actual = serializers.CharField(source='receiver.role', read_only=True)
    receiver_email_actual = serializers.CharField(source='receiver.email', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'sender', 'receiver', 'teacher', 'parent', 'content', 'is_read', 
            'school', 'created_at', 'receiver_email', 'receiver_role',
            # ✅ New fields for sender/receiver details
            'sender_name', 'sender_role', 'sender_email',
            'receiver_name', 'receiver_role_actual', 'receiver_email_actual'
        ]
        read_only_fields = ['sender', 'created_at']
        
    def create(self, validated_data):
        """Custom create method to handle teacher and parent direct connections"""
        # Extract non-model fields
        receiver_email = validated_data.pop('receiver_email', None)
        receiver_role = validated_data.pop('receiver_role', None)
        
        # Get receiver from validated data if it exists
        receiver = validated_data.get('receiver', None)
        
        # If no direct receiver and we have email/role, try to find direct models
        if not receiver and receiver_email and receiver_role:
            if receiver_role == 'teacher':
                try:
                    # Find teacher directly
                    teacher = Teacher.objects.get(email=receiver_email)
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
                    # Try by ID if provided in receiver field
                    if 'receiver' in validated_data and validated_data['receiver']:
                        try:
                            teacher_id = validated_data['receiver']
                            teacher = Teacher.objects.get(id=teacher_id)
                            validated_data['teacher'] = teacher
                        except Teacher.DoesNotExist:
                            pass
            elif receiver_role == 'parent':
                try:
                    # Find parent directly
                    parent = Parent.objects.get(email=receiver_email)
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
                    # Try by ID if provided in receiver field
                    if 'receiver' in validated_data and validated_data['receiver']:
                        try:
                            parent_id = validated_data['receiver']
                            parent = Parent.objects.get(id=parent_id)
                            validated_data['parent'] = parent
                        except Parent.DoesNotExist:
                            pass
        
        # Create the message
        message = Message.objects.create(**validated_data)
        return message
        
    def validate_receiver(self, value):
        """Allow receiver to be specified as a Teacher or Parent ID"""
        # If we have a receiver ID, check if it's a Teacher or Parent ID directly
        if value:
            try:
                teacher = Teacher.objects.get(id=value)
                # We'll handle this in create() - just pass the value through
                return value
            except Teacher.DoesNotExist:
                try:
                    parent = Parent.objects.get(id=value)
                    # We'll handle this in create() - just pass the value through
                    return value
                except Parent.DoesNotExist:
                    pass
        
        # If email is provided, just pass through and handle in create()
        if receiver_email:
            return value
                
        # Legacy behavior - try to find a User
        try:
            user = User.objects.get(id=value)
            return user
        except User.DoesNotExist:
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
    teacher_name = serializers.CharField(source='teacher.name', read_only=True)
    
    class Meta:
        model = LeaveApplication
        fields = ['id', 'teacher', 'teacher_name', 'leave_type', 'start_date', 'end_date', 'reason', 'status', 'created_at']
        read_only_fields = ['teacher']

class ProductSerializer(serializers.ModelSerializer):
    """Serializer for products in the school shop"""
    image = serializers.ImageField(required=True, allow_null=False)
    price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'
        
    def get_price(self, obj):
        """Convert price to float for frontend compatibility"""
        return float(obj.price) if obj.price else 0.0

    def update(self, instance, validated_data):
        # If no new image is provided and there's an existing image, keep the existing one
        if 'image' not in validated_data and instance.image:
            validated_data['image'] = instance.image
        return super().update(instance, validated_data)

class OrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    unit_price = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'total_price']
        read_only_fields = ['total_price']
        
    def get_unit_price(self, obj):
        """Convert unit_price to float for frontend compatibility"""
        return float(obj.unit_price) if obj.unit_price else 0.0
        
    def get_total_price(self, obj):
        """Convert total_price to float for frontend compatibility"""
        return float(obj.total_price) if obj.total_price else 0.0

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    parent_name = serializers.CharField(source='parent.first_name', read_only=True)
    total_amount = serializers.SerializerMethodField()  # Custom method to ensure it's a number

    class Meta:
        model = Order
        fields = ['id', 'parent', 'parent_name', 'school', 'status', 'total_amount', 'items', 'created_at', 'updated_at']
        read_only_fields = ['total_amount', 'created_at', 'updated_at']
    
    def get_total_amount(self, obj):
        """Convert total_amount to float for frontend compatibility"""
        return float(obj.total_amount) if obj.total_amount else 0.0

class OrderCreateSerializer(serializers.ModelSerializer):
    items = serializers.ListField(
        child=serializers.DictField(
            child=serializers.CharField()
        ),
        write_only=True
    )

    class Meta:
        model = Order
        fields = ['items'] 

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("At least one item is required")
        
        for item in items:
            if not all(k in item for k in ('product', 'quantity')):
                raise serializers.ValidationError("Each item must have 'product' and 'quantity' fields")
            try:
                quantity = int(item['quantity'])
                if quantity <= 0:
                    raise serializers.ValidationError("Quantity must be positive")
            except ValueError:
                raise serializers.ValidationError("Quantity must be a number")
        
        return items

    def create(self, validated_data):
        try:
            items_data = validated_data.pop('items')
            total_amount = 0

            # Create order - parent, school, status are set by perform_create() in the view
            try:
                order = Order.objects.create(
                    total_amount=total_amount,
                    **validated_data
                )
            except Exception as e:
                raise serializers.ValidationError(f"Order creation failed: {str(e)}")

            # Create order items
            for i, item_data in enumerate(items_data):
                try:
                    product_id = item_data['product']

                    try:
                        product = Product.objects.get(id=product_id)

                    except Product.DoesNotExist:
                        order.delete()
                        raise serializers.ValidationError(f"Product with ID '{product_id}' not found")
                    except Exception as e:
                        order.delete()
                        raise serializers.ValidationError(f"Product lookup error: {type(e).__name__}: {str(e)}")
                    
                    quantity = int(item_data['quantity'])

                    if product.stock < quantity:
                        order.delete()
                        raise serializers.ValidationError(f"Not enough stock for {product.name}. Available: {product.stock}, Requested: {quantity}")

                    # Create order item
                    try:
                        order_item = OrderItem.objects.create(
                            order=order,
                            product=product,
                            quantity=quantity,
                            unit_price=product.price,
                            total_price=product.price * quantity
                        )
                    except Exception as e:
                        order.delete()
                        raise serializers.ValidationError(f"OrderItem creation failed: {type(e).__name__}: {str(e)}")

                    # Update product stock
                    try:
                        product.stock -= quantity
                        product.save()
                    except Exception as e:
                        order.delete()
                        raise serializers.ValidationError(f"Product stock update failed: {type(e).__name__}: {str(e)}")
                    
                    # Update total amount
                    total_amount += product.price * quantity

                except Exception as e:
                    if 'order' in locals():
                        order.delete()
                    raise

            # Update order total
            try:
                order.total_amount = total_amount
                order.save()
            except Exception as e:
                order.delete()
                raise serializers.ValidationError(f"Order total update failed: {type(e).__name__}: {str(e)}")
            return order
            
        except Exception as e:
            raise serializers.ValidationError(f"Order creation failed: {type(e).__name__}: {str(e)}")

class ExamPDFSerializer(serializers.ModelSerializer):
    download_url = serializers.SerializerMethodField()
    teacher_name = serializers.SerializerMethodField()
    school_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ExamPDF
        fields = [
            'id', 'teacher', 'teacher_name', 'exam_name', 'subject',
            'class_assigned', 'exam_date', 'year', 'file',
            'remarks', 'download_url', 'created_at',
            'school', 'school_name'
        ]
        read_only_fields = [
            'teacher', 'created_at', 'school',
            'class_assigned'  # This is set from teacher's assigned class
        ]
        
    def get_download_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
        
    def get_teacher_name(self, obj):
        return obj.teacher.name if obj.teacher else None
        
    def get_school_name(self, obj):
        return obj.school.name if obj.school else None
        
    def validate_year(self, value):
        """Ensure year is not in the future"""
        current_year = timezone.now().year
        if value > current_year:
            raise serializers.ValidationError("Year cannot be in the future")
        return value

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

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.name', read_only=True)
    
    class Meta:
        model = Attendance
        fields = ['id', 'student', 'student_name', 'date', 'status', 'reason', 'recorded_by', 'recorded_by_name', 'created_at']
        read_only_fields = ['recorded_by', 'created_at']

class ComprehensiveStudentSerializer(serializers.ModelSerializer):
    """Comprehensive Student serializer with all related data"""
    exam_results = ExamResultSerializer(many=True, read_only=True)
    attendance_records = AttendanceSerializer(many=True, read_only=True)
    
    # Parent information
    parent_name = serializers.CharField(source='parent.first_name', read_only=True)
    parent_email = serializers.CharField(source='parent.email', read_only=True)
    parent_id = serializers.UUIDField(source='parent.id', read_only=True)
    
    # School information
    school_name = serializers.CharField(source='school.name', read_only=True)
    school_id = serializers.UUIDField(source='school.id', read_only=True)
    school_address = serializers.CharField(source='school.address', read_only=True)
    school_phone = serializers.CharField(source='school.phone_number', read_only=True)
    school_email = serializers.EmailField(source='school.email', read_only=True)
    
    # Class teachers (teachers assigned to the same class)
    class_teachers = serializers.SerializerMethodField()
    
    # Attendance statistics
    attendance_statistics = serializers.SerializerMethodField()
    
    # Academic performance summary
    academic_summary = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            # Basic student info
            'id', 'name', 'contact', 'grade', 'class_assigned', 'created_at', 'updated_at',
            
            # Parent info
            'parent', 'parent_id', 'parent_name', 'parent_email',
            
            # School info
            'school', 'school_id', 'school_name', 'school_address', 'school_phone', 'school_email',
            
            # Class info
            'class_teachers',
            
            # Academic data
            'exam_results', 'academic_summary',
            
            # Attendance data
            'attendance_records', 'attendance_statistics'
        ]

    def get_class_teachers(self, obj):
        """Get all teachers assigned to the student's class"""
        if not obj.class_assigned:
            return []
        
        teachers = Teacher.objects.filter(class_assigned=obj.class_assigned, school=obj.school)
        return [{
            'id': str(teacher.id),
            'name': teacher.name,
            'email': teacher.email,
            'phone_number': teacher.phone_number,
            'subjects': teacher.subjects,
            'class_assigned': teacher.class_assigned
        } for teacher in teachers]

    def get_attendance_statistics(self, obj):
        """Calculate attendance statistics for the student"""
        from django.utils import timezone
        from datetime import timedelta
        
        # Get attendance records for current academic year
        current_year = timezone.now().year
        
        # Get records for the last 90 days as a reasonable sample
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=90)
        
        attendance_records = obj.attendance_records.filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        total_days = attendance_records.count()
        if total_days == 0:
            return {
                'total_days_recorded': 0,
                'present_days': 0,
                'absent_days': 0,
                'late_days': 0,
                'excused_days': 0,
                'attendance_percentage': 0.0,
                'period': f'{start_date} to {end_date}'
            }
        
        present_days = attendance_records.filter(status='present').count()
        absent_days = attendance_records.filter(status='absent').count()
        late_days = attendance_records.filter(status='late').count()
        excused_days = attendance_records.filter(status='excused').count()
        
        attendance_percentage = (present_days / total_days) * 100 if total_days > 0 else 0
        
        return {
            'total_days_recorded': total_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'late_days': late_days,
            'excused_days': excused_days,
            'attendance_percentage': round(attendance_percentage, 2),
            'period': f'{start_date} to {end_date}'
        }

    def get_academic_summary(self, obj):
        """Calculate academic performance summary"""
        exam_results = obj.exam_results.all()
        
        if not exam_results.exists():
            return {
                'total_exams': 0,
                'average_marks': 0.0,
                'highest_mark': 0.0,
                'lowest_mark': 0.0,
                'subjects_count': 0,
                'grade_distribution': {},
                'recent_performance': []
            }
        
        total_exams = exam_results.count()
        total_marks = sum([float(result.marks) for result in exam_results])
        average_marks = total_marks / total_exams if total_exams > 0 else 0
        
        marks_list = [float(result.marks) for result in exam_results]
        highest_mark = max(marks_list) if marks_list else 0
        lowest_mark = min(marks_list) if marks_list else 0
        
        # Count unique subjects
        subjects_count = exam_results.values('subject').distinct().count()
        
        # Grade distribution
        grade_distribution = {}
        for result in exam_results:
            grade = result.grade
            grade_distribution[grade] = grade_distribution.get(grade, 0) + 1
        
        # Recent performance (last 5 exams)
        recent_results = exam_results.order_by('-created_at')[:5]
        recent_performance = [{
            'exam_name': result.exam_name,
            'subject': result.subject,
            'marks': float(result.marks),
            'grade': result.grade,
            'date': result.created_at.date()
        } for result in recent_results]
        
        return {
            'total_exams': total_exams,
            'average_marks': round(average_marks, 2),
            'highest_mark': highest_mark,
            'lowest_mark': lowest_mark,
            'subjects_count': subjects_count,
            'grade_distribution': grade_distribution,
            'recent_performance': recent_performance
        }
