from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from uuid import uuid4

from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.core.files.base import ContentFile
from django.test import Client, TestCase, override_settings
from django.test.client import RequestFactory
from PIL import Image

from .models import Category, Product
from .serializers import ProductSerializer


class ProductSerializerTests(TestCase):
    def test_create_generates_slug_when_omitted(self):
        category = Category.objects.create(name='Books', slug='books')
        serializer = ProductSerializer(data={
            'name': 'Campus Textbook',
            'base_price': '25.00',
            'category_id': category.id,
        })

        self.assertTrue(serializer.is_valid(), serializer.errors)
        product = serializer.save()

        self.assertEqual(product.slug, 'campus-textbook')
        self.assertEqual(product.category, category)

    def test_image_url_is_absolute_when_request_is_available(self):
        with TemporaryDirectory() as media_root:
            with override_settings(MEDIA_ROOT=media_root):
                image_content = BytesIO()
                Image.new('RGB', (1, 1)).save(image_content, format='PNG')

                product = Product.objects.create(name='Campus Bag', base_price='25.00')
                product.image.save('bag.png', ContentFile(image_content.getvalue()))
                request = RequestFactory().get('/api/store/products/')
                request.user = AnonymousUser()

                image_url = ProductSerializer(product, context={'request': request}).data['image']

        self.assertTrue(image_url.startswith('http://testserver/media/products/'))


class LocalMediaServingTests(TestCase):
    def test_media_is_served_with_debug_disabled(self):
        media_file = Path(settings.MEDIA_ROOT) / f'test-media-{uuid4().hex}.png'
        media_file.write_bytes(b'image data')
        response = Client().get(f'/media/{media_file.name}')
        try:
            self.assertEqual(response.status_code, 200)
            self.assertEqual(b''.join(response.streaming_content), b'image data')
        finally:
            response.close()
            media_file.unlink(missing_ok=True)
