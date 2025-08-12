from rest_framework import serializers
from django.db import transaction
import json
from .models import (
    User, Department, Category, Item, Procurement, Location, ProcurementItem,
    StockMovement, SendingStockRequest, DiscardedItem, Report, TotalInventory, InventoryByLocation, AuditLog, DiscardRequest, Transit, ContractSchedule, AmendmentOrder, DeliveryNote, DeliveredItem, ReceivingNote, ReceivedItem
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
    user_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Department
        fields = ['id', 'name', 'email', 'user_count', 'locations']
    
    def get_user_count(self, obj):
        """Get the count of users in this department"""
        return obj.users.count()
    
    def validate_name(self, value):
        if Department.get_active_departments().filter(name=value).exists():
            raise serializers.ValidationError("Department with this name already exists.")
        return value

class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    department = serializers.PrimaryKeyRelatedField(read_only=True)
    location = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), required=False, allow_null=True
    )
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'full_name', 'email', 'password', 'role', 'department', 'department_name', 'location']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }
    
    def get_full_name(self, obj):
        """Get the full name of the user"""
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        elif obj.first_name:
            return obj.first_name
        elif obj.last_name:
            return obj.last_name
        else:
            return obj.username

    def create(self, validated_data):
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['department'] = request.user.department

        password = validated_data.pop('password', None)
        user = super().create(validated_data)

        if password:
            user.set_password(password)
            user.save()

        return user

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
    received_by_name = serializers.SerializerMethodField()

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

    def get_received_by_name(self, obj):
        """Get the name of the user who received the stock movement"""
        if obj.received_by:
            if obj.received_by.first_name and obj.received_by.last_name:
                return f"{obj.received_by.first_name} {obj.received_by.last_name}"
            elif obj.received_by.first_name:
                return obj.received_by.first_name
            elif obj.received_by.last_name:
                return obj.received_by.last_name
            else:
                return obj.received_by.username
        return "Unknown"

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

class DiscardRequestSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), source='item', write_only=True)
    location = LocationSerializer(read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all(), source='location', write_only=True)
    requested_by = UserSerializer(read_only=True)
    requested_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='requested_by', write_only=True)

    class Meta:
        model = DiscardRequest
        fields = [
            'id', 'item', 'item_id', 'quantity', 'reason', 'notes',
            'location', 'location_id', 'requested_by', 'requested_by_id',
            'status', 'date_requested', 'date_processed'
        ]
        read_only_fields = ['id', 'status', 'date_requested', 'date_processed', 'item', 'location', 'requested_by']

class ReportSerializer(serializers.ModelSerializer):
    generated_by_name = serializers.SerializerMethodField()
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

    def get_generated_by_name(self, obj):
        """Get the name of the user who generated the report"""
        if obj.generated_by:
            if obj.generated_by.first_name and obj.generated_by.last_name:
                return f"{obj.generated_by.first_name} {obj.generated_by.last_name}"
            elif obj.generated_by.first_name:
                return obj.generated_by.first_name
            elif obj.generated_by.last_name:
                return obj.generated_by.last_name
            else:
                return obj.generated_by.username
        return "Unknown"

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
            received_by_name = "Unknown"
            if m.received_by:
                if m.received_by.first_name and m.received_by.last_name:
                    received_by_name = f"{m.received_by.first_name} {m.received_by.last_name}"
                elif m.received_by.first_name:
                    received_by_name = m.received_by.first_name
                elif m.received_by.last_name:
                    received_by_name = m.received_by.last_name
                else:
                    received_by_name = m.received_by.username
            
            return {
                'id': m.id,
                'from_location': m.from_location.name,
                'to_location': m.to_location.name,
                'quantity': m.quantity,
                'movement_date': m.movement_date,
                'received_by': received_by_name,
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

class TransitSerializer(serializers.ModelSerializer):
    item = ItemSerializer(read_only=True)
    item_id = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all(), source='item', write_only=True)
    from_location = LocationSerializer(read_only=True)
    from_location_id = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all(), source='from_location', write_only=True)
    to_location = LocationSerializer(read_only=True)
    to_location_id = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all(), source='to_location', write_only=True)
    sent_by = UserSerializer(read_only=True)
    sent_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='sent_by', write_only=True)
    received_by = UserSerializer(read_only=True)
    received_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='received_by', write_only=True, required=False, allow_null=True)
    
    # Additional fields for API response
    item_name = serializers.CharField(source='item.name', read_only=True)
    from_location_name = serializers.CharField(source='from_location.name', read_only=True)
    to_location_name = serializers.CharField(source='to_location.name', read_only=True)
    sent_by_name = serializers.SerializerMethodField()
    received_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Transit
        fields = [
            'id', 'item', 'item_id', 'from_location', 'from_location_id',
            'to_location', 'to_location_id', 'quantity', 'sent_by', 'sent_by_id',
            'received_by', 'received_by_id', 'status', 'sent_date', 'received_date',
            'notes', 'item_name', 'from_location_name', 'to_location_name',
            'sent_by_name', 'received_by_name'
        ]
        read_only_fields = ['id', 'sent_date', 'received_date', 'status', 'received_by']

    def create(self, validated_data):
        """Create a transit and update inventory"""
        from .models import InventoryByLocation
        
        with transaction.atomic():
            # Create the transit
            transit = Transit.objects.create(**validated_data)
            
            # Remove quantity from source location
            source_inventory = InventoryByLocation.get_or_create_inventory(
                transit.item, transit.from_location
            )
            source_inventory.remove_quantity(transit.quantity)
            
            # Log the action
            from .utils import log_audit_action
            log_audit_action(
                'Transit Created', 
                'Transit', 
                f"Created transit for {transit.quantity} x {transit.item.name} from {transit.from_location.name} to {transit.to_location.name}"
            )
            
            return transit

    def get_sent_by_name(self, obj):
        """Get the name of the user who sent the transit"""
        if obj.sent_by:
            if obj.sent_by.first_name and obj.sent_by.last_name:
                return f"{obj.sent_by.first_name} {obj.sent_by.last_name}"
            elif obj.sent_by.first_name:
                return obj.sent_by.first_name
            elif obj.sent_by.last_name:
                return obj.sent_by.last_name
            else:
                return obj.sent_by.username
        return "Unknown"

    def get_received_by_name(self, obj):
        """Get the name of the user who received the transit"""
        if obj.received_by:
            if obj.received_by.first_name and obj.received_by.last_name:
                return f"{obj.received_by.first_name} {obj.received_by.last_name}"
            elif obj.received_by.first_name:
                return obj.received_by.first_name
            elif obj.received_by.last_name:
                return obj.received_by.last_name
            else:
                return obj.received_by.username
        return "Unknown"

class TransitSendSerializer(serializers.Serializer):
    """Serializer for marking transit as delivered"""
    received_by_user_id = serializers.IntegerField()
    notes = serializers.CharField(required=False, allow_blank=True)

class ContractScheduleSerializer(serializers.ModelSerializer):
    procurement = serializers.PrimaryKeyRelatedField(queryset=Procurement.objects.all())
    uploaded_by = UserSerializer(read_only=True)
    uploaded_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='uploaded_by', write_only=True)
    
    class Meta:
        model = ContractSchedule
        fields = [
            'id', 'procurement', 'title', 'document', 'notes', 
            'uploaded_at', 'uploaded_by', 'uploaded_by_id'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']

    def create(self, validated_data):
        """Create contract schedule and log the action"""
        contract_schedule = ContractSchedule.objects.create(**validated_data)
        
        # Log the action
        from .utils import log_audit_action
        log_audit_action(
            'Contract Schedule Uploaded', 
            'ContractSchedule', 
            f"Uploaded contract schedule '{contract_schedule.title}' for procurement {contract_schedule.procurement.order_number}"
        )
        
        return contract_schedule

class AmendmentOrderSerializer(serializers.ModelSerializer):
    contract_schedule = serializers.PrimaryKeyRelatedField(queryset=ContractSchedule.objects.all())
    uploaded_by = UserSerializer(read_only=True)
    uploaded_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='uploaded_by', write_only=True)
    
    class Meta:
        model = AmendmentOrder
        fields = [
            'id', 'contract_schedule', 'title', 'document', 'reason', 'notes', 
            'amendment_date', 'uploaded_at', 'uploaded_by', 'uploaded_by_id'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']

    def create(self, validated_data):
        """Create amendment order and log the action"""
        amendment_order = AmendmentOrder.objects.create(**validated_data)
        
        # Log the action
        from .utils import log_audit_action
        log_audit_action(
            'Amendment Order Uploaded', 
            'AmendmentOrder', 
            f"Uploaded amendment order '{amendment_order.title}' for contract schedule '{amendment_order.contract_schedule.title}'"
        )
        
        return amendment_order

class DeliveredItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    item_name = serializers.CharField(source='item.name', read_only=True)
    
    class Meta:
        model = DeliveredItem
        fields = ['id', 'item', 'item_name', 'lot_number', 'quantity']


class DeliveryNoteSerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    uploaded_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='uploaded_by', write_only=True)
    delivered_items = DeliveredItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = DeliveryNote
        fields = [
            'id', 'order_type', 'order_id', 'delivery_type', 'delivery_date', 
            'document', 'uploaded_by', 'uploaded_by_id', 'uploaded_at', 
            'delivered_items', 'notes'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by', 'delivered_items']

    def create(self, validated_data):
        """Create delivery note and log the action"""
        delivery_note = DeliveryNote.objects.create(**validated_data)
        
        # Log the action
        from .utils import log_audit_action
        log_audit_action(
            'Delivery Note Uploaded', 
            'DeliveryNote', 
            f"Uploaded {delivery_note.get_delivery_type_display()} for {delivery_note.get_order_type_display()} #{delivery_note.order_id}"
        )
        
        return delivery_note

class ReceivedItemSerializer(serializers.ModelSerializer):
    item = serializers.PrimaryKeyRelatedField(queryset=Item.objects.all())
    item_name = serializers.CharField(source='item.name', read_only=True)
    
    class Meta:
        model = ReceivedItem
        fields = ['id', 'item', 'item_name', 'lot_number', 'quantity']


class ReceivingNoteSerializer(serializers.ModelSerializer):
    delivery_note = serializers.PrimaryKeyRelatedField(queryset=DeliveryNote.objects.all())
    received_by = UserSerializer(read_only=True)
    received_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='received_by', write_only=True)
    uploaded_by = UserSerializer(read_only=True)
    uploaded_by_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source='uploaded_by', write_only=True)
    received_items = ReceivedItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = ReceivingNote
        fields = [
            'id', 'delivery_note', 'receiving_type', 'receiving_date', 
            'received_by', 'received_by_id', 'uploaded_by', 'uploaded_by_id',
            'uploaded_at', 'received_items', 'notes'
        ]
        read_only_fields = ['id', 'uploaded_at', 'received_by', 'uploaded_by', 'received_items']

    def create(self, validated_data):
        """Create receiving note and log the action"""
        receiving_note = ReceivingNote.objects.create(**validated_data)
        
        # Log the action
        from .utils import log_audit_action
        log_audit_action(
            'Receiving Note Created', 
            'ReceivingNote', 
            f"Created {receiving_note.get_receiving_type_display()} for Delivery Note #{receiving_note.delivery_note.id}"
        )
        
        return receiving_note