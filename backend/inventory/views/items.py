from rest_framework import viewsets
from ..models import Item, InventoryByLocation
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
        dead_stock = self.request.query_params.get('dead_stock')
        if dead_stock is not None:
            if dead_stock.lower() == 'true':
                queryset = [item for item in queryset if item.is_dead_stock]
            elif dead_stock.lower() == 'false':
                queryset = [item for item in queryset if not item.is_dead_stock]
        return queryset

    @action(detail=False, methods=['get'])
    def total_inventory(self, request):
        """
        Returns a list of inventory items from the TotalInventory table.
        """
        inventory_rows = TotalInventory.objects.select_related('item', 'procurement', 'location').all()
        serializer = TotalInventoryRowSerializer(inventory_rows, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def locations_with_stock(self, request):
        """
        Returns locations where a specific item has available stock.
        Query parameter: item_id
        """
        item_id = request.query_params.get('item_id')
        
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
        """
        location_id = request.query_params.get('location_id')
        
        if not location_id:
            return Response({"error": "location_id parameter is required"}, status=400)
        
        try:
            location = Location.objects.get(id=location_id)
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