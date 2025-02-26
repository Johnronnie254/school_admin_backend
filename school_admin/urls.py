from django.urls import path
from admin_interface.views import (
    RegisterView, LoginView, LogoutView, TeacherListView,
    StudentListView, StudentByGradeView, NotificationListView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('teachers/', TeacherListView.as_view(), name='teachers'),
    path('students/', StudentListView.as_view(), name='students'),
    path('students/grade/<str:grade>/', StudentByGradeView.as_view(), name='students-by-grade'),  # Supports PP1, PP2, etc.
    path('notifications/', NotificationListView.as_view(), name='notifications'),
]
