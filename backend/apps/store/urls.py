from django.urls import path

from .views import (
    AdminCategoryDetailView,
    AdminCategoryListCreateView,
    AdminCategoryStatusView,
    CategoriesView,
    FavoriteDeleteView,
    FavoriteListCreateView,
    StoreProductDetailView,
    StoreProductListView,
    StoreCategoriesView,
)

urlpatterns = [
    path('categories/', CategoriesView.as_view()),
    path('store/categories/', StoreCategoriesView.as_view()),
    path('store/products/', StoreProductListView.as_view()),
    path('store/products/<slug:slug>/', StoreProductDetailView.as_view()),
    path('store/favorites/', FavoriteListCreateView.as_view()),
    path('store/favorites/<int:product_id>/', FavoriteDeleteView.as_view()),

    path('admin/categories/', AdminCategoryListCreateView.as_view()),
    path('admin/categories/<int:category_id>/', AdminCategoryDetailView.as_view()),
    path('admin/categories/<int:category_id>/status/', AdminCategoryStatusView.as_view()),
]
