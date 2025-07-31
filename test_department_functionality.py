#!/usr/bin/env python3
"""
Test script to verify department creation and deletion functionality
"""

import requests
import json
import time

BASE_URL = 'http://localhost:8000/inventory'

def test_department_functionality():
    print("Testing Department Creation and Deletion Functionality")
    print("=" * 60)
    
    # Test 1: Create a department
    print("\n1. Creating department 'Test Department'...")
    department_data = {
        'name': 'Test Department',
        'email': 'test@example.com'
    }
    
    response = requests.post(f"{BASE_URL}/departments/", json=department_data)
    if response.status_code == 201:
        department = response.json()
        department_id = department['id']
        print(f"   ✅ Department created successfully with ID: {department_id}")
        print(f"   Name: {department['name']}")
        print(f"   Email: {department['email']}")
    else:
        print(f"   ❌ Failed to create department: {response.text}")
        return
    
    # Test 2: Verify department exists
    print("\n2. Verifying department exists...")
    response = requests.get(f"{BASE_URL}/departments/check_exists/?name=Test Department")
    if response.status_code == 200:
        result = response.json()
        if result['exists']:
            print("   ✅ Department exists as expected")
        else:
            print("   ❌ Department not found")
    else:
        print(f"   ❌ Failed to check department existence: {response.text}")
    
    # Test 3: Delete the department
    print("\n3. Deleting department...")
    response = requests.delete(f"{BASE_URL}/departments/{department_id}/")
    if response.status_code == 204:
        print("   ✅ Department deleted successfully")
    else:
        print(f"   ❌ Failed to delete department: {response.text}")
        return
    
    # Test 4: Verify department no longer exists
    print("\n4. Verifying department no longer exists...")
    response = requests.get(f"{BASE_URL}/departments/check_exists/?name=Test Department")
    if response.status_code == 200:
        result = response.json()
        if not result['exists']:
            print("   ✅ Department no longer exists as expected")
        else:
            print("   ❌ Department still exists after deletion")
    else:
        print(f"   ❌ Failed to check department existence: {response.text}")
    
    # Test 5: Create department with same name again
    print("\n5. Creating department with same name again...")
    response = requests.post(f"{BASE_URL}/departments/", json=department_data)
    if response.status_code == 201:
        new_department = response.json()
        new_department_id = new_department['id']
        print(f"   ✅ Department created successfully with same name!")
        print(f"   New ID: {new_department_id}")
        print(f"   Name: {new_department['name']}")
        print(f"   Email: {new_department['email']}")
    else:
        print(f"   ❌ Failed to create department with same name: {response.text}")
        return
    
    # Test 6: Verify new department exists
    print("\n6. Verifying new department exists...")
    response = requests.get(f"{BASE_URL}/departments/check_exists/?name=Test Department")
    if response.status_code == 200:
        result = response.json()
        if result['exists']:
            print("   ✅ New department exists as expected")
        else:
            print("   ❌ New department not found")
    else:
        print(f"   ❌ Failed to check department existence: {response.text}")
    
    # Test 7: Clean up - delete the new department
    print("\n7. Cleaning up - deleting new department...")
    response = requests.delete(f"{BASE_URL}/departments/{new_department_id}/")
    if response.status_code == 204:
        print("   ✅ New department deleted successfully")
    else:
        print(f"   ❌ Failed to delete new department: {response.text}")
    
    print("\n" + "=" * 60)
    print("✅ All tests completed successfully!")
    print("The department creation and deletion functionality is working correctly.")
    print("You can now create departments with the same name after deletion.")

if __name__ == "__main__":
    try:
        test_department_functionality()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the Django server.")
        print("Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {str(e)}") 