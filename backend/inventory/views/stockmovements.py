from rest_framework import viewsets
from ..models import StockMovement
from ..serializers import StockMovementSerializer

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer 