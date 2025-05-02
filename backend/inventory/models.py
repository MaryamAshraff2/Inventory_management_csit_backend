from django.db import models
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db.models import Sum

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=20)
    department = models.CharField(max_length=100)

    def __str__(self):
        return self.name
    

class Department(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    user_count = models.IntegerField(default=0)
    locations = models.JSONField(default=list)  # For PostgreSQL JSON field
    
    def __str__(self):
        return self.name
    

class Item(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField(default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2) #check
    category = models.ForeignKey(
        'Category', on_delete=models.CASCADE, related_name='items'
    )

    def __str__(self):
        return self.name
    

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    itemCount = models.PositiveIntegerField(default=0)

    def __str__(self):
        return self.name

    def update_item_count(self):
        # Sum all quantities of items in this category
        total = self.items.aggregate(total_quantity=Sum('quantity'))['total_quantity']
        self.itemCount = total if total is not None else 0
        self.save()


# class Procurement(models.Model):
#     item = models.ForeignKey(
#         'Item', on_delete=models.CASCADE, related_name='procurements' 
#     )
#     order_number = models.CharField(max_length=100, unique=True) #procurement ID
#     proc_type = models.CharField(max_length=255) #changed from type 
#     date_procured = models.DateField()
#     quantity = models.PositiveIntegerField()
#     unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
#     total_cost = models.DecimalField(max_digits=12, decimal_places=2)
#     supplier = models.CharField(max_length=255)
#     notes = models.TextField(blank=True, null=True)
#     document_file = models.FileField(upload_to="procurement_documents/", blank=True, null=True)
#     document_type = models.CharField(max_length=50)


#     def save(self, *args, **kwargs):
#         # Automatically calculate total cost
#         self.total_cost = self.quantity * self.unit_cost
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return f"{self.item.name} procured on {self.date_procured}"


class ProcurementOrder(models.Model):
    order_number = models.CharField(max_length=100, primary_key=True)  # ✅ Now primary key
    supplier = models.CharField(max_length=255)
    date_procured = models.DateField()
    notes = models.TextField(blank=True, null=True)
    document_file = models.FileField(upload_to="procurement_documents/", blank=True, null=True)
    document_type = models.CharField(max_length=50)
    added_by = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.order_number} - {self.supplier}"


class ProcurementItem(models.Model):
    order = models.ForeignKey(ProcurementOrder, on_delete=models.CASCADE, related_name='items', to_field='order_number')
    item = models.ForeignKey('Item', on_delete=models.CASCADE)
    proc_type = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2)
    total_cost = models.DecimalField(max_digits=12, decimal_places=2)

    def save(self, *args, **kwargs):
        self.total_cost = self.quantity * self.unit_cost
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.item.name} x {self.quantity} for {self.order.order_number}"
