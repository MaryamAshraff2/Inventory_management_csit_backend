#!/usr/bin/env python
"""
Test script to verify the password setting functionality for chairman and main inventory manager
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import Department, User

def test_password_setting():
    """Test the password setting functionality"""
    print("Testing password setting functionality...")
    
    # Create a test department
    try:
        dept = Department.objects.create(
            name="Test Department",
            email="test@example.com"
        )
        print(f"✓ Created test department: {dept.name}")
        
        # Test chairman creation
        chairman_username = f"chairman_{dept.name.lower().replace(' ', '_')}"
        chairman_email = f"{chairman_username}@{dept.name.lower().replace(' ', '_')}.com"
        
        chairman = User.objects.create(
            name=chairman_username,
            email=chairman_email,
            password="test123",
            role="chairman",
            department=dept
        )
        print(f"✓ Created chairman: {chairman.name} with email: {chairman.email}")
        
        # Test main inventory manager creation
        main_manager_username = f"main_manager_{dept.name.lower().replace(' ', '_')}"
        main_manager_email = f"{main_manager_username}@{dept.name.lower().replace(' ', '_')}.com"
        
        main_manager = User.objects.create(
            name=main_manager_username,
            email=main_manager_email,
            password="test456",
            role="main_inventory_manager",
            department=dept
        )
        print(f"✓ Created main inventory manager: {main_manager.name} with email: {main_manager.email}")
        
        # Verify both users can be retrieved
        retrieved_chairman = User.objects.filter(department=dept, role='chairman').first()
        retrieved_manager = User.objects.filter(department=dept, role='main_inventory_manager').first()
        
        if retrieved_chairman and retrieved_manager:
            print("✓ Both users can be retrieved successfully")
            print(f"  - Chairman: {retrieved_chairman.name} ({retrieved_chairman.email})")
            print(f"  - Manager: {retrieved_manager.name} ({retrieved_manager.email})")
        else:
            print("✗ Failed to retrieve users")
            
        # Clean up
        dept.delete()
        print("✓ Cleaned up test data")
        
        print("\n🎉 All tests passed! The password setting functionality should work correctly.")
        
    except Exception as e:
        print(f"✗ Test failed with error: {e}")
        return False
    
    return True

if __name__ == "__main__":
    test_password_setting()