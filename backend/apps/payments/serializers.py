from rest_framework import serializers

from apps.accounts.serializers import UserSerializer
from apps.store.serializers import ProductSerializer

from .models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'product', 'variant', 'quantity', 'unit_price')


class OrderSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_phone_number = serializers.CharField(source='user.phone_number', read_only=True)
    user_address = serializers.CharField(source='user.address', read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            'id',
            'user',
            'user_username',
            'user_email',
            'user_phone_number',
            'user_address',
            'total_amount',
            'currency',
            'status',
            'created_at',
            'updated_at',
            'items',
        )
        read_only_fields = ('id', 'user', 'total_amount', 'currency', 'status', 'created_at', 'updated_at')


class CreateOrderSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.DictField(), allow_empty=False)


class InitializePaymentSerializer(serializers.Serializer):
    email = serializers.EmailField()
    amount = serializers.DecimalField(max_digits=12, decimal_places=2)
    content_type = serializers.CharField()
    object_id = serializers.IntegerField()
