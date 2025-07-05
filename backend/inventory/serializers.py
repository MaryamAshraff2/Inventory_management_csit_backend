from rest_framework import serializers
from django.db import transaction
import json
from .models import (
    User, Department, Category, Item, Procurement, Location, ProcurementItem,
    StockMovement, SendingStockRequest, DiscardedItem, Report, TotalInventory, InventoryByLocation, AuditLog
)
import logging
from django.utils import timezone

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
    main_store_quantity = serializers.SerializerMethodField(read_only=True)
    total_quantity = serializers.SerializerMethodField(read_only=True)
    is_dead_stock = serializers.SerializerMethodField()
    last_stock_movement = serializers.SerializerMethodField()
    dead_stock_threshold_days = serializers.SerializerMethodField()

    class Meta:
        model = Item
        fields = ['id', 'name', 'unit_price', 'category', 'category_id', 'main_store_quantity', 'total_quantity', 'is_dead_stock', 'last_stock_movement', 'dead_stock_threshold_days']

    def get_main_store_quantity(self, obj):
        return obj.main_store_quantity

    def get_total_quantity(self, obj):
        return obj.total_quantity

    def get_is_dead_stock(self, obj):
        return obj.is_dead_stock

    def get_last_stock_movement(self, obj):
        if hasattr(obj, 'last_stock_movement') and obj.last_stock_movement:
            return obj.last_stock_movement.isoformat()
        return None

    def get_dead_stock_threshold_days(self, obj):
        return obj.dead_stock_threshold_days

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

        for idx, item_entry in enumerate(items_data):
            try:
                logger.debug(f"Processing item {idx + 1}: {item_entry}")

                if 'item' in item_entry:
                    # Existing item reference
                    item = Item.objects.get(pk=item_entry['item'])
                    # Always update category and unit price from procurement form
                    if 'category' in item_entry:
                        try:
                            category = Category.objects.get(id=item_entry['category'])
                            item.category = category
                        except Category.DoesNotExist:
                            pass
                    if 'unit_price' in item_entry:
                        item.unit_price = item_entry['unit_price']
                    item.save(update_fields=["category", "unit_price"])
                elif 'item_data' in item_entry:
                    # New item to be created
                    item_data = item_entry['item_data']
                    logger.debug(f"Creating new item: {item_data}")

                    # Ensure category exists
                    try:
                        category = Category.objects.get(id=item_data['category'])
                    except Category.DoesNotExist:
                        logger.error(f"Category with id {item_data['category']} does not exist.")
                        raise serializers.ValidationError({"items": f"Category with id {item_data['category']} does not exist."})

                    item, created = Item.objects.get_or_create(
                        name=item_data['name'],
                        defaults={
                            'category': category,
                            'unit_price': item_data['unit_price'],
                        }
                    )

                    if not item.pk:
                        logger.error(f"Item creation failed: {item_data}")
                        raise serializers.ValidationError({"items": f"Failed to create item: {item_data['name']}"})

                    if created:
                        logger.info(f"Item created: {item.name} (ID: {item.id})")
                    else:
                        logger.warning(f"Item already exists: {item.name} (ID: {item.id})")
                else:
                    logger.error(f"Invalid item entry: {item_entry}")
                    raise serializers.ValidationError({"items": "Each item must include 'item' or 'item_data'."})

                # Create ProcurementItem
                ProcurementItem.objects.create(
                    procurement=procurement,
                    item=item,
                    quantity=item_entry['quantity'],
                    unit_price=item_entry['unit_price']
                )

                # Update inventory in main store only
                main_inventory = InventoryByLocation.get_main_store_inventory(item)
                main_inventory.add_quantity(item_entry['quantity'])

            except Exception as e:
                logger.error(f"Error processing item entry {item_entry}: {e}", exc_info=True)
                raise serializers.ValidationError({"items": f"Error processing item {item_entry}: {str(e)}"})

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
        from .models import TotalInventory, InventoryByLocation
        from django.db import transaction
        print(f"[DEBUG] StockMovement create called with validated_data: {validated_data}")
        with transaction.atomic():
            stock_movement = super().create(validated_data)
            print(f"[DEBUG] StockMovement created: {stock_movement}")
            item = stock_movement.item
            from_location = stock_movement.from_location
            to_location = stock_movement.to_location
            quantity = stock_movement.quantity
            # Update location inventories
            from_inventory = InventoryByLocation.get_or_create_inventory(item, from_location)
            to_inventory = InventoryByLocation.get_or_create_inventory(item, to_location)
            from_inventory.remove_quantity(quantity)
            to_inventory.add_quantity(quantity)

            # --- Update TotalInventory (FIFO logic) ---
            qty_to_move = quantity
            # Decrement from from_location (FIFO by procurement)
            from_batches = list(TotalInventory.objects.filter(item=item, location=from_location, available_quantity__gt=0).order_by('order_date', 'id'))
            batch_movements = []  # (batch, qty_moved)
            for batch in from_batches:
                if qty_to_move <= 0:
                    break
                move_qty = min(batch.available_quantity, qty_to_move)
                batch.available_quantity -= move_qty
                batch.last_stock_movement = stock_movement
                batch.save(update_fields=['available_quantity', 'last_stock_movement'])
                batch_movements.append((batch, move_qty))
                qty_to_move -= move_qty
            if qty_to_move > 0:
                raise serializers.ValidationError(f"Not enough stock in TotalInventory at {from_location.name} for {item.name}")
            # Increment at to_location, preserving procurement info
            for batch, moved_qty in batch_movements:
                to_batch, _ = TotalInventory.objects.get_or_create(
                    item=item,
                    procurement=batch.procurement,
                    location=to_location,
                    defaults={
                        'available_quantity': 0,
                        'order_number': batch.order_number,
                        'supplier': batch.supplier,
                        'order_date': batch.order_date,
                    }
                )
                to_batch.available_quantity += moved_qty
                to_batch.last_stock_movement = stock_movement
                to_batch.save(update_fields=['available_quantity', 'last_stock_movement'])

            # --- DEAD STOCK LOGIC: update last_stock_movement on item ---
            item.last_stock_movement = timezone.now().date()
            item.save(update_fields=["last_stock_movement"])

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
        from .models import TotalInventory, InventoryByLocation
        import logging
        logger = logging.getLogger('inventory')
        with transaction.atomic():
            item = validated_data['item']
            location = validated_data['location']
            quantity = validated_data['quantity']

            # STEP 1: Process batches FIRST (FIFO, lock for update) - STRICTLY SCOPED TO LOCATION
            qty_to_discard = quantity
            batches = list(TotalInventory.objects.select_for_update().filter(
                item=item,
                location=location,  # CRITICAL: Only this location
                available_quantity__gt=0
            ).order_by('order_date', 'id'))
            updated_batches = []
            for batch in batches:
                if qty_to_discard <= 0:
                    break
                discard_qty = min(batch.available_quantity, qty_to_discard)
                batch.available_quantity -= discard_qty
                qty_to_discard -= discard_qty
                updated_batches.append(batch)
            # VERIFY BEFORE UPDATING LOCATION
            if qty_to_discard > 0:
                raise serializers.ValidationError(f"Not enough stock in TotalInventory at {location.name} for {item.name} to discard")

            # STEP 2: Now update location inventory (ONLY this location)
            location_inventory = InventoryByLocation.get_or_create_inventory(item, location)
            logger.debug(f"Discard: Location {location.name} inventory BEFORE: {location_inventory.quantity}")
            if location_inventory.quantity < quantity:
                raise serializers.ValidationError(f"Only {location_inventory.quantity} available at {location.name}")
            location_inventory.remove_quantity(quantity)
            logger.debug(f"Discard: Location {location.name} inventory AFTER: {location_inventory.quantity}")

            # STEP 3: Save batch changes (ONLY for this location)
            for batch in updated_batches:
                if batch.available_quantity > 0:
                    batch.save(update_fields=['available_quantity'])
                else:
                    batch.delete()

            # STEP 4: Create the discarded item record
            discarded_item = super().create(validated_data)

            # STEP 5: Increment dead stock for category only if the field exists
            from .models import Category
            dead_stock_category = Category.get_dead_stock_category()
            if hasattr(dead_stock_category, 'dead_stock_count'):
                dead_stock_category.dead_stock_count += quantity
                dead_stock_category.save(update_fields=["dead_stock_count"])

            return discarded_item

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

class AuditLogSerializer(serializers.ModelSerializer):
    performed_by = UserSerializer(read_only=True)
    performed_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='performed_by', write_only=True)

    class Meta:
        model = AuditLog
        fields = ['id', 'action', 'entity_type', 'performed_by', 'performed_by_id', 'timestamp', 'details']
        read_only_fields = ['id', 'timestamp', 'performed_by']