#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Procurement, Item, TotalInventory, ProcurementItem

print("=== Database State Check ===")
print(f"Total Procurements: {Procurement.objects.count()}")
print(f"Total Items: {Item.objects.count()}")
print(f"Total TotalInventory records: {TotalInventory.objects.count()}")

print("\n=== Procurements ===")
for proc in Procurement.objects.all():
    print(f"Procurement {proc.id}: {proc.order_number} - {proc.items.count()} items")
    for item in proc.items.all():
        print(f"  - {item.item.name}: {item.quantity} units @ ${item.unit_price}")

print("\n=== TotalInventory Records ===")
for ti in TotalInventory.objects.select_related('item', 'location', 'procurement').all():
    print(f"ID {ti.id}: {ti.item.name} - {ti.available_quantity} units at {ti.location.name} (Order: {ti.order_number})")

print("\n=== Items with their total quantities ===")
for item in Item.objects.all():
    print(f"{item.name}: Total={item.total_quantity}, Available={item.available_quantity}, Dead={item.dead_stock_quantity}") 