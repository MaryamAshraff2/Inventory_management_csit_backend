from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.usermanagement import UserViewSet
from .views.login import login_api
from .views.departments import DepartmentViewSet
from .views.superuser_management import SuperuserManagementViewSet
from .views.categories import CategoryViewSet
from .views.items import ItemViewSet, get_item_availability
from .views.procurements import ProcurementViewSet
from .views.locations import LocationViewSet
from .views.stockmovements import StockMovementViewSet
from .views.sendingstockrequests import SendingStockRequestViewSet
from .views.discardeditems import DiscardedItemViewSet
from .views.reports import ReportViewSet
from .views.auditlogs import AuditLogListView, AuditLogActionsView, AuditLogEntitiesView, AuditLogUsersView, AuditLogExportPDFView, AuditLogExportExcelView
from .views.user_views import user_dashboard_data, create_stock_request, user_stock_requests, user_inventory_view, user_location_inventory, available_items_for_request, user_profile_data, get_user_counts
from .views.discardrequest import user_discard_requests, admin_pending_discard_requests, admin_process_discard_request
from .views.transit import TransitViewSet, transit_send_api
from .views.contract_schedule import ContractScheduleViewSet, contract_schedule_upload_api, contract_schedule_delete_api
from .views.amendment_order import AmendmentOrderViewSet, amendment_order_upload_api, amendment_order_delete_api
from .views.delivery_note import DeliveryNoteViewSet, delivery_note_upload_api, delivery_note_delete_api
from .views.receiving_note import ReceivingNoteViewSet, receiving_note_create_api, receiving_note_delete_api
from .views.stock_in_hand import stock_in_hand_api, stock_in_hand_summary_api
from .views.inventory_transactions import inventory_transactions_api, inventory_transactions_summary_api, inventory_transactions_export_api
from .views.low_stock import low_stock_api, low_stock_summary_api, low_stock_export_api, low_stock_by_category_api
from .views.out_of_stock import out_of_stock_api, out_of_stock_summary_api, out_of_stock_export_api, out_of_stock_by_category_api, out_of_stock_by_store_api


# Router for ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'superuser-management', SuperuserManagementViewSet, basename='superuser-management')
router.register(r'locations', LocationViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'items', ItemViewSet)
router.register(r'procurements', ProcurementViewSet)
router.register(r'stockmovements', StockMovementViewSet)
router.register(r'sendingstockrequests', SendingStockRequestViewSet)
router.register(r'discardeditems', DiscardedItemViewSet)
router.register(r'reports', ReportViewSet)
router.register(r'transits', TransitViewSet)
router.register(r'contract-schedules', ContractScheduleViewSet)
router.register(r'amendment-orders', AmendmentOrderViewSet)
router.register(r'delivery-notes', DeliveryNoteViewSet)
router.register(r'receiving-notes', ReceivingNoteViewSet)

urlpatterns = [
    path('login/', login_api, name='login'),
    path('', include(router.urls)),
    path('api/item-availability/', get_item_availability, name='item-availability'),
    path('audit-logs/', AuditLogListView.as_view(), name='audit-log-list'),
    path('audit-logs/actions/', AuditLogActionsView.as_view(), name='audit-log-actions'),
    path('audit-logs/entities/', AuditLogEntitiesView.as_view(), name='audit-log-entities'),
    path('audit-logs/users/', AuditLogUsersView.as_view(), name='audit-log-users'),
    path('audit-logs/export/pdf/', AuditLogExportPDFView.as_view(), name='audit-log-export-pdf'),
    path('audit-logs/export/excel/', AuditLogExportExcelView.as_view(), name='audit-log-export-excel'),
    
    # User-specific endpoints
    path('user/dashboard/', user_dashboard_data, name='user-dashboard'),
    path('user/stock-requests/', user_stock_requests, name='user-stock-requests'),
    path('user/create-stock-request/', create_stock_request, name='create-stock-request'),
    path('user/inventory/', user_inventory_view, name='user-inventory'),
    path('user/location-inventory/', user_location_inventory, name='user-location-inventory'),
    path('user/available-items/', available_items_for_request, name='available-items'),
    path('user/profile/', user_profile_data, name='user-profile'),
    path('user/counts/', get_user_counts, name='user-counts'),
    # Discard request workflow
    path('user/discard-requests/', user_discard_requests, name='user-discard-requests'),
    path('admin/discard-requests/pending/', admin_pending_discard_requests, name='admin-pending-discard-requests'),
    path('admin/discard-requests/<int:pk>/process/', admin_process_discard_request, name='admin-process-discard-request'),
    
    # Transit endpoints
    path('api/transit/send/', transit_send_api, name='transit-send'),
    
    # Contract Schedule endpoints
    path('api/contract-schedule/', contract_schedule_upload_api, name='contract-schedule-upload'),
    path('api/contract-schedule/<int:schedule_id>/', contract_schedule_delete_api, name='contract-schedule-delete'),
    
    # Amendment Order endpoints
    path('api/contract-schedule/<int:contract_schedule_id>/amendment/', amendment_order_upload_api, name='amendment-order-upload'),
    path('api/contract-schedule/amendment/', amendment_order_delete_api, name='amendment-order-delete'),
    
    # Delivery Note endpoints
    path('api/delivery-note/', delivery_note_upload_api, name='delivery-note-upload'),
    path('api/delivery-note/<int:delivery_note_id>/', delivery_note_delete_api, name='delivery-note-delete'),
    
    # Receiving Note endpoints
    path('api/receiving-note/', receiving_note_create_api, name='receiving-note-create'),
    path('api/receiving-note/<int:receiving_note_id>/', receiving_note_delete_api, name='receiving-note-delete'),
    
    # Stock in Hand endpoints
    path('api/stock-in-hand/', stock_in_hand_api, name='stock-in-hand'),
    path('api/stock-in-hand/summary/', stock_in_hand_summary_api, name='stock-in-hand-summary'),
    
    # Inventory Transactions endpoints
    path('api/inventory-transactions/', inventory_transactions_api, name='inventory-transactions'),
    path('api/inventory-transactions/summary/', inventory_transactions_summary_api, name='inventory-transactions-summary'),
    path('api/inventory-transactions/export/', inventory_transactions_export_api, name='inventory-transactions-export'),
    
    # Low Stock endpoints
    path('api/low-stock/', low_stock_api, name='low-stock'),
    path('api/low-stock/summary/', low_stock_summary_api, name='low-stock-summary'),
    path('api/low-stock/export/', low_stock_export_api, name='low-stock-export'),
    path('api/low-stock/by-category/', low_stock_by_category_api, name='low-stock-by-category'),
    
    # Out of Stock endpoints
    path('api/out-of-stock/', out_of_stock_api, name='out-of-stock'),
    path('api/out-of-stock/summary/', out_of_stock_summary_api, name='out-of-stock-summary'),
    path('api/out-of-stock/export/', out_of_stock_export_api, name='out-of-stock-export'),
    path('api/out-of-stock/by-category/', out_of_stock_by_category_api, name='out-of-stock-by-category'),
    path('api/out-of-stock/by-store/', out_of_stock_by_store_api, name='out-of-stock-by-store'),
]



# userview urls
