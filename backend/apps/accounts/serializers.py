from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import PlatformSettings

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',
            'role',
            'phone_number',
            'address',
            'profile_picture',
            'profile_picture_url',
            'is_active',
            'is_staff',
            'is_superuser',
            'date_joined',
        )
        read_only_fields = ('id', 'role', 'is_active', 'is_staff', 'is_superuser', 'date_joined')

    def get_profile_picture_url(self, obj):
        return getattr(obj, 'profile_picture_url', None)

    def get_role(self, obj):
        if obj.is_superuser:
            return User.Role.ADMIN
        return obj.role


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
        )
        return user


class GoogleAuthSerializer(serializers.Serializer):
    credential = serializers.CharField(trim_whitespace=True)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_new_password(self, value):
        validate_password(value)
        return value


class PlatformSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformSettings
        fields = ('site_name', 'contact_email', 'maintenance_mode', 'paystack_public_key', 'paystack_secret_key')
