from django.core.management.base import BaseCommand
from inventory.models import Category, Item

class Command(BaseCommand):
    help = 'Recalculate and update item_count for all categories.'

    def handle(self, *args, **options):
        for category in Category.objects.all():
            count = Item.objects.filter(category=category).count()
            category.item_count = count
            category.save(update_fields=["item_count"])
            self.stdout.write(self.style.SUCCESS(f'Category "{category.name}" updated to item_count={count}'))
        self.stdout.write(self.style.SUCCESS('All category item counts recalculated.')) 