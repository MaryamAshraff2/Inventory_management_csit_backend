from django.core.management.base import BaseCommand
from inventory.models import Department, Location, User

class Command(BaseCommand):
    help = 'Set up initial data for the inventory system'

    def handle(self, *args, **options):
        # Create main department if it doesn't exist
        main_dept, created = Department.objects.get_or_create(
            name='Main Department',
            defaults={
                'email': 'main@neduet.edu.pk',
                'user_count': 0
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created main department: {main_dept.name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Main department already exists: {main_dept.name}')
            )

        # Create main store location if it doesn't exist
        main_store, created = Location.objects.get_or_create(
            name='Main Store',
            defaults={
                'department': main_dept,
                'room_number': '001',
                'description': 'Main inventory storage location'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Created main store location: {main_store.name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Main store location already exists: {main_store.name}')
            )

        # Check if superuser exists
        if User.objects.filter(role='superuser').exists():
            self.stdout.write(
                self.style.SUCCESS('Superuser already exists')
            )
        else:
            self.stdout.write(
                self.style.WARNING('No superuser found. Run create_superuser command first.')
            )

        self.stdout.write(
            self.style.SUCCESS('Initial data setup completed!')
        ) 