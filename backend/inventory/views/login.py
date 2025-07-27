from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json


USERNAME = "admin"
PASSWORD = "12345"

# @csrf_exempt
# def login_user(request):
#     if request.method == "POST":
#         data = json.loads(request.body)
#         if data.get("username") == USERNAME and data.get("password") == PASSWORD:
#             return JsonResponse({"success": True})
#         return JsonResponse({"success": False}, status=401)


@csrf_exempt
def login_api(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            portal_id = data.get("portalID")
            password = data.get("password")
            user_type = data.get("userType")

            credentials = {
                "Chairman": {"id": "chairman", "password": "chairman123"},
                "Main Inventory Manager": {"id": "main_inventory_manager", "password": "main123"},
                "Inventory Manager": {"id": "inventory_manager", "password": "inventory123"},
            }

            if user_type in credentials:
                if portal_id == credentials[user_type]["id"] and password == credentials[user_type]["password"]:
                    return JsonResponse({"success": True})
                else:
                    return JsonResponse({"success": False, "message": "Invalid credentials"}, status=401)
            else:
                return JsonResponse({"success": False, "message": "Invalid user type"}, status=400)

        except Exception as e:
            return JsonResponse({"success": False, "message": str(e)}, status=500)