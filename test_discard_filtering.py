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

from inventory.models import Procurement, Location, TotalInventory, Item

def test_discard_filtering():
    """Test the discard item filtering functionality"""
    
    print("=== Testing Discard Item Filtering ===")
    
    # Get some test data
    procurements = Procurement.objects.all()[:3]
    locations = Location.objects.all()[:3]
    
    if not procurements:
        print("No procurements found in database")
        return
    
    print(f"\nFound {len(procurements)} procurements to test with")
    
    for procurement in procurements:
        print(f"\n--- Testing Procurement: {procurement.order_number} (ID: {procurement.id}) ---")
        
        # Test the locations by procurement API
        url = "http://localhost:8000/inventory/locations/by_procurement/"
        params = {'procurement_id': procurement.id}
        
        try:
            response = requests.get(url, params=params)
            if response.status_code == 200:
                locations_data = response.json()
                print(f"API Response: Found {len(locations_data)} locations")
                
                for loc in locations_data:
                    print(f"  - {loc['name']} (ID: {loc['id']})")
                
                # Verify against database
                db_locations = Location.objects.filter(
                    total_inventory__procurement_id=procurement.id,
                    total_inventory__available_quantity__gt=0
                ).distinct()
                
                print(f"Database verification: {db_locations.count()} locations")
                for loc in db_locations:
                    print(f"  - {loc.name} (ID: {loc.id})")
                
                # Check if API and database match
                api_location_ids = {loc['id'] for loc in locations_data}
                db_location_ids = {loc.id for loc in db_locations}
                
                if api_location_ids == db_location_ids:
                    print("  ✅ API and database results match")
                else:
                    print("  ❌ API and database results don't match")
                    print(f"    API: {api_location_ids}")
                    print(f"    DB: {db_location_ids}")
                    
            else:
                print(f"❌ API Error: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    print("\n=== Testing Complete ===")

if __name__ == "__main__":
    test_discard_filtering() 