#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from inventory.models import Procurement, Location, TotalInventory, Item, User, DiscardedItem
from django.db import transaction

def test_discard_fix():
    """Test the fixed discard item functionality"""
    
    print("=== Testing Fixed Discard Item Logic ===")
    
    # Get existing data
    try:
        item = Item.objects.first()
        if not item:
            print("No items found in database")
            return
            
        user = User.objects.first()
        if not user:
            print("No users found in database")
            return
            
        # Get the procurement that actually has inventory
        existing_inventory = TotalInventory.objects.filter(item=item).first()
        if not existing_inventory:
            print("No inventory records found for this item")
            return
            
        procurement = existing_inventory.procurement
        location = existing_inventory.location
            
    except Exception as e:
        print(f"Error setting up test data: {e}")
        return
    
    print(f"\nTest Setup:")
    print(f"Item: {item.name}")
    print(f"Procurement: {procurement.order_number} (ID: {procurement.id})")
    print(f"Location: {location.name}")
    print(f"Current available quantity: {existing_inventory.available_quantity}")
    
    # Store original values
    original_available_qty = existing_inventory.available_quantity
    original_total_qty = item.total_quantity
    original_dead_stock = item.dead_stock_quantity
    
    # Test the discard functionality
    print(f"\n=== Testing Discard Logic ===")
    
    try:
        # Create a discarded item using the fixed serializer logic
        from inventory.serializers import DiscardedItemSerializer
        
        discard_quantity = 5  # Small quantity for testing
        
        # Check if we have enough quantity
        if existing_inventory.available_quantity < discard_quantity:
            print(f"Not enough quantity to test. Available: {existing_inventory.available_quantity}")
            return
        
        # Simulate the API call
        discard_data = {
            'item_id': item.id,
            'location_id': location.id,
            'procurement_id': procurement.id,
            'quantity': discard_quantity,
            'reason': 'Damaged',
            'discarded_by_id': user.id,
            'notes': 'Test discard fix'
        }
        
        # Use the serializer to create the discarded item
        serializer = DiscardedItemSerializer(data=discard_data)
        if serializer.is_valid():
            discarded_item = serializer.save()
            print(f"✅ Successfully created discarded item: {discarded_item}")
        else:
            print(f"❌ Serializer validation failed: {serializer.errors}")
            return
        
        # Refresh data from database
        existing_inventory.refresh_from_db()
        item.refresh_from_db()
        
        print(f"\nResults after discard:")
        print(f"  Available quantity: {existing_inventory.available_quantity} (was {original_available_qty})")
        print(f"  Item total quantity: {item.total_quantity} (was {original_total_qty})")
        print(f"  Item dead stock: {item.dead_stock_quantity} (was {original_dead_stock})")
        
        # Verify the fix worked
        expected_available = original_available_qty - discard_quantity
        expected_total = original_total_qty - discard_quantity
        expected_dead_stock = original_dead_stock + discard_quantity
        
        if existing_inventory.available_quantity == expected_available:
            print("✅ SUCCESS: Available quantity updated correctly")
        else:
            print(f"❌ FAILED: Available quantity should be {expected_available}, got {existing_inventory.available_quantity}")
            
        if item.total_quantity == expected_total:
            print("✅ SUCCESS: Item total quantity updated correctly")
        else:
            print(f"❌ FAILED: Item total quantity should be {expected_total}, got {item.total_quantity}")
            
        if item.dead_stock_quantity == expected_dead_stock:
            print("✅ SUCCESS: Item dead stock updated correctly")
        else:
            print(f"❌ FAILED: Item dead stock should be {expected_dead_stock}, got {item.dead_stock_quantity}")
        
        # Test that only the specific location was affected
        other_inventory = TotalInventory.objects.filter(item=item).exclude(id=existing_inventory.id)
        if other_inventory.exists():
            for other in other_inventory:
                other.refresh_from_db()
                print(f"  Other location {other.location.name}: {other.available_quantity} (unchanged)")
        
        print(f"\n✅ Test completed successfully!")
        
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()

def test_procurement_requirement():
    """Test that procurement_id is now required"""
    
    print(f"\n=== Testing Procurement ID Requirement ===")
    
    try:
        from inventory.serializers import DiscardedItemSerializer
        
        # Test without procurement_id (should fail)
        discard_data_without_procurement = {
            'item_id': Item.objects.first().id,
            'location_id': Location.objects.first().id,
            'quantity': 1,
            'reason': 'Damaged',
            'discarded_by_id': User.objects.first().id,
            'notes': 'Test without procurement'
        }
        
        serializer = DiscardedItemSerializer(data=discard_data_without_procurement)
        if not serializer.is_valid():
            print("✅ SUCCESS: Discard without procurement_id correctly rejected")
            print(f"   Error: {serializer.errors}")
        else:
            print("❌ FAILED: Discard without procurement_id should have been rejected")
            
        # Test with procurement_id (should work)
        existing_inventory = TotalInventory.objects.first()
        if existing_inventory:
            discard_data_with_procurement = {
                'item_id': existing_inventory.item.id,
                'location_id': existing_inventory.location.id,
                'procurement_id': existing_inventory.procurement.id,
                'quantity': 1,
                'reason': 'Damaged',
                'discarded_by_id': User.objects.first().id,
                'notes': 'Test with procurement'
            }
            
            serializer2 = DiscardedItemSerializer(data=discard_data_with_procurement)
            if serializer2.is_valid():
                print("✅ SUCCESS: Discard with procurement_id is valid")
            else:
                print(f"❌ FAILED: Discard with procurement_id should be valid: {serializer2.errors}")
            
    except Exception as e:
        print(f"❌ Test failed with error: {e}")

if __name__ == "__main__":
    test_discard_fix()
    test_procurement_requirement()
    print(f"\n=== Test Complete ===") 