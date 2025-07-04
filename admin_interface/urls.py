from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherViewSet, StudentViewSet, DocumentUploadView,
    ExamResultView, NotificationView,
    RegisterView, LoginView, LogoutView,
    ParentChildrenView, StudentExamResultsView,
    TeachersBySubjectView,
    SchoolStatisticsView, AdminViewSet,
    MessageViewSet, LeaveApplicationViewSet,
    ProductViewSet, TeacherScheduleView, TeacherProfilePicView,
    TeacherExamViewSet, PasswordResetRequestView,
    PasswordResetConfirmView, TeacherPasswordResetConfirmView, TeacherParentAssociationViewSet,
    SchoolViewSet, ParentViewSet, SchoolEventViewSet, SuperUserViewSet,
    CurrentSchoolView, DirectMessagingView, AttendanceViewSet,
    OrderViewSet, ComprehensiveStudentDetailView
)

router = DefaultRouter()
router.register(r'superuser', SuperUserViewSet, basename='superuser')
router.register(r'admin', AdminViewSet, basename='admin')
router.register(r'schools', SchoolViewSet, basename='school')
router.register(r'teachers', TeacherViewSet)
router.register(r'students', StudentViewSet, basename='student')
router.register(r'parents', ParentViewSet, basename='parent')
router.register(r'notifications', NotificationView, basename='notification')
router.register(r'teacher/exams', TeacherExamViewSet, basename='teacher-exams')
router.register(r'teacher-parent-associations', TeacherParentAssociationViewSet, basename='teacher-parent-association')
router.register(r'leave-applications', LeaveApplicationViewSet, basename='leave-application')
router.register(r'school-events', SchoolEventViewSet, basename='school-event')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    # Authentication
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/password/reset/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    path('auth/password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    path('auth/password/reset/teacher/confirm/', TeacherPasswordResetConfirmView.as_view(), name='teacher-password-reset-confirm'),

    # School
    path('current-school/', CurrentSchoolView.as_view(), name='current-school'),
    path('school/statistics/', SchoolStatisticsView.as_view(), name='school-statistics'),

    # Documents
    path('documents/upload/', DocumentUploadView.as_view(), name='document-upload'),

    # Exam Results
    path('exams/record/', ExamResultView.as_view(), name='record-exam-result'),
    path('exam-results/', ExamResultView.as_view(), name='exam-results'),

    # Parents
    path('parents/me/', ParentViewSet.as_view({'get': 'me'}), name='parent-me'),
    path('parents/available_teachers/', ParentViewSet.as_view({'get': 'available_teachers'}), name='parent-available-teachers'),
    path('parents/available_admins/', ParentViewSet.as_view({'get': 'available_admins'}), name='parent-available-admins'),
    path('parents/exam_pdfs/', ParentViewSet.as_view({'get': 'exam_pdfs'}), name='parent-exam-pdfs'),
    path('parents/exam_results/', ParentViewSet.as_view({'get': 'exam_results'}), name='parent-exam-results'),
    path('parents/attendance_summary/', ParentViewSet.as_view({'get': 'attendance_summary'}), name='parent-attendance-summary'),
    path('parents/children/', ParentChildrenView.as_view(), name='parent-children'),
    path('parents/<uuid:parent_id>/children/', ParentChildrenView.as_view(), name='parent-specific-children'),
    path('parents/children/<uuid:student_id>/', ParentChildrenView.as_view(), name='parent-manage-child'),

    # Students
    path('students/<uuid:student_id>/exam-results/', StudentExamResultsView.as_view(), name='student-exam-results'),
    path('students/<uuid:student_id>/', ComprehensiveStudentDetailView.as_view(), name='comprehensive-student-detail'),

    # Teachers
    path('teachers/by-subject/<str:subject>/', TeachersBySubjectView.as_view(), name='teachers-by-subject'),
    path('teacher/profile_pic/', TeacherProfilePicView.as_view(), name='teacher-profile-pic'),
    path('teacher/schedule/', TeacherScheduleView.as_view(), name='teacher-schedule'),
    # GET /api/teachers/my_class_students/ - Get students in teacher's assigned class

    # Direct Messaging (Simplified)
    path('messaging/contacts/', DirectMessagingView.as_view(), name='messaging-contacts'),
    path('messaging/send/', DirectMessagingView.as_view(), name='send-direct-message'),

    # Messages
    path('messages/resolve_user_id/', MessageViewSet.as_view({
        'post': 'resolve_user_id'
    }), name='resolve-user-id'),
    
    path('messages/chat/<uuid:user_id>/', MessageViewSet.as_view({
        'get': 'get_chat_history'
    }), name='chat-history'),
    
    path('messages/chat/', MessageViewSet.as_view({
        'get': 'get_chat_history'
    }), name='chat-history-query'),
    
    path('messages/direct_message/', MessageViewSet.as_view({
        'post': 'direct_message'
    }), name='direct-message'),
    
    path('messages/filtered_chat_contacts/', MessageViewSet.as_view({
        'get': 'filtered_chat_contacts'
    }), name='filtered-chat-contacts'),
    
    path('messages/', MessageViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='message-list'),
    
    path('messages/<uuid:pk>/', MessageViewSet.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='message-detail'),

    # Notifications registered via router

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