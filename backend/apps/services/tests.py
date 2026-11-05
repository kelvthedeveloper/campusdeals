from io import BytesIO
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework.test import APIClient

from .models import Service


class AdminServiceImageUploadTests(TestCase):
    def test_admin_can_upload_and_view_service_image(self):
        admin = get_user_model().objects.create_user(
            username='admin',
            password='password',
            is_staff=True,
        )
        client = APIClient()
        client.force_authenticate(admin)

        image_content = BytesIO()
        Image.new('RGB', (1, 1)).save(image_content, format='PNG')
        image_name = f'laptop-{uuid4().hex}.png'
        response = client.post(
            '/api/services/admin/services/',
            {
                'name': 'Laptop Repair',
                'description': 'Campus laptop repair',
                'is_active': 'true',
                'image': SimpleUploadedFile(
                    image_name,
                    image_content.getvalue(),
                    content_type='image/png',
                ),
            },
            format='multipart',
        )

        self.assertEqual(response.status_code, 201, response.data)
        service = Service.objects.get()
        try:
            self.assertTrue(service.image)
            self.assertTrue(response.data['image'].startswith('http://testserver/media/services/'))
            image_response = client.get(response.data['image'])
            self.assertEqual(image_response.status_code, 200)
            image_response.close()
        finally:
            service.image.delete(save=False)
