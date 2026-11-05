from django.conf import settings
from django.db import models


class Auction(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    start_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    current_price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    end_time = models.DateTimeField()
    image = models.ImageField(upload_to='auctions/', null=True, blank=True)
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='auctions', on_delete=models.CASCADE)
    is_active = models.BooleanField(default=True)
    winner = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, related_name='won_auctions', on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']


class Bid(models.Model):
    auction = models.ForeignKey(Auction, related_name='bids', on_delete=models.CASCADE)
    bidder = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='bids', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
