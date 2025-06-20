from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from admin_interface.models import SchoolEvent


class Command(BaseCommand):
    help = 'Clean up past events that have ended more than specified days ago'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days after event end to keep the event (default: 30)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting'
        )

    def handle(self, *args, **options):
        days_to_keep = options['days']
        dry_run = options['dry_run']
        
        # Calculate cutoff date
        cutoff_date = timezone.now() - timedelta(days=days_to_keep)
        
        # Find events that ended before the cutoff date
        past_events = SchoolEvent.objects.filter(end_date__lt=cutoff_date)
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f'DRY RUN: Would delete {past_events.count()} events that ended before {cutoff_date.strftime("%Y-%m-%d %H:%M:%S")}'
                )
            )
            
            if past_events.exists():
                self.stdout.write(self.style.WARNING('Events that would be deleted:'))
                for event in past_events:
                    self.stdout.write(
                        f'  - {event.title} (ended: {event.end_date.strftime("%Y-%m-%d %H:%M:%S")})'
                    )
        else:
            deleted_count = past_events.count()
            if deleted_count > 0:
                # Log the events being deleted
                self.stdout.write(
                    self.style.WARNING(f'Deleting {deleted_count} past events:')
                )
                for event in past_events:
                    self.stdout.write(
                        f'  - {event.title} (ended: {event.end_date.strftime("%Y-%m-%d %H:%M:%S")})'
                    )
                
                # Delete the events
                past_events.delete()
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully deleted {deleted_count} past events that ended before {cutoff_date.strftime("%Y-%m-%d %H:%M:%S")}'
                    )
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS('No past events found to delete.')
                ) 