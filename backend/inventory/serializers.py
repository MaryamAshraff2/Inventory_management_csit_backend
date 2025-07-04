from rest_framework import serializers
from django.db import transaction
from .models import  User, Department, Category, Item, Procurement, Location

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

class ProcurementSerializer(serializers.ModelSerializer):
    # Write-only fields for input
    item_name = serializers.CharField(write_only=True, required=False)
    item_id = serializers.IntegerField(write_only=True, required=False)
    category_id = serializers.IntegerField(write_only=True, required=False)

    # Read-only field for output
    item = ItemSerializer(read_only=True)
    order_number = serializers.CharField(read_only=True)
    supplier = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    document = serializers.FileField(required=False, allow_null=True)
    total_amount = serializers.SerializerMethodField()
    order_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Procurement
        fields = (
            'id', 'item', 'quantity', 'unit_price', 'created_at',
            'item_name', 'item_id', 'category_id',
            'order_number', 'supplier', 'document', 'total_amount', 'order_date'
        )

    def get_total_amount(self, obj):
        return float(obj.unit_price) * obj.quantity

    def validate(self, data):
        if 'item_id' not in data and ('item_name' not in data or 'category_id' not in data):
            raise serializers.ValidationError("For a new item, you must provide both 'item_name' and 'category_id'. For an existing item, provide 'item_id'.")
        if data.get('item_id') and data.get('item_name'):
            raise serializers.ValidationError("Provide either 'item_id' for an existing item or 'item_name' for a new one, but not both.")
        return data

    def create(self, validated_data):
        item_id = validated_data.pop('item_id', None)
        item_name = validated_data.pop('item_name', None)
        category_id = validated_data.pop('category_id', None)

        # The rest of the validated_data is for the procurement record
        # But we need quantity and unit_price for item creation as well
        quantity = validated_data['quantity']
        unit_price = validated_data['unit_price']

        with transaction.atomic():
            if item_id:
                try:
                    item = Item.objects.get(id=item_id)
                    item.quantity += quantity
                    item.save(update_fields=['quantity'])
                except Item.DoesNotExist:
                    raise serializers.ValidationError({'item_id': f'Item with id {item_id} does not exist.'})
            else:  # New item
                try:
                    category = Category.objects.get(id=category_id)
                except Category.DoesNotExist:
                    raise serializers.ValidationError({'category_id': f'Category with id {category_id} does not exist.'})

                item, created = Item.objects.get_or_create(
                    name__iexact=item_name,
                    defaults={
                        'name': item_name,
                        'category': category,
                        'quantity': quantity,
                        'unit_price': unit_price
                    }
                )
                if not created:
                    item.quantity += quantity
                    item.save(update_fields=['quantity'])

            # Add item to the data for procurement creation
            validated_data['item'] = item
            procurement = Procurement.objects.create(**validated_data)
            
        return procurement