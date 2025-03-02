from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from admin_interface.views import (
    TeacherViewSet, StudentViewSet, ParentViewSet,
    ExamResultViewSet, SchoolFeeViewSet, NotificationViewSet,
    AdminViewSet
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'admin', AdminViewSet, basename='admin')
router.register(r'teachers', TeacherViewSet)
router.register(r'students', StudentViewSet)
router.register(r'parents', ParentViewSet)
router.register(r'exam-results', ExamResultViewSet)
router.register(r'school-fees', SchoolFeeViewSet)
router.register(r'notifications', NotificationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
]
