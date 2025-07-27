from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
import json
import os
from datetime import datetime
from ..models import AmendmentOrder, ContractSchedule, User
from ..serializers import AmendmentOrderSerializer
from ..utils import log_audit_action


class AmendmentOrderViewSet(viewsets.ModelViewSet):
    queryset = AmendmentOrder.objects.all()
    serializer_class = AmendmentOrderSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        contract_schedule_id = self.request.query_params.get('contract_schedule_id')
        
        if contract_schedule_id:
            queryset = queryset.filter(contract_schedule_id=contract_schedule_id)
        
        return queryset.order_by('-amendment_date', '-uploaded_at')

    def perform_destroy(self, instance):
        """Delete amendment order and its associated file"""
        # Delete the file from storage
        if instance.document:
            if default_storage.exists(instance.document.name):
                default_storage.delete(instance.document.name)
        
        # Log the action before deletion
        log_audit_action(
            'Amendment Order Deleted', 
            'AmendmentOrder', 
            f"Deleted amendment order '{instance.title}' for contract schedule '{instance.contract_schedule.title}'"
        )
        
        instance.delete()


@csrf_exempt
def amendment_order_upload_api(request, contract_schedule_id):
    """API endpoint for uploading amendment order documents"""
    if request.method == 'POST':
        try:
            # Get form data
            title = request.POST.get('title')
            document = request.FILES.get('document')
            reason = request.POST.get('reason')
            notes = request.POST.get('notes', '')
            amendment_date = request.POST.get('amendment_date')
            uploaded_by_id = request.POST.get('uploaded_by')
            
            # Validate required fields
            if not title:
                return JsonResponse({'error': 'title is required'}, status=400)
            if not document:
                return JsonResponse({'error': 'document is required'}, status=400)
            if not reason:
                return JsonResponse({'error': 'reason is required'}, status=400)
            if not amendment_date:
                return JsonResponse({'error': 'amendment_date is required'}, status=400)
            if not uploaded_by_id:
                return JsonResponse({'error': 'uploaded_by is required'}, status=400)
            
            # Validate contract schedule exists
            try:
                contract_schedule = ContractSchedule.objects.get(id=contract_schedule_id)
            except ContractSchedule.DoesNotExist:
                return JsonResponse({'error': 'Contract schedule not found'}, status=404)
            
            # Validate user exists
            try:
                uploaded_by = User.objects.get(id=uploaded_by_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)
            
            # Parse amendment date
            try:
                parsed_date = datetime.strptime(amendment_date, '%Y-%m-%d').date()
            except ValueError:
                return JsonResponse({'error': 'Invalid amendment_date format. Use YYYY-MM-DD'}, status=400)
            
            # Create amendment order
            amendment_order = AmendmentOrder.objects.create(
                contract_schedule=contract_schedule,
                title=title,
                document=document,
                reason=reason,
                notes=notes,
                amendment_date=parsed_date,
                uploaded_by=uploaded_by
            )
            
            # Log the action
            log_audit_action(
                'Amendment Order Uploaded', 
                'AmendmentOrder', 
                f"Uploaded amendment order '{amendment_order.title}' for contract schedule '{amendment_order.contract_schedule.title}'"
            )
            
            # Return response in the specified format
            return JsonResponse({
                'id': amendment_order.id,
                'contract_schedule': amendment_order.contract_schedule.id,
                'title': amendment_order.title,
                'document': amendment_order.document.url if amendment_order.document else None,
                'reason': amendment_order.reason,
                'notes': amendment_order.notes or '',
                'amendment_date': amendment_order.amendment_date.isoformat(),
                'uploaded_at': amendment_order.uploaded_at.isoformat(),
                'uploaded_by': amendment_order.uploaded_by.id
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def amendment_order_delete_api(request):
    """API endpoint for deleting amendment order documents"""
    if request.method == 'DELETE':
        try:
            # Get amendment order ID from request body
            data = json.loads(request.body)
            amendment_id = data.get('amendment_id')
            
            if not amendment_id:
                return JsonResponse({'error': 'amendment_id is required'}, status=400)
            
            # Get the amendment order
            try:
                amendment_order = AmendmentOrder.objects.get(id=amendment_id)
            except AmendmentOrder.DoesNotExist:
                return JsonResponse({'error': 'Amendment order not found'}, status=404)
            
            # Delete the file from storage
            if amendment_order.document:
                if default_storage.exists(amendment_order.document.name):
                    default_storage.delete(amendment_order.document.name)
            
            # Log the action before deletion
            log_audit_action(
                'Amendment Order Deleted', 
                'AmendmentOrder', 
                f"Deleted amendment order '{amendment_order.title}' for contract schedule '{amendment_order.contract_schedule.title}'"
            )
            
            # Delete the record
            amendment_order.delete()
            
            return JsonResponse({'message': 'Amendment order deleted successfully'})
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON in request body'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405) 