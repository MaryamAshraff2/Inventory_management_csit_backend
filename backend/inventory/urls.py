from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.usermanagement import UserViewSet
from .views.login import login_api
from .views.departments import DepartmentViewSet
from .views.categories import CategoryViewSet
from .views.items import ItemViewSet
from .views.procurements import ProcurementViewSet
from .views.locations import LocationViewSet
from .views.stockmovements import StockMovementViewSet
from .views.sendingstockrequests import SendingStockRequestViewSet
from .views.discardeditems import DiscardedItemViewSet
from .views.reports import ReportViewSet


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
]



# userview urls
