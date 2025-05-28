from django.core.management.base import BaseCommand
from django.utils import timezone
from admin_interface.models import SchoolEvent
from django.db.models import Q

class Command(BaseCommand):
    help = 'Deletes events that have ended'

    def handle(self, *args, **options):
        # Get current time
        now = timezone.now()
        
        # Find all events that have ended
        past_events = SchoolEvent.objects.filter(end_date__lt=now)
        
        # Count events to be deleted
        count = past_events.count()
        
        # Delete the events
        past_events.delete()
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully deleted {count} past events')
        ) 