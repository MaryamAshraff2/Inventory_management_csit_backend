from rest_framework import viewsets
from ..models import DiscardedItem
from ..serializers import DiscardedItemSerializer
from ..utils import log_audit_action

class DiscardedItemViewSet(viewsets.ModelViewSet):
    queryset = DiscardedItem.objects.all().order_by('-date')
    serializer_class = DiscardedItemSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        log_audit_action('Discarded Item Created', 'DiscardedItem', f"Created discarded item ID {response.data.get('id')}")
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_action('Discarded Item Updated', 'DiscardedItem', f"Updated discarded item ID {response.data.get('id')}")
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        item_id = instance.id
        response = super().destroy(request, *args, **kwargs)
        log_audit_action('Discarded Item Deleted', 'DiscardedItem', f"Deleted discarded item ID {item_id}")
        return response 