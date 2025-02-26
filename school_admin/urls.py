from django.urls import path
from admin_interface.views import (
    RegisterView, LoginView, LogoutView, TeacherListView, 
    TeacherDetailView, TeacherUploadView, StudentListView, 
    StudentByGradeView, StudentDetailView, StudentUploadView,  # ✅ Added missing imports
    NotificationListView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),

    path('teachers/', TeacherListView.as_view(), name='teachers'),
    path('teachers/<int:pk>/', TeacherDetailView.as_view(), name='teacher-detail'),  # ✅ Matches frontend
    path('teachers/upload_teachers/', TeacherUploadView.as_view(), name='upload-teachers'),  # ✅ Matches frontend

    path('students/', StudentListView.as_view(), name='students'),
    path('students/grade/<int:grade>/', StudentByGradeView.as_view(), name='students-by-grade'),  # ✅ Fixed
    path('students/<int:pk>/', StudentDetailView.as_view(), name='student-detail'),  # ✅ Fixed import
    path('students/grade/<int:grade>/upload/', StudentUploadView.as_view(), name='student-upload'),  # ✅ Fixed import

    path('notifications/', NotificationListView.as_view(), name='notifications'),
]
