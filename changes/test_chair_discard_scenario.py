#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from inventory.models import Item, Location, TotalInventory, DiscardedItem, User, Procurement, ProcurementItem
from django.db import transaction

def test_chair_discard_scenario():
    """Test the exact chair discard scenario described by the user"""
    
    print("=== Testing Chair Discard Scenario ===")
    print("Scenario: Lab 1 has 50 chairs, discard 10, then discard 10 more")
    print("Expected: Available 40, then 30; Discarded 10, then 20")
    
    # Get or create test data
    try:
        # Get Lab 1 location
        lab1 = Location.objects.get(name='Lab 1')
    except Location.DoesNotExist:
        print("❌ Lab 1 location not found. Please create it first.")
        return
    
    try:
        # Get or create Chair item
        chair, created = Item.objects.get_or_create(
            name='Chair',
            defaults={
                'category_id': 1,  # Assuming category 1 exists
                'total_quantity': 50,
                'available_quantity': 0,  # Will be set by TotalInventory
                'dead_stock_quantity': 0,
                'unit_price': 100.00
            }
        )
        if created:
            print(f"✅ Created Chair item")
        else:
            print(f"✅ Found existing Chair item")
    except Exception as e:
        print(f"❌ Error with Chair item: {e}")
        return
    
    try:
        # Get or create a user
        user = User.objects.first()
        if not user:
            print("❌ No users found. Please create a user first.")
            return
    except Exception as e:
        print(f"❌ Error getting user: {e}")
        return
    
    # Get or create procurement
    try:
        procurement, created = Procurement.objects.get_or_create(
            order_number='TEST-001',
            defaults={
                'supplier': 'Test Supplier',
                'order_date': '2024-01-01'
            }
        )
        if created:
            print(f"✅ Created test procurement")
        else:
            print(f"✅ Found existing test procurement")
    except Exception as e:
        print(f"❌ Error with procurement: {e}")
        return
    
    # Get or create procurement item
    try:
        proc_item, created = ProcurementItem.objects.get_or_create(
            procurement=procurement,
            item=chair,
            defaults={
                'quantity': 50,
                'unit_price': 100.00
            }
        )
        if created:
            print(f"✅ Created procurement item for 50 chairs")
        else:
            print(f"✅ Found existing procurement item")
    except Exception as e:
        print(f"❌ Error with procurement item: {e}")
        return
    
    # Get or create TotalInventory record
    try:
        total_inv, created = TotalInventory.objects.get_or_create(
            item=chair,
            procurement=procurement,
            location=lab1,
            defaults={
                'available_quantity': 50,
                'order_number': procurement.order_number,
                'supplier': procurement.supplier,
                'order_date': procurement.order_date,
                'unit_price': 100.00
            }
        )
        if created:
            print(f"✅ Created TotalInventory record: 50 chairs at Lab 1")
        else:
            # Update to ensure we have 50 chairs
            total_inv.available_quantity = 50
            total_inv.save()
            print(f"✅ Updated TotalInventory record: 50 chairs at Lab 1")
    except Exception as e:
        print(f"❌ Error with TotalInventory: {e}")
        return
    
    # Update chair totals
    chair.total_quantity = 50
    chair.dead_stock_quantity = 0
    chair.save()
    print(f"✅ Updated Chair totals: Total=50, Dead=0")
    
    print(f"\n=== Initial State ===")
    print(f"Lab 1 - Chair Available: {total_inv.available_quantity}")
    print(f"Chair Total Quantity: {chair.total_quantity}")
    print(f"Chair Dead Stock: {chair.dead_stock_quantity}")
    
    # First discard: 10 chairs
    print(f"\n=== First Discard: 10 chairs ===")
    try:
        with transaction.atomic():
            discard1 = DiscardedItem.objects.create(
                item=chair,
                location=lab1,
                quantity=10,
                reason='Damaged',
                discarded_by=user,
                notes='First discard test'
            )
            print(f"✅ First discard created: {discard1}")
            
            # Refresh data
            total_inv.refresh_from_db()
            chair.refresh_from_db()
            
            print(f"After first discard:")
            print(f"  Lab 1 - Chair Available: {total_inv.available_quantity} (Expected: 40)")
            print(f"  Chair Total Quantity: {chair.total_quantity} (Expected: 40)")
            print(f"  Chair Dead Stock: {chair.dead_stock_quantity} (Expected: 10)")
            
            # Verify first discard
            if total_inv.available_quantity == 40 and chair.dead_stock_quantity == 10:
                print(f"  ✅ First discard working correctly!")
            else:
                print(f"  ❌ First discard not working correctly!")
                
    except Exception as e:
        print(f"❌ First discard failed: {e}")
        return
    
    # Second discard: 10 more chairs
    print(f"\n=== Second Discard: 10 more chairs ===")
    try:
        with transaction.atomic():
            discard2 = DiscardedItem.objects.create(
                item=chair,
                location=lab1,
                quantity=10,
                reason='Damaged',
                discarded_by=user,
                notes='Second discard test'
            )
            print(f"✅ Second discard created: {discard2}")
            
            # Refresh data
            total_inv.refresh_from_db()
            chair.refresh_from_db()
            
            print(f"After second discard:")
            print(f"  Lab 1 - Chair Available: {total_inv.available_quantity} (Expected: 30)")
            print(f"  Chair Total Quantity: {chair.total_quantity} (Expected: 30)")
            print(f"  Chair Dead Stock: {chair.dead_stock_quantity} (Expected: 20)")
            
            # Verify second discard
            if total_inv.available_quantity == 30 and chair.dead_stock_quantity == 20:
                print(f"  ✅ Second discard working correctly!")
            else:
                print(f"  ❌ Second discard not working correctly!")
                
    except Exception as e:
        print(f"❌ Second discard failed: {e}")
        return
    
    # Check all discarded items for this item at this location
    print(f"\n=== Verification ===")
    discarded_items = DiscardedItem.objects.filter(item=chair, location=lab1)
    total_discarded = sum(d.quantity for d in discarded_items)
    print(f"Total discarded items for Chair at Lab 1: {total_discarded} (Expected: 20)")
    print(f"Available at Lab 1: {total_inv.available_quantity} (Expected: 30)")
    print(f"Dead stock total: {chair.dead_stock_quantity} (Expected: 20)")
    
    if total_discarded == 20 and total_inv.available_quantity == 30 and chair.dead_stock_quantity == 20:
        print(f"✅ SCENARIO COMPLETED SUCCESSFULLY!")
        print(f"✅ Available: 50 → 40 → 30")
        print(f"✅ Discarded: 0 → 10 → 20")
    else:
        print(f"❌ SCENARIO FAILED!")
        print(f"Expected: Available=30, Discarded=20")
        print(f"Actual: Available={total_inv.available_quantity}, Discarded={total_discarded}")

def test_api_response():
    """Test the API response for items at Lab 1"""
    print(f"\n=== Testing API Response ===")
    
    try:
        import requests
        response = requests.get(f"http://localhost:8000/inventory/items/items_at_location/?location_id={Location.objects.get(name='Lab 1').id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Response for Lab 1:")
            print(f"  Location: {data.get('location_name')}")
            for item in data.get('items', []):
                if item['item_name'] == 'Chair':
                    print(f"  Chair Available: {item['available_qty']}")
                    break
        else:
            print(f"❌ API Error: {response.status_code}")
    except Exception as e:
        print(f"❌ API Test failed: {e}")

if __name__ == "__main__":
    test_chair_discard_scenario()
    test_api_response() 