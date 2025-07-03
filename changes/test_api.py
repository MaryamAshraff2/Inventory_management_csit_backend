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

from inventory.models import Item, Location, TotalInventory

def test_item_availability_api():
    """Test the item-availability API endpoint"""
    
    # Get some test data
    items = Item.objects.all()[:3]
    locations = Location.objects.all()[:3]
    
    print("=== Testing Item Availability API ===")
    
    for item in items:
        for location in locations:
            print(f"\nTesting item: {item.name} at location: {location.name}")
            
            # Call the API
            url = "http://localhost:8000/inventory/api/item-availability/"
            params = {
                'item_id': item.id,
                'location_id': location.id
            }
            
            try:
                response = requests.get(url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    available_qty = data.get('available_quantity', 0)
                    print(f"  API Response: {available_qty} units available")
                    
                    # Verify against database
                    if location.name == 'Main Store':
                        expected = item.available_quantity
                        print(f"  Expected (Item.available_quantity): {expected}")
                    else:
                        total_inv = TotalInventory.objects.filter(item=item, location=location)
                        expected = sum(ti.available_quantity for ti in total_inv)
                        print(f"  Expected (TotalInventory sum): {expected}")
                    
                    if available_qty == expected:
                        print(f"  ✅ MATCH")
                    else:
                        print(f"  ❌ MISMATCH")
                        
                else:
                    print(f"  ❌ API Error: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"  ❌ Exception: {e}")

# Test the new API endpoint
def test_locations_by_procurement():
    base_url = "http://localhost:8000/inventory"
    
    # First, get all procurements
    print("Fetching procurements...")
    response = requests.get(f"{base_url}/procurements/")
    if response.status_code == 200:
        procurements = response.json()
        print(f"Found {len(procurements)} procurements")
        
        if procurements:
            # Test with the first procurement
            first_procurement = procurements[0]
            procurement_id = first_procurement['id']
            print(f"\nTesting with procurement: {first_procurement['order_number']} (ID: {procurement_id})")
            
            # Test the new endpoint
            response = requests.get(f"{base_url}/locations/by_procurement/?procurement_id={procurement_id}")
            if response.status_code == 200:
                locations = response.json()
                print(f"Found {len(locations)} locations for this procurement:")
                for loc in locations:
                    print(f"  - {loc['name']}")
            else:
                print(f"Error: {response.status_code} - {response.text}")
        else:
            print("No procurements found to test with")
    else:
        print(f"Error fetching procurements: {response.status_code}")

if __name__ == "__main__":
    test_item_availability_api()
    test_locations_by_procurement() 