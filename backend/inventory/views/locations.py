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
from ..models import Location
from ..serializers import LocationSerializer
from rest_framework.decorators import action
from rest_framework.response import Response

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