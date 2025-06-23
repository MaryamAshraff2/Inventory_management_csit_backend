from rest_framework import viewsets
from ..models import User, Department
from ..serializers import UserSerializer
from rest_framework.response import Response
from rest_framework import status

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
        return response

