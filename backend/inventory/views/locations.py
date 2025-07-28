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
from ..models import Location, TotalInventory, User
from ..serializers import LocationSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from ..utils import log_audit_action

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        location = self.get_object()
        
        # Auto-create inventory manager for this location
        location_name = location.name
        
        # Create inventory manager user
        inventory_manager_username = f"inventory_manager_{location_name.lower().replace(' ', '_')}"
        inventory_manager_user = User.objects.create(
            username=inventory_manager_username,
            password="inventory123",  # Default password
            name=f"Inventory Manager - {location_name}",
            email=f"inventory_manager.{location_name.lower().replace(' ', '_')}@neduet.edu.pk",
            role="inventory_manager",
            location=location
        )
        
        # Assign the location to the inventory manager
        inventory_manager_user.assigned_locations.add(location)
        
        log_audit_action('Location Created', 'Location', f"Created location '{location_name}' with auto-created inventory manager")
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_action('Location Updated', 'Location', f"Updated location '{response.data.get('name')}'")
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        response = super().destroy(request, *args, **kwargs)
        log_audit_action('Location Deleted', 'Location', f"Deleted location '{name}'")
        return response

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
                log_audit_action('Location Department Assigned', 'Location', f"Assigned department '{department.name}' to location '{location.name}'")
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