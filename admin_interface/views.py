from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from admin_interface.models import Teacher, Student, Notification
from admin_interface.serializers import TeacherSerializer, StudentSerializer, NotificationSerializer, FileUploadSerializer
import pandas as pd
from io import BytesIO

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

    # Adding a custom action for bulk upload of teachers from an Excel file
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_teachers(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data['file']
            # Read the Excel file
            df = pd.read_excel(file)
            # Process the file data and create teacher records
            for _, row in df.iterrows():
                Teacher.objects.create(
                    name=row['name'],
                    email=row['email'],
                    phone_number=row['phone_number'],
                    class_assigned=row['class_assigned'],
                    subjects=row['subjects'].split(',')  # Assuming subjects are comma separated
                )
            return Response({"message": "Teachers uploaded successfully!"})
        return Response(serializer.errors, status=400)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    # Adding a custom action for bulk upload of students from an Excel file
    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_students(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data['file']
            # Read the Excel file
            df = pd.read_excel(file)
            # Process the file data and create student records
            for _, row in df.iterrows():
                Student.objects.create(
                    name=row['name'],
                    guardian=row['guardian'],
                    contact=row['contact'],
                    grade=row['grade']
                )
            return Response({"message": "Students uploaded successfully!"})
        return Response(serializer.errors, status=400)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
