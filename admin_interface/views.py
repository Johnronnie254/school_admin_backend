from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from admin_interface.models import Teacher, Student, Notification
from admin_interface.serializers import (
    TeacherSerializer, StudentSerializer, NotificationSerializer, FileUploadSerializer,
)
import pandas as pd

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_teachers(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data['file']
            df = pd.read_excel(file)

            for _, row in df.iterrows():
                Teacher.objects.create(
                    name=row['name'],
                    email=row['email'],
                    phone_number=row['phone_number'],
                    class_assigned=row['class_assigned'],
                    subjects=row['subjects']  # Already comma-separated
                )
            Notification.objects.create(
                message="Bulk teacher upload completed.",
                target_group="Teachers"
            )
            return Response({"message": "Teachers uploaded successfully!"})
        return Response(serializer.errors, status=400)

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

    @action(detail=False, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def upload_students(self, request):
        serializer = FileUploadSerializer(data=request.data)
        if serializer.is_valid():
            file = serializer.validated_data['file']
            df = pd.read_excel(file)

            for _, row in df.iterrows():
                Student.objects.create(
                    name=row['name'],
                    guardian=row['guardian'],
                    contact=row['contact'],
                    grade=row['grade']
                )
            Notification.objects.create(
                message="Bulk student upload completed.",
                target_group="Students"
            )
            return Response({"message": "Students uploaded successfully!"})
        return Response(serializer.errors, status=400)

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
