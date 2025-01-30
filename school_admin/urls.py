from django.urls import path, include
from rest_framework.routers import DefaultRouter
from admin_interface.views import TeacherViewSet, StudentViewSet, NotificationViewSet

router = DefaultRouter()
router.register('teachers', TeacherViewSet)
router.register('students', StudentViewSet)
router.register('notifications', NotificationViewSet)

urlpatterns = [
    path('api/', include(router.urls)),
]
