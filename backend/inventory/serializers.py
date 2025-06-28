from rest_framework import serializers
from django.db import transaction
import json
from .models import (
    User, Department, Category, Item, Procurement, Location, ProcurementItem,
    StockMovement, SendingStockRequest, DiscardedItem, Report, TotalInventory
)
import logging

logger = logging.getLogger('inventory')

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
        fields = ['id', 'name', 'total_quantity', 'available_quantity', 'dead_stock_quantity', 'unit_price', 'category', 'category_id']

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
        logger.debug(f"Raw items data received: {raw_items}")
        if not raw_items:
            logger.error("No items field in procurement request.")
            raise serializers.ValidationError({"items": "This field is required."})

        try:
            items_data = json.loads(raw_items)
        except json.JSONDecodeError:
            logger.error(f"Invalid JSON format for items: {raw_items}")
            raise serializers.ValidationError({"items": "Invalid JSON format."})

        from .models import TotalInventory, Location
        main_store = Location.get_main_store()

        for idx, item_entry in enumerate(items_data):
            try:
                logger.debug(f"Processing item {idx+1}: {item_entry}")
                if 'item' in item_entry:
                    item = Item.objects.get(pk=item_entry['item'])
                elif 'item_data' in item_entry:
                    item_data = item_entry['item_data']
                    item, _ = Item.objects.get_or_create(
                        name=item_data['name'],
                        defaults={
                            'category_id': item_data['category'],
                            'unit_price': item_data['unit_price'],
                            'total_quantity': 0,
                            'available_quantity': 0,
                            'dead_stock_quantity': 0,
                        }
                    )
                else:
                    logger.error(f"Invalid item entry: {item_entry}")
                    raise serializers.ValidationError({"items": "Each item must include 'item' or 'item_data'."})

                ProcurementItem.objects.create(
                    procurement=procurement,
                    item=item,
                    quantity=item_entry['quantity'],
                    unit_price=item_entry['unit_price']
                )
                # Update item total_quantity and available_quantity in stock
                logger.debug(f"Incrementing item {item.id} ({item.name}) total_quantity and available_quantity by {item_entry['quantity']} (before: {item.total_quantity}, {item.available_quantity})")
                item.total_quantity += item_entry['quantity']
                item.available_quantity += item_entry['quantity']
                item.save(update_fields=["total_quantity", "available_quantity"])
                logger.debug(f"Item {item.id} ({item.name}) new total_quantity: {item.total_quantity}, available_quantity: {item.available_quantity}")
                # TotalInventory creation is handled by the sync command triggered by ProcurementItem creation
                logger.debug(f"Processed item {item.id} ({item.name}) in procurement {procurement.id}")
            except Exception as e:
                logger.error(f"Error processing item {item_entry}: {e}")
                raise serializers.ValidationError({"items": f"Error processing item {item_entry}: {e}"})
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

    def create(self, validated_data):
        from .models import TotalInventory
        from django.db import transaction
        print(f"[DEBUG] StockMovement create called with validated_data: {validated_data}")
        with transaction.atomic():
            stock_movement = super().create(validated_data)
            print(f"[DEBUG] StockMovement created: {stock_movement}")
            item = stock_movement.item
            from_location = stock_movement.from_location
            to_location = stock_movement.to_location
            quantity = stock_movement.quantity
            qty_to_move = quantity

            # Fetch all inventory rows for this item at the source location with available stock (FIFO)
            source_inventory = TotalInventory.objects.filter(
                item=item,
                location=from_location,
                available_quantity__gt=0
            ).order_by('order_date', 'id')

            total_available = sum(row.available_quantity for row in source_inventory)
            if total_available < qty_to_move:
                raise serializers.ValidationError('Not enough quantity at source location.')

            print(f"[DEBUG] Checking stock for item {item} at location {from_location}")
            print("TotalInventory at source:")
            for row in source_inventory:
                print(f"  - Qty: {row.available_quantity}, Procurement: {row.procurement}, Order#: {row.order_number}")

            for row in source_inventory:
                if qty_to_move <= 0:
                    break
                deduct_qty = min(qty_to_move, row.available_quantity)
                row.available_quantity -= deduct_qty
                qty_to_move -= deduct_qty

                # Match destination inventory by item and location (and optionally order_number), not procurement
                dest_ti = TotalInventory.objects.filter(
                    item=row.item,
                    location=to_location
                ).first()
                if dest_ti:
                    dest_ti.available_quantity += deduct_qty
                    dest_ti.last_stock_movement = stock_movement
                    dest_ti.save()
                else:
                    # Ensure no None values for required fields
                    TotalInventory.objects.create(
                        item=row.item,
                        procurement=row.procurement,
                        location=to_location,
                        available_quantity=deduct_qty,
                        order_number=row.order_number or '',
                        supplier=row.supplier or '',
                        order_date=row.order_date,
                        unit_price=row.unit_price if row.unit_price is not None else 0,
                        last_stock_movement=stock_movement
                    )
                print(f"[DEBUG] Moving {deduct_qty} from {from_location} to {to_location}. Destination TI: {dest_ti}")

                if row.available_quantity == 0:
                    row.delete()
                else:
                    row.save()

            # If moving from Main Store, also update item.available_quantity for audit
            if from_location.name == 'Main Store':
                print(f"[DEBUG] Moving FROM Main Store. Item available_quantity before: {item.available_quantity}")
                item.available_quantity = max(0, item.available_quantity - quantity)
                item.save(update_fields=["available_quantity"])
                print(f"[DEBUG] Item available_quantity after FROM Main Store: {item.available_quantity}")

            # If moving TO Main Store, increase item.available_quantity
            if to_location.name == 'Main Store':
                print(f"[DEBUG] Moving TO Main Store. Item available_quantity before: {item.available_quantity}")
                item.available_quantity = item.available_quantity + quantity
                item.save(update_fields=["available_quantity"])
                print(f"[DEBUG] Item available_quantity after TO Main Store: {item.available_quantity}")

            return stock_movement

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
    location = serializers.CharField(source='location.name', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all(), source='location', write_only=True)
    discarded_by = UserSerializer(read_only=True)
    discarded_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='discarded_by', write_only=True, required=False, allow_null=True)
    date = serializers.DateField(read_only=True)

    class Meta:
        model = DiscardedItem
        fields = [
            'id', 'item', 'item_id', 'location', 'location_id', 'quantity', 'date', 'reason', 
            'discarded_by', 'discarded_by_id', 'notes'
        ]
        read_only_fields = ['id', 'date']

    def create(self, validated_data):
        from .models import TotalInventory, Category, Location
        with transaction.atomic():
            item = validated_data['item']
            quantity = validated_data['quantity']
            # Find all TotalInventory records for this item
            total_inventories = TotalInventory.objects.filter(item=item).order_by('-available_quantity')
            qty_to_discard = quantity
            for ti in total_inventories:
                if qty_to_discard <= 0:
                    break
                if ti.available_quantity > 0:
                    remove_qty = min(ti.available_quantity, qty_to_discard)
                    ti.available_quantity -= remove_qty
                    qty_to_discard -= remove_qty
                    if ti.available_quantity == 0:
                        ti.delete()
                    else:
                        ti.save()
            if qty_to_discard > 0:
                raise serializers.ValidationError('Not enough inventory to discard.')
            # Decrement item total_quantity and increment dead_stock_quantity
            item.total_quantity -= quantity
            item.dead_stock_quantity += quantity
            # If discarding from Main Store, decrement available_quantity
            from_location = validated_data.get('from_location', None)
            if from_location and from_location.name == 'Main Store':
                item.available_quantity = max(0, item.available_quantity - quantity)
            item.save(update_fields=["total_quantity", "dead_stock_quantity", "available_quantity"])
            return super().create(validated_data)

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

class TotalInventoryRowSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    item_name = serializers.CharField(source='item.name')
    available_qty = serializers.IntegerField(source='available_quantity')
    order_number = serializers.CharField()
    location = serializers.CharField(source='location.name')
    supplier = serializers.CharField(allow_null=True, allow_blank=True)
    order_date = serializers.DateField(allow_null=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, allow_null=True)
    last_stock_movement = serializers.SerializerMethodField()
    item_id = serializers.IntegerField(source='item.id')
    location_id = serializers.IntegerField(source='location.id')
    procurement_id = serializers.IntegerField(source='procurement.id')

    def get_last_stock_movement(self, obj):
        if hasattr(obj, 'last_stock_movement') and obj.last_stock_movement:
            m = obj.last_stock_movement
            return {
                'id': m.id,
                'from_location': m.from_location.name,
                'to_location': m.to_location.name,
                'quantity': m.quantity,
                'movement_date': m.movement_date,
                'received_by': m.received_by.name,
                'notes': m.notes,
            }
        return None
