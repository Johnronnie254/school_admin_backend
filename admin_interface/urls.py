from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherViewSet, StudentViewSet, DocumentUploadView,
    FeePaymentView, ExamResultView, NotificationView,
    RegisterView, LoginView, LogoutView,
    ParentChildrenView, StudentExamResultsView,
    StudentFeeRecordsView, TeachersBySubjectView,
    SchoolStatisticsView, AdminViewSet,
    InitiateFeesPaymentView,
    MessageViewSet, LeaveApplicationViewSet,
    ProductViewSet, TeacherScheduleView, TeacherProfilePicView,
    TeacherExamViewSet, PasswordResetRequestView,
    PasswordResetConfirmView, TeacherParentAssociationViewSet,
    SchoolViewSet, ParentViewSet, SchoolEventViewSet
)

router = DefaultRouter()
router.register(r'admin', AdminViewSet, basename='admin')
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'teachers', TeacherViewSet)
router.register(r'students', StudentViewSet, basename='student')
router.register(r'parents', ParentViewSet, basename='parent')
router.register(r'notifications', NotificationView, basename='notification')
router.register(r'teacher/exams', TeacherExamViewSet, basename='teacher-exams')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'teacher-parent-associations', TeacherParentAssociationViewSet, basename='teacher-parent-association')
router.register(r'leave-applications', LeaveApplicationViewSet, basename='leave-application')
router.register(r'school-events', SchoolEventViewSet, basename='school-event')

urlpatterns = [
    # Authentication
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/password/reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),

    # Documents
    path('documents/upload/', DocumentUploadView.as_view(), name='document-upload'),

    # Fees
    path('fees/initiate/', FeePaymentView.as_view({'post': 'initiate_payment'}), name='initiate-fee-payment'),
    path('fees/confirm/', FeePaymentView.as_view({'post': 'confirm_payment'}), name='confirm-fee-payment'),

    # Exam Results
    path('exams/record/', ExamResultView.as_view(), name='record-exam-result'),

    # Parents
    path('parents/children/', ParentChildrenView.as_view(), name='parent-children'),
    path('parents/<uuid:parent_id>/children/', ParentChildrenView.as_view(), name='parent-specific-children'),
    path('parents/children/<uuid:student_id>/', ParentChildrenView.as_view(), name='parent-manage-child'),

    # Students
    path('students/<uuid:student_id>/exam-results/', StudentExamResultsView.as_view(), name='student-exam-results'),
    path('students/<uuid:student_id>/fee-records/', StudentFeeRecordsView.as_view(), name='student-fee-records'),
    path('students/<uuid:student_id>/initiate_payment/', InitiateFeesPaymentView.as_view(), name='initiate-payment'),

    # Teachers
    path('teachers/by-subject/<str:subject>/', TeachersBySubjectView.as_view(), name='teachers-by-subject'),
    path('teacher/profile_pic/', TeacherProfilePicView.as_view(), name='teacher-profile-pic'),

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

    # Messaging
    path('messages/', MessageViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='message-list'),
    path('messages/<uuid:pk>/', MessageViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='message-detail'),
    path('messages/chat/<uuid:user_id>/', MessageViewSet.as_view({
        'get': 'get_chat_history'
    }), name='chat-history'),

    # Leave Applications
    path('leave-applications/', LeaveApplicationViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='leave-application-list'),
    path('leave-applications/<uuid:pk>/', LeaveApplicationViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name='leave-application-detail'),

    # Teacher Schedule
    path('teacher/schedule/', TeacherScheduleView.as_view(), name='teacher-schedule'),

    # School Shop
    path('products/', ProductViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='product-list'),
    path('products/<uuid:pk>/', ProductViewSet.as_view({
        'get': 'retrieve',
        'put': 'update',
        'delete': 'destroy'
    }), name='product-detail'),

    # Include the router URLs
    path('', include(router.urls)),
] 