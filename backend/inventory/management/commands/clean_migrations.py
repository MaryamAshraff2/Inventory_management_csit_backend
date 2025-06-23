from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Manually deletes specific migration records from the django_migrations table.'

    def handle(self, *args, **options):
        migrations_to_delete = [
            '0005_procurement_document_procurement_order_date_and_more',
            '0006_populate_order_number',
            '0007_alter_procurement_order_number',
        ]
        
        with connection.cursor() as cursor:
            for migration_name in migrations_to_delete:
                self.stdout.write(f"Deleting migration record for inventory.{migration_name}...")
                cursor.execute(
                    "DELETE FROM django_migrations WHERE app = 'inventory' AND name = %s",
                    [migration_name]
                )
                if cursor.rowcount > 0:
                    self.stdout.write(self.style.SUCCESS(f"Successfully deleted record for {migration_name}."))
                else:
                    self.stdout.write(self.style.WARNING(f"No record found for {migration_name}, skipping."))
        
        self.stdout.write(self.style.SUCCESS('Finished cleaning migration history.')) 