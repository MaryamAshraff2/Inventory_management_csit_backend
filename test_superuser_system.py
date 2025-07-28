#!/usr/bin/env python3
"""
Test script for the superuser system
"""
import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_superuser_login():
    """Test superuser login"""
    print("Testing superuser login...")
    
    login_data = {
        "username": "superuser",
        "password": ""  # No password needed for superuser
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Superuser login successful!")
        print(f"   User: {data['user']['name']}")
        print(f"   Role: {data['user']['role']}")
        return True
    else:
        print(f"❌ Superuser login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_create_department():
    """Test creating a department"""
    print("\nTesting department creation...")
    
    department_data = {
        "name": "Computer Science Department",
        "email": "cs@neduet.edu.pk"
    }
    
    response = requests.post(f"{BASE_URL}/departments/", json=department_data)
    
    if response.status_code == 201:
        data = response.json()
        print(f"✅ Department created successfully!")
        print(f"   Department: {data['name']}")
        print(f"   ID: {data['id']}")
        return data['id']
    else:
        print(f"❌ Department creation failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return None

def test_assign_chairman(department_id):
    """Test assigning a chairman to a department"""
    print(f"\nTesting chairman assignment to department {department_id}...")
    
    chairman_data = {
        "name": "dr_smith",
        "password": "chairman123",
        "email": "dr.smith@neduet.edu.pk"
    }
    
    response = requests.post(f"{BASE_URL}/superuser-management/{department_id}/assign_chairman/", json=chairman_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Chairman assigned successfully!")
        print(f"   Chairman: {data['chairman']['name']}")
        print(f"   Password: {data['chairman']['password']}")
        return True
    else:
        print(f"❌ Chairman assignment failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_chairman_login():
    """Test chairman login"""
    print("\nTesting chairman login...")
    
    login_data = {
        "username": "dr_smith",
        "password": "chairman123"
    }
    
    response = requests.post(f"{BASE_URL}/login/", json=login_data)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Chairman login successful!")
        print(f"   User: {data['user']['name']}")
        print(f"   Role: {data['user']['role']}")
        print(f"   Department: {data['user']['department']}")
        return True
    else:
        print(f"❌ Chairman login failed: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def test_get_departments_with_chairmen():
    """Test getting departments with chairmen"""
    print("\nTesting get departments with chairmen...")
    
    response = requests.get(f"{BASE_URL}/superuser-management/departments_with_chairmen/")
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Retrieved {len(data)} departments:")
        for dept in data:
            print(f"   - {dept['name']}")
            if dept['chairman']:
                print(f"     Chairman: {dept['chairman']['name']}")
            if dept['main_inventory_manager']:
                print(f"     Main Manager: {dept['main_inventory_manager']['name']}")
        return True
    else:
        print(f"❌ Failed to get departments: {response.status_code}")
        print(f"   Response: {response.text}")
        return False

def main():
    """Run all tests"""
    print("🧪 Testing Superuser System")
    print("=" * 50)
    
    # Test superuser login
    if not test_superuser_login():
        print("❌ Superuser login failed. Stopping tests.")
        return
    
    # Test department creation
    department_id = test_create_department()
    if not department_id:
        print("❌ Department creation failed. Stopping tests.")
        return
    
    # Test chairman assignment
    if not test_assign_chairman(department_id):
        print("❌ Chairman assignment failed. Stopping tests.")
        return
    
    # Test chairman login
    if not test_chairman_login():
        print("❌ Chairman login failed.")
        return
    
    # Test get departments with chairmen
    test_get_departments_with_chairmen()
    
    print("\n🎉 All tests completed!")

if __name__ == "__main__":
    main() 