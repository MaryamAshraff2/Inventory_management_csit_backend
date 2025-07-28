from rest_framework import viewsets
from ..models import Department, Location, User
from ..serializers import DepartmentSerializer, LocationSerializer
from ..utils import log_audit_action

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

    def create(self, request, *args, **kwargs):
        # Ensure user_count is 0 and no locations assigned
        data = request.data.copy()
        data['user_count'] = 0
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        department = serializer.save()
        
        # Auto-create chairman and main inventory manager for this department
        department_name = department.name
        
        # Create chairman user
        chairman_name = f"chairman_{department_name.lower().replace(' ', '_')}"
        chairman_user = User.objects.create(
            name=chairman_name,
            password="chairman123",  # Default password
            email=f"chairman.{department_name.lower().replace(' ', '_')}@neduet.edu.pk",
            role="chairman",
            department=department
        )
        
        # Create main inventory manager user
        main_manager_name = f"main_manager_{department_name.lower().replace(' ', '_')}"
        main_manager_user = User.objects.create(
            name=main_manager_name,
            password="main123",  # Default password
            email=f"main_manager.{department_name.lower().replace(' ', '_')}@neduet.edu.pk",
            role="main_inventory_manager",
            department=department
        )
        
        # Update department user count
        department.user_count = 2  # chairman + main inventory manager
        department.save()
        
        headers = self.get_success_headers(serializer.data)
        log_audit_action('Department Created', 'Department', f"Created department '{department_name}' with auto-created chairman and main inventory manager")
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_action('Department Updated', 'Department', f"Updated department '{response.data.get('name')}'")
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        response = super().destroy(request, *args, **kwargs)
        log_audit_action('Department Deleted', 'Department', f"Deleted department '{name}'")
        return response

    @action(detail=True, methods=['get'])
    def locations(self, request, pk=None):
        department = self.get_object()
        locations = department.locations.all()
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)

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