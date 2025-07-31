from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from ..models import User
from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def login_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            username = data.get("username")
            password = data.get("password")

            if not username:
                return JsonResponse({"success": False, "message": "Username required."}, status=400)

            try:
                # Use 'name' field for authentication since that's what exists in the database
                user = User.objects.get(name=username)
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
                if not user.password or user.password != password:
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

            # Success: return user info and role
            return JsonResponse({
                "success": True,
                "user": {
                    "id": user.id,
                    "username": user.name,  # Use name as username for frontend compatibility
                    "name": user.name,
                    "role": user.role,
                    "department": user.department.name if user.department else None,
                }
            })
        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)