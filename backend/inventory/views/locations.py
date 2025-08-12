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
from rest_framework.permissions import IsAuthenticated
from ..utils import log_audit_action

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        print(f"DEBUG: User: {user}, Authenticated: {user.is_authenticated}, Role: {getattr(user, 'role', 'N/A')}")
        
        if not user.is_authenticated:
            print("DEBUG: User not authenticated, returning empty queryset")
            return Location.objects.none()
        
        # Superuser can see all locations
        if user.role == 'superuser':
            print("DEBUG: Superuser detected, returning all locations")
            return Location.objects.all()
        
        # Chairman can see all locations
        if user.role == 'chairman':
            print("DEBUG: Chairman detected, returning all locations")
            return Location.objects.all()
        
        # Main inventory manager can see all locations
        if user.role == 'main_inventory_manager':
            print("DEBUG: Main inventory manager detected, returning all locations")
            return Location.objects.all()
        
        # Regular users see locations based on their department
        user_department = user.department
        print(f"DEBUG: Regular user, department: {user_department}")
        if user_department:
            return Location.objects.filter(department=user_department)
        
        # If user has no department, return empty queryset
        print("DEBUG: User has no department, returning empty queryset")
        return Location.objects.none()


    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        location = serializer.instance  # ✅ The saved Location object

        # Auto-create inventory manager for this location
        location_name = location.name
        inventory_manager_username = f"inventory_manager_{location_name.lower().replace(' ', '_')}"
        inventory_manager_user = User.objects.create(
            username=inventory_manager_username,
            email=f"inventory_manager.{location_name.lower().replace(' ', '_')}@neduet.edu.pk",
            role="inventory_manager",
            location=location
        )
        inventory_manager_user.set_password("inventory123")
        inventory_manager_user.save()
        inventory_manager_user.assigned_locations.add(location)

        log_audit_action(
            'Location Created',
            'Location',
            f"Created location '{location_name}' with auto-created inventory manager"
        )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=201, headers=headers)


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
            
    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        """
        Returns minimal location data for the logged-in user's department
        for use in dropdown menus.
        """
        user_department = request.user.department
        locations = Location.objects.filter(department=user_department).only("id", "name")
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)