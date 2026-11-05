from django.contrib import admin

from .models import Order, OrderItem, PaymentTransaction


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'total_amount', 'currency', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('id', 'user__username', 'user__email')
    inlines = [OrderItemInline]


@admin.register(PaymentTransaction)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('reference', 'provider', 'amount', 'currency', 'status', 'created_at')
    search_fields = ('reference',)
    list_filter = ('provider', 'status')
