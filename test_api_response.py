#!/usr/bin/env python
"""
Test script to verify API response for dashboard stats
"""
import requests
import json

def test_api_response():
    """Test the API response for dashboard stats"""
    print("Testing API response for dashboard stats...")
    
    try:
        # Test users endpoint
        url = "http://localhost:8000/inventory/users/"
        response = requests.get(url)
        
        if response.status_code == 200:
            users = response.json()
            print(f"✓ Users API working. Found {len(users)} users")
            
            # Count by role
            chairmen = [u for u in users if u['role'] == 'chairman']
            main_managers = [u for u in users if u['role'] == 'main_inventory_manager']
            superusers = [u for u in users if u['role'] == 'superuser']
            
            print(f"  - Chairmen: {len(chairmen)}")
            print(f"  - Main Inventory Managers: {len(main_managers)}")
            print(f"  - Superusers: {len(superusers)}")
            
            # Test departments endpoint
            dept_url = "http://localhost:8000/inventory/departments/"
            dept_response = requests.get(dept_url)
            
            if dept_response.status_code == 200:
                departments = dept_response.json()
                print(f"✓ Departments API working. Found {len(departments)} departments")
                
                # Expected values for superuser dashboard
                expected_departments = 1
                expected_users = 1  # Only superuser
                expected_chairmen = 1  # One chairman for CSIT
                expected_managers = 0  # No main inventory managers
                
                print(f"\nExpected dashboard values:")
                print(f"  - Total Departments: {expected_departments}")
                print(f"  - Total Users: {expected_users}")
                print(f"  - Total Chairmen: {expected_chairmen}")
                print(f"  - Main Inventory Managers: {expected_managers}")
                
                print(f"\nActual API values:")
                print(f"  - Total Departments: {len(departments)}")
                print(f"  - Total Users: {len(superusers)}")
                print(f"  - Total Chairmen: {len(chairmen)}")
                print(f"  - Main Inventory Managers: {len(main_managers)}")
                
                # Verify all counts match
                all_correct = (
                    len(departments) == expected_departments and
                    len(superusers) == expected_users and
                    len(chairmen) == expected_chairmen and
                    len(main_managers) == expected_managers
                )
                
                if all_correct:
                    print("\n🎉 All counts are correct! Dashboard should display properly.")
                else:
                    print("\n⚠️  Some counts don't match expectations.")
                    
            else:
                print(f"✗ Departments API error: {dept_response.status_code}")
                
        else:
            print(f"✗ Users API error: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("⚠️  Server not running. Start with: python manage.py runserver")
    except Exception as e:
        print(f"✗ Test error: {str(e)}")

if __name__ == "__main__":
    test_api_response() 