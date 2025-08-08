from rest_framework import viewsets
from ..models import Department, Location, User
from ..serializers import DepartmentSerializer, LocationSerializer
from ..utils import log_audit_action

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.get_active_departments()  # Use active departments only
    serializer_class = DepartmentSerializer

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Check if department with this name already exists (active only)
        department_name = data.get('name')
        if department_name:
            if not Department.is_name_available(department_name):
                return Response(
                    {'error': f'Department with name "{department_name}" already exists.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if there's a deleted department with this name and provide info
            deleted_dept = Department.get_deleted_department_by_name(department_name)
            if deleted_dept:
                # Log that we're reusing a deleted department's name
                log_audit_action('Department Name Reused', 'Department', f"Reusing name '{department_name}' from previously deleted department (ID: {deleted_dept.id})")
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        try:
            self.perform_create(serializer)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        #department = serializer.save()
        #department_name = department
        # Generate usernames (do not create users yet)
        chairman_username = f"chairman_{department_name.lower().replace(' ', '_')}"
        main_manager_username = f"main_manager_{department_name.lower().replace(' ', '_')}"
        
        headers = self.get_success_headers(serializer.data)
        log_audit_action('Department Created', 'Department', f"Created department '{department_name}'. Chairman username: {chairman_username}, Main Manager username: {main_manager_username}")
        
        # Return department data and generated usernames
        response_data = serializer.data.copy()
        response_data['chairman_username'] = chairman_username
        response_data['main_manager_username'] = main_manager_username
        
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_action('Department Updated', 'Department', f"Updated department '{response.data.get('name')}'")
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        
        try:
            # Use the overridden delete method which handles soft deletion and cleanup
            instance.delete()
            
            return Response({
                'message': f'Department "{name}" and all associated data deleted successfully.',
                'deleted': True
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'Error deleting department: {str(e)}',
                'deleted': False
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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

    @action(detail=True, methods=['post'])
    def set_chairman_password(self, request, pk=None):
        department = self.get_object()
        department_name = department.name
        chairman_username = f"chairman_{department_name.lower().replace(' ', '_')}"
        password = request.data.get('password')
        
        if not password:
            return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if chairman already exists for this department
        existing_chairman = User.objects.filter(department=department, role='chairman').first()
        if existing_chairman:
            return Response({'error': 'Chairman already exists for this department.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate email for chairman
        chairman_email = f"{chairman_username}@{department_name.lower().replace(' ', '_')}.com"
        
        # Ensure email uniqueness by adding department ID if needed
        counter = 1
        original_email = chairman_email
        while User.objects.filter(email=chairman_email).exists():
            chairman_email = f"{chairman_username}{counter}@{department_name.lower().replace(' ', '_')}.com"
            counter += 1
        
        # Create chairman user
        chairman_user = User.objects.create(
            username=chairman_username,
            email=chairman_email,
            password=password,
            role='chairman',
            department=department
        )
        
        log_audit_action('Chairman Created', 'User', f"Created chairman '{chairman_username}' for department '{department_name}'")
        return Response({'message': f'Chairman {chairman_username} created successfully.'}, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def set_main_manager_password(self, request, pk=None):
        department = self.get_object()
        department_name = department.name
        main_manager_username = f"main_manager_{department_name.lower().replace(' ', '_')}"
        password = request.data.get('password')
        
        if not password:
            return Response({'error': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if main inventory manager already exists for this department
        existing_manager = User.objects.filter(department=department, role='main_inventory_manager').first()
        if existing_manager:
            return Response({'error': 'Main inventory manager already exists for this department.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate email for main inventory manager
        main_manager_email = f"{main_manager_username}@{department_name.lower().replace(' ', '_')}.com"
        
        # Ensure email uniqueness by adding department ID if needed
        counter = 1
        original_email = main_manager_email
        while User.objects.filter(email=main_manager_email).exists():
            main_manager_email = f"{main_manager_username}{counter}@{department_name.lower().replace(' ', '_')}.com"
            counter += 1
        
        # Create main inventory manager user
        main_manager_user = User.objects.create(
            username=main_manager_username,
            email=main_manager_email,
            password=password,
            role='main_inventory_manager',
            department=department
        )
        
        log_audit_action('Main Inventory Manager Created', 'User', f"Created main inventory manager '{main_manager_username}' for department '{department_name}'")
        return Response({'message': f'Main inventory manager {main_manager_username} created successfully.'}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def check_exists(self, request):
        """Check if a department with a specific name exists"""
        department_name = request.query_params.get('name') 
        if not department_name:
            return Response({'error': 'Department name parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if active department exists
        active_exists = Department.get_active_departments().filter(name=department_name).exists()
        
        # Check if deleted department exists
        deleted_dept = Department.get_deleted_department_by_name(department_name)
        deleted_exists = deleted_dept is not None
        
        return Response({
            'name': department_name,
            'active_exists': active_exists,
            'deleted_exists': deleted_exists,
            'can_create': not active_exists,  # Can create if no active department with this name
            'deleted_info': {
                'id': deleted_dept.id if deleted_dept else None,
                'deleted_at': deleted_dept.deleted_at if deleted_dept else None
            } if deleted_dept else None
        })

    @action(detail=True, methods=['delete'])
    def force_delete(self, request, pk=None):
        """Force delete a department and all related data"""
        instance = self.get_object()
        name = instance.name
        
        try:
            # Delete all users associated with this department
            users_deleted = User.objects.filter(department=instance).delete()
            
            # Delete all locations associated with this department
            locations_deleted = Location.objects.filter(department=instance).delete()
            
            # Now delete the department
            instance.delete()
            
            log_audit_action('Department Force Deleted', 'Department', f"Force deleted department '{name}' and all associated data")
            return Response({
                'message': f'Department "{name}" force deleted successfully.',
                'users_deleted': users_deleted[0] if users_deleted else 0,
                'locations_deleted': locations_deleted[0] if locations_deleted else 0
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': f'Error deleting department: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)