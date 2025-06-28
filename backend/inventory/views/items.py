from rest_framework import viewsets
from ..models import Item
from ..serializers import ItemSerializer, TotalInventoryRowSerializer
from rest_framework.decorators import action, api_view
from rest_framework.response import Response
from ..models import Procurement, ProcurementItem, StockMovement, DiscardedItem, Location
from django.db.models import F, Sum
from inventory.models import TotalInventory

class ItemViewSet(viewsets.ModelViewSet):
    queryset = Item.objects.all()
    serializer_class = ItemSerializer

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
            
            # Check Main Store (special case)
            if item.available_quantity > 0:
                main_store = Location.get_main_store()
                locations_with_stock.append({
                    'id': main_store.id,
                    'name': main_store.name,
                    'available_quantity': item.available_quantity
                })
            
            # Check other locations using TotalInventory
            from django.db.models import Sum
            location_stock = TotalInventory.objects.filter(
                item_id=item_id,
                available_quantity__gt=0
            ).exclude(
                location__name='Main Store'  # Exclude Main Store as it's handled above
            ).values('location__id', 'location__name').annotate(
                total_available=Sum('available_quantity')
            )
            
            for loc_stock in location_stock:
                locations_with_stock.append({
                    'id': loc_stock['location__id'],
                    'name': loc_stock['location__name'],
                    'available_quantity': loc_stock['total_available']
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

@api_view(['GET'])
def get_item_availability(request):
    item_id = request.query_params.get('item_id')
    location_id = request.query_params.get('location_id')

    print(f"Checking availability for item_id={item_id} and location_id={location_id}")

    if not item_id or not location_id:
        return Response({"error": "item_id and location_id are required"}, status=400)

    # Get the location to check if it's Main Store
    from ..models import Location
    try:
        location = Location.objects.get(id=location_id)
        print(f"Location: {location.name}")
        
        if location.name == 'Main Store':
            # For Main Store, get available_quantity from Item table
            from ..models import Item
            try:
                item = Item.objects.get(id=item_id)
                available_qty = item.available_quantity
                print(f"Main Store - Item available_quantity: {available_qty}")
                return Response({"available_quantity": available_qty})
            except Item.DoesNotExist:
                return Response({"error": "Item not found"}, status=404)
        else:
            # For other locations, use TotalInventory
            qs = TotalInventory.objects.filter(item_id=item_id, location_id=location_id)
            print(f"TotalInventory entries: {list(qs.values('id', 'item_id', 'location_id', 'available_quantity'))}")
            total_available = qs.aggregate(total=Sum('available_quantity'))['total'] or 0
            print(f"Total available quantity: {total_available}")
            return Response({"available_quantity": total_available})
            
    except Location.DoesNotExist:
        return Response({"error": "Location not found"}, status=404)