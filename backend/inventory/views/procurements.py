from rest_framework import viewsets
from ..models import Procurement
from ..serializers import ProcurementSerializer

class ProcurementViewSet(viewsets.ModelViewSet):
    queryset = Procurement.objects.all()
    serializer_class = ProcurementSerializer
