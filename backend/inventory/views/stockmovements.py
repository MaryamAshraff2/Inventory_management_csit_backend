from rest_framework import viewsets
from ..models import StockMovement
from ..serializers import StockMovementSerializer

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    
    def create(self, request, *args, **kwargs):
        print(f"[DEBUG] StockMovementViewSet create called with data: {request.data}")
        try:
            return super().create(request, *args, **kwargs)
        except Exception as e:
            print(f"[DEBUG] StockMovementViewSet create error: {e}")
            raise 