from django.apps import AppConfig


class AdminInterfaceConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'admin_interface'
    
    def ready(self):
        # Import the management command and run it during startup
        import os
        from django.core.management import call_command
        
        # We need to check if we're running the main Django process
        # This prevents the command from running twice in development
        if os.environ.get('RUN_MAIN', None) != 'true':
            call_command('ensure_superuser')
