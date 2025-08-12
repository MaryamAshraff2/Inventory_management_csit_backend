from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from ..models import User
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import check_password
import uuid
from datetime import datetime, timedelta

# Simple in-memory token storage (in production, use Redis or database)
TOKEN_STORE = {}

@csrf_exempt
def login_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            userName = data.get("username")
            password = data.get("password")

            if not userName:
                return JsonResponse({"success": False, "message": "Username required."}, status=400)

            try:
                # Use 'name' field for authentication since that's what exists in the database
                user = User.objects.get(username=userName)
            except User.DoesNotExist:
                return JsonResponse({"success": False, "message": "Invalid username or password."}, status=401)

            # Check password based on user role
            if user.role == 'superuser':
                # Superuser can login without password
                pass
            else:
                # All other users require password
                if not password:
                    return JsonResponse({"success": False, "message": "Password required."}, status=400)
                if not user.password or not check_password(password, user.password):
                    return JsonResponse({"success": False, "message": "Invalid username or password."}, status=401)

            # Role-based access checks
            if user.role == 'superuser':
                # Superuser can always login
                pass
            elif user.role == 'chairman':
                # Chairman can only login if assigned to a department
                if not user.department:
                    return JsonResponse({"success": False, "message": "Chairman account not yet assigned by superuser."}, status=403)
            elif user.role == 'main_inventory_manager':
                # Main inventory manager can only login if assigned to a department
                if not user.department:
                    return JsonResponse({"success": False, "message": "Main inventory manager account not yet assigned by superuser."}, status=403)
            elif user.role == 'inventory_manager':
                # Inventory manager can only login if assigned to a location
                if not user.assigned_locations.exists():
                    return JsonResponse({"success": False, "message": "Inventory manager account not yet assigned to a location."}, status=403)

            # Generate a simple token
            token = str(uuid.uuid4())
            TOKEN_STORE[token] = {
                'user_id': user.id,
                'user_role': user.role,
                'user_department': user.department.id if user.department else None,
                'expires_at': datetime.now() + timedelta(hours=24)
            }
            
            print(f"DEBUG: Login successful for user {user.username}")
            print(f"DEBUG: Token generated: {token}")
            print(f"DEBUG: Token store: {TOKEN_STORE}")

            # Success: return user info and role with token
            return JsonResponse({
                "success": True,
                "token": token,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "name": user.username,
                    "role": user.role,
                    "department": user.department.name if user.department else None,
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)

@csrf_exempt
def logout_api(request):
    if request.method == "POST":
        try:
            # Get token from request headers
            auth_header = request.headers.get('Authorization', '')
            if auth_header.startswith('Bearer '):
                token = auth_header[7:]  # Remove 'Bearer ' prefix
                if token in TOKEN_STORE:
                    del TOKEN_STORE[token]
                    print(f"DEBUG: Token {token} removed from store")
            
            return JsonResponse({"success": True, "message": "Logged out successfully"})
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)