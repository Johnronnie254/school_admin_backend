from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
import uuid
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError

class Role(models.TextChoices):
    ADMIN = 'admin', 'Administrator'
    TEACHER = 'teacher', 'Teacher'
    PARENT = 'parent', 'Parent'

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
        return self.create_user(email, password, **extra_fields)


# Custom User model for Admins only
class User(AbstractUser):
    """Custom user model with role-based access"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None  # Remove username field (authentication is via email)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PARENT)
    
    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["role"]

    def __str__(self):
        return self.email


class Teacher(models.Model):
    """Independent Teacher model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
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
    class_assigned = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    subjects = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['name', 'email']),
            models.Index(fields=['class_assigned']),
        ]
        ordering = ['name']

    def __str__(self):
        return self.name

    def clean(self):
        super().clean()
        # Validate phone number
        if not self.phone_regex.regex.match(str(self.phone_number)):
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
    phone_number = models.CharField(max_length=15, unique=True)
    password = models.CharField(max_length=255)  # Will store hashed password
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Student(models.Model):
    """Independent Student model."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    guardian = models.CharField(max_length=255)
    contact = models.CharField(max_length=15, unique=True)
    grade = models.PositiveIntegerField(db_index=True)
    class_assigned = models.CharField(max_length=255, blank=True, null=True, db_index=True)
    parent = models.ForeignKey(Parent, on_delete=models.SET_NULL, null=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['name', 'grade']),
            models.Index(fields=['class_assigned']),
        ]

    def __str__(self):
        return f"{self.name} - Grade {self.grade}"


class Notification(models.Model):
    """Model for storing notifications sent to teachers or students."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    TARGET_CHOICES = [
        ("teachers", "Teachers"),
        ("students", "Students"),
        ("both", "Both"),
    ]

    message = models.TextField()
    target_group = models.CharField(max_length=10, choices=TARGET_CHOICES, default="both")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

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
