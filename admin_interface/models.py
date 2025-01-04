from django.db import models

class Teacher(models.Model):
    name = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    leave_status = models.BooleanField(default=False)

class Student(models.Model):
    name = models.CharField(max_length=255)
    grade = models.CharField(max_length=50)
    attendance = models.DecimalField(max_digits=5, decimal_places=2)

class Notification(models.Model):
    message = models.TextField()
    target_group = models.CharField(max_length=50)  # e.g., 'Teachers', 'Students'
    date = models.DateTimeField(auto_now_add=True)

class LeaveRequest(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    start_date = models.DateField()
    end_date = models.DateField()
    approved = models.BooleanField(default=False)
    reason = models.TextField()

    def __str__(self):
        return f"Leave request from {self.teacher.name} ({'Approved' if self.approved else 'Pending'})"

class SalaryAdvanceRequest(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    amount_requested = models.DecimalField(max_digits=10, decimal_places=2)
    approved = models.BooleanField(default=False)
    reason = models.TextField()

    def __str__(self):
        return f"Salary advance request from {self.teacher.name} ({'Approved' if self.approved else 'Pending'})"
