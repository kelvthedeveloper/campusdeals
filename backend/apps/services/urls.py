from django.urls import path

from .views import (
    AdminServiceDetailView,
    AdminServiceListCreateView,
    AdminServiceStatusView,
    BookingDetailView,
    BookingListCreateView,
    ServiceListView,
)

urlpatterns = [
    path('services/', ServiceListView.as_view()),
    path('services/bookings/', BookingListCreateView.as_view()),
    path('services/bookings/<int:booking_id>/', BookingDetailView.as_view()),
    path('services/admin/services/', AdminServiceListCreateView.as_view()),
    path('services/admin/services/<int:service_id>/', AdminServiceDetailView.as_view()),
    path('services/admin/services/<int:service_id>/status/', AdminServiceStatusView.as_view()),
]
