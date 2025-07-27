from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
import json
import os
from ..models import ContractSchedule, Procurement, User
from ..serializers import ContractScheduleSerializer
from ..utils import log_audit_action


class ContractScheduleViewSet(viewsets.ModelViewSet):
    queryset = ContractSchedule.objects.all()
    serializer_class = ContractScheduleSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        procurement_id = self.request.query_params.get('procurement_id')
        
        if procurement_id:
            queryset = queryset.filter(procurement_id=procurement_id)
        
        return queryset.order_by('-uploaded_at')

    def perform_destroy(self, instance):
        """Delete contract schedule and its associated file"""
        # Delete the file from storage
        if instance.document:
            if default_storage.exists(instance.document.name):
                default_storage.delete(instance.document.name)
        
        # Log the action before deletion
        log_audit_action(
            'Contract Schedule Deleted', 
            'ContractSchedule', 
            f"Deleted contract schedule '{instance.title}' for procurement {instance.procurement.order_number}"
        )
        
        instance.delete()


@csrf_exempt
def contract_schedule_upload_api(request):
    """API endpoint for uploading contract schedule documents"""
    if request.method == 'POST':
        try:
            # Get form data
            procurement_id = request.POST.get('procurement')
            title = request.POST.get('title')
            document = request.FILES.get('document')
            notes = request.POST.get('notes', '')
            uploaded_by_id = request.POST.get('uploaded_by')
            
            # Validate required fields
            if not procurement_id:
                return JsonResponse({'error': 'procurement is required'}, status=400)
            if not title:
                return JsonResponse({'error': 'title is required'}, status=400)
            if not document:
                return JsonResponse({'error': 'document is required'}, status=400)
            if not uploaded_by_id:
                return JsonResponse({'error': 'uploaded_by is required'}, status=400)
            
            # Validate procurement exists
            try:
                procurement = Procurement.objects.get(id=procurement_id)
            except Procurement.DoesNotExist:
                return JsonResponse({'error': 'Procurement not found'}, status=404)
            
            # Validate user exists
            try:
                uploaded_by = User.objects.get(id=uploaded_by_id)
            except User.DoesNotExist:
                return JsonResponse({'error': 'User not found'}, status=404)
            
            # Create contract schedule
            contract_schedule = ContractSchedule.objects.create(
                procurement=procurement,
                title=title,
                document=document,
                notes=notes,
                uploaded_by=uploaded_by
            )
            
            # Log the action
            log_audit_action(
                'Contract Schedule Uploaded', 
                'ContractSchedule', 
                f"Uploaded contract schedule '{contract_schedule.title}' for procurement {contract_schedule.procurement.order_number}"
            )
            
            # Return response in the specified format
            return JsonResponse({
                'id': contract_schedule.id,
                'procurement': contract_schedule.procurement.id,
                'title': contract_schedule.title,
                'document': contract_schedule.document.url if contract_schedule.document else None,
                'uploaded_at': contract_schedule.uploaded_at.isoformat(),
                'uploaded_by': contract_schedule.uploaded_by.id,
                'notes': contract_schedule.notes or ''
            })
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)


@csrf_exempt
def contract_schedule_delete_api(request, schedule_id):
    """API endpoint for deleting contract schedule documents"""
    if request.method == 'DELETE':
        try:
            # Get the contract schedule
            try:
                contract_schedule = ContractSchedule.objects.get(id=schedule_id)
            except ContractSchedule.DoesNotExist:
                return JsonResponse({'error': 'Contract schedule not found'}, status=404)
            
            # Delete the file from storage
            if contract_schedule.document:
                if default_storage.exists(contract_schedule.document.name):
                    default_storage.delete(contract_schedule.document.name)
            
            # Log the action before deletion
            log_audit_action(
                'Contract Schedule Deleted', 
                'ContractSchedule', 
                f"Deleted contract schedule '{contract_schedule.title}' for procurement {contract_schedule.procurement.order_number}"
            )
            
            # Delete the record
            contract_schedule.delete()
            
            return JsonResponse({'message': 'Contract schedule deleted successfully'})
            
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405) 