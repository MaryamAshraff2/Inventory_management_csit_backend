from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.db.models import Sum, Q, Count
from django.utils import timezone
from ..models import Item, InventoryByLocation, Location, Category
from ..serializers import ItemSerializer


@api_view(['GET'])
def stock_in_hand_api(request):
    """API endpoint for stock in hand - full view or store-specific view"""
    try:
        store_id = request.GET.get('store')
        
        if store_id:
            # Store-specific view
            return get_store_specific_stock(request, store_id)
        else:
            # Full view
            return get_full_stock_view(request)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_full_stock_view(request):
    """Get full stock view with quantities across all stores"""
    try:
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location').all()
        
        stock_data = []
        
        for item in items:
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Build store quantities list
            store_quantities = []
            for inv in inventory_data:
                if inv.quantity > 0:  # Only include stores with stock
                    store_quantities.append({
                        'store_id': inv.location.id,
                        'store_name': inv.location.name,
                        'quantity': inv.quantity
                    })
            
            # Get last updated time (most recent inventory update)
            last_updated = None
            if inventory_data:
                last_updated = max(inv.last_updated for inv in inventory_data if inv.last_updated)
            
            stock_data.append({
                'item_id': item.id,
                'item_name': item.name,
                'item_code': item.code or '',
                'unit': item.unit or '',
                'category': item.category.name if item.category else '',
                'total_quantity': total_quantity,
                'store_quantities': store_quantities,
                'last_updated': last_updated.isoformat() if last_updated else None
            })
        
        # Filter out items with zero total quantity if requested
        show_zero_stock = request.GET.get('show_zero_stock', 'true').lower() == 'true'
        if not show_zero_stock:
            stock_data = [item for item in stock_data if item['total_quantity'] > 0]
        
        return JsonResponse(stock_data, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_store_specific_stock(request, store_id):
    """Get stock view for a specific store"""
    try:
        # Validate store exists
        try:
            store = Location.objects.get(id=store_id)
        except Location.DoesNotExist:
            return JsonResponse({'error': 'Store not found'}, status=404)
        
        # Get inventory data for this specific store
        inventory_data = InventoryByLocation.objects.filter(
            location_id=store_id
        ).select_related('item', 'item__category', 'location')
        
        stock_data = []
        
        for inv in inventory_data:
            if inv.quantity > 0:  # Only include items with stock
                stock_data.append({
                    'item_id': inv.item.id,
                    'item_name': inv.item.name,
                    'item_code': inv.item.code or '',
                    'unit': inv.item.unit or '',
                    'category': inv.item.category.name if inv.item.category else '',
                    'quantity': inv.quantity,
                    'store_id': inv.location.id,
                    'store_name': inv.location.name,
                    'last_updated': inv.last_updated.isoformat() if inv.last_updated else None
                })
        
        # Filter out zero quantity items if requested
        show_zero_stock = request.GET.get('show_zero_stock', 'true').lower() == 'true'
        if not show_zero_stock:
            stock_data = [item for item in stock_data if item['quantity'] > 0]
        
        return JsonResponse(stock_data, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def stock_in_hand_summary_api(request):
    """API endpoint for stock in hand summary statistics"""
    try:
        store_id = request.GET.get('store')
        
        if store_id:
            # Store-specific summary
            return get_store_summary(request, store_id)
        else:
            # Full summary
            return get_full_summary(request)
            
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_full_summary(request):
    """Get summary statistics for all stores"""
    try:
        # Total items with stock
        total_items_with_stock = InventoryByLocation.objects.filter(
            quantity__gt=0
        ).values('item').distinct().count()
        
        # Total items
        total_items = Item.objects.count()
        
        # Total quantity across all stores
        total_quantity = InventoryByLocation.objects.aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        # Store-wise breakdown
        store_breakdown = []
        stores = Location.objects.all()
        
        for store in stores:
            store_quantity = InventoryByLocation.objects.filter(
                location=store
            ).aggregate(total=Sum('quantity'))['total'] or 0
            
            store_items = InventoryByLocation.objects.filter(
                location=store,
                quantity__gt=0
            ).count()
            
            store_breakdown.append({
                'store_id': store.id,
                'store_name': store.name,
                'total_quantity': store_quantity,
                'items_with_stock': store_items
            })
        
        return JsonResponse({
            'total_items': total_items,
            'total_items_with_stock': total_items_with_stock,
            'total_quantity': total_quantity,
            'store_breakdown': store_breakdown
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


def get_store_summary(request, store_id):
    """Get summary statistics for a specific store"""
    try:
        # Validate store exists
        try:
            store = Location.objects.get(id=store_id)
        except Location.DoesNotExist:
            return JsonResponse({'error': 'Store not found'}, status=404)
        
        # Store-specific statistics
        store_quantity = InventoryByLocation.objects.filter(
            location_id=store_id
        ).aggregate(total=Sum('quantity'))['total'] or 0
        
        store_items_with_stock = InventoryByLocation.objects.filter(
            location_id=store_id,
            quantity__gt=0
        ).count()
        
        total_items_in_store = InventoryByLocation.objects.filter(
            location_id=store_id
        ).count()
        
        # Category breakdown for this store
        category_breakdown = InventoryByLocation.objects.filter(
            location_id=store_id,
            quantity__gt=0
        ).values(
            'item__category__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            item_count=Count('item', distinct=True)
        )
        
        return JsonResponse({
            'store_id': store.id,
            'store_name': store.name,
            'total_items': total_items_in_store,
            'items_with_stock': store_items_with_stock,
            'total_quantity': store_quantity,
            'category_breakdown': list(category_breakdown)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 