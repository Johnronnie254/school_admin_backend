import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message, User
from .permissions import IsTeacher, IsParent

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        # Check if user is authenticated
        if self.user.is_anonymous:
            await self.close()
            return
            
        # Check if user is a teacher or parent
        if not (self.user.role in ['teacher', 'parent']):
            await self.close()
            return

        self.room_name = f"user_{self.user.id}"
        await self.channel_layer.group_add(self.room_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_name'):
            await self.channel_layer.group_discard(self.room_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message = data["message"]
            receiver_id = data["receiver_id"]

            # Validate receiver exists and is allowed to receive messages
            if not await self.can_message_user(receiver_id):
                await self.send(text_data=json.dumps({
                    "error": "Invalid receiver or not allowed to message this user"
                }))
                return

            # Save message to database
            await self.save_message(message, receiver_id)

            # Send message to receiver's room
            await self.channel_layer.group_send(
                f"user_{receiver_id}",
                {
                    "type": "chat_message",
                    "message": message,
                    "sender_id": str(self.user.id)
                }
            )
        except Exception as e:
            await self.send(text_data=json.dumps({
                "error": str(e)
            }))

    async def chat_message(self, event):
        """Handle incoming messages"""
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender_id": event["sender_id"]
        }))

    @database_sync_to_async
    def save_message(self, content, receiver_id):
        receiver = User.objects.get(id=receiver_id)
        return Message.objects.create(
            sender=self.user,
            receiver=receiver,
            content=content
        )

    @database_sync_to_async
    def can_message_user(self, receiver_id):
        try:
            receiver = User.objects.get(id=receiver_id)
            # Teachers can message parents and vice versa
            if self.user.role == 'teacher':
                return receiver.role == 'parent'
            elif self.user.role == 'parent':
                return receiver.role == 'teacher'
            return False
        except User.DoesNotExist:
            return False 