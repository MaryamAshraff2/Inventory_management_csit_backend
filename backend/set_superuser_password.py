#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from inventory.models import User

def set_superuser_password():
    """Set password for superuser"""
    try:
        # Find the superuser
        superuser = User.objects.filter(role='superuser').first()
        
        if not superuser:
            print("No superuser found!")
            return
        
        # Set password
        password = "superuser123"
        superuser.set_password(password)
        superuser.save()
        
        print(f"Password set successfully for superuser: {superuser.username}")
        print(f"Username: {superuser.username}")
        print(f"Password: {password}")
        print(f"Email: {superuser.email}")
        
    except Exception as e:
        print(f"Error setting password: {e}")

if __name__ == "__main__":
    set_superuser_password() 