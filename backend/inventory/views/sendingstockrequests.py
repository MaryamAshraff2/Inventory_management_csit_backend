from rest_framework import viewsets
from ..models import SendingStockRequest
from ..serializers import SendingStockRequestSerializer

class SendingStockRequestViewSet(viewsets.ModelViewSet):
    queryset = SendingStockRequest.objects.all().order_by('-created_at')
    serializer_class = SendingStockRequestSerializer 