from datetime import timedelta
from io import BytesIO
from tempfile import TemporaryDirectory

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.utils import timezone
from PIL import Image
from rest_framework.test import APIClient

from .models import Auction


class AdminAuctionAPITests(TestCase):
    def setUp(self):
        self.media_dir = TemporaryDirectory()
        self.addCleanup(self.media_dir.cleanup)
        self.storage_settings = override_settings(
            MEDIA_ROOT=self.media_dir.name,
            STORAGES={
                'default': {'BACKEND': 'django.core.files.storage.FileSystemStorage'},
                'staticfiles': {
                    'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
                },
            },
        )
        self.storage_settings.enable()
        self.addCleanup(self.storage_settings.disable)

        self.admin = get_user_model().objects.create_user(
            username='admin',
            password='password',
            is_staff=True,
        )
        self.client = APIClient()

    @staticmethod
    def make_image():
        content = BytesIO()
        Image.new('RGB', (2, 2), color='blue').save(content, format='PNG')
        return SimpleUploadedFile('auction.png', content.getvalue(), content_type='image/png')

    def test_auction_list_and_detail_are_public(self):
        auction = Auction.objects.create(
            title='Textbook',
            start_price='10.00',
            current_price='10.00',
            end_time=timezone.now() + timedelta(days=1),
            owner=self.admin,
        )

        list_response = self.client.get('/api/auctions/')
        detail_response = self.client.get(f'/api/auctions/{auction.id}/')

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data['title'], 'Textbook')

    def test_admin_can_create_update_and_delete_auction_with_image(self):
        self.client.force_authenticate(self.admin)
        end_time = (timezone.now() + timedelta(days=1)).isoformat()
        create_response = self.client.post(
            '/api/auctions/',
            {
                'title': 'Laptop',
                'description': 'Used laptop',
                'start_price': '100.00',
                'end_time': end_time,
                'is_active': 'true',
                'image': self.make_image(),
            },
            format='multipart',
        )

        self.assertEqual(create_response.status_code, 201, create_response.data)
        auction = Auction.objects.get()
        self.assertEqual(auction.owner, self.admin)
        self.assertEqual(auction.current_price, auction.start_price)
        self.assertTrue(auction.image)
        self.assertTrue(create_response.data['image'].startswith('http://testserver/media/auctions/'))

        update_response = self.client.patch(
            f'/api/auctions/{auction.id}/',
            {
                'title': 'Updated laptop',
                'image': self.make_image(),
            },
            format='multipart',
        )
        self.assertEqual(update_response.status_code, 200, update_response.data)
        auction.refresh_from_db()
        self.assertEqual(auction.title, 'Updated laptop')
        self.assertTrue(auction.image)

        delete_response = self.client.delete(f'/api/auctions/{auction.id}/')
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(Auction.objects.exists())

    def test_non_admin_cannot_create_or_update_auction(self):
        create_response = self.client.post(
            '/api/auctions/',
            {
                'title': 'Laptop',
                'start_price': '100.00',
                'end_time': (timezone.now() + timedelta(days=1)).isoformat(),
            },
            format='multipart',
        )
        self.assertIn(create_response.status_code, (401, 403))

        auction = Auction.objects.create(
            title='Textbook',
            start_price='10.00',
            current_price='10.00',
            end_time=timezone.now() + timedelta(days=1),
            owner=self.admin,
        )
        update_response = self.client.patch(
            f'/api/auctions/{auction.id}/',
            {'title': 'Changed'},
            format='multipart',
        )
        self.assertIn(update_response.status_code, (401, 403))
        auction.refresh_from_db()
        self.assertEqual(auction.title, 'Textbook')
