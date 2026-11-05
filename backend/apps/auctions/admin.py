from django.contrib import admin

from .models import Auction, Bid


class BidInline(admin.TabularInline):
    model = Bid
    extra = 0


@admin.register(Auction)
class AuctionAdmin(admin.ModelAdmin):
    list_display = ('title', 'current_price', 'end_time', 'is_active', 'owner', 'winner')
    list_filter = ('is_active',)
    search_fields = ('title',)
    inlines = [BidInline]


@admin.register(Bid)
class BidAdmin(admin.ModelAdmin):
    list_display = ('auction', 'bidder', 'amount', 'created_at')
    search_fields = ('auction__title', 'bidder__username')
