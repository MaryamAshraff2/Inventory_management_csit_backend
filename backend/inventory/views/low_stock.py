from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.db.models import Sum, Q
from django.utils import timezone
from ..models import Item, InventoryByLocation, Location, Category
from ..serializers import ItemSerializer


@api_view(['GET'])
def low_stock_api(request):
    """API endpoint for low stock items - items below minimum threshold"""
    try:
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location').all()
        
        low_stock_data = []
        
        for item in items:
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Check if item is below minimum threshold
            min_threshold = item.min_threshold or 0
            if total_quantity < min_threshold:
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
                
                low_stock_data.append({
                    'item_id': item.id,
                    'item_name': item.name,
                    'item_code': item.code or '',
                    'unit': item.unit or '',
                    'min_threshold': min_threshold,
                    'total_quantity': total_quantity,
                    'store_quantities': store_quantities,
                    'last_updated': last_updated.isoformat() if last_updated else None
                })
        
        # Sort by urgency (items with lowest quantity relative to threshold first)
        low_stock_data.sort(key=lambda x: (x['total_quantity'] / x['min_threshold']) if x['min_threshold'] > 0 else 0)
        
        return JsonResponse(low_stock_data, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def low_stock_summary_api(request):
    """API endpoint for low stock summary statistics"""
    try:
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location').all()
        
        total_items = 0
        total_low_stock_items = 0
        total_quantity_deficit = 0
        category_breakdown = {}
        urgency_levels = {
            'critical': 0,  # 0-25% of threshold
            'warning': 0,   # 25-50% of threshold
            'notice': 0     # 50-100% of threshold
        }
        
        for item in items:
            total_items += 1
            
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Check if item is below minimum threshold
            min_threshold = item.min_threshold or 0
            if total_quantity < min_threshold:
                total_low_stock_items += 1
                quantity_deficit = min_threshold - total_quantity
                total_quantity_deficit += quantity_deficit
                
                # Categorize by urgency
                if min_threshold > 0:
                    percentage = (total_quantity / min_threshold) * 100
                    if percentage <= 25:
                        urgency_levels['critical'] += 1
                    elif percentage <= 50:
                        urgency_levels['warning'] += 1
                    else:
                        urgency_levels['notice'] += 1
                
                # Category breakdown
                category_name = item.category.name if item.category else 'Uncategorized'
                if category_name not in category_breakdown:
                    category_breakdown[category_name] = {
                        'count': 0,
                        'total_deficit': 0,
                        'items': []
                    }
                
                category_breakdown[category_name]['count'] += 1
                category_breakdown[category_name]['total_deficit'] += quantity_deficit
                category_breakdown[category_name]['items'].append({
                    'item_id': item.id,
                    'item_name': item.name,
                    'current_quantity': total_quantity,
                    'min_threshold': min_threshold,
                    'deficit': quantity_deficit
                })
        
        # Sort category breakdown by count
        sorted_categories = sorted(
            category_breakdown.items(), 
            key=lambda x: x[1]['count'], 
            reverse=True
        )
        
        return JsonResponse({
            'summary': {
                'total_items': total_items,
                'total_low_stock_items': total_low_stock_items,
                'total_quantity_deficit': total_quantity_deficit,
                'percentage_low_stock': (total_low_stock_items / total_items * 100) if total_items > 0 else 0
            },
            'urgency_levels': urgency_levels,
            'category_breakdown': dict(sorted_categories)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def low_stock_export_api(request):
    """API endpoint for exporting low stock items as CSV"""
    try:
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location').all()
        
        # Build CSV data
        csv_content = 'Item ID,Item Name,Item Code,Unit,Category,Min Threshold,Total Quantity,Deficit,Stores,Last Updated\n'
        
        for item in items:
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Check if item is below minimum threshold
            min_threshold = item.min_threshold or 0
            if total_quantity < min_threshold:
                # Build store quantities string
                store_quantities = []
                for inv in inventory_data:
                    if inv.quantity > 0:
                        store_quantities.append(f"{inv.location.name}: {inv.quantity}")
                
                stores_str = "; ".join(store_quantities) if store_quantities else "No stock"
                
                # Get last updated time
                last_updated = None
                if inventory_data:
                    last_updated = max(inv.last_updated for inv in inventory_data if inv.last_updated)
                
                # Calculate deficit
                deficit = min_threshold - total_quantity
                
                # Escape quotes for CSV
                item_name = item.name.replace('"', '""')
                item_code = (item.code or '').replace('"', '""')
                unit = (item.unit or '').replace('"', '""')
                category = (item.category.name if item.category else 'Uncategorized').replace('"', '""')
                stores_str = stores_str.replace('"', '""')
                
                csv_content += f'{item.id},"{item_name}","{item_code}","{unit}","{category}",{min_threshold},{total_quantity},{deficit},"{stores_str}","{last_updated}"\n'
        
        # Return CSV data
        return JsonResponse({
            'csv_data': csv_content,
            'filename': f'low_stock_report_{timezone.now().strftime("%Y%m%d_%H%M%S")}.csv',
            'total_low_stock_items': len([item for item in items if sum(inv.quantity for inv in InventoryByLocation.objects.filter(item=item)) < (item.min_threshold or 0)])
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def low_stock_by_category_api(request):
    """API endpoint for low stock items grouped by category"""
    try:
        category_name = request.GET.get('category')
        
        # Get all items with their inventory data
        items = Item.objects.prefetch_related('category', 'inventory_by_location__location')
        
        if category_name:
            items = items.filter(category__name=category_name)
        
        low_stock_by_category = {}
        
        for item in items:
            # Get inventory data for this item across all locations
            inventory_data = InventoryByLocation.objects.filter(item=item).select_related('location')
            
            # Calculate total quantity
            total_quantity = sum(inv.quantity for inv in inventory_data)
            
            # Check if item is below minimum threshold
            min_threshold = item.min_threshold or 0
            if total_quantity < min_threshold:
                category_name = item.category.name if item.category else 'Uncategorized'
                
                if category_name not in low_stock_by_category:
                    low_stock_by_category[category_name] = []
                
                # Build store quantities list
                store_quantities = []
                for inv in inventory_data:
                    if inv.quantity > 0:
                        store_quantities.append({
                            'store_id': inv.location.id,
                            'store_name': inv.location.name,
                            'quantity': inv.quantity
                        })
                
                # Get last updated time
                last_updated = None
                if inventory_data:
                    last_updated = max(inv.last_updated for inv in inventory_data if inv.last_updated)
                
                low_stock_by_category[category_name].append({
                    'item_id': item.id,
                    'item_name': item.name,
                    'item_code': item.code or '',
                    'unit': item.unit or '',
                    'min_threshold': min_threshold,
                    'total_quantity': total_quantity,
                    'deficit': min_threshold - total_quantity,
                    'store_quantities': store_quantities,
                    'last_updated': last_updated.isoformat() if last_updated else None
                })
        
        # Sort items within each category by deficit (highest first)
        for category in low_stock_by_category:
            low_stock_by_category[category].sort(key=lambda x: x['deficit'], reverse=True)
        
        return JsonResponse(low_stock_by_category, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 