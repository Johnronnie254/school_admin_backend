from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    """Custom user model extending Django's default user authentication."""
    email = models.EmailField(unique=True)
    is_teacher = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

class Teacher(models.Model):
    """Teacher model linked to the User model."""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone_number = models.CharField(max_length=15, blank=True)
    class_assigned = models.CharField(max_length=255, blank=True)
    subjects = models.TextField()  # Comma-separated list of subjects

    def __str__(self):
        return self.user.username

class Student(models.Model):
    """Student model storing student details."""
    name = models.CharField(max_length=255)
    guardian = models.CharField(max_length=255)
    contact = models.CharField(max_length=255)
    grade = models.IntegerField()  # Ensures grades are numeric

    def __str__(self):
        return f"{self.name} - Grade {self.grade}"

class Notification(models.Model):
    """Model for storing notifications sent to teachers or students."""
    message = models.TextField()
    target_group = models.CharField(max_length=50)  # 'Teachers', 'Students'
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.message
