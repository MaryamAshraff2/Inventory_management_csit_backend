from rest_framework import serializers
from django.db import transaction
import json
from .models import  User, Department, Category, Item, Procurement, Location, ProcurementItem

class LocationSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)

    class Meta:
        model = Location
        fields = ['id', 'name', 'department', 'department_name', 'room_number', 'description']
        extra_kwargs = {
            'department': {'write_only': True}
        }

class DepartmentSerializer(serializers.ModelSerializer):
    locations = LocationSerializer(many=True, read_only=True)
    class Meta:
        model = Department
        fields = ['id', 'name', 'email', 'user_count', 'locations']

class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    department = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(), write_only=False
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'department', 'department_name']

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'item_count']

class ItemSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    class Meta:
        model = Item
        fields = ['id', 'name', 'quantity', 'unit_price', 'category', 'category_id']

class ProcurementItemSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)

    class Meta:
        model = ProcurementItem
        fields = ['item', 'item_name', 'quantity', 'unit_price']

class ProcurementSerializer(serializers.ModelSerializer):
    items = ProcurementItemSerializer(many=True, read_only=True)
    order_number = serializers.CharField(read_only=True)
    supplier = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    document = serializers.FileField(required=False, allow_null=True)
    document_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    procurement_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    order_date = serializers.DateField(required=False, allow_null=True)
    total_amount = serializers.SerializerMethodField()

    class Meta:
        model = Procurement
        fields = (
            'id', 'created_at', 'order_number', 'supplier', 'document', 'document_type', 
            'procurement_type', 'order_date', 'items', 'total_amount'
        )

    def get_total_amount(self, obj):
        """Calculate total amount by summing all items' (quantity * unit_price)"""
        total = sum(item.quantity * item.unit_price for item in obj.items.all())
        return float(total)

    def create(self, validated_data):
        request = self.context['request']
        procurement = Procurement.objects.create(**validated_data)

        raw_items = request.data.get('items')
        if not raw_items:
            raise serializers.ValidationError({"items": "This field is required."})

        try:
            items_data = json.loads(raw_items)
        except json.JSONDecodeError:
            raise serializers.ValidationError({"items": "Invalid JSON format."})

        for item_entry in items_data:
            if 'item' in item_entry:
                item = Item.objects.get(pk=item_entry['item'])
            elif 'item_data' in item_entry:
                item_data = item_entry['item_data']
                item, _ = Item.objects.get_or_create(
                    name=item_data['name'],
                    defaults={
                        'category_id': item_data['category'],
                        'unit_price': item_data['unit_price'],
                        'quantity': 0
                    }
                )
            else:
                raise serializers.ValidationError({"items": "Each item must include 'item' or 'item_data'."})

            ProcurementItem.objects.create(
                procurement=procurement,
                item=item,
                quantity=item_entry['quantity'],
                unit_price=item_entry['unit_price']
            )
            # Update item quantity in stock
            item.quantity += item_entry['quantity']
            item.save(update_fields=["quantity"])

        return procurement