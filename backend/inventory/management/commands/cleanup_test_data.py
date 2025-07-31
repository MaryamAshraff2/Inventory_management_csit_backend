from django.core.management.base import BaseCommand
from inventory.models import Department

class Command(BaseCommand):
    help = 'Clean up test departments and data'

    def handle(self, *args, **options):
        # Find and delete test departments
        test_departments = Department.objects.filter(
            name__icontains='test'
        )
        
        count = 0
        for dept in test_departments:
            self.stdout.write(f'Deleting test department: {dept.name} (ID: {dept.id})')
            dept.delete()
            count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'Deleted {count} test departments')
        )
        
        # Show remaining departments
        active_depts = Department.get_active_departments()
        self.stdout.write(f'\nRemaining active departments: {active_depts.count()}')
        for dept in active_depts:
            self.stdout.write(f'- {dept.name} (ID: {dept.id})') 