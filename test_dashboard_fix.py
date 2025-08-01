#!/usr/bin/env python
"""
Test script to verify dashboard counts and department listing
"""
import os
import sys
import django

# Add the backend directory to the Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import User, Department

def test_dashboard_counts():
    """Test the dashboard counts and department listing"""
    print("Testing dashboard counts and department listing...")
    
    # Get current data
    users = User.objects.all()
    departments = Department.get_active_departments()
    
    print(f"Current state:")
    print(f"- Total users: {users.count()}")
    print(f"- Total departments: {departments.count()}")
    
    # Count by role (only users with departments)
    superusers = users.filter(role='superuser').count()
    chairmen = users.filter(role='chairman', department__isnull=False).count()
    main_managers = users.filter(role='main_inventory_manager', department__isnull=False).count()
    inventory_managers = users.filter(role='inventory_manager', department__isnull=False).count()
    
    print(f"\nUser counts by role (with departments):")
    print(f"- Superusers: {superusers}")
    print(f"- Chairmen: {chairmen}")
    print(f"- Main Inventory Managers: {main_managers}")
    print(f"- Inventory Managers: {inventory_managers}")
    
    print(f"\nDepartments:")
    for dept in departments:
        print(f"- {dept.name} (ID: {dept.id})")
        chairman = User.objects.filter(department=dept, role='chairman').first()
        main_manager = User.objects.filter(department=dept, role='main_inventory_manager').first()
        
        if chairman:
            print(f"  Chairman: {chairman.name} ({chairman.email})")
        else:
            print(f"  Chairman: None")
            
        if main_manager:
            print(f"  Main Manager: {main_manager.name} ({main_manager.email})")
        else:
            print(f"  Main Manager: None")
    
    print(f"\nExpected dashboard values:")
    print(f"1. SUPERUSER Dashboard:")
    print(f"   - Total Departments: {departments.count()}")
    print(f"   - Total Users: 1 (only superuser)")
    print(f"   - Total Chairmen: {chairmen}")
    print(f"   - Main Inventory Managers: {main_managers}")
    
    print(f"\n2. CHAIRMAN Dashboard:")
    print(f"   - Total Departments: {departments.count()}")
    print(f"   - Total Users: {chairmen} (only chairmen)")
    
    print(f"\n3. MAIN INVENTORY MANAGER Dashboard:")
    print(f"   - Total Departments: {departments.count()}")
    print(f"   - Total Users: {main_managers} (only main inventory managers)")
    
    print(f"\n✅ Dashboard counts test completed!")

if __name__ == "__main__":
    test_dashboard_counts() 