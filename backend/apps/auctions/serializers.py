from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Auction, Bid


class BidSerializer(serializers.ModelSerializer):
    bidder_id = serializers.IntegerField(source='bidder.id', read_only=True)
    bidder_username = serializers.CharField(source='bidder.username', read_only=True)

    class Meta:
        model = Bid
        fields = ('id', 'bidder_id', 'bidder_username', 'amount', 'created_at')


class AuctionSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    owner = serializers.CharField(source='owner.username', read_only=True)
    winner = serializers.CharField(source='winner.username', read_only=True)
    winner_id = serializers.PrimaryKeyRelatedField(
        source='winner',
        queryset=get_user_model().objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    bids = BidSerializer(many=True, read_only=True)

    class Meta:
        model = Auction
        read_only_fields = ('current_price', 'owner')
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
            'winner_id',
            'bids',
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        image = None
        try:
            if instance.image:
                image = instance.image.url
                request = self.context.get('request')
                if request:
                    image = request.build_absolute_uri(image)
        except Exception:
            image = None
        data['image'] = image
        return data
