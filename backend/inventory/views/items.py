from rest_framework import viewsets
from ..models import Item, InventoryByLocation, User, Location
from ..serializers import ItemSerializer, TotalInventoryRowSerializer
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from ..models import Procurement, ProcurementItem, StockMovement, DiscardedItem, Location
from django.db.models import F, Sum
from inventory.models import TotalInventory
from ..utils import log_audit_action

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_type = self.request.query_params.get('userType')
        user_location = self.request.query_params.get('userLocation')
        
        # Filter by dead stock if requested
        dead_stock = self.request.query_params.get('dead_stock')
        if dead_stock is not None:
            if dead_stock.lower() == 'true':
                queryset = [item for item in queryset if item.is_dead_stock]
            elif dead_stock.lower() == 'false':
                queryset = [item for item in queryset if not item.is_dead_stock]
        
        # Role-based filtering
        if user_type == 'chairman':
            # Chairman can see all items
            return queryset
        elif user_type == 'main_inventory_manager':
            # Main inventory manager can only see items in main inventory locations
            main_locations = Location.objects.filter(name__icontains='main')
            main_inventory_items = InventoryByLocation.objects.filter(
                location__in=main_locations,
                quantity__gt=0
            ).values_list('item_id', flat=True)
            return queryset.filter(id__in=main_inventory_items)
        elif user_type == 'inventory_manager':
            # Inventory manager can only see items in their assigned location
            if user_location:
                try:
                    location = Location.objects.get(name__icontains=user_location)
                    location_items = InventoryByLocation.objects.filter(
                        location=location,
                        quantity__gt=0
                    ).values_list('item_id', flat=True)
                    return queryset.filter(id__in=location_items)
                except Location.DoesNotExist:
                    return Item.objects.none()
        
        return queryset

    def perform_create(self, serializer):
        user_type = self.request.data.get('userType')
        if user_type not in ['chairman', 'main_inventory_manager']:
            raise PermissionError("Only Chairman and Main Inventory Manager can create items")
        serializer.save()

    def perform_update(self, serializer):
        user_type = self.request.data.get('userType')
        if user_type not in ['chairman', 'main_inventory_manager']:
            raise PermissionError("Only Chairman and Main Inventory Manager can update items")
        serializer.save()

    def perform_destroy(self, instance):
        user_type = self.request.data.get('userType')
        if user_type != 'chairman':
            raise PermissionError("Only Chairman can delete items")
        instance.delete()

    @action(detail=False, methods=['get'])
    def total_inventory(self, request):
        """
        Returns a list of inventory items from the TotalInventory table.
        Role-based filtering applied.
        """
        user_type = request.query_params.get('userType')
        user_location = request.query_params.get('userLocation')
        
        inventory_rows = TotalInventory.objects.select_related('item', 'procurement', 'location').all()
        
        # Apply role-based filtering
        if user_type == 'chairman':
            # Chairman can see all inventory
            pass
        elif user_type == 'main_inventory_manager':
            # Main inventory manager can only see main inventory
            inventory_rows = inventory_rows.filter(location__name__icontains='main')
        elif user_type == 'inventory_manager':
            # Inventory manager can only see their assigned location
            if user_location:
                inventory_rows = inventory_rows.filter(location__name__icontains=user_location)
        
        serializer = TotalInventoryRowSerializer(inventory_rows, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def locations_with_stock(self, request):
        """
        Returns locations where a specific item has available stock.
        Query parameter: item_id
        Role-based filtering applied.
        """
        item_id = request.query_params.get('item_id')
        user_type = request.query_params.get('userType')
        user_location = request.query_params.get('userLocation')
        
        if not item_id:
            return Response({"error": "item_id parameter is required"}, status=400)
        
        try:
            item = Item.objects.get(id=item_id)
            locations_with_stock = []
            
            # Get all locations where this item has inventory using InventoryByLocation
            location_inventories = InventoryByLocation.objects.filter(
                item_id=item_id,
                quantity__gt=0
            ).select_related('location')
            
            # Apply role-based filtering
            if user_type == 'chairman':
                # Chairman can see all locations
                pass
            elif user_type == 'main_inventory_manager':
                # Main inventory manager can only see main inventory locations
                location_inventories = location_inventories.filter(location__name__icontains='main')
            elif user_type == 'inventory_manager':
                # Inventory manager can only see their assigned location
                if user_location:
                    location_inventories = location_inventories.filter(location__name__icontains=user_location)
            
            for inventory in location_inventories:
                locations_with_stock.append({
                    'id': inventory.location.id,
                    'name': inventory.location.name,
                    'quantity': inventory.quantity
                })
            
            return Response({
                'item_id': item_id,
                'item_name': item.name,
                'locations': locations_with_stock
            })
            
        except Item.DoesNotExist:
            return Response({"error": "Item not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['get'])
    def items_at_location(self, request):
        """
        Returns items available at a specific location.
        Query parameter: location_id
        Role-based filtering applied.
        """
        location_id = request.query_params.get('location_id')
        user_type = request.query_params.get('userType')
        user_location = request.query_params.get('userLocation')
        
        if not location_id:
            return Response({"error": "location_id parameter is required"}, status=400)
        
        try:
            location = Location.objects.get(id=location_id)
            
            # Check if user has access to this location
            if user_type == 'chairman':
                # Chairman can access all locations
                pass
            elif user_type == 'main_inventory_manager':
                # Main inventory manager can only access main inventory locations
                if 'main' not in location.name.lower():
                    return Response({"error": "Access denied to this location"}, status=403)
            elif user_type == 'inventory_manager':
                # Inventory manager can only access their assigned location
                if user_location and user_location.lower() not in location.name.lower():
                    return Response({"error": "Access denied to this location"}, status=403)
            
            items_at_location = []
            
            # Get items at this location using InventoryByLocation
            location_inventories = InventoryByLocation.objects.filter(
                location=location,
                quantity__gt=0
            ).select_related('item', 'item__category')
            
            for inventory in location_inventories:
                items_at_location.append({
                    'item_id': inventory.item.id,
                    'item_name': inventory.item.name,
                    'quantity': inventory.quantity,
                    'location_id': location.id,
                    'location': location.name,
                    'category': inventory.item.category.name
                })
            
            return Response({
                'location_id': location_id,
                'location_name': location.name,
                'items': items_at_location
            })
            
        except Location.DoesNotExist:
            return Response({"error": "Location not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        log_audit_action('Item Created', 'Item', f"Created item '{response.data.get('name')}'")
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_action('Item Updated', 'Item', f"Updated item '{response.data.get('name')}'")
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        response = super().destroy(request, *args, **kwargs)
        log_audit_action('Item Deleted', 'Item', f"Deleted item '{name}'")
        return response

@api_view(['GET'])
def get_item_availability(request):
    item_id = request.query_params.get('item_id')
    location_id = request.query_params.get('location_id')

    print(f"Checking availability for item_id={item_id} and location_id={location_id}")

    if not item_id or not location_id:
        return Response({"error": "item_id and location_id are required"}, status=400)

    try:
        location = Location.objects.get(id=location_id)
        print(f"Location: {location.name}")
        
        item = Item.objects.get(id=item_id)
        available_qty = InventoryByLocation.get_available_quantity(item, location)
        print(f"Available quantity at {location.name}: {available_qty}")
        return Response({"quantity": available_qty})
            
    except (Location.DoesNotExist, Item.DoesNotExist):
        return Response({"error": "Item or Location not found"}, status=404)