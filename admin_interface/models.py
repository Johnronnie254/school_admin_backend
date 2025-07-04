from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
import uuid
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime

class Role(models.TextChoices):
    SUPERUSER = 'superuser', 'Super User'
    ADMIN = 'admin', 'Administrator'
    TEACHER = 'teacher', 'Teacher'
    PARENT = 'parent', 'Parent'
    STUDENT = 'student', 'Student'

class School(models.Model):
    """Model for School"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, default="Default School")
    address = models.TextField(default="Default Address")
    phone_number = models.CharField(max_length=15, default="0700000000")
    email = models.EmailField(unique=True)
    website = models.URLField(blank=True, null=True)
    logo = models.ImageField(upload_to='school_logos/', blank=True, null=True)
    registration_number = models.CharField(max_length=50, unique=True, default="REG000001")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = 'school'
        verbose_name_plural = 'schools'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['registration_number']),
        ]

# Custom User Manager
class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", Role.SUPERUSER)
        
        return self.create_user(email, password, **extra_fields)


# Custom User model for Admins only
class User(AbstractUser):
    """Custom user model with role-based access"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None  # Remove username field
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PARENT)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='users', null=True, blank=True)
    
    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["role"]

    def __str__(self):
        return f"{self.first_name} ({self.email})"

    class Meta:
        verbose_name = 'user'
        verbose_name_plural = 'users'
        ordering = ['email']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['role']),
        ]
        swappable = 'AUTH_USER_MODEL'


class Teacher(models.Model):
    """Independent Teacher model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    school = models.ForeignKey(School, on_delete=models.SET_NULL, related_name='teachers', null=True, blank=True)
    phone_regex = RegexValidator(
        regex=r'^07\d{8}$',
        message="Phone number must be in format '07XXXXXXXX'"
    )
    phone_number = models.CharField(
        validators=[phone_regex], 
        max_length=15,
        null=True,
        blank=True,
        error_messages={
            'invalid': "Phone number must be in format '07XXXXXXXX'"
        }
    )
    profile_pic = models.ImageField(upload_to='teacher_profile_pics/', null=True, blank=True)
    class_assigned = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    subjects = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'teacher'
        verbose_name_plural = 'teachers'
        ordering = ['name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['email']),
            models.Index(fields=['class_assigned']),
        ]

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        # Validate phone number
        if self.phone_number and not self.phone_regex.regex.match(str(self.phone_number)):
            raise ValidationError({
                'phone_number': self.phone_regex.message
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Parent(models.Model):
    """Model for Parents/Guardians"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    password = models.CharField(max_length=255, blank=True)  # Will store hashed password
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='parents', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Student(models.Model):
    """Independent Student model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    contact = models.CharField(max_length=255, null=True, blank=True)
    grade = models.IntegerField()
    class_assigned = models.CharField(max_length=50, null=True, blank=True)
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='children', null=True, blank=True, default=None)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students', default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()
        if self.parent and self.parent.role != Role.PARENT:
            raise ValidationError({'parent': 'The selected user must have a parent role'})
        if self.parent and self.parent.school != self.school:
            raise ValidationError({'parent': 'Parent must belong to the same school as the student'})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Notification(models.Model):
    """Model for storing notifications sent to teachers or students."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    TARGET_CHOICES = [
        ('all', 'All'),
        ('teachers', 'Teachers'),
        ('students', 'Students'),
        ('parents', 'Parents')
    ]

    message = models.CharField(max_length=500)
    target_group = models.CharField(max_length=10, choices=TARGET_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)

    def __str__(self):
        return f"Notification to {self.get_target_group_display()}"

    class Meta:
        ordering = ['-created_at']


class ExamResult(models.Model):
    """Model for storing student exam results"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='exam_results')
    exam_name = models.CharField(max_length=255)
    subject = models.CharField(max_length=100)
    marks = models.DecimalField(max_digits=5, decimal_places=2)
    grade = models.CharField(max_length=2)
    term = models.CharField(max_length=20)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='exam_results', null=True, blank=True)
    year = models.PositiveIntegerField()
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['student', 'year', 'term']),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.subject} ({self.exam_name})"


class SchoolFee(models.Model):
    """Model for tracking school fee payments"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fee_records')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    term = models.CharField(max_length=20)
    year = models.PositiveIntegerField()
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=50)
    transaction_id = models.UUIDField(default=uuid.uuid4, unique=True)
    status = models.CharField(max_length=20, default='pending')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='fees', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['student', 'year', 'term']),
            models.Index(fields=['transaction_id']),
        ]

    def __str__(self):
        return f"{self.student.name} - {self.term} {self.year}"


class Attendance(models.Model):
    """Model for tracking student attendance"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField()
    status = models.CharField(max_length=20, choices=[
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused')
    ])
    reason = models.TextField(blank=True)
    recorded_by = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'date']
        indexes = [models.Index(fields=['student', 'date'])]


class TimeTable(models.Model):
    """Model for school timetable"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    grade = models.PositiveIntegerField()
    day = models.CharField(max_length=10)
    period = models.PositiveIntegerField()
    subject = models.CharField(max_length=100)
    teacher = models.ForeignKey(Teacher, on_delete=models.SET_NULL, null=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    room = models.CharField(max_length=50)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='timetables', null=True, blank=True)

    class Meta:
        unique_together = ['grade', 'day', 'period']
        ordering = ['day', 'period']

    def clean(self):
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            raise ValidationError({
                'end_time': 'End time must be after start time'
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Document(models.Model):
    """Model for storing school documents"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/%Y/%m/')
    document_type = models.CharField(max_length=50, choices=[
        ('report', 'Report Card'),
        ('assignment', 'Assignment'),
        ('syllabus', 'Syllabus'),
        ('other', 'Other')
    ])
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, null=True, blank=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='documents', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.student.name}"


class SchoolEvent(models.Model):
    """Model for school events and calendar"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    description = models.TextField()
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    event_type = models.CharField(max_length=50, choices=[
        ('holiday', 'Holiday'),
        ('exam', 'Examination'),
        ('meeting', 'Meeting'),
        ('activity', 'Activity')
    ])
    participants = models.CharField(max_length=50, choices=[
        ('all', 'All'),
        ('teachers', 'Teachers'),
        ('students', 'Students'),
        ('parents', 'Parents')
    ])
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def has_ended(self):
        """Check if the event has ended"""
        return timezone.now() > self.end_date

    def clean(self):
        """Validate event dates"""
        if self.start_date and self.end_date and self.start_date > self.end_date:
            raise ValidationError({
                'end_date': 'End date must be after start date'
            })

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    class Meta:
        ordering = ['start_date']
        indexes = [
            models.Index(fields=['start_date', 'end_date']),
            models.Index(fields=['event_type']),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_event_type_display()})"


class Message(models.Model):
    """Model for chat messages between teachers and parents"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_messages', null=True, blank=True)
    
    # Direct links to Teacher/Parent models
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    parent = models.ForeignKey(Parent, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='messages', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class TeacherParentAssociation(models.Model):
    """Model for associating teachers with parents"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='parent_associations')
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='teacher_associations')
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['teacher', 'parent']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.teacher.name} - {self.parent.first_name}"


class ExamPDF(models.Model):
    """Model for storing exam PDFs uploaded by teachers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='exam_pdfs')
    exam_name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    class_assigned = models.CharField(max_length=255)
    exam_date = models.DateField()
    year = models.PositiveIntegerField(default=datetime.now().year)
    file = models.FileField(upload_to='exam_pdfs/')
    remarks = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='exam_pdfs', null=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['teacher', 'class_assigned', 'subject']),
            models.Index(fields=['year']),
        ]
        
    def __str__(self):
        return f"{self.exam_name} - {self.subject} - {self.class_assigned}"

    def save(self, *args, **kwargs):
        if not self.school and hasattr(self.teacher, 'school'):
            self.school = self.teacher.school
        super().save(*args, **kwargs)


class LeaveApplication(models.Model):
    """Model for teacher leave applications"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    leave_type = models.CharField(max_length=50, choices=[
        ('sick', 'Sick Leave'),
        ('casual', 'Casual Leave'),
        ('emergency', 'Emergency Leave')
    ])
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected')
    ], default='pending')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='leave_applications', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Product(models.Model):
    """Model for school shop products"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='products/', null=False, blank=False)
    stock = models.PositiveIntegerField()
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='products', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class Order(models.Model):
    """Model for parent orders from school shop"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    parent = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled')
    ], default='pending')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['parent', 'status']),
            models.Index(fields=['school', 'status']),
        ]

    def __str__(self):
        return f"Order {self.id} by {self.parent.first_name}"


class OrderItem(models.Model):
    """Model for items in an order"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.quantity}x {self.product.name} in Order {self.order.id}"


class PasswordResetToken(models.Model):
    """
    Model for password reset tokens and codes
    - token: UUID for parents (deep link flow)
    - reset_code: 6-digit code for teachers (code-based flow)
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    reset_code = models.CharField(max_length=6, blank=True, null=True, help_text="6-digit code for teachers")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        """Check if the token/code is still valid"""
        return not self.used and timezone.now() < self.expires_at

    def generate_reset_code(self):
        """Generate a 6-digit reset code for teachers"""
        import random
        self.reset_code = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        self.save()
        return self.reset_code

    def __str__(self):
        return f"Reset token for {self.user.email} - {'Code' if self.reset_code else 'Token'}"

    class Meta:
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['reset_code']),
            models.Index(fields=['user']),
            models.Index(fields=['expires_at']),
        ]


class AdminCredential(models.Model):
    """Temporary storage for admin credentials"""
    admin = models.OneToOneField(User, on_delete=models.CASCADE)
    password = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'admin_credentials'
