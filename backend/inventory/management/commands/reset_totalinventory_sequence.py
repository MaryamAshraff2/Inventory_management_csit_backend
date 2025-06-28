from django.core.management.base import BaseCommand
from django.db import connection
from inventory.models import TotalInventory

class Command(BaseCommand):
    help = 'Resets the auto-increment sequence for TotalInventory table'

    def handle(self, *args, **options):
        # Get the sequence name
        sequence_name = 'inventory_totalinventory_id_seq'
        
        with connection.cursor() as cursor:
            # Reset the sequence to 1
            cursor.execute(f"ALTER SEQUENCE {sequence_name} RESTART WITH 1;")
            
        self.stdout.write(
            self.style.SUCCESS(f'Successfully reset sequence {sequence_name} to 1')
        ) 