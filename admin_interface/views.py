from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Teacher, Student, Notification, LeaveRequest, SalaryAdvanceRequest
from .serializers import TeacherSerializer, StudentSerializer, NotificationSerializer, LeaveRequestSerializer, SalaryAdvanceRequestSerializer

class TeacherViewSet(ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

class StudentViewSet(ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer

class NotificationViewSet(ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

class LeaveRequestViewSet(ModelViewSet):
    queryset = LeaveRequest.objects.all()
    serializer_class = LeaveRequestSerializer

    @action(detail=True, methods=['post'])
    def approve_leave(self, request, pk=None):
        leave_request = self.get_object()
        leave_request.approved = True
        leave_request.save()
        return Response({'status': 'Leave approved'})

    @action(detail=True, methods=['post'])
    def deny_leave(self, request, pk=None):
        leave_request = self.get_object()
        leave_request.approved = False
        leave_request.save()
        return Response({'status': 'Leave denied'})

class SalaryAdvanceRequestViewSet(ModelViewSet):
    queryset = SalaryAdvanceRequest.objects.all()
    serializer_class = SalaryAdvanceRequestSerializer

    @action(detail=True, methods=['post'])
    def approve_advance(self, request, pk=None):
        salary_request = self.get_object()
        salary_request.approved = True
        salary_request.save()
        return Response({'status': 'Salary advance approved'})

    @action(detail=True, methods=['post'])
    def deny_advance(self, request, pk=None):
        salary_request = self.get_object()
        salary_request.approved = False
        salary_request.save()
        return Response({'status': 'Salary advance denied'})
