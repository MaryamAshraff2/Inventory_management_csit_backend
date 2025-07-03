from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q
from ..models import TotalInventory
from ..serializers import TotalInventoryRowSerializer


class TotalInventoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing TotalInventory records.
    Provides CRUD operations and additional actions for inventory management.
    """
    queryset = TotalInventory.objects.select_related('item', 'procurement', 'location').all()
    serializer_class = TotalInventoryRowSerializer

    def get_queryset(self):
        """
        Filter queryset based on query parameters.
        """
        queryset = super().get_queryset()
        
        # Filter by item
        item_id = self.request.query_params.get('item_id')
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        
        # Filter by location
        location_id = self.request.query_params.get('location_id')
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        
        # Filter by procurement
        procurement_id = self.request.query_params.get('procurement_id')
        if procurement_id:
            queryset = queryset.filter(procurement_id=procurement_id)
        
        # Filter by available quantity
        min_quantity = self.request.query_params.get('min_quantity')
        if min_quantity:
            try:
                queryset = queryset.filter(available_quantity__gte=int(min_quantity))
            except ValueError:
                pass
        
        # Search by item name
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(item__name__icontains=search) |
                Q(order_number__icontains=search) |
                Q(supplier__icontains=search)
            )
        
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get inventory summary statistics.
        """
        total_items = self.get_queryset().values('item').distinct().count()
        total_locations = self.get_queryset().values('location').distinct().count()
        total_procurements = self.get_queryset().values('procurement').distinct().count()
        total_quantity = self.get_queryset().aggregate(
            total=Sum('available_quantity')
        )['total'] or 0
        
        return Response({
            'total_items': total_items,
            'total_locations': total_locations,
            'total_procurements': total_procurements,
            'total_quantity': total_quantity
        })

    @action(detail=False, methods=['get'])
    def by_item(self, request):
        """
        Get inventory grouped by item.
        Query parameter: item_id (optional)
        """
        item_id = request.query_params.get('item_id')
        queryset = self.get_queryset()
        
        if item_id:
            queryset = queryset.filter(item_id=item_id)
        
        # Group by item and aggregate quantities
        inventory_by_item = queryset.values('item__id', 'item__name').annotate(
            total_available=Sum('available_quantity'),
            location_count=Sum('location', distinct=True)
        )
        
        return Response(inventory_by_item)

    @action(detail=False, methods=['get'])
    def by_location(self, request):
        """
        Get inventory grouped by location.
        Query parameter: location_id (optional)
        """
        location_id = request.query_params.get('location_id')
        queryset = self.get_queryset()
        
        if location_id:
            queryset = queryset.filter(location_id=location_id)
        
        # Group by location and aggregate quantities
        inventory_by_location = queryset.values('location__id', 'location__name').annotate(
            total_available=Sum('available_quantity'),
            item_count=Sum('item', distinct=True)
        )
        
        return Response(inventory_by_location)

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """
        Get items with low stock (configurable threshold).
        Query parameter: threshold (default: 10)
        """
        threshold = int(request.query_params.get('threshold', 10))
        
        low_stock_items = self.get_queryset().values(
            'item__id', 'item__name', 'location__id', 'location__name'
        ).annotate(
            total_available=Sum('available_quantity')
        ).filter(
            total_available__lte=threshold
        ).order_by('total_available')
        
        return Response(low_stock_items)

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Bulk update inventory quantities.
        Expected data: list of objects with 'id' and 'available_quantity'
        """
        updates = request.data.get('updates', [])
        
        if not updates:
            return Response(
                {'error': 'No updates provided'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            updated_count = 0
            for update in updates:
                inventory_id = update.get('id')
                new_quantity = update.get('available_quantity')
                
                if inventory_id is not None and new_quantity is not None:
                    try:
                        inventory = TotalInventory.objects.get(id=inventory_id)
                        inventory.available_quantity = max(0, new_quantity)
                        inventory.save()
                        updated_count += 1
                    except TotalInventory.DoesNotExist:
                        continue
            
            return Response({
                'message': f'Successfully updated {updated_count} inventory records',
                'updated_count': updated_count
            })
            
        except Exception as e:
            return Response(
                {'error': f'Failed to update inventory: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 