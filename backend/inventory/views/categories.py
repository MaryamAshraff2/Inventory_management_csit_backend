# views/categories.py
from rest_framework import viewsets
from ..models import Category
from ..serializers import CategorySerializer

class CategoriesViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()  # No annotation needed now
    serializer_class = CategorySerializer