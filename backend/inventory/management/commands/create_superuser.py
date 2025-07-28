from django.core.management.base import BaseCommand
from inventory.models import User

class Command(BaseCommand):
    help = 'Create the initial superuser with template credentials'

    def handle(self, *args, **options):
        # Check if superuser already exists
        if User.objects.filter(role='superuser').exists():
            self.stdout.write(
                self.style.WARNING('Superuser already exists!')
            )
            return

        # Create superuser (no password field in database)
        superuser = User.objects.create(
            name='superuser',  # Use 'name' field since that's what exists in database
            email='superuser@neduet.edu.pk',
            role='superuser'
        )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully created superuser: {superuser.name}')
        )
        self.stdout.write(
            self.style.SUCCESS('Username: superuser')
        )
        self.stdout.write(
            self.style.SUCCESS('No password required - just enter the username')
        ) 