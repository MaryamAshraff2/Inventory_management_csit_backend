from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from ..models import Department, User
from ..serializers import DepartmentSerializer, UserSerializer
from ..utils import log_audit_action


class SuperuserManagementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for superuser to manage departments and assign chairmen
    """
    queryset = Department.get_active_departments()
    serializer_class = DepartmentSerializer

    @action(detail=False, methods=['get'])
    def departments_with_chairmen(self, request):
        """Get all active departments with their assigned chairmen"""
        departments = Department.get_active_departments()
        data = []
        
        for dept in departments:
            chairman = User.objects.filter(department=dept, role='chairman').first()
            main_manager = User.objects.filter(department=dept, role='main_inventory_manager').first()
            
            dept_data = {
                'id': dept.id,
                'name': dept.name,
                'email': dept.email,
                'user_count': dept.users.count(),
                'chairman': {
                    'id': chairman.id if chairman else None,
                    'name': chairman.name if chairman else None,
                    'email': chairman.email if chairman else None,
                    'password': chairman.password if chairman else None,
                } if chairman else None,
                'main_inventory_manager': {
                    'id': main_manager.id if main_manager else None,
                    'name': main_manager.name if main_manager else None,
                    'email': main_manager.email if main_manager else None,
                    'password': main_manager.password if main_manager else None,
                } if main_manager else None,
            }
            data.append(dept_data)
        
        return Response(data)

    @action(detail=True, methods=['post'])
    def assign_chairman(self, request, pk=None):
        """Assign a chairman to a department"""
        department = self.get_object()
        data = request.data
        
        # Check if chairman already exists for this department
        existing_chairman = User.objects.filter(department=department, role='chairman').first()
        if existing_chairman:
            return Response({
                'error': f'Department already has a chairman: {existing_chairman.name}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create chairman user
        chairman_name = data.get('name')
        chairman_password = data.get('password')
        chairman_email = data.get('email')
        
        if not chairman_name or not chairman_email or not chairman_password:
            return Response({
                'error': 'Name, email, and password are required for chairman'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user with this name already exists
        if User.objects.filter(name=chairman_name).exists():
            return Response({
                'error': f'User with name "{chairman_name}" already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user with this email already exists
        if User.objects.filter(email=chairman_email).exists():
            return Response({
                'error': f'User with email "{chairman_email}" already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        chairman = User.objects.create(
            name=chairman_name,
            password=chairman_password,
            email=chairman_email,
            role='chairman',
            department=department
        )
        
        log_audit_action('Chairman Assigned', 'User', f"Assigned chairman '{chairman_name}' to department '{department.name}'")
        
        return Response({
            'success': True,
            'message': f'Chairman "{chairman_name}" assigned to department "{department.name}"',
            'chairman': {
                'id': chairman.id,
                'name': chairman.name,
                'email': chairman.email,
                'password': chairman.password,
            }
        })

    @action(detail=True, methods=['post'])
    def assign_main_inventory_manager(self, request, pk=None):
        """Assign a main inventory manager to a department"""
        department = self.get_object()
        data = request.data
        
        # Check if main inventory manager already exists for this department
        existing_manager = User.objects.filter(department=department, role='main_inventory_manager').first()
        if existing_manager:
            return Response({
                'error': f'Department already has a main inventory manager: {existing_manager.name}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create main inventory manager user
        manager_name = data.get('name')
        manager_password = data.get('password')
        manager_email = data.get('email')
        
        if not manager_name or not manager_email or not manager_password:
            return Response({
                'error': 'Name, email, and password are required for main inventory manager'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user with this name already exists
        if User.objects.filter(name=manager_name).exists():
            return Response({
                'error': f'User with name "{manager_name}" already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if user with this email already exists
        if User.objects.filter(email=manager_email).exists():
            return Response({
                'error': f'User with email "{manager_email}" already exists'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        manager = User.objects.create(
            name=manager_name,
            password=manager_password,
            email=manager_email,
            role='main_inventory_manager',
            department=department
        )
        
        log_audit_action('Main Inventory Manager Assigned', 'User', f"Assigned main inventory manager '{manager_name}' to department '{department.name}'")
        
        return Response({
            'success': True,
            'message': f'Main inventory manager "{manager_name}" assigned to department "{department.name}"',
            'manager': {
                'id': manager.id,
                'name': manager.name,
                'email': manager.email,
                'password': manager.password,
            }
        })

    @action(detail=True, methods=['get'])
    def department_users(self, request, pk=None):
        """Get all users for a specific department"""
        department = self.get_object()
        users = User.objects.filter(department=department)
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data) 