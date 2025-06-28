#!/usr/bin/env python
import os
import django
from django.db.models import Sum

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Item, Location, InventoryByLocation, DiscardedItem

print("=== InventoryByLocation System Test ===")

# Get or create test item and locations
test_item, _ = Item.objects.get_or_create(name='Test Widget', unit_price=10.0, category_id=1)
main_store = Location.get_main_store()
location_a, _ = Location.objects.get_or_create(name='Test Location A')

# 1. Simulate procurement: add 100 units to Main Store
main_inv = InventoryByLocation.get_main_store_inventory(test_item)
main_inv.quantity = 100
main_inv.save()
print(f"\n[Procurement] Main Store now has: {main_inv.quantity} units of {test_item.name}")

# 2. Move 30 units from Main Store to Location A
move_qty = 30
main_inv.remove_quantity(move_qty)
loc_a_inv = InventoryByLocation.get_or_create_inventory(test_item, location_a)
loc_a_inv.add_quantity(move_qty)
print(f"\n[Stock Movement] Moved {move_qty} units to {location_a.name}")

# 3. Discard 5 units from Location A
discard_qty = 5
loc_a_inv.remove_quantity(discard_qty)
DiscardedItem.objects.create(item=test_item, location=location_a, quantity=discard_qty, reason='Damaged')
print(f"\n[Discard] Discarded {discard_qty} units from {location_a.name}")

# Print InventoryByLocation for all locations
print("\n[InventoryByLocation] Current quantities:")
for inv in InventoryByLocation.objects.filter(item=test_item):
    print(f"  {inv.location.name}: {inv.quantity} units")

# Print total non-discarded stock
total_stock = InventoryByLocation.objects.filter(item=test_item).aggregate(total=Sum('quantity'))['total'] or 0
print(f"\n[Total non-discarded stock]: {total_stock} units")

# Print dead stock
dead_stock = DiscardedItem.objects.filter(item=test_item).aggregate(total=Sum('quantity'))['total'] or 0
print(f"[Dead stock]: {dead_stock} units")

print("\n=== Test Complete ===") 