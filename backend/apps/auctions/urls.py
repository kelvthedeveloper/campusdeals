from django.urls import path

from .views import AuctionDetailView, AuctionListView, PlaceBidView

urlpatterns = [
    path('auctions/', AuctionListView.as_view()),
    path('auctions/<int:pk>/', AuctionDetailView.as_view()),
    path('auctions/<int:auction_id>/bid/', PlaceBidView.as_view()),
]
