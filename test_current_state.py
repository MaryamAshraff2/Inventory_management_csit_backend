import os
import django
import sys

# Add the backend directory to the Python path
sys.path.append('backend')

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import User, Department

def check_current_state():
    print("=== CURRENT SYSTEM STATE ===")
    print()
    
    # Check all users
    print("📋 ALL USERS:")
    users = User.objects.all()
    for user in users:
        print(f"  - {user.username} ({user.role}) - Department: {user.department.name if user.department else 'None'}")
    
    print()
    
    # Check all departments
    print("🏢 ALL DEPARTMENTS:")
    departments = Department.objects.all()
    for dept in departments:
        status = "ACTIVE" if not dept.is_deleted else "DELETED"
        print(f"  - {dept.name} ({status}) - Email: {dept.email}")
    
    print()
    
    # Check active departments only
    print("✅ ACTIVE DEPARTMENTS ONLY:")
    active_departments = Department.get_active_departments()
    for dept in active_departments:
        print(f"  - {dept.name} - Email: {dept.email}")
    
    print()
    
    # Count users by role
    print("👥 USER COUNTS BY ROLE:")
    superusers = User.objects.filter(role='superuser').count()
    chairmen = User.objects.filter(role='chairman', department__is_deleted=False).count()
    main_managers = User.objects.filter(role='main_inventory_manager', department__is_deleted=False).count()
    inventory_managers = User.objects.filter(role='inventory_manager').count()
    
    print(f"  - Superusers: {superusers}")
    print(f"  - Chairmen (active depts): {chairmen}")
    print(f"  - Main Inventory Managers (active depts): {main_managers}")
    print(f"  - Inventory Managers: {inventory_managers}")
    
    print()
    print("=== END STATE CHECK ===")

if __name__ == "__main__":
    check_current_state() 