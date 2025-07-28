#!/usr/bin/env python3
"""
Quick test to verify superuser login works
"""
import requests
import json

def test_superuser_login():
    """Test superuser login"""
    print("🧪 Testing superuser login...")
    
    login_data = {
        "username": "superuser",
        "password": ""  # No password needed for superuser
    }
    
    try:
        response = requests.post('http://localhost:8000/inventory/login/', json=login_data)
        
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

if __name__ == "__main__":
    print("🚀 Quick Superuser Login Test")
    print("=" * 40)
    test_superuser_login()
    print("\n📋 Next Steps:")
    print("1. Open http://localhost:3000 in your browser")
    print("2. Login with username: 'superuser' (no password)")
    print("3. You should see the superuser dashboard")
    print("4. Look for 'Manage Departments & Chairmen' in the sidebar") 