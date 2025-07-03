from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from admin_interface.views import api_root, PasswordResetRedirectView

urlpatterns = [
    path('', api_root, name='api-root'),
    path('admin/', admin.site.urls),
    path('api/', include('admin_interface.urls')),
    path('app/reset-password/<uuid:token>/', PasswordResetRedirectView.as_view(), name='password-reset-redirect'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
