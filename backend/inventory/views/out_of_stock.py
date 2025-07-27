from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.db.models import Sum, Q
from django.utils import timezone
from ..models import Item, InventoryByLocation, Location, Category
from ..serializers import ItemSerializer


@api_view(['GET'])
def out_of_stock_api(request):
    """API endpoint for out of stock items - items with zero quantity across all stores"""
    try:
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location').all()
        
        out_of_stock_data = []
        
        for item in items:
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Check if item is completely out of stock
            if total_quantity == 0:
                # Build store quantities list (all will be 0)
                store_quantities = []
                for inv in inventory_data:
                    store_quantities.append({
                        'store_id': inv.location.id,
                        'store_name': inv.location.name,
                        'quantity': inv.quantity
                    })
                
                # Get last updated time (most recent inventory update)
                last_updated = None
                if inventory_data:
                    last_updated = max(inv.last_updated for inv in inventory_data if inv.last_updated)
                
                out_of_stock_data.append({
                    'item_id': item.id,
                    'item_name': item.name,
                    'item_code': item.code or '',
                    'unit': item.unit or '',
                    'category': item.category.name if item.category else 'Uncategorized',
                    'total_quantity': total_quantity,
                    'store_quantities': store_quantities,
                    'last_updated': last_updated.isoformat() if last_updated else None
                })
        
        # Sort by item name for better organization
        out_of_stock_data.sort(key=lambda x: x['item_name'])
        
        return JsonResponse(out_of_stock_data, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def out_of_stock_summary_api(request):
    """API endpoint for out of stock summary statistics"""
    try:
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location').all()
        
        total_items = 0
        total_out_of_stock_items = 0
        category_breakdown = {}
        store_breakdown = {}
        
        for item in items:
            total_items += 1
            
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Check if item is completely out of stock
            if total_quantity == 0:
                total_out_of_stock_items += 1
                
                # Category breakdown
                category_name = item.category.name if item.category else 'Uncategorized'
                if category_name not in category_breakdown:
                    category_breakdown[category_name] = {
                        'count': 0,
                        'items': []
                    }
                
                category_breakdown[category_name]['count'] += 1
                category_breakdown[category_name]['items'].append({
                    'item_id': item.id,
                    'item_name': item.name,
                    'item_code': item.code or ''
                })
                
                # Store breakdown (items that are out of stock in each store)
                for inv in inventory_data:
                    store_name = inv.location.name
                    if store_name not in store_breakdown:
                        store_breakdown[store_name] = {
                            'count': 0,
                            'items': []
                        }
                    
                    store_breakdown[store_name]['count'] += 1
                    if item.name not in [i['item_name'] for i in store_breakdown[store_name]['items']]:
                        store_breakdown[store_name]['items'].append({
                            'item_id': item.id,
                            'item_name': item.name,
                            'item_code': item.code or ''
                        })
        
        # Sort category breakdown by count
        sorted_categories = sorted(
            category_breakdown.items(), 
            key=lambda x: x[1]['count'], 
            reverse=True
        )
        
        # Sort store breakdown by count
        sorted_stores = sorted(
            store_breakdown.items(), 
            key=lambda x: x[1]['count'], 
            reverse=True
        )
        
        return JsonResponse({
            'summary': {
                'total_items': total_items,
                'total_out_of_stock_items': total_out_of_stock_items,
                'percentage_out_of_stock': (total_out_of_stock_items / total_items * 100) if total_items > 0 else 0
            },
            'category_breakdown': dict(sorted_categories),
            'store_breakdown': dict(sorted_stores)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def out_of_stock_export_api(request):
    """API endpoint for exporting out of stock items as CSV"""
    try:
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location').all()
        
        # Build CSV data
        csv_content = 'Item ID,Item Name,Item Code,Unit,Category,Total Quantity,Stores,Last Updated\n'
        
        for item in items:
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Check if item is completely out of stock
            if total_quantity == 0:
                # Build store quantities string
                store_quantities = []
                for inv in inventory_data:
                    store_quantities.append(f"{inv.location.name}: {inv.quantity}")
                
                stores_str = "; ".join(store_quantities) if store_quantities else "No stores"
                
                # Get last updated time
                last_updated = None
                if inventory_data:
                    last_updated = max(inv.last_updated for inv in inventory_data if inv.last_updated)
                
                # Escape quotes for CSV
                item_name = item.name.replace('"', '""')
                item_code = (item.code or '').replace('"', '""')
                unit = (item.unit or '').replace('"', '""')
                category = (item.category.name if item.category else 'Uncategorized').replace('"', '""')
                stores_str = stores_str.replace('"', '""')
                
                csv_content += f'{item.id},"{item_name}","{item_code}","{unit}","{category}",{total_quantity},"{stores_str}","{last_updated}"\n'
        
        # Return CSV data
        return JsonResponse({
            'csv_data': csv_content,
            'filename': f'out_of_stock_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv',
            'total_out_of_stock_items': len([item for item in items if sum(inv.quantity for inv in InventoryByLocation.objects.filter(item=item)) == 0])
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def out_of_stock_by_category_api(request):
    """API endpoint for out of stock items grouped by category"""
    try:
        category_name = request.GET.get('category')
        
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location')
        
        if category_name:
            items = items.filter(category__name=category_name)
        
        out_of_stock_by_category = {}
        
        for item in items:
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Check if item is completely out of stock
            if total_quantity == 0:
                category_name = item.category.name if item.category else 'Uncategorized'
                
                if category_name not in out_of_stock_by_category:
                    out_of_stock_by_category[category_name] = []
                
                # Build store quantities list
                store_quantities = []
                for inv in inventory_data:
                    store_quantities.append({
                        'store_id': inv.location.id,
                        'store_name': inv.location.name,
                        'quantity': inv.quantity
                    })
                
                # Get last updated time
                last_updated = None
                if inventory_data:
                    last_updated = max(inv.last_updated for inv in inventory_data if inv.last_updated)
                
                out_of_stock_by_category[category_name].append({
                    'item_id': item.id,
                    'item_name': item.name,
                    'item_code': item.code or '',
                    'unit': item.unit or '',
                    'category': category_name,
                    'total_quantity': total_quantity,
                    'store_quantities': store_quantities,
                    'last_updated': last_updated.isoformat() if last_updated else None
                })
        
        # Sort items within each category by name
        for category in out_of_stock_by_category:
            out_of_stock_by_category[category].sort(key=lambda x: x['item_name'])
        
        return JsonResponse(out_of_stock_by_category, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def out_of_stock_by_store_api(request):
    """API endpoint for out of stock items grouped by store"""
    try:
        store_id = request.GET.get('store')
        
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location')
        
        if store_id:
            items = items.filter(inventory_by_location__location_id=store_id)
        
        out_of_stock_by_store = {}
        
        for item in items:
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Check if item is completely out of stock
            if total_quantity == 0:
                # Group by store where the item is out of stock
                for inv in inventory_data:
                    store_name = inv.location.name
                    
                    if store_name not in out_of_stock_by_store:
                        out_of_stock_by_store[store_name] = []
                    
                    # Check if item is already in this store's list
                    if not any(i['item_id'] == item.id for i in out_of_stock_by_store[store_name]):
                        out_of_stock_by_store[store_name].append({
                            'item_id': item.id,
                            'item_name': item.name,
                            'item_code': item.code or '',
                            'unit': item.unit or '',
                            'category': item.category.name if item.category else 'Uncategorized',
                            'total_quantity': total_quantity,
                            'last_updated': max(inv.last_updated for inv in inventory_data if inv.last_updated).isoformat() if inventory_data else None
                        })
        
        # Sort items within each store by name
        for store in out_of_stock_by_store:
            out_of_stock_by_store[store].sort(key=lambda x: x['item_name'])
        
        return JsonResponse(out_of_stock_by_store, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 