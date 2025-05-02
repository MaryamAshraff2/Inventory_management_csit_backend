from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views.usermanagement import UserViewSet
from .views.login import login_api
from .views.departments import DepartmentViewSet
from .views.categories import CategoriesViewSet
from .views.items import ItemsViewSet
from .views.procurements import ProcurementOrderViewSet


# Router for ViewSets
router = DefaultRouter()
router.register(r'usermanagement', UserViewSet, basename='usermanagement')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'items', ItemsViewSet, basename='items')
router.register(r'categories', CategoriesViewSet, basename='categories')
router.register(r'procurements', ProcurementOrderViewSet, basename='procurements')

urlpatterns = [
    path('login/', login_api, name='login'),
    path('', include(router.urls)),
]



