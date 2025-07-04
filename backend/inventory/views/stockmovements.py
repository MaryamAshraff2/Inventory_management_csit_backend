from rest_framework import viewsets
from ..models import StockMovement
from ..serializers import StockMovementSerializer
from ..utils import log_audit_action

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"[DEBUG] StockMovementViewSet create called with data: {request.data}")
        try:
            response = super().create(request, *args, **kwargs)
            log_audit_action('Stock Movement Created', 'StockMovement', f"Created stock movement ID {response.data.get('id')}")
            return response
        except Exception as e:
            print(f"[DEBUG] StockMovementViewSet create error: {e}")
            raise 

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_action('Stock Movement Updated', 'StockMovement', f"Updated stock movement ID {response.data.get('id')}")
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        movement_id = instance.id
        response = super().destroy(request, *args, **kwargs)
        log_audit_action('Stock Movement Deleted', 'StockMovement', f"Deleted stock movement ID {movement_id}")
        return response 