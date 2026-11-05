from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import PlatformSettings, User


@admin.register(User)
class CampusDealsUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('CampusDeals', {'fields': ('role', 'phone_number', 'address', 'profile_picture')}),
    )
    list_display = ('username', 'email', 'role', 'is_active', 'is_staff', 'is_superuser')


@admin.register(PlatformSettings)
class PlatformSettingsAdmin(admin.ModelAdmin):
    list_display = ('site_name', 'contact_email', 'maintenance_mode', 'updated_at')
