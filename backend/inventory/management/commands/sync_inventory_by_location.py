from django.core.management.base import BaseCommand
from inventory.models import Item, Location, TotalInventory, InventoryByLocation, StockMovement, DiscardedItem
from django.db import transaction


class Command(BaseCommand):
    help = 'Sync InventoryByLocation with existing TotalInventory and Item data'

    def handle(self, *args, **options):
        self.stdout.write("Starting InventoryByLocation sync...")
        
        with transaction.atomic():
            # Clear existing InventoryByLocation records
            InventoryByLocation.objects.all().delete()
            self.stdout.write("Cleared existing InventoryByLocation records")
            
            # Get Main Store location
            main_store = Location.get_main_store()
            
            # Process each item
            for item in Item.objects.all():
                self.stdout.write(f"Processing item: {item.name}")
                
                # For Main Store, use Item.available_quantity
                if item.available_quantity > 0:
                    InventoryByLocation.objects.create(
                        item=item,
                        location=main_store,
                        available_quantity=item.available_quantity
                    )
                    self.stdout.write(f"  - Main Store: {item.available_quantity}")
                
                # For other locations, aggregate from TotalInventory
                location_totals = {}
                for ti in TotalInventory.objects.filter(item=item, available_quantity__gt=0):
                    if ti.location != main_store:  # Skip Main Store as it's handled above
                        if ti.location_id not in location_totals:
                            location_totals[ti.location_id] = 0
                        location_totals[ti.location_id] += ti.available_quantity
                
                # Create InventoryByLocation records for other locations
                for location_id, total_qty in location_totals.items():
                    location = Location.objects.get(id=location_id)
                    InventoryByLocation.objects.create(
                        item=item,
                        location=location,
                        available_quantity=total_qty
                    )
                    self.stdout.write(f"  - {location.name}: {total_qty}")
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully synced InventoryByLocation. "
                    f"Created {InventoryByLocation.objects.count()} records."
                )
            ) 