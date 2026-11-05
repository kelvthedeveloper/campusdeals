from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Auction, Bid
from .serializers import AuctionSerializer


class AuctionListView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = AuctionSerializer

    def get_queryset(self):
        qs = Auction.objects.all().select_related('owner', 'winner').prefetch_related('bids__bidder')
        is_active = self.request.query_params.get('is_active')
        if is_active in ('true', '1'):
            qs = qs.filter(is_active=True)
        return qs


class AuctionDetailView(RetrieveAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = AuctionSerializer
    queryset = Auction.objects.all().select_related('owner', 'winner').prefetch_related('bids__bidder')


class PlaceBidView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def post(self, request, auction_id: int):
        try:
            auction = Auction.objects.select_for_update().get(id=auction_id)
        except Auction.DoesNotExist:
            return Response({'detail': 'Auction not found'}, status=status.HTTP_404_NOT_FOUND)

        if not auction.is_active or auction.end_time <= timezone.now():
            return Response({'detail': 'Auction is not active'}, status=status.HTTP_400_BAD_REQUEST)

        amount = request.data.get('amount')
        try:
            amount_dec = Decimal(str(amount))
        except Exception:
            return Response({'detail': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)

        min_bid = max(auction.current_price, auction.start_price)
        if amount_dec <= min_bid:
            return Response({'detail': f'Bid must be greater than {min_bid}'}, status=status.HTTP_400_BAD_REQUEST)

        Bid.objects.create(auction=auction, bidder=request.user, amount=amount_dec)
        auction.current_price = amount_dec
        auction.save(update_fields=['current_price'])

        return Response({'new_price': str(auction.current_price)})
