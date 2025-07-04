from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from ..models import SendingStockRequest, Item, Location, InventoryByLocation
from ..serializers import SendingStockRequestSerializer, ItemSerializer
from ..utils import log_audit_action


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def user_dashboard_data(request):
    """Get data for user dashboard"""
    try:
        # Get user's stock requests
        user_requests = SendingStockRequest.objects.all().order_by('-created_at')[:5]
        requests_serializer = SendingStockRequestSerializer(user_requests, many=True)
        
        # Get available items for stock requests
        available_items = Item.objects.all()
        items_serializer = ItemSerializer(available_items, many=True)
        
        # Get locations
        locations = Location.objects.all()
        
        dashboard_data = {
            'recent_requests': requests_serializer.data,
            'available_items': items_serializer.data,
            'locations': list(locations.values('id', 'name')),
            'total_requests': SendingStockRequest.objects.count(),
            'pending_requests': SendingStockRequest.objects.filter(status='Pending').count(),
            'approved_requests': SendingStockRequest.objects.filter(status='Approved').count(),
        }
        
        return JsonResponse(dashboard_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def create_stock_request(request):
    """Create a new stock request for user"""
    try:
        data = json.loads(request.body)
        
        # Validate required fields
        required_fields = ['item', 'quantity']
        for field in required_fields:
            if field not in data:
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        
        # Create the stock request
        stock_request = SendingStockRequest.objects.create(
            item_id=data['item'],
            quantity=data['quantity'],
            status='Pending'
        )
        
        # Log the action
        log_audit_action('Stock Request Created', 'SendingStockRequest', 
                        f"Created stock request for {stock_request.quantity} x {stock_request.item.name}")
        
        serializer = SendingStockRequestSerializer(stock_request)
        return JsonResponse(serializer.data, status=201)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def user_stock_requests(request):
    """Get all stock requests for the user"""
    try:
        requests = SendingStockRequest.objects.all().order_by('-created_at')
        serializer = SendingStockRequestSerializer(requests, many=True)
        return JsonResponse(serializer.data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def user_inventory_view(request):
    """Get inventory data for user view"""
    try:
        # Get items with their inventory information
        items = Item.objects.all()
        inventory_data = []
        
        for item in items:
            # Get main store inventory
            main_store_inventory = InventoryByLocation.get_main_store_inventory(item)
            
            inventory_data.append({
                'id': item.id,
                'name': item.name,
                'category': item.category.name,
                'unit_price': str(item.unit_price),
                'main_store_quantity': main_store_inventory.quantity if main_store_inventory else 0,
                'total_quantity': item.total_quantity,
                'dead_stock_quantity': item.dead_stock_quantity
            })
        
        return JsonResponse(inventory_data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def user_location_inventory(request):
    """Get inventory data for specific user location from InventoryByLocation table, only show items with quantity > 0"""
    try:
        portal_id = request.GET.get('portal_id', 'user')
        location_mapping = {
            'user': 'lab1',
            # Add more mappings as needed
        }
        location_name = location_mapping.get(portal_id, 'lab1')

        # Get the location from database
        try:
            location = Location.objects.get(name=location_name)
        except Location.DoesNotExist:
            return JsonResponse({
                'location': location_name,
                'inventory': [],
                'total_items': 0,
                'message': f'Location "{location_name}" does not exist. Please contact admin.'
            })

        # Get inventory from InventoryByLocation table for this specific location
        inventory_records = InventoryByLocation.objects.filter(location=location)
        inventory_data = []
        
        for record in inventory_records:
            if record.quantity > 0:
                item = record.item
                inventory_data.append({
                    'id': item.id,
                    'name': item.name,
                    'category': item.category.name,
                    'quantity': record.quantity,
                    'unit_price': str(item.unit_price),
                    'location': location.name,
                    'last_updated': record.last_updated.strftime('%Y-%m-%d %H:%M:%S') if record.last_updated else None
                })
        
        return JsonResponse({
            'location': location.name,
            'inventory': inventory_data,
            'total_items': len(inventory_data)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def available_items_for_request(request):
    """Get available items for stock requests"""
    try:
        items = Item.objects.all()
        serializer = ItemSerializer(items, many=True)
        return JsonResponse(serializer.data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def user_profile_data(request):
    """Get user profile data"""
    try:
        # For now, return basic user info
        # In a real application, this would get the actual logged-in user's data
        profile_data = {
            'name': 'User',
            'role': 'User',
            'department': 'General',
            'email': 'user@neduet.edu.pk'
        }
        return JsonResponse(profile_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 