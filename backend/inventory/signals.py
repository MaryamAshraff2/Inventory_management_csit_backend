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
from django.db.models.signals import post_save, post_delete, m2m_changed, pre_save
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
        if created:
            category = instance.category
            category.item_count = Item.objects.filter(category=category).count()
            category.save(update_fields=["item_count"])
        else:
            # If the item's category was changed, handle in pre_save
            pass
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
            category.item_count = Item.objects.filter(category=category).count()
            category.save(update_fields=["item_count"])
    except Exception as e:
        logger.error(f"Error updating count on delete: {e}")

# Handle category change on update
@receiver(pre_save, sender=Item)
def update_item_count_on_category_change(sender, instance, **kwargs):
    if not instance.pk:
        return  # New item, handled in post_save
    try:
        old_item = Item.objects.get(pk=instance.pk)
    except Item.DoesNotExist:
        return
    if old_item.category != instance.category:
        # Decrement old category
        old_category = old_item.category
        old_category.item_count = Item.objects.filter(category=old_category).exclude(pk=instance.pk).count()
        old_category.save(update_fields=["item_count"])
        # Increment new category will be handled in post_save