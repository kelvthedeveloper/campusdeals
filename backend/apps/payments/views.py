import uuid
from decimal import Decimal

import requests
from django.conf import settings
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.store.models import Product, ProductVariant

from .models import Order, OrderItem, PaymentTransaction
from .serializers import CreateOrderSerializer, InitializePaymentSerializer, OrderSerializer


class OrderListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.is_staff or getattr(user, 'role', None) == 'ADMIN':
            qs = Order.objects.all().select_related('user').prefetch_related('items__product')
        else:
            qs = Order.objects.filter(user=user).select_related('user').prefetch_related('items__product')
        return Response(OrderSerializer(qs, many=True, context={'request': request}).data)

    @transaction.atomic
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        items = serializer.validated_data['items']
        order = Order.objects.create(user=request.user, status=Order.Status.PENDING)

        total = Decimal('0')
        for item in items:
            product_id = item.get('id')
            variant_id = item.get('variantId')
            qty = int(item.get('quantity') or 1)
            if qty < 1:
                qty = 1

            try:
                product = Product.objects.select_related('category').get(id=product_id)
            except Product.DoesNotExist:
                transaction.set_rollback(True)
                return Response({'detail': f'Product {product_id} not found'}, status=status.HTTP_400_BAD_REQUEST)

            variant = None
            unit_price = Decimal(str(product.base_price))
            if variant_id:
                try:
                    variant = ProductVariant.objects.get(id=variant_id, product=product)
                    unit_price = unit_price + Decimal(str(variant.additional_price))
                except ProductVariant.DoesNotExist:
                    transaction.set_rollback(True)
                    return Response({'detail': f'Variant {variant_id} not found'}, status=status.HTTP_400_BAD_REQUEST)

            OrderItem.objects.create(
                order=order,
                product=product,
                variant=variant,
                quantity=qty,
                unit_price=unit_price,
            )
            total += unit_price * qty

        order.total_amount = total
        order.status = Order.Status.PROCESSING
        order.save(update_fields=['total_amount', 'status'])

        return Response(OrderSerializer(order, context={'request': request}).data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, order_id: int):
        qs = Order.objects.select_related('user').prefetch_related('items__product')
        order = qs.filter(id=order_id).first()
        if not order:
            return None
        if request.user.is_staff or getattr(request.user, 'role', None) == 'ADMIN':
            return order
        if order.user_id != request.user.id:
            return None
        return order

    def get(self, request, order_id: int):
        order = self.get_object(request, order_id)
        if not order:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order, context={'request': request}).data)

    def patch(self, request, order_id: int):
        order = self.get_object(request, order_id)
        if not order:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if not (request.user.is_staff or getattr(request.user, 'role', None) == 'ADMIN'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        status_value = request.data.get('status')
        if status_value and status_value in Order.Status.values:
            order.status = status_value
            order.save(update_fields=['status'])
        return Response(OrderSerializer(order, context={'request': request}).data)

    def delete(self, request, order_id: int):
        order = self.get_object(request, order_id)
        if not order:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        if not (request.user.is_staff or getattr(request.user, 'role', None) == 'ADMIN'):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        Order.objects.filter(id=order_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class InitializePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = InitializePaymentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not settings.PAYSTACK_SECRET_KEY:
            return Response({'detail': 'PAYSTACK_SECRET_KEY is not configured'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        email = serializer.validated_data['email']
        amount = serializer.validated_data['amount']
        object_id = serializer.validated_data['object_id']

        order = Order.objects.filter(id=object_id, user=request.user).first()
        if not order:
            return Response({'detail': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        reference = uuid.uuid4().hex

        payload = {
            'email': email,
            'amount': int(Decimal(amount) * 100),
            'currency': order.currency,
            'reference': reference,
        }
        if settings.PAYSTACK_CALLBACK_URL:
            payload['callback_url'] = settings.PAYSTACK_CALLBACK_URL

        headers = {
            'Authorization': f'Bearer {settings.PAYSTACK_SECRET_KEY}',
            'Content-Type': 'application/json',
        }

        resp = requests.post('https://api.paystack.co/transaction/initialize', json=payload, headers=headers, timeout=30)
        data = resp.json() if resp.content else {}
        if resp.status_code >= 400 or not data.get('status'):
            PaymentTransaction.objects.create(
                order=order,
                reference=reference,
                amount=Decimal(amount),
                currency=order.currency,
                status='failed',
                raw=data,
            )
            return Response({'detail': 'Payment initialization failed', 'provider': data}, status=status.HTTP_400_BAD_REQUEST)

        PaymentTransaction.objects.create(
            order=order,
            reference=reference,
            amount=Decimal(amount),
            currency=order.currency,
            status='initialized',
            raw=data,
        )

        return Response(data.get('data', data))
