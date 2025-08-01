#!/usr/bin/env python3
"""
Test script to verify department creation functionality
"""

import requests
import json

API_BASE_URL = "http://localhost:8000/inventory"

def test_department_creation():
    """Test creating a new department"""
    print("🧪 Testing Department Creation...")
    
    # Test data for new department
    department_data = {
        "name": "Test Computer Science Department",
        "email": "cs@neduet.edu.pk"
    }
    
    try:
        # Create department
        response = requests.post(
            f"{API_BASE_URL}/departments/",
            json=department_data,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 201:
            created_dept = response.json()
            print(f"✅ Department created successfully!")
            print(f"   ID: {created_dept['id']}")
            print(f"   Name: {created_dept['name']}")
            print(f"   Email: {created_dept['email']}")
            print(f"   User Count: {created_dept.get('user_count', 'N/A')}")
            
            # Test fetching the department
            fetch_response = requests.get(f"{API_BASE_URL}/departments/{created_dept['id']}/")
            if fetch_response.status_code == 200:
                fetched_dept = fetch_response.json()
                print(f"✅ Department fetched successfully!")
                print(f"   Fetched Name: {fetched_dept['name']}")
                print(f"   Fetched Email: {fetched_dept['email']}")
            else:
                print(f"❌ Failed to fetch department: {fetch_response.status_code}")
                
        else:
            print(f"❌ Failed to create department: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the Django server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_departments_list():
    """Test fetching all departments"""
    print("\n🧪 Testing Departments List...")
    
    try:
        response = requests.get(f"{API_BASE_URL}/departments/")
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            departments = response.json()
            print(f"✅ Found {len(departments)} departments:")
            for dept in departments:
                print(f"   - {dept['name']} (ID: {dept['id']}, Users: {dept.get('user_count', 'N/A')})")
        else:
            print(f"❌ Failed to fetch departments: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error: Make sure the Django server is running on localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_department_creation()
    test_departments_list() 