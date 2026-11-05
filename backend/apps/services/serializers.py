from rest_framework import serializers

from .models import Booking, Service


class ServiceSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = ('id', 'name', 'description', 'image', 'is_active')

    def get_image(self, obj):
        if obj.image:
            try:
                return obj.image.url
            except Exception:
                return None
        return None


class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Booking
        fields = ('id', 'service', 'service_name', 'user_username', 'date', 'time', 'notes', 'status', 'staff')
        read_only_fields = ('status',)
