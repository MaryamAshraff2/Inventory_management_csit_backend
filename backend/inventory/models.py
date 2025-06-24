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