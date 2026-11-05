from rest_framework import serializers

from .models import Booking, Service


class ServiceSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Service
        fields = ('id', 'name', 'description', 'image', 'is_active')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data['image'] and self.context.get('request'):
            data['image'] = self.context['request'].build_absolute_uri(data['image'])
        return data


class BookingSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source='service.name', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Booking
        fields = ('id', 'service', 'service_name', 'user_username', 'date', 'time', 'notes', 'status', 'staff')
        read_only_fields = ('status',)
