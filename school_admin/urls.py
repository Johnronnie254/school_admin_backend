from django.urls import path, include
from django.contrib import admin
from rest_framework.routers import DefaultRouter
from admin_interface.views import TeacherViewSet, StudentViewSet, NotificationViewSet

router = DefaultRouter()
router.register('teachers', TeacherViewSet)
router.register('students', StudentViewSet)
router.register('notifications', NotificationViewSet)

urlpatterns = [
    path('admin/', admin.site.urls),  # Add this line to enable the admin site
    path('api/', include(router.urls)),
]
