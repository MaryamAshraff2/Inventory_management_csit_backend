# from django.apps import AppConfig


# class UserappConfig(AppConfig):
#     default_auto_field = 'django.db.models.BigAutoField'
#     name = 'inventory'

# inventory/apps.py
from django.apps import AppConfig

class InventoryConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'inventory'

    def ready(self):
        # Import signals when app is ready
        import inventory.signals




