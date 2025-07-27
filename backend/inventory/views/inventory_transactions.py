from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.db.models import Q, Count, Sum
from datetime import datetime
from ..models import StockMovement, Item, Location, User
from ..serializers import StockMovementSerializer


@api_view(['GET'])
def inventory_transactions_api(request):
    """API endpoint for inventory transactions filtered by date range"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Validate date parameters
        if not start_date or not end_date:
            return JsonResponse({
                'error': 'Both start_date and end_date parameters are required (YYYY-MM-DD format)'
            }, status=400)
        
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({
                'error': 'Invalid date format. Use YYYY-MM-DD format for dates'
            }, status=400)
        
        # Validate date range
        if start_date_obj > end_date_obj:
            return JsonResponse({
                'error': 'start_date cannot be after end_date'
            }, status=400)
        
        # Get transactions within the date range
        transactions = StockMovement.objects.filter(
            movement_date__range=[start_date_obj, end_date_obj]
        ).select_related(
            'item', 'from_location', 'to_location', 'moved_by'
        ).order_by('-movement_date', '-id')
        
        # Build response data
        transactions_data = []
        for transaction in transactions:
            transactions_data.append({
                'transaction_id': transaction.id,
                'item_id': transaction.item.id,
                'item_name': transaction.item.name,
                'from_location': transaction.from_location.name if transaction.from_location else 'N/A',
                'to_location': transaction.to_location.name if transaction.to_location else 'N/A',
                'quantity': transaction.quantity,
                'movement_date': transaction.movement_date.isoformat(),
                'moved_by': f"{transaction.moved_by.first_name} {transaction.moved_by.last_name}" if transaction.moved_by else 'Unknown',
                'notes': transaction.notes or ''
            })
        
        return JsonResponse(transactions_data, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def inventory_transactions_summary_api(request):
    """API endpoint for inventory transactions summary statistics"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Validate date parameters
        if not start_date or not end_date:
            return JsonResponse({
                'error': 'Both start_date and end_date parameters are required (YYYY-MM-DD format)'
            }, status=400)
        
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({
                'error': 'Invalid date format. Use YYYY-MM-DD format for dates'
            }, status=400)
        
        # Validate date range
        if start_date_obj > end_date_obj:
            return JsonResponse({
                'error': 'start_date cannot be after end_date'
            }, status=400)
        
        # Get transactions within the date range
        transactions = StockMovement.objects.filter(
            movement_date__range=[start_date_obj, end_date_obj]
        ).select_related(
            'item', 'from_location', 'to_location', 'moved_by'
        )
        
        # Calculate summary statistics
        total_transactions = transactions.count()
        total_quantity_moved = sum(t.quantity for t in transactions)
        
        # Unique items moved
        unique_items = transactions.values('item').distinct().count()
        
        # Unique locations involved
        from_locations = transactions.values('from_location').distinct().count()
        to_locations = transactions.values('to_location').distinct().count()
        unique_locations = from_locations + to_locations
        
        # Unique users who made movements
        unique_users = transactions.values('moved_by').distinct().count()
        
        # Daily breakdown
        daily_breakdown = transactions.values('movement_date').annotate(
            transaction_count=Count('id'),
            total_quantity=Sum('quantity')
        ).order_by('movement_date')
        
        # Top moved items
        top_items = transactions.values(
            'item__name', 'item__id'
        ).annotate(
            total_quantity=Sum('quantity'),
            transaction_count=Count('id')
        ).order_by('-total_quantity')[:10]
        
        # Top locations (by movements)
        top_from_locations = transactions.values(
            'from_location__name'
        ).annotate(
            movement_count=Count('id')
        ).order_by('-movement_count')[:5]
        
        top_to_locations = transactions.values(
            'to_location__name'
        ).annotate(
            movement_count=Count('id')
        ).order_by('-movement_count')[:5]
        
        # Top users (by movements)
        top_users = transactions.values(
            'moved_by__first_name', 'moved_by__last_name'
        ).annotate(
            movement_count=Count('id')
        ).order_by('-movement_count')[:5]
        
        return JsonResponse({
            'date_range': {
                'start_date': start_date,
                'end_date': end_date
            },
            'summary': {
                'total_transactions': total_transactions,
                'total_quantity_moved': total_quantity_moved,
                'unique_items': unique_items,
                'unique_locations': unique_locations,
                'unique_users': unique_users
            },
            'daily_breakdown': list(daily_breakdown),
            'top_items': list(top_items),
            'top_from_locations': list(top_from_locations),
            'top_to_locations': list(top_to_locations),
            'top_users': list(top_users)
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['GET'])
def inventory_transactions_export_api(request):
    """API endpoint for exporting inventory transactions as CSV"""
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Validate date parameters
        if not start_date or not end_date:
            return JsonResponse({
                'error': 'Both start_date and end_date parameters are required (YYYY-MM-DD format)'
            }, status=400)
        
        try:
            start_date_obj = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_obj = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return JsonResponse({
                'error': 'Invalid date format. Use YYYY-MM-DD format for dates'
            }, status=400)
        
        # Validate date range
        if start_date_obj > end_date_obj:
            return JsonResponse({
                'error': 'start_date cannot be after end_date'
            }, status=400)
        
        # Get transactions within the date range
        transactions = StockMovement.objects.filter(
            movement_date__range=[start_date_obj, end_date_obj]
        ).select_related(
            'item', 'from_location', 'to_location', 'moved_by'
        ).order_by('-movement_date', '-id')
        
        # Build CSV data
        csv_content = 'Transaction ID,Item ID,Item Name,From Location,To Location,Quantity,Movement Date,Moved By,Notes\n'
        
        for transaction in transactions:
            moved_by_name = f"{transaction.moved_by.first_name} {transaction.moved_by.last_name}" if transaction.moved_by else 'Unknown'
            from_location = transaction.from_location.name if transaction.from_location else 'N/A'
            to_location = transaction.to_location.name if transaction.to_location else 'N/A'
            notes = (transaction.notes or '').replace('"', '""')  # Escape quotes for CSV
            
            csv_content += f'{transaction.id},{transaction.item.id},"{transaction.item.name}","{from_location}","{to_location}",{transaction.quantity},{transaction.movement_date},"{moved_by_name}","{notes}"\n'
        
        # Return CSV data
        return JsonResponse({
            'csv_data': csv_content,
            'filename': f'inventory_transactions_{start_date}_to_{end_date}.csv',
            'total_transactions': transactions.count()
        })
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500) 