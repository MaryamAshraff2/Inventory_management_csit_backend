from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.db import transaction
import json
import os
from datetime import datetime
from ..models import DeliveryNote, DeliveredItem, Item, User, Procurement, SendingStockRequest
from ..serializers import DeliveryNoteSerializer, DeliveredItemSerializer
from ..utils import log_audit_action


class DeliveryNoteViewSet(viewsets.ModelViewSet):
    queryset = DeliveryNote.objects.all()
    serializer_class = DeliveryNoteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        order_type = self.request.query_params.get('order_type')
        order_id = self.request.query_params.get('order_id')
        
        if order_type:
            queryset = queryset.filter(order_type=order_type)
        if order_id:
            queryset = queryset.filter(order_id=order_id)
        
        return queryset.order_by('-delivery_date', '-uploaded_at')

    def perform_destroy(self, instance):
        """Delete delivery note and its associated file"""
        # Delete the file from storage
        if instance.document:
            if default_storage.exists(instance.document.name):
                default_storage.delete(instance.document.name)
        
        # Log the action before deletion
        log_audit_action(
            'Delivery Note Deleted', 
            'DeliveryNote', 
            f"Deleted {instance.get_delivery_type_display()} for {instance.get_order_type_display()} #{instance.order_id}"
        )
        
        instance.delete()


@csrf_exempt
def delivery_note_upload_api(request):
    """API endpoint for uploading delivery note documents"""
    if request.method == 'POST':
        try:
            # Get form data
            order_type = request.POST.get('order_type')
            order_id = request.POST.get('order_id')
            delivery_type = request.POST.get('delivery_type')
            delivery_date = request.POST.get('delivery_date')
            document = request.FILES.get('document')
            delivered_items_json = request.POST.get('delivered_items')
            notes = request.POST.get('notes', '')
            uploaded_by_id = request.POST.get('uploaded_by')
            
            # Validate required fields
            if not order_type:
                return JsonResponse({'error': 'order_type is required'}, status=400)
            if not order_id:
                return JsonResponse({'error': 'order_id is required'}, status=400)
            if not delivery_type:
                return JsonResponse({'error': 'delivery_type is required'}, status=400)
            if not delivery_date:
                return JsonResponse({'error': 'delivery_date is required'}, status=400)
            if not document:
                return JsonResponse({'error': 'document is required'}, status=400)
            if not delivered_items_json:
                return JsonResponse({'error': 'delivered_items is required'}, status=400)
            if not uploaded_by_id:
                return JsonResponse({'error': 'uploaded_by is required'}, status=400)
            
            # Validate order_type
            if order_type not in ['procurement', 'transfer']:
                return JsonResponse({'error': 'order_type must be "procurement" or "transfer"'}, status=400)
            
            # Validate delivery_type
            if delivery_type not in ['full', 'partial']:
                return JsonResponse({'error': 'delivery_type must be "full" or "partial"'}, status=400)
            
            # Validate order exists
            try:
                if order_type == 'procurement':
                    order = Procurement.objects.get(id=order_id)
                else:  # transfer
                    order = SendingStockRequest.objects.get(id=order_id)
            except (Procurement.DoesNotExist, SendingStockRequest.DoesNotExist):
                return JsonResponse({'error': f'{order_type.capitalize()} order not found'}, status=404)
            
            # Validate user exists
            try:
                uploaded_by = User.objects.get(id=uploaded_by_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)
            
            # Parse delivery date
            try:
                parsed_date = datetime.strptime(delivery_date, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'error': 'Invalid delivery_date format. Use YYYY-MM-DD'}, status=400)
            
            # Parse delivered items JSON
            try:
                delivered_items_data = json.loads(delivered_items_json)
                if not isinstance(delivered_items_data, list):
                    return JsonResponse({'error': 'delivered_items must be a JSON array'}, status=400)
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid delivered_items JSON format'}, status=400)
            
            # Validate delivered items
            for item_data in delivered_items_data:
                if not all(key in item_data for key in ['item_id', 'lot_number', 'quantity']):
                    return JsonResponse({'error': 'Each delivered item must have item_id, lot_number, and quantity'}, status=400)
                
                try:
                    item = Item.objects.get(id=item_data['item_id'])
                except Item.DoesNotExist:
                    return JsonResponse({'error': f'Item with id {item_data["item_id"]} not found'}, status=404)
                
                if not isinstance(item_data['quantity'], int) or item_data['quantity'] <= 0:
                    return JsonResponse({'error': 'Quantity must be a positive integer'}, status=400)
            
            # Create delivery note with transaction
            with transaction.atomic():
                delivery_note = DeliveryNote.objects.create(
                    order_type=order_type,
                    order_id=order_id,
                    delivery_type=delivery_type,
                    delivery_date=parsed_date,
                    document=document,
                    uploaded_by=uploaded_by,
                    notes=notes
                )
                
                # Create delivered items
                delivered_items = []
                for item_data in delivered_items_data:
                    delivered_item = DeliveredItem.objects.create(
                        delivery_note=delivery_note,
                        item_id=item_data['item_id'],
                        lot_number=item_data['lot_number'],
                        quantity=item_data['quantity']
                    )
                    delivered_items.append(delivered_item)
            
            # Log the action
            log_audit_action(
                'Delivery Note Uploaded', 
                'DeliveryNote', 
                f"Uploaded {delivery_note.get_delivery_type_display()} for {delivery_note.get_order_type_display()} #{delivery_note.order_id}"
            )
            
            # Return response in the specified format
            return JsonResponse({
                'id': delivery_note.id,
                'order_type': delivery_note.order_type,
                'order_id': delivery_note.order_id,
                'delivery_type': delivery_note.delivery_type,
                'delivery_date': delivery_note.delivery_date.isoformat(),
                'document': delivery_note.document.url if delivery_note.document else None,
                'uploaded_by': delivery_note.uploaded_by.id,
                'uploaded_at': delivery_note.uploaded_at.isoformat(),
                'delivered_items': [
                    {
                        'item_id': item.item.id,
                        'lot_number': item.lot_number,
                        'quantity': item.quantity
                    }
                    for item in delivered_items
                ],
                'notes': delivery_note.notes or ''
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def delivery_note_delete_api(request, delivery_note_id):
    """API endpoint for deleting delivery note documents"""
    if request.method == 'DELETE':
        try:
            # Get the delivery note
            try:
                delivery_note = DeliveryNote.objects.get(id=delivery_note_id)
            except DeliveryNote.DoesNotExist:
                return JsonResponse({'error': 'Delivery note not found'}, status=404)
            
            # Delete the file from storage
            if delivery_note.document:
                if default_storage.exists(delivery_note.document.name):
                    default_storage.delete(delivery_note.document.name)
            
            # Log the action before deletion
            log_audit_action(
                'Delivery Note Deleted', 
                'DeliveryNote', 
                f"Deleted {delivery_note.get_delivery_type_display()} for {delivery_note.get_order_type_display()} #{delivery_note.order_id}"
            )
            
            # Delete the record (delivered items will be deleted automatically due to CASCADE)
            delivery_note.delete()
            
            return JsonResponse({'message': 'Delivery note deleted successfully'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405) 