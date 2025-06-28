# views/categories.py
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction
from ..models import Category, Item
from ..serializers import CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if category has associated items
        item_count = Item.objects.filter(category=instance).count()
        
        if item_count > 0:
            return Response(
                {
                    "detail": f"Cannot delete category '{instance.name}' because it has {item_count} associated item(s). Please remove or reassign all items before deleting this category."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response(
                {
                    "detail": f"Failed to delete category: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )