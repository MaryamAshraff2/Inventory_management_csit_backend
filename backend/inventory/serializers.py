from rest_framework import serializers
from .models import  User, Department, Category, Item, ProcurementOrder, ProcurementItem

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'email', 'user_count', 'locations']


class CategorySerializer(serializers.ModelSerializer):
    # item_count is now a real field that sums quantities
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'itemCount']

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Item
        fields = ['id', 'name', 'description', 'quantity', 'category', 'category_name', 'unit_price']

# class ProcurementSerializer(serializers.ModelSerializer):
#     procurement_name = serializers.CharField(source='procurement.name', read_only=True)

#     class Meta:
#         model = Procurement
#         fields = ["id","item","order_number","proc_type","date_procured","quantity","unit_cost","total_cost","supplier","notes","document_file","document_type",
#         ]
#         read_only_fields = ["total_cost"]

# class ProcurementItemSerializer(serializers.ModelSerializer):
#     item_name = serializers.CharField(source='item.name', read_only=True)

#     class Meta:
#         model = ProcurementItem
#         fields = ['id', 'item', 'item_name', 'proc_type', 'quantity', 'unit_cost', 'total_cost']


# class ProcurementOrderSerializer(serializers.ModelSerializer):
#     items = ProcurementItemSerializer(many=True)
    
#     class Meta:
#         model = ProcurementOrder
#         fields = [
#             'order_number', 'supplier', 'date_procured',
#             'notes', 'document_file', 'document_type', 'added_by', 'items'
#         ]

#     def create(self, validated_data):
#         items_data = validated_data.pop('items')
#         order = ProcurementOrder.objects.create(**validated_data)
#         for item_data in items_data:
#             ProcurementItem.objects.create(order=order, **item_data)
#         return order

class ProcurementItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), source='item')

    class Meta:
        model = ProcurementItem
        fields = ['item_id', 'item_name', 'proc_type', 'quantity', 'unit_cost', 'total_cost']
        read_only_fields = ['total_cost']

class ProcurementOrderSerializer(serializers.ModelSerializer):
    items = ProcurementItemSerializer(many=True)
    
    class Meta:
        model = ProcurementOrder
        fields = [
            'order_number', 'supplier', 'date_procured',
            'notes', 'document_file', 'document_type', 'added_by', 'items'
        ]
        extra_kwargs = {
            'order_number': {'required': False}  # Allow auto-generation
        }

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = ProcurementOrder.objects.create(**validated_data)
        for item_data in items_data:
            ProcurementItem.objects.create(order=order, **item_data)
        return order