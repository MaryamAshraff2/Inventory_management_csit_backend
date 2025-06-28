#!/usr/bin/env python
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Item, Location, TotalInventory, StockMovement, User

def test_stock_movement_logic():
    """Test the stock movement logic and available quantity calculations"""
    
    print("=== Testing Stock Movement Logic ===")
    
    # Get some test data
    items = Item.objects.all()[:2]
    locations = Location.objects.all()[:3]
    users = User.objects.all()[:1]
    
    if not items or not locations or not users:
        print("Not enough test data available")
        return
    
    item = items[0]
    from_location = locations[0]
    to_location = locations[1]
    user = users[0]
    
    print(f"\nTesting with:")
    print(f"  Item: {item.name}")
    print(f"  From Location: {from_location.name}")
    print(f"  To Location: {to_location.name}")
    print(f"  User: {user.name}")
    
    # Check current state
    print(f"\nCurrent state:")
    print(f"  Item.available_quantity: {item.available_quantity}")
    
    if from_location.name == 'Main Store':
        available_qty = item.available_quantity
        print(f"  Available at {from_location.name}: {available_qty}")
    else:
        total_inv = TotalInventory.objects.filter(item=item, location=from_location)
        available_qty = sum(ti.available_quantity for ti in total_inv)
        print(f"  Available at {from_location.name}: {available_qty}")
        print(f"  TotalInventory records: {list(total_inv.values('id', 'available_quantity'))}")
    
    # Try to create a stock movement
    try:
        movement = StockMovement.objects.create(
            item=item,
            from_location=from_location,
            to_location=to_location,
            quantity=5,  # Try to move 5 units
            received_by=user
        )
        print(f"\n✅ Stock movement created successfully: {movement}")
        
        # Check updated state
        item.refresh_from_db()
        print(f"\nUpdated state:")
        print(f"  Item.available_quantity: {item.available_quantity}")
        
        if to_location.name == 'Main Store':
            total_inv = TotalInventory.objects.filter(item=item, location=to_location)
            available_qty = sum(ti.available_quantity for ti in total_inv)
            print(f"  Available at {to_location.name}: {available_qty}")
        
    except Exception as e:
        print(f"\n❌ Stock movement failed: {e}")
        
        # Check what's in TotalInventory for this item/location
        total_inv = TotalInventory.objects.filter(item=item, location=from_location)
        print(f"\nTotalInventory for {item.name} at {from_location.name}:")
        for ti in total_inv:
            print(f"  - ID {ti.id}: {ti.available_quantity} units (Order: {ti.order_number})")

if __name__ == "__main__":
    test_stock_movement_logic() 