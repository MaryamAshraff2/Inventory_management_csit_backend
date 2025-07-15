from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.usermanagement import UserViewSet
from .views.login import login_api
from .views.departments import DepartmentViewSet
from .views.categories import CategoryViewSet
from .views.items import ItemViewSet, get_item_availability
from .views.procurements import ProcurementViewSet
from .views.locations import LocationViewSet
from .views.stockmovements import StockMovementViewSet
from .views.sendingstockrequests import SendingStockRequestViewSet
from .views.discardeditems import DiscardedItemViewSet
from .views.reports import ReportViewSet
from .views.auditlogs import AuditLogListView, AuditLogActionsView, AuditLogEntitiesView, AuditLogUsersView, AuditLogExportPDFView, AuditLogExportExcelView
from .views.user_views import user_dashboard_data, create_stock_request, user_stock_requests, user_inventory_view, user_location_inventory, available_items_for_request, user_profile_data
from .views.discardrequest import user_discard_requests, admin_pending_discard_requests, admin_process_discard_request


# Router for ViewSets
router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'items', ItemViewSet)
router.register(r'procurements', ProcurementViewSet)
router.register(r'stockmovements', StockMovementViewSet)
router.register(r'sendingstockrequests', SendingStockRequestViewSet)
router.register(r'discardeditems', DiscardedItemViewSet)
router.register(r'reports', ReportViewSet)

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
    # Discard request workflow
    path('user/discard-requests/', user_discard_requests, name='user-discard-requests'),
    path('admin/discard-requests/pending/', admin_pending_discard_requests, name='admin-pending-discard-requests'),
    path('admin/discard-requests/<int:pk>/process/', admin_process_discard_request, name='admin-process-discard-request'),
]



# userview urls
