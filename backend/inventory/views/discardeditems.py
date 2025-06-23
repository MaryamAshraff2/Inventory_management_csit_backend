from rest_framework import viewsets
from ..models import DiscardedItem
from ..serializers import DiscardedItemSerializer

class DiscardedItemViewSet(viewsets.ModelViewSet):
    queryset = DiscardedItem.objects.all().order_by('-date')
    serializer_class = DiscardedItemSerializer 