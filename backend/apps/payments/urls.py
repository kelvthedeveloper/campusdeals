from django.urls import path

from .views import InitializePaymentView, OrderDetailView, OrderListCreateView

urlpatterns = [
    path('payments/orders/', OrderListCreateView.as_view()),
    path('payments/orders/<int:order_id>/', OrderDetailView.as_view()),
    path('payments/initialize/', InitializePaymentView.as_view()),
]
