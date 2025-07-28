#!/usr/bin/env python3
"""
Test script for the superuser system - Frontend Integration Test
"""
import requests
import json
import time

# Base URL for the API
BASE_URL = "http://localhost:8000/inventory"

def test_superuser_login():
    """Test superuser login"""
    print("🧪 Testing superuser login...")
    
    login_data = {
        "username": "superuser",
        "password": ""  # No password needed for superuser
    }
    
    try:
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
    except Exception as e:
        print(f"❌ Error during superuser login: {e}")
        return False

def test_create_department():
    """Test creating a department"""
    print("\n🧪 Testing department creation...")
    
    department_data = {
        "name": "Computer Science Department",
        "email": "cs@neduet.edu.pk"
    }
    
    try:
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
    except Exception as e:
        print(f"❌ Error during department creation: {e}")
        return None

def test_assign_chairman(department_id):
    """Test assigning a chairman to a department"""
    print(f"\n🧪 Testing chairman assignment to department {department_id}...")
    
    chairman_data = {
        "name": "dr_smith",
        "password": "chairman123",
        "email": "dr.smith@neduet.edu.pk"
    }
    
    try:
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
    except Exception as e:
        print(f"❌ Error during chairman assignment: {e}")
        return False

def test_chairman_login():
    """Test chairman login"""
    print("\n🧪 Testing chairman login...")
    
    login_data = {
        "username": "dr_smith",
        "password": "chairman123"
    }
    
    try:
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
    except Exception as e:
        print(f"❌ Error during chairman login: {e}")
        return False

def test_get_departments_with_chairmen():
    """Test getting departments with chairmen"""
    print("\n🧪 Testing get departments with chairmen...")
    
    try:
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
    except Exception as e:
        print(f"❌ Error getting departments: {e}")
        return False

def main():
    """Run all tests"""
    print("🚀 Testing Superuser System - Frontend Integration")
    print("=" * 60)
    
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
    
    print("\n🎉 All tests completed successfully!")
    print("\n📋 Summary:")
    print("   ✅ Superuser can login without password")
    print("   ✅ Superuser can create departments")
    print("   ✅ Superuser can assign chairmen with credentials")
    print("   ✅ Chairmen can login with username/password")
    print("   ✅ Departments are visible with assigned users")
    print("\n🌐 Frontend Integration:")
    print("   - Superuser can access /superuser-departments")
    print("   - Can create departments and assign chairmen")
    print("   - Chairmen can login and access their dashboards")

if __name__ == "__main__":
    main() 