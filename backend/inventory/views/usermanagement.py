from rest_framework import viewsets
from ..models import User, Department
from ..serializers import UserSerializer
from rest_framework.response import Response
from rest_framework import status
from ..utils import log_audit_action

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        department_id = response.data.get('department')
        if department_id:
            try:
                department = Department.objects.get(id=department_id)
                department.user_count = department.user_count + 1
                department.save()
            except Department.DoesNotExist:
                pass
        # Audit log
        log_audit_action('User Created', 'User', f"Created new user '{response.data.get('name')}'")
        return response

    def update(self, request, *args, **kwargs):
        response = super().update(request, *args, **kwargs)
        log_audit_action('User Updated', 'User', f"Updated user '{response.data.get('name')}'")
        return response

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        name = instance.name
        response = super().destroy(request, *args, **kwargs)
        log_audit_action('User Deleted', 'User', f"Deleted user '{name}'")
        return response

