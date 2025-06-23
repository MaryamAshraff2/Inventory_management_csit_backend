from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
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

    def __str__(self):
        return self.name


class Item(models.Model):
    name = models.CharField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return self.name


class Procurement(models.Model):
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='procurements')
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    order_number = models.CharField(max_length=20, unique=True, blank=True)
    supplier = models.CharField(max_length=255, null=True, blank=True)
    document = models.FileField(upload_to='procurement_documents/', blank=True, null=True)
    order_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.order_number:
            last = Procurement.objects.order_by('-id').first()
            next_id = (last.id + 1) if last else 1
            self.order_number = f'PO-{next_id:04d}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.order_number} - {self.quantity} of {self.item.name}'


class Location(models.Model):
    name = models.CharField(max_length=100)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, related_name='locations', null=True, blank=True)
    room_number = models.CharField(max_length=100,default='0')
    description = models.TextField(blank=True)
   
    # Add more fields as needed (e.g., address, code, etc.)

    def __str__(self):
        return self.name 


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


# # one table for stock request
# class StockRequest(models.Model):
#     STATUS_CHOICES = [
#         ("Pending", "Pending"),
#         ("Approved", "Approved"),
#         ("Rejected", "Rejected"),
#     ]
#     item = models.ForeignKey(Item, on_delete=models.PROTECT)
#     quantity = models.PositiveIntegerField()
#     requested_by = models.ForeignKey(
#         User, 
#         on_delete=models.CASCADE,
#         related_name="stock_requests"
#     )
#     status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Pending")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         ordering = ['-created_at']


# # two tables for stock request
# class StockRequest(models.Model):
#     STATUS_CHOICES = [
#         ("Pending", "Pending"),
#         ("Approved", "Approved"),
#         ("Rejected", "Rejected"),
#     ]
#     item = models.CharField(max_length=100)
#     # category = models.CharField(max_length=10)
#     quantity = models.PositiveIntegerField()
#     requester_name = models.CharField(max_length=100)
#     requested_by = models.ForeignKey('auth.User', on_delete=models.SET_NULL, null=True, blank=True)
#     date_requested = models.DateField()
#     status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="Pending")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

#     def __str__(self):
#         return f"{self.item} request by {self.requester_name}"


# # userview models
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

