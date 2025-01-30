from rest_framework import serializers
from admin_interface.models import Teacher, Student, Notification

class TeacherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Teacher
        fields = ['id', 'name', 'email', 'phone_number', 'class_assigned', 'subjects']

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = ['id', 'name', 'guardian', 'contact', 'grade']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'message', 'target_group', 'date']

class FileUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        # Check if the file is an Excel file
        if not value.name.endswith('.xlsx'):
            raise serializers.ValidationError("Only Excel files (.xlsx) are allowed.")
        
        # Optionally, you can also validate the file type by checking the MIME type
        if not value.content_type in ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
            raise serializers.ValidationError("Invalid file type. Please upload a valid Excel file.")
        
        return value
