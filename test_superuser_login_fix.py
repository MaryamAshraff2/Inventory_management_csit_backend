#!/usr/bin/env python3
"""
Test script to verify superuser login fix
"""
import requests
import json

# Base URL for the API
BASE_URL = "http://localhost:8000"

def test_superuser_login():
    """Test superuser login without password"""
    print("🧪 Testing superuser login without password...")
    
    login_data = {
        "username": "superuser",
        "password": ""  # No password for superuser
    }
    
    try:
        response = requests.post(f"{BASE_URL}/inventory/login/", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Superuser login successful!")
            print(f"   User: {data['user']['name']}")
            print(f"   Role: {data['user']['role']}")
            print(f"   Username: {data['user']['username']}")
            return True
        else:
            print(f"❌ Superuser login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during superuser login: {e}")
        return False

def test_chairman_login():
    """Test chairman login with password"""
    print("\n🧪 Testing chairman login with password...")
    
    login_data = {
        "username": "chairman_me",
        "password": "chairman123"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/inventory/login/", json=login_data)
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Chairman login successful!")
            print(f"   User: {data['user']['name']}")
            print(f"   Role: {data['user']['role']}")
            return True
        else:
            print(f"❌ Chairman login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error during chairman login: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Login Fix")
    print("=" * 50)
    
    # Test superuser login
    superuser_success = test_superuser_login()
    
    # Test chairman login
    chairman_success = test_chairman_login()
    
    print("\n" + "=" * 50)
    if superuser_success and chairman_success:
        print("🎉 All tests passed! Login system is working correctly.")
    else:
        print("❌ Some tests failed. Please check the errors above.") 