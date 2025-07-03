#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from inventory.models import Item, Location, TotalInventory, DiscardedItem, User
from django.db import transaction

def test_location_based_discard():
    """Test the new location-based discard functionality without procurement dependency"""
    
    print("=== Testing Location-Based Discard Functionality ===")
    
    # Get test data
    items = Item.objects.all()[:1]
    locations = Location.objects.all()[:2]
    users = User.objects.all()[:1]
    
    if not items or not locations or not users:
        print("Not enough test data available")
        return
    
    item = items[0]
    location1 = locations[0]
    location2 = locations[1]
    user = users[0]
    
    print(f"\nTesting with:")
    print(f"  Item: {item.name}")
    print(f"  Location 1: {location1.name}")
    print(f"  Location 2: {location2.name}")
    print(f"  User: {user.name}")
    
    # Check current state
    print(f"\nCurrent state:")
    print(f"  Item.total_quantity: {item.total_quantity}")
    print(f"  Item.available_quantity: {item.available_quantity}")
    print(f"  Item.dead_stock_quantity: {item.dead_stock_quantity}")
    
    # Check TotalInventory at each location
    ti_location1 = TotalInventory.objects.filter(item=item, location=location1)
    ti_location2 = TotalInventory.objects.filter(item=item, location=location2)
    
    print(f"  TotalInventory at {location1.name}: {sum(ti.available_quantity for ti in ti_location1)}")
    print(f"  TotalInventory at {location2.name}: {sum(ti.available_quantity for ti in ti_location2)}")
    
    # Test the new API endpoint
    print(f"\n=== Testing API Endpoint ===")
    try:
        response = requests.get(f"http://localhost:8000/inventory/items/items_at_location/?location_id={location1.id}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ API Response for {location1.name}:")
            print(f"  Location: {data.get('location_name')}")
            print(f"  Items found: {len(data.get('items', []))}")
            for item_data in data.get('items', []):
                print(f"    - {item_data['item_name']}: {item_data['available_qty']} units")
        else:
            print(f"❌ API Error: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ API Test failed: {e}")
    
    # Try to create a discard at location1
    print(f"\n=== Testing Discard Creation ===")
    try:
        with transaction.atomic():
            discard = DiscardedItem.objects.create(
                item=item,
                location=location1,
                quantity=5,
                reason='Damaged',
                discarded_by=user,
                notes='Test location-based discard'
            )
            print(f"✅ Discard created successfully: {discard}")
            
            # Check updated state
            item.refresh_from_db()
            print(f"\nUpdated state after discard at {location1.name}:")
            print(f"  Item.total_quantity: {item.total_quantity}")
            print(f"  Item.available_quantity: {item.available_quantity}")
            print(f"  Item.dead_stock_quantity: {item.dead_stock_quantity}")
            
            # Check TotalInventory at each location
            ti_location1_after = TotalInventory.objects.filter(item=item, location=location1)
            ti_location2_after = TotalInventory.objects.filter(item=item, location=location2)
            
            print(f"  TotalInventory at {location1.name}: {sum(ti.available_quantity for ti in ti_location1_after)}")
            print(f"  TotalInventory at {location2.name}: {sum(ti.available_quantity for ti in ti_location2_after)}")
            
            # Verify that only location1 was affected
            location1_before = sum(ti.available_quantity for ti in ti_location1)
            location1_after = sum(ti.available_quantity for ti in ti_location1_after)
            location2_before = sum(ti.available_quantity for ti in ti_location2)
            location2_after = sum(ti.available_quantity for ti in ti_location2_after)
            
            print(f"\nVerification:")
            print(f"  {location1.name} before: {location1_before}, after: {location1_after}, difference: {location1_before - location1_after}")
            print(f"  {location2.name} before: {location2_before}, after: {location2_after}, difference: {location2_before - location2_after}")
            
            if location1_before - location1_after == 5 and location2_before == location2_after:
                print("  ✅ Location-based discard working correctly!")
            else:
                print("  ❌ Location-based discard not working correctly!")
                
    except Exception as e:
        print(f"\n❌ Discard failed: {e}")
        
        # Check what's in TotalInventory for this item/location
        total_inv = TotalInventory.objects.filter(item=item, location=location1)
        print(f"\nTotalInventory for {item.name} at {location1.name}:")
        for ti in total_inv:
            print(f"  - ID {ti.id}: {ti.available_quantity} units (Order: {ti.order_number})")

def test_api_endpoints():
    """Test the new API endpoints"""
    print("\n=== Testing API Endpoints ===")
    
    # Test items at location endpoint
    try:
        response = requests.get("http://localhost:8000/inventory/items/items_at_location/?location_id=1")
        print(f"Items at location endpoint: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"  Location: {data.get('location_name')}")
            print(f"  Items: {len(data.get('items', []))}")
    except Exception as e:
        print(f"API test failed: {e}")

if __name__ == "__main__":
    test_location_based_discard()
    test_api_endpoints() 