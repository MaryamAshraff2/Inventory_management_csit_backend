from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction
import json
from datetime import datetime
from ..models import ReceivingNote, ReceivedItem, DeliveryNote, Item, User
from ..serializers import ReceivingNoteSerializer, ReceivedItemSerializer
from ..utils import log_audit_action


class ReceivingNoteViewSet(viewsets.ModelViewSet):
    queryset = ReceivingNote.objects.all()
    serializer_class = ReceivingNoteSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        delivery_note_id = self.request.query_params.get('delivery_note_id')
        
        if delivery_note_id:
            queryset = queryset.filter(delivery_note_id=delivery_note_id)
        
        return queryset.order_by('-receiving_date', '-uploaded_at')

    def perform_destroy(self, instance):
        """Delete receiving note and log the action"""
        # Log the action before deletion
        log_audit_action(
            'Receiving Note Deleted', 
            'ReceivingNote', 
            f"Deleted {instance.get_receiving_type_display()} for Delivery Note #{instance.delivery_note.id}"
        )
        
        instance.delete()


@csrf_exempt
def receiving_note_create_api(request):
    """API endpoint for creating receiving notes"""
    if request.method == 'POST':
        try:
            # Parse JSON data
            data = json.loads(request.body)
            
            # Extract fields
            delivery_note_id = data.get('delivery_note')
            receiving_type = data.get('receiving_type')
            receiving_date = data.get('receiving_date')
            received_items_data = data.get('received_items')
            received_by_id = data.get('received_by')
            notes = data.get('notes', '')
            uploaded_by_id = data.get('uploaded_by')
            
            # Validate required fields
            if not delivery_note_id:
                return JsonResponse({'error': 'delivery_note is required'}, status=400)
            if not receiving_type:
                return JsonResponse({'error': 'receiving_type is required'}, status=400)
            if not receiving_date:
                return JsonResponse({'error': 'receiving_date is required'}, status=400)
            if not received_items_data:
                return JsonResponse({'error': 'received_items is required'}, status=400)
            if not received_by_id:
                return JsonResponse({'error': 'received_by is required'}, status=400)
            if not uploaded_by_id:
                return JsonResponse({'error': 'uploaded_by is required'}, status=400)
            
            # Validate receiving_type
            if receiving_type not in ['full', 'partial']:
                return JsonResponse({'error': 'receiving_type must be "full" or "partial"'}, status=400)
            
            # Validate delivery note exists
            try:
                delivery_note = DeliveryNote.objects.get(id=delivery_note_id)
            except DeliveryNote.DoesNotExist:
                return JsonResponse({'error': 'Delivery note not found'}, status=404)
            
            # Validate users exist
            try:
                received_by = User.objects.get(id=received_by_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Received by user not found'}, status=404)
            
            try:
                uploaded_by = User.objects.get(id=uploaded_by_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'Uploaded by user not found'}, status=404)
            
            # Parse receiving date
            try:
                parsed_date = datetime.strptime(receiving_date, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'error': 'Invalid receiving_date format. Use YYYY-MM-DD'}, status=400)
            
            # Validate received items
            if not isinstance(received_items_data, list):
                return JsonResponse({'error': 'received_items must be a JSON array'}, status=400)
            
            for item_data in received_items_data:
                if not all(key in item_data for key in ['item_id', 'lot_number', 'quantity']):
                    return JsonResponse({'error': 'Each received item must have item_id, lot_number, and quantity'}, status=400)
                
                try:
                    item = Item.objects.get(id=item_data['item_id'])
                except Item.DoesNotExist:
                    return JsonResponse({'error': f'Item with id {item_data["item_id"]} not found'}, status=404)
                
                if not isinstance(item_data['quantity'], int) or item_data['quantity'] <= 0:
                    return JsonResponse({'error': 'Quantity must be a positive integer'}, status=400)
            
            # Create receiving note with transaction
            with transaction.atomic():
                receiving_note = ReceivingNote.objects.create(
                    delivery_note=delivery_note,
                    receiving_type=receiving_type,
                    receiving_date=parsed_date,
                    received_by=received_by,
                    uploaded_by=uploaded_by,
                    notes=notes
                )
                
                # Create received items
                received_items = []
                for item_data in received_items_data:
                    received_item = ReceivedItem.objects.create(
                        receiving_note=receiving_note,
                        item_id=item_data['item_id'],
                        lot_number=item_data['lot_number'],
                        quantity=item_data['quantity']
                    )
                    received_items.append(received_item)
            
            # Log the action
            log_audit_action(
                'Receiving Note Created', 
                'ReceivingNote', 
                f"Created {receiving_note.get_receiving_type_display()} for Delivery Note #{receiving_note.delivery_note.id}"
            )
            
            # Return response in the specified format
            return JsonResponse({
                'id': receiving_note.id,
                'delivery_note': receiving_note.delivery_note.id,
                'receiving_type': receiving_note.receiving_type,
                'receiving_date': receiving_note.receiving_date.isoformat(),
                'received_items': [
                    {
                        'item_id': item.item.id,
                        'lot_number': item.lot_number,
                        'quantity': item.quantity
                    }
                    for item in received_items
                ],
                'received_by': receiving_note.received_by.id,
                'notes': receiving_note.notes or '',
                'uploaded_by': receiving_note.uploaded_by.id,
                'uploaded_at': receiving_note.uploaded_at.isoformat()
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON format'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def receiving_note_delete_api(request, receiving_note_id):
    """API endpoint for deleting receiving notes"""
    if request.method == 'DELETE':
        try:
            # Get the receiving note
            try:
                receiving_note = ReceivingNote.objects.get(id=receiving_note_id)
            except ReceivingNote.DoesNotExist:
                return JsonResponse({'error': 'Receiving note not found'}, status=404)
            
            # Log the action before deletion
            log_audit_action(
                'Receiving Note Deleted', 
                'ReceivingNote', 
                f"Deleted {receiving_note.get_receiving_type_display()} for Delivery Note #{receiving_note.delivery_note.id}"
            )
            
            # Delete the record (received items will be deleted automatically due to CASCADE)
            receiving_note.delete()
            
            return JsonResponse({'message': 'Receiving note deleted successfully'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405) 