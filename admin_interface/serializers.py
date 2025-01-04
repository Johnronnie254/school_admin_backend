from rest_framework import serializers
from .models import Teacher, Student, Notification, LeaveRequest, SalaryAdvanceRequest

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = '__all__'

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'

class SalaryAdvanceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryAdvanceRequest
        fields = '__all__'
