from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherViewSet, StudentViewSet, DocumentUploadView,
    FeePaymentView, ExamResultView, NotificationView,
    RegisterView, LoginView, LogoutView,
    ParentRegistrationView, ParentLoginView,
    ParentChildrenView, StudentExamResultsView,
    StudentFeeRecordsView, TeachersBySubjectView,
    SchoolStatisticsView, AdminViewSet,
    InitiateFeesPaymentView
)

router = DefaultRouter()
router.register(r'admin', AdminViewSet, basename='admin')
router.register(r'teachers', TeacherViewSet)
router.register(r'students', StudentViewSet, basename='student')
router.register(r'notifications', NotificationView, basename='notification')

urlpatterns = [
    # Authentication
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),

    # Documents
    path('documents/upload/', DocumentUploadView.as_view(), name='document-upload'),

    # Fees
    path('fees/initiate/', FeePaymentView.as_view({'post': 'initiate_payment'}), name='initiate-fee-payment'),
    path('fees/confirm/', FeePaymentView.as_view({'post': 'confirm_payment'}), name='confirm-fee-payment'),

    # Exam Results
    path('exams/record/', ExamResultView.as_view(), name='record-exam-result'),

    # Parents
    path('parents/register/', ParentRegistrationView.as_view(), name='parent-register'),
    path('parents/login/', ParentLoginView.as_view(), name='parent-login'),
    path('parents/<uuid:parent_id>/children/', ParentChildrenView.as_view(), name='parent-children'),

    # Students
    path('students/<uuid:student_id>/exam-results/', StudentExamResultsView.as_view(), name='student-exam-results'),
    path('students/<uuid:student_id>/fee-records/', StudentFeeRecordsView.as_view(), name='student-fee-records'),
    path('students/<uuid:student_id>/initiate_payment/', 
         InitiateFeesPaymentView.as_view(), 
         name='initiate-payment'),

    # Teachers
    path('teachers/by-subject/<str:subject>/', TeachersBySubjectView.as_view(), name='teachers-by-subject'),

    # Statistics
    path('statistics/', SchoolStatisticsView.as_view(), name='school-statistics'),

    # Notifications
    path('notifications/', NotificationView.as_view({
        'get': 'list',
        'post': 'create'
    }), name='notification-list'),
    path('notifications/<uuid:pk>/', NotificationView.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name='notification-detail'),

    # Include the router URLs
    path('', include(router.urls)),
] 