from django.contrib import admin
from django.urls import path
from admin_interface.views import (
    RegisterView, LoginView, LogoutView, TeacherListView, 
    TeacherDetailView, TeacherUploadView, StudentListView, 
    StudentByGradeView, StudentDetailView, StudentUploadView,  
    NotificationListView
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # Authentication
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', LoginView.as_view(), name='login'),
    path('api/logout/', LogoutView.as_view(), name='logout'),

    # Teachers
    path('api/teachers/', TeacherListView.as_view(), name='teachers'),
    path('api/teachers/<int:pk>/', TeacherDetailView.as_view(), name='teacher-detail'),
    path('api/teachers/upload_teachers/', TeacherUploadView.as_view(), name='upload-teachers'),

    # Students
    path('api/students/', StudentListView.as_view(), name='students'),
    path('api/students/grade/<int:grade>/', StudentByGradeView.as_view(), name='students-by-grade'),
    path('api/students/<int:pk>/', StudentDetailView.as_view(), name='student-detail'),
    path('api/students/grade/<int:grade>/upload/', StudentUploadView.as_view(), name='student-upload'),

    # Notifications
    path('api/notifications/', NotificationListView.as_view(), name='notifications'),
]
