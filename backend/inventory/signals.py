# from django.db.models.signals import post_save, post_delete
# from django.dispatch import receiver
# from .models import Item, Category

# @receiver(post_save, sender=Item)
# def update_item_count_on_save(sender, instance, **kwargs):
#     category = instance.category
#     category.item_count = Item.objects.filter(category=category).count()
#     category.save()

# @receiver(post_delete, sender=Item)
# def update_item_count_on_delete(sender, instance, **kwargs):
#     category = instance.category
#     category.item_count = Item.objects.filter(category=category).count()
#     category.save()



# inventory/signals.py
from django.db.models import Sum
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from .models import Item, Category
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Item)
def update_item_count_on_save(sender, instance, created, **kwargs):
    """
    Updates category count when items are saved (created or updated)
    """
    try:
        logger.debug(f"Updating count for category {instance.category.id}")
        total = Item.objects.filter(
            category=instance.category
        ).aggregate(
            total=Sum('quantity')
        )['total'] or 0
        
        Category.objects.filter(
            pk=instance.category.pk
        ).update(
            itemCount=total
        )
    except Exception as e:
        logger.error(f"Error updating count: {e}")

@receiver(post_delete, sender=Item)
def update_item_count_on_delete(sender, instance, **kwargs):
    """
    Updates category count when items are deleted
    """
    try:
        if hasattr(instance, 'category') and instance.category:
            category = instance.category
            total = Item.objects.filter(
                category=category
            ).aggregate(
                total=Sum('quantity')
            )['total'] or 0
            
            category.itemCount = total
            category.save()
    except Exception as e:
        logger.error(f"Error updating count on delete: {e}")