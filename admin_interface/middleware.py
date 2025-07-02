from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
import json
from django.http import JsonResponse
from django.conf import settings
import logging
import traceback

logger = logging.getLogger(__name__)

class WebSocketJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Get the token from query string
        query_string = scope.get('query_string', b'').decode()
        token = None
        
        if 'token=' in query_string:
            for param in query_string.split('&'):
                if param.startswith('token='):
                    token = param.split('=')[1]
                    break
        
        if token:
            # Add authentication logic here if needed
            pass
        else:
            scope['user'] = AnonymousUser()
        
        # For now, just allow all WebSocket connections
        scope['user'] = AnonymousUser()
        return await super().__call__(scope, receive, send)

class APIErrorMiddleware:
    """
    Middleware to ensure API endpoints return JSON responses even during 500 errors
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """
        Handle exceptions for API endpoints and return JSON error responses
        """
        # Only handle API requests
        if request.path.startswith('/api/'):
            logger.error(f"API Exception on {request.path}: {str(exception)}", exc_info=True)
            
            error_data = {
                "status": "error",
                "message": "An internal server error occurred. Please try again later.",
                "path": request.path,
                "method": request.method
            }
            
            # Add debug info if DEBUG is enabled
            if settings.DEBUG:
                error_data.update({
                    "debug_info": str(exception),
                    "traceback": traceback.format_exc().split('\n')[-10:]  # Last 10 lines
                })
            
            return JsonResponse(error_data, status=500)
        
        # For non-API requests, let Django handle normally
        return None 