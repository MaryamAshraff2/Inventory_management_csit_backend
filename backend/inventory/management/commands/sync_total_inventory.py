from django.core.management.base import BaseCommand
from inventory.models import Procurement, StockMovement, DiscardedItem, TotalInventory, Item, Location
from django.db import transaction

class Command(BaseCommand):
    help = 'Syncs the TotalInventory table with the current state of procurements, stock movements, and discards.'

    def handle(self, *args, **options):
        self.stdout.write('Clearing TotalInventory table...')
        TotalInventory.objects.all().delete()
        self.stdout.write('Rebuilding TotalInventory...')
        
        # Get main store location
        main_store = Location.get_main_store()
        
        procurements = Procurement.objects.prefetch_related('items__item').all()
        stock_movements = StockMovement.objects.select_related('item', 'to_location').all()
        discards = DiscardedItem.objects.select_related('item').all()
        rows = []
        
        for procurement in procurements:
            for proc_item in procurement.items.all():
                # Create TotalInventory record for Main Store (where items are initially stored)
                # Calculate how much is still in Main Store
                movements_out = sum(
                    m.quantity for m in stock_movements 
                    if m.item_id == proc_item.item_id and m.from_location_id == main_store.id
                )
                movements_in = sum(
                    m.quantity for m in stock_movements 
                    if m.item_id == proc_item.item_id and m.to_location_id == main_store.id
                )
                
                # Net quantity in Main Store
                main_store_qty = proc_item.quantity + movements_in - movements_out
                
                # Subtract discarded quantity from Main Store
                discarded_from_main = sum(
                    d.quantity for d in discards
                    if d.item_id == proc_item.item_id
                )
                main_store_qty = max(0, main_store_qty - discarded_from_main)
                
                if main_store_qty > 0:
                    rows.append(TotalInventory(
                        item=proc_item.item,
                        procurement=procurement,
                        location=main_store,
                        available_quantity=main_store_qty,
                        order_number=procurement.order_number,
                        supplier=procurement.supplier,
                        order_date=procurement.order_date,
                        unit_price=proc_item.unit_price,
                    ))
                
                # Create TotalInventory records for other locations where items have been moved
                location_map = {}
                for m in stock_movements:
                    if m.item_id == proc_item.item_id and m.to_location_id != main_store.id:
                        loc_id = m.to_location_id
                        if loc_id not in location_map:
                            location_map[loc_id] = {
                                'location': m.to_location,
                                'quantity': 0,
                            }
                        location_map[loc_id]['quantity'] += m.quantity
                
                for loc_id, loc_data in location_map.items():
                    # Subtract movements out from this location
                    movements_out_from_loc = sum(
                        m.quantity for m in stock_movements
                        if m.item_id == proc_item.item_id and m.from_location_id == loc_id
                    )
                    
                    # Subtract discarded quantity from this location
                    discarded_from_loc = sum(
                        d.quantity for d in discards
                        if d.item_id == proc_item.item_id and getattr(d, 'location_id', None) == loc_id
                    )
                    
                    available_qty = max(0, loc_data['quantity'] - movements_out_from_loc - discarded_from_loc)
                    
                    if available_qty > 0:
                        rows.append(TotalInventory(
                            item=proc_item.item,
                            procurement=procurement,
                            location=loc_data['location'],
                            available_quantity=available_qty,
                            order_number=procurement.order_number,
                            supplier=procurement.supplier,
                            order_date=procurement.order_date,
                            unit_price=proc_item.unit_price,
                        ))
        
        with transaction.atomic():
            TotalInventory.objects.bulk_create(rows)
        self.stdout.write(self.style.SUCCESS(f'Synced {len(rows)} inventory records.')) 