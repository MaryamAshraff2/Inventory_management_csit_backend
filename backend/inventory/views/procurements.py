from rest_framework import viewsets
from ..models import Procurement, ProcurementItem
from ..serializers import ProcurementSerializer
from ..utils import log_audit_action
from rest_framework.decorators import action
from rest_framework.response import Response

class ProcurementViewSet(viewsets.ModelViewSet):
    queryset = Procurement.objects.all()
    serializer_class = ProcurementSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        log_audit_action('Procurement Created', 'Procurement', f"Created procurement '{response.data.get('order_number')}'")
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_action('Procurement Updated', 'Procurement', f"Updated procurement '{response.data.get('order_number')}'")
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        order_number = instance.order_number
        response = super().destroy(request, *args, **kwargs)
        log_audit_action('Procurement Deleted', 'Procurement', f"Deleted procurement '{order_number}'")
        return response

    @action(detail=False, methods=['get'])
    def procurement_types(self, request):
        """Return the list of procurement type choices."""
        types = [ptype[0] for ptype in Procurement.PROCUREMENT_TYPE_CHOICES]
        return Response(types)

    @action(detail=False, methods=['get'])
    def suppliers(self, request):
        """Return the list of unique supplier names from procurements."""
        suppliers = Procurement.objects.exclude(supplier__isnull=True).exclude(supplier__exact='').values_list('supplier', flat=True).distinct()
        return Response(list(suppliers))
