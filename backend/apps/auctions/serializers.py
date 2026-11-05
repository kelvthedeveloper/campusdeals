from rest_framework import serializers

from .models import Auction, Bid


class BidSerializer(serializers.ModelSerializer):
    bidder_id = serializers.IntegerField(source='bidder.id', read_only=True)
    bidder_username = serializers.CharField(source='bidder.username', read_only=True)

    class Meta:
        model = Bid
        fields = ('id', 'bidder_id', 'bidder_username', 'amount', 'created_at')


class AuctionSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    owner = serializers.CharField(source='owner.username', read_only=True)
    winner = serializers.CharField(source='winner.username', read_only=True)
    bids = BidSerializer(many=True, read_only=True)

    class Meta:
        model = Auction
        fields = (
            'id',
            'title',
            'description',
            'start_price',
            'current_price',
            'end_time',
            'image',
            'owner',
            'is_active',
            'winner',
            'bids',
        )

    def get_image(self, obj):
        if obj.image:
            try:
                return obj.image.url
            except Exception:
                return None
        return None
