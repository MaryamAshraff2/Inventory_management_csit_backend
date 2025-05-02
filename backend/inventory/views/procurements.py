# from rest_framework import viewsets
# from ..models import Procurement
# from ..serializers import ProcurementSerializer

# class ProcurementViewSet(viewsets.ModelViewSet):
#     queryset = Procurement.objects.all()
#     serializer_class = ProcurementSerializer


from rest_framework import viewsets
from ..models import ProcurementOrder
from ..serializers import ProcurementOrderSerializer

class ProcurementOrderViewSet(viewsets.ModelViewSet):
    queryset = ProcurementOrder.objects.all().prefetch_related('items__item')
    serializer_class = ProcurementOrderSerializer
