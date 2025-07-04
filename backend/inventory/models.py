from django.db import models
from django.db.models import Sum

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20)
    department = models.ForeignKey('Department', on_delete=models.CASCADE, related_name='users')

    def __str__(self):
        return self.name
    

class Department(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    user_count = models.IntegerField(default=0)
    def __str__(self):
        return self.name
    

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    item_count = models.PositiveIntegerField(default=0)
    dead_stock_count = models.PositiveIntegerField(default=0)  # Track dead stock

    @classmethod
    def get_dead_stock_category(cls):
        return cls.objects.get_or_create(name='Dead Stock')[0]

    def __str__(self):
        return self.name


class Item(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    dead_stock_quantity = models.PositiveIntegerField(default=0)  # Track per-item dead stock

    @property
    def main_store_quantity(self):
        return InventoryByLocation.get_main_store_inventory(self).quantity

    @property
    def total_quantity(self):
        return self.inventory_by_location.aggregate(total=Sum('quantity'))['total'] or 0

    def __str__(self):
        return f"{self.name} (Main Store: {self.main_store_quantity})"


class Procurement(models.Model):
    PROCUREMENT_TYPE_CHOICES = [
        ('Purchase', 'Purchase'),
        ('Donation', 'Donation'),
        ('Transfer', 'Transfer'),
    ]
    
    DOCUMENT_TYPE_CHOICES = [
        ('Purchase Order', 'Purchase Order'),
        ('MOU (Email)', 'MOU (Email)'),
        ('Internal Memo', 'Internal Memo'),
        ('Donation Letter', 'Donation Letter'),
        ('Invoice', 'Invoice'),
    ]
    
    created_at = models.DateTimeField(auto_now_add=True)
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    supplier = models.CharField(max_length=255, null=True, blank=True)
    document = models.FileField(upload_to='procurement_documents/', blank=True, null=True)
    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES, blank=True, null=True)
    procurement_type = models.CharField(max_length=20, choices=PROCUREMENT_TYPE_CHOICES, blank=True, null=True)
    order_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            last = Procurement.objects.order_by('-id').first()
            next_id = (last.id + 1) if last else 1
            self.order_number = f'PO-{next_id:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.order_number}'


class ProcurementItem(models.Model):
    procurement = models.ForeignKey(Procurement, on_delete=models.CASCADE, related_name='items')
    item = models.ForeignKey(Item, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} x {self.item.name} for {self.procurement.order_number}"


class Location(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='locations', null=True, blank=True)
    room_number = models.CharField(max_length=100,default='0')
    description = models.TextField(blank=True)
   
    # Add more fields as needed (e.g., address, code, etc.)

    def __str__(self):
        return self.name 

    @classmethod
    def get_main_store(cls):
        return cls.objects.get_or_create(name='Main Store')[0]


class StockMovement(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='stock_movements')
    from_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='stock_movements_from')
    to_location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='stock_movements_to')
    quantity = models.PositiveIntegerField()
    movement_date = models.DateField(auto_now_add=True)
    received_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_stock_movements')
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.quantity} x {self.item.name} from {self.from_location.name} to {self.to_location.name} on {self.movement_date} (Received by: {self.received_by.name})" 


class SendingStockRequest(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name="stock_requests")
    quantity = models.PositiveIntegerField()
    requested_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Pending")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.quantity} x {self.item.name} requested by {self.requested_by} ({self.status})"

class DiscardedItem(models.Model):
    REASON_CHOICES = [
        ('Damaged', 'Damaged'),
        ('Obsolete', 'Obsolete'),
        ('Expired', 'Expired'),
        ('Other', 'Other'),
    ]
    
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='discarded_items')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='discarded_items')
    quantity = models.PositiveIntegerField()
    date = models.DateField(auto_now_add=True)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    discarded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='discarded_items')
    notes = models.TextField(blank=True, null=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.item.name} discarded at {self.location.name} on {self.date} ({self.reason})"
    
    def save(self, *args, **kwargs):
        # No more updates to Item fields; inventory is handled by InventoryByLocation and DiscardedItem
        super().save(*args, **kwargs)


class Report(models.Model):
    report_type = models.CharField(max_length=50)  # e.g., "Procurement", "Stock Movement"
    filters = models.JSONField(blank=True, null=True)  # To store filter parameters as JSON 
    generated_at = models.DateTimeField(auto_now_add=True)
    generated_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    export_pdf = models.FileField(upload_to='report_exports/pdf/', blank=True, null=True)
    export_excel = models.FileField(upload_to='report_exports/excel/', blank=True, null=True)

    def __str__(self):
        return f"{self.report_type} Report generated on {self.generated_at.strftime('%Y-%m-%d %H:%M:%S')}"

class TotalInventory(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='total_inventory')
    procurement = models.ForeignKey(Procurement, on_delete=models.CASCADE, related_name='total_inventory')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='total_inventory')
    available_quantity = models.PositiveIntegerField(default=0)
    order_number = models.CharField(max_length=20)
    supplier = models.CharField(max_length=255, null=True, blank=True)
    order_date = models.DateField(null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    last_stock_movement = models.ForeignKey('StockMovement', on_delete=models.SET_NULL, null=True, blank=True, related_name='inventory_records')

    class Meta:
        unique_together = ('item', 'procurement', 'location')

    def __str__(self):
        return f"{self.item.name} ({self.order_number}) at {self.location.name}: {self.available_quantity}"


class InventoryByLocation(models.Model):
    """
    Tracks item quantities per location to replace the flawed global available_quantity field.
    This ensures discarded items only affect inventory at their specific location.
    """
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='inventory_by_location')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='inventory_by_location')
    quantity = models.PositiveIntegerField(default=0)
    last_updated = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = [['item', 'location']]
        verbose_name = "Inventory by Location"
        verbose_name_plural = "Inventory by Locations"

    def __str__(self):
        return f"{self.item.name} at {self.location.name}: {self.quantity}"

    @classmethod
    def get_or_create_inventory(cls, item, location):
        inventory, created = cls.objects.get_or_create(
            item=item,
            location=location,
            defaults={'quantity': 0}
        )
        return inventory

    @classmethod
    def get_available_quantity(cls, item, location):
        try:
            inventory = cls.objects.get(item=item, location=location)
            return inventory.quantity
        except cls.DoesNotExist:
            return 0

    @classmethod
    def get_main_store_inventory(cls, item):
        main_store = Location.get_main_store()
        return cls.get_or_create_inventory(item, main_store)

    def add_quantity(self, quantity):
        self.quantity += quantity
        self.save(update_fields=['quantity', 'last_updated'])

    def remove_quantity(self, quantity):
        if self.quantity < quantity:
            raise ValueError(f"Not enough quantity available. Available: {self.quantity}, Requested: {quantity}")
        self.quantity -= quantity
        self.save(update_fields=['quantity', 'last_updated'])

class AuditLog(models.Model):
    action = models.CharField(max_length=100)
    entity_type = models.CharField(max_length=100)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField()

    def __str__(self):
        return f"{self.action} on {self.entity_type} by {self.performed_by} at {self.timestamp}"
