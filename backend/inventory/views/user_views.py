from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from ..models import SendingStockRequest, Item, Location, InventoryByLocation, User
from ..serializers import SendingStockRequestSerializer, ItemSerializer
from ..utils import log_audit_action


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def user_dashboard_data(request):
    """Get data for user dashboard with role-based filtering"""
    try:
        user_type = request.query_params.get('userType')
        user_location = request.query_params.get('userLocation')
        
        # Get user's stock requests with role-based filtering
        user_requests = SendingStockRequest.objects.all().order_by('-created_at')[:5]
        
        # Get available items with role-based filtering
        available_items = Item.objects.all()
        
        # Apply role-based filtering to items
        if user_type == 'chairman':
            # Chairman can see all items
            pass
        elif user_type == 'main_inventory_manager':
            # Main inventory manager can only see items in main inventory
            main_locations = Location.objects.filter(name__icontains='main')
            main_inventory_items = InventoryByLocation.objects.filter(
                location__in=main_locations,
                quantity__gt=0
            ).values_list('item_id', flat=True)
            available_items = available_items.filter(id__in=main_inventory_items)
        elif user_type == 'inventory_manager':
            # Inventory manager can only see items in their assigned location
            if user_location:
                try:
                    location = Location.objects.get(name__icontains=user_location)
                    location_items = InventoryByLocation.objects.filter(
                        location=location,
                        quantity__gt=0
                    ).values_list('item_id', flat=True)
                    available_items = available_items.filter(id__in=location_items)
                except Location.DoesNotExist:
                    available_items = Item.objects.none()
        
        requests_serializer = SendingStockRequestSerializer(user_requests, many=True)
        items_serializer = ItemSerializer(available_items, many=True)
        
        # Get locations based on user role
        if user_type == 'chairman':
            locations = Location.objects.all()
        elif user_type == 'main_inventory_manager':
            locations = Location.objects.filter(name__icontains='main')
        elif user_type == 'inventory_manager':
            if user_location:
                locations = Location.objects.filter(name__icontains=user_location)
            else:
                locations = Location.objects.none()
        else:
            locations = Location.objects.none()
        
        dashboard_data = {
            'recent_requests': requests_serializer.data,
            'available_items': items_serializer.data,
            'locations': list(locations.values('id', 'name')),
            'total_requests': SendingStockRequest.objects.count(),
            'pending_requests': SendingStockRequest.objects.filter(status='Pending').count(),
            'approved_requests': SendingStockRequest.objects.filter(status='Approved').count(),
            'user_type': user_type,
            'user_location': user_location
        }
        
        return JsonResponse(dashboard_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def create_stock_request(request):
    """Create a new stock request for user with role-based validation"""
    try:
        data = json.loads(request.body)
        user_type = data.get('userType')
        user_location = data.get('userLocation')
        
        # Validate required fields
        required_fields = ['item', 'quantity']
        for field in required_fields:
            if field not in data:
                return JsonResponse({'error': f'Missing required field: {field}'}, status=400)
        
        # Role-based validation for stock requests
        if user_type == 'inventory_manager':
            # Inventory managers can only request items for their assigned location
            if user_location:
                try:
                    location = Location.objects.get(name__icontains=user_location)
                    # Check if item is available at their location
                    item_available = InventoryByLocation.objects.filter(
                        item_id=data['item'],
                        location=location,
                        quantity__gt=0
                    ).exists()
                    if not item_available:
                        return JsonResponse({'error': 'Item not available at your assigned location'}, status=400)
                except Location.DoesNotExist:
                    return JsonResponse({'error': 'Invalid assigned location'}, status=400)
        
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
    """Get all stock requests for the user with role-based filtering"""
    try:
        user_type = request.query_params.get('userType')
        user_location = request.query_params.get('userLocation')
        
        requests = SendingStockRequest.objects.all().order_by('-created_at')
        
        # Apply role-based filtering if needed
        if user_type == 'inventory_manager' and user_location:
            # Filter requests to only show those related to their location
            try:
                location = Location.objects.get(name__icontains=user_location)
                # This would need to be enhanced based on how stock requests are linked to locations
                pass
            except Location.DoesNotExist:
                requests = SendingStockRequest.objects.none()
        
        serializer = SendingStockRequestSerializer(requests, many=True)
        return JsonResponse(serializer.data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def user_inventory_view(request):
    """Get inventory data for user view with role-based filtering"""
    try:
        user_type = request.query_params.get('userType')
        user_location = request.query_params.get('userLocation')
        
        # Get items with their inventory information
        items = Item.objects.all()
        
        # Apply role-based filtering
        if user_type == 'chairman':
            # Chairman can see all items
            pass
        elif user_type == 'main_inventory_manager':
            # Main inventory manager can only see items in main inventory
            main_locations = Location.objects.filter(name__icontains='main')
            main_inventory_items = InventoryByLocation.objects.filter(
                location__in=main_locations,
                quantity__gt=0
            ).values_list('item_id', flat=True)
            items = items.filter(id__in=main_inventory_items)
        elif user_type == 'inventory_manager':
            # Inventory manager can only see items in their assigned location
            if user_location:
                try:
                    location = Location.objects.get(name__icontains=user_location)
                    location_items = InventoryByLocation.objects.filter(
                        location=location,
                        quantity__gt=0
                    ).values_list('item_id', flat=True)
                    items = items.filter(id__in=location_items)
                except Location.DoesNotExist:
                    items = Item.objects.none()
        
        inventory_data = []
        
        for item in items:
            # Get main store inventory
            main_store_quantity = 0
            if user_type == 'chairman' or user_type == 'main_inventory_manager':
                main_store_inventory = InventoryByLocation.get_main_store_inventory(item)
                main_store_quantity = main_store_inventory.quantity if main_store_inventory else 0
            
            # Get location-specific inventory based on user role
            location_inventory = []
            if user_type == 'chairman':
                # Chairman can see all locations
                location_inventories = InventoryByLocation.objects.filter(item=item, quantity__gt=0)
            elif user_type == 'main_inventory_manager':
                # Main inventory manager can only see main inventory locations
                main_locations = Location.objects.filter(name__icontains='main')
                location_inventories = InventoryByLocation.objects.filter(
                    item=item, 
                    location__in=main_locations,
                    quantity__gt=0
                )
            elif user_type == 'inventory_manager':
                # Inventory manager can only see their assigned location
                if user_location:
                    try:
                        location = Location.objects.get(name__icontains=user_location)
                        location_inventories = InventoryByLocation.objects.filter(
                            item=item,
                            location=location,
                            quantity__gt=0
                        )
                    except Location.DoesNotExist:
                        location_inventories = InventoryByLocation.objects.none()
                else:
                    location_inventories = InventoryByLocation.objects.none()
            
            for inv in location_inventories:
                location_inventory.append({
                    'location_name': inv.location.name,
                    'quantity': inv.quantity
                })
            
            inventory_data.append({
                'id': item.id,
                'name': item.name,
                'category': item.category.name,
                'unit_price': str(item.unit_price),
                'main_store_quantity': main_store_quantity,
                'total_quantity': item.total_quantity,
                'is_dead_stock': item.is_dead_stock,
                'location_inventory': location_inventory
            })
        
        return JsonResponse(inventory_data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def user_location_inventory(request):
    """Get inventory data for a specific location with role-based access control"""
    try:
        location_id = request.query_params.get('location_id')
        user_type = request.query_params.get('userType')
        user_location = request.query_params.get('userLocation')
        
        if not location_id:
            return JsonResponse({'error': 'location_id parameter is required'}, status=400)
        
        try:
            location = Location.objects.get(id=location_id)
            
            # Check if user has access to this location
            if user_type == 'chairman':
                # Chairman can access all locations
                pass
            elif user_type == 'main_inventory_manager':
                # Main inventory manager can only access main inventory locations
                if 'main' not in location.name.lower():
                    return JsonResponse({'error': 'Access denied to this location'}, status=403)
            elif user_type == 'inventory_manager':
                # Inventory manager can only access their assigned location
                if user_location and user_location.lower() not in location.name.lower():
                    return JsonResponse({'error': 'Access denied to this location'}, status=403)
            
            # Get inventory for this location
            location_inventories = InventoryByLocation.objects.filter(
                location=location,
                quantity__gt=0
            ).select_related('item', 'item__category')
            
            inventory_data = []
            for inv in location_inventories:
                inventory_data.append({
                    'item_id': inv.item.id,
                    'item_name': inv.item.name,
                    'category': inv.item.category.name,
                    'quantity': inv.quantity,
                    'unit_price': str(inv.item.unit_price),
                    'total_value': float(inv.item.unit_price) * inv.quantity
                })
            
            return JsonResponse({
                'location_id': location.id,
                'location_name': location.name,
                'inventory': inventory_data
            })
            
        except Location.DoesNotExist:
            return JsonResponse({'error': 'Location not found'}, status=404)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def available_items_for_request(request):
    """Get available items for stock requests with role-based filtering"""
    try:
        user_type = request.query_params.get('userType')
        user_location = request.query_params.get('userLocation')
        
        # Get items with inventory
        items = Item.objects.all()
        
        # Apply role-based filtering
        if user_type == 'chairman':
            # Chairman can see all items
            pass
        elif user_type == 'main_inventory_manager':
            # Main inventory manager can only see items in main inventory
            main_locations = Location.objects.filter(name__icontains='main')
            main_inventory_items = InventoryByLocation.objects.filter(
                location__in=main_locations,
                quantity__gt=0
            ).values_list('item_id', flat=True)
            items = items.filter(id__in=main_inventory_items)
        elif user_type == 'inventory_manager':
            # Inventory manager can only see items in their assigned location
            if user_location:
                try:
                    location = Location.objects.get(name__icontains=user_location)
                    location_items = InventoryByLocation.objects.filter(
                        location=location,
                        quantity__gt=0
                    ).values_list('item_id', flat=True)
                    items = items.filter(id__in=location_items)
                except Location.DoesNotExist:
                    items = Item.objects.none()
        
        available_items = []
        for item in items:
            # Get available quantity based on user role
            if user_type == 'chairman':
                available_quantity = item.total_quantity
            elif user_type == 'main_inventory_manager':
                main_store_inventory = InventoryByLocation.get_main_store_inventory(item)
                available_quantity = main_store_inventory.quantity if main_store_inventory else 0
            elif user_type == 'inventory_manager':
                if user_location:
                    try:
                        location = Location.objects.get(name__icontains=user_location)
                        inventory = InventoryByLocation.objects.filter(item=item, location=location).first()
                        available_quantity = inventory.quantity if inventory else 0
                    except Location.DoesNotExist:
                        available_quantity = 0
                else:
                    available_quantity = 0
            
            if available_quantity > 0:
                available_items.append({
                    'id': item.id,
                    'name': item.name,
                    'category': item.category.name,
                    'available_quantity': available_quantity,
                    'unit_price': str(item.unit_price)
                })
        
        return JsonResponse(available_items, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def user_profile_data(request):
    """Get user profile data with role-based information"""
    try:
        user_type = request.query_params.get('userType')
        user_location = request.query_params.get('userLocation')
        
        profile_data = {
            'user_type': user_type,
            'user_location': user_location,
            'permissions': {
                'can_view_all_inventory': user_type == 'chairman',
                'can_edit_main_inventory': user_type in ['chairman', 'main_inventory_manager'],
                'can_edit_lab_inventory': user_type in ['chairman', 'inventory_manager'],
                'can_create_items': user_type in ['chairman', 'main_inventory_manager'],
                'can_delete_items': user_type == 'chairman',
                'can_view_reports': True,  # All users can view reports
                'can_view_audit_logs': user_type == 'chairman'
            }
        }
        
        return JsonResponse(profile_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 

@api_view(['POST'])
def get_user_counts(request):
    """
    Get user counts based on the logged-in user's role
    """
    try:
        data = json.loads(request.body)
        user_role = data.get('user_role')
        
        if not user_role:
            return Response({'error': 'User role is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get user counts based on role
        if user_role == 'superuser':
            # Superuser sees only superusers (should be 1)
            user_count = User.objects.filter(role='superuser').count()
        elif user_role == 'chairman':
            # Chairman sees only chairmen from active departments
            user_count = User.objects.filter(role='chairman', department__is_deleted=False).count()
        elif user_role == 'main_inventory_manager':
            # Main inventory manager sees only main inventory managers from active departments
            user_count = User.objects.filter(role='main_inventory_manager', department__is_deleted=False).count()
        elif user_role == 'inventory_manager':
            # Inventory manager sees only inventory managers
            user_count = User.objects.filter(role='inventory_manager').count()
        else:
            return Response({'error': 'Invalid user role'}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response({
            'user_count': user_count,
            'user_role': user_role
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 