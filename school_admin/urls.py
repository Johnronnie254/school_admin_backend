from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from admin_interface.views import (
    TeacherViewSet, StudentViewSet, ParentViewSet,
    ExamResultView, SchoolFeeViewSet, NotificationView,
    AdminViewSet, api_root
)

# Create a router and register our viewsets with it
router = DefaultRouter()
router.register(r'admin', AdminViewSet, basename='admin')
router.register(r'teachers', TeacherViewSet)
router.register(r'students', StudentViewSet)
router.register(r'parents', ParentViewSet)
# router.register(r'exam-results', ExamResultViewSet)  # Comment out or remove this line since ExamResultView is not a viewset
router.register(r'school-fees', SchoolFeeViewSet)
router.register(r'notifications', NotificationView, basename='notification')

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('admin_interface.urls')),  # This should include all URLs including the router URLs
    # Add a direct path for ExamResultView since it's not a viewset
    path('api/exam-results/', ExamResultView.as_view(), name='exam-results'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
