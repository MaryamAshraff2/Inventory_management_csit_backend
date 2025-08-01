import requests
import json

# Test the new user counts API endpoint
def test_user_counts_api():
    base_url = "http://localhost:8000/inventory"
    
    # Test cases for different user roles
    test_cases = [
        {"user_role": "superuser", "expected_label": "Superusers"},
        {"user_role": "chairman", "expected_label": "Chairmen"},
        {"user_role": "main_inventory_manager", "expected_label": "Main Inventory Managers"},
        {"user_role": "inventory_manager", "expected_label": "Inventory Managers"},
    ]
    
    print("Testing User Counts API Endpoint")
    print("=" * 40)
    
    for test_case in test_cases:
        try:
            response = requests.post(
                f"{base_url}/user/counts/",
                headers={"Content-Type": "application/json"},
                data=json.dumps({"user_role": test_case["user_role"]})
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {test_case['user_role']}: {data['user_count']} {test_case['expected_label']}")
            else:
                print(f"❌ {test_case['user_role']}: Error {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ {test_case['user_role']}: Exception - {str(e)}")
    
    print("\n" + "=" * 40)
    print("Test completed!")

if __name__ == "__main__":
    test_user_counts_api() 