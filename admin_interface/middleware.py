from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser

class WebSocketJWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        # Allow all connections by setting a default anonymous user
        scope['user'] = AnonymousUser()
        return await super().__call__(scope, receive, send) 