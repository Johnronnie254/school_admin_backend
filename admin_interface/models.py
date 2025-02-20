from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager


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
    """Custom user model for Admins who manage Teachers and Students."""
    username = None  # Remove username field (authentication is via email)
    email = models.EmailField(unique=True)
    
    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []  # Only email is required

    def __str__(self):
        return self.email


class Teacher(models.Model):
    """Independent Teacher model."""
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)  # Auto timestamp
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Student(models.Model):
    """Independent Student model."""
    name = models.CharField(max_length=255)
    guardian = models.CharField(max_length=255)
    contact = models.CharField(max_length=15)  # Phone numbers are usually 10-15 chars
    grade = models.PositiveIntegerField()  # Ensures grades are positive numbers
    class_assigned = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - Grade {self.grade}"


class Notification(models.Model):
    """Model for storing notifications sent to teachers or students."""
    TARGET_CHOICES = [
        ("teachers", "Teachers"),
        ("students", "Students"),
        ("both", "Both"),
    ]

    message = models.TextField()
    target_group = models.CharField(max_length=10, choices=TARGET_CHOICES, default="both")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification to {self.get_target_group_display()}"
