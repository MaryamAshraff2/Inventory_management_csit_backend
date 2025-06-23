from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Manually checks for and adds missing columns to the procurement table.'

    def handle(self, *args, **options):
        table_name = 'inventory_procurement'
        columns_to_check = {
            'order_number': 'VARCHAR(20)',
            'supplier': 'VARCHAR(255)',
            'document': 'VARCHAR(100)',
            'order_date': 'DATE',
        }

        with connection.cursor() as cursor:
            self.stdout.write(f"Checking schema for table '{table_name}'...")
            
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = %s
            """, [table_name])
            existing_columns = [row[0] for row in cursor.fetchall()]

            self.stdout.write(f"Found existing columns: {existing_columns}")

            for col_name, col_type in columns_to_check.items():
                if col_name not in existing_columns:
                    self.stdout.write(self.style.WARNING(f"Column '{col_name}' is missing. Attempting to add it..."))
                    try:
                        cursor.execute(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}")
                        self.stdout.write(self.style.SUCCESS(f"Successfully added column '{col_name}'."))
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"Failed to add column '{col_name}': {e}"))
                else:
                    self.stdout.write(f"Column '{col_name}' already exists. Skipping.")

        self.stdout.write(self.style.SUCCESS('Schema fix complete. Please restart your server and try the request again.')) 