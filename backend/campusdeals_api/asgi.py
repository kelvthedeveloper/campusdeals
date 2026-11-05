"""ASGI config for campusdeals_api project."""

import os

from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campusdeals_api.settings')

application = get_asgi_application()
