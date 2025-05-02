from rest_framework import viewsets
from ..models import Department
from ..serializers import DepartmentSerializer

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    @action(detail=False, methods=['get'])
    def search(self, request):
        filter_by = request.query_params.get('filter_by', 'name')
        search_term = request.query_params.get('search_term', '').lower()
        
        if filter_by == 'name':
            queryset = self.queryset.filter(name__icontains=search_term)
        else:
            queryset = self.queryset.filter(locations__contains=[search_term])
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)