from rest_framework import viewsets
from ..models import SendingStockRequest
from ..serializers import SendingStockRequestSerializer
from ..utils import log_audit_action

class SendingStockRequestViewSet(viewsets.ModelViewSet):
    queryset = SendingStockRequest.objects.all().order_by('-created_at')
    serializer_class = SendingStockRequestSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        log_audit_action('Stock Request Created', 'StockRequest', f"Created stock request ID {response.data.get('id')}")
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_action('Stock Request Updated', 'StockRequest', f"Updated stock request ID {response.data.get('id')}")
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        req_id = instance.id
        response = super().destroy(request, *args, **kwargs)
        log_audit_action('Stock Request Deleted', 'StockRequest', f"Deleted stock request ID {req_id}")
        return response 