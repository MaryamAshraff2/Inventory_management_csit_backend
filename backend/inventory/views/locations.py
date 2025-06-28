# from rest_framework import viewsets,generics
# from ..models import Location
# from ..serializers import LocationSerializer


# # For Location
# class LocationListCreateView(generics.ListCreateAPIView):
#     queryset = Location.objects.all()
#     serializer_class = LocationSerializer

# class LocationDetailView(generics.RetrieveUpdateDestroyAPIView):
#     queryset = Location.objects.all()
#     serializer_class = LocationSerializer

from rest_framework import viewsets, generics
from ..models import Location, TotalInventory
from ..serializers import LocationSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    @action(detail=True, methods=['post'])
    def assign_department(self, request, pk=None):
        location = self.get_object()
        department_id = request.data.get('department_id')
        if department_id:
            from ..models import Department
            try:
                department = Department.objects.get(id=department_id)
                location.department = department
                location.save()
                return Response({'status': 'department assigned'})
            except Department.DoesNotExist:
                return Response({'error': 'Department not found'}, status=404)
        return Response({'error': 'No department_id provided'}, status=400)

    @action(detail=False, methods=['get'])
    def by_procurement(self, request):
        """
        Returns locations where items from a specific procurement are stored.
        Query parameter: procurement_id
        """
        procurement_id = request.query_params.get('procurement_id')
        if not procurement_id:
            return Response({'error': 'procurement_id parameter is required'}, status=400)
        
        try:
            # Get locations where items from this procurement have available stock
            locations = Location.objects.filter(
                total_inventory__procurement_id=procurement_id,
                total_inventory__available_quantity__gt=0
            ).distinct()
            
            serializer = LocationSerializer(locations, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=500)