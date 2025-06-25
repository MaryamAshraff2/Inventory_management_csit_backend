from rest_framework import serializers
from django.db import transaction
import json
from .models import (
    User, Department, Category, Item, Procurement, Location, ProcurementItem,
    StockMovement, SendingStockRequest, DiscardedItem, Report
)

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

class StockMovementSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), source='item', write_only=True)
    from_location = LocationSerializer(read_only=True)
    from_location_id = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all(), source='from_location', write_only=True)
    to_location = LocationSerializer(read_only=True)
    to_location_id = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all(), source='to_location', write_only=True)
    received_by = UserSerializer(read_only=True)
    received_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='received_by', write_only=True)
    
    # Additional fields for dashboard
    item_name = serializers.CharField(source='item.name', read_only=True)
    from_location_name = serializers.CharField(source='from_location.name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True)
    received_by_name = serializers.CharField(source='received_by.name', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'item', 'item_id', 'from_location', 'from_location_id',
            'to_location', 'to_location_id', 'quantity', 'movement_date',
            'received_by', 'received_by_id', 'notes',
            'item_name', 'from_location_name', 'to_location_name', 'received_by_name'
        ]
        read_only_fields = ['id', 'item', 'from_location', 'to_location', 'received_by', 'movement_date']

class SendingStockRequestSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), source='item', write_only=True)
    requested_by = serializers.StringRelatedField(read_only=True)
    
    # Additional fields for dashboard
    item_name = serializers.CharField(source='item.name', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by', read_only=True)

    class Meta:
        model = SendingStockRequest
        fields = '__all__'

class DiscardedItemSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), source='item', write_only=True)
    discarded_by = UserSerializer(read_only=True)
    discarded_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='discarded_by', write_only=True, required=False, allow_null=True)
    date = serializers.DateField(read_only=True)

    class Meta:
        model = DiscardedItem
        fields = [
            'id', 'item', 'item_id', 'quantity', 'date', 'reason', 
            'discarded_by', 'discarded_by_id', 'notes'
        ]
        read_only_fields = ['id', 'date']

class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.CharField(source='generated_by.name', read_only=True)
    generated_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), 
        source='generated_by', 
        write_only=True, 
        required=False, 
        allow_null=True
    )
    
    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'filters', 'generated_at', 
            'generated_by', 'generated_by_name', 'export_pdf', 'export_excel'
        ]
        read_only_fields = ['id', 'generated_at', 'export_pdf', 'export_excel']
