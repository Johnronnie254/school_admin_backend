from django.urls import path
from .views import (
    RegisterView, LoginView, LogoutView, TeacherListView,
    StudentListView, StudentByGradeView, NotificationListView
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('teachers/', TeacherListView.as_view(), name='teachers'),
    path('students/', StudentListView.as_view(), name='students'),
    path('students/grade/<int:grade>/', StudentByGradeView.as_view(), name='students-by-grade'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),
]
