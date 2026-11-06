from unittest.mock import patch

from django.test import TestCase, override_settings

from .models import User
from .serializers import UserSerializer


class UserSerializerTests(TestCase):
    def test_superuser_is_serialized_as_admin(self):
        user = User.objects.create_superuser(
            username='root',
            email='root@example.com',
            password='test-password',
        )

        self.assertEqual(user.role, User.Role.ADMIN)
        self.assertEqual(UserSerializer(user).data['role'], User.Role.ADMIN)

    def test_regular_user_keeps_assigned_role(self):
        user = User.objects.create_user(
            username='student',
            email='student@example.com',
            password='test-password',
            role=User.Role.CUSTOMER,
        )

        self.assertEqual(UserSerializer(user).data['role'], User.Role.CUSTOMER)


class GoogleLoginTests(TestCase):
    endpoint = '/api/auth/google/'

    @override_settings(GOOGLE_CLIENT_ID='google-client-id')
    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_google_login_creates_user_and_returns_jwt_tokens(self, verify_token):
        verify_token.return_value = {
            'sub': 'google-sub-123',
            'email': 'new.student@example.com',
            'email_verified': True,
            'given_name': 'New',
            'family_name': 'Student',
        }

        response = self.client.post(
            self.endpoint,
            {'credential': 'valid-google-id-token'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.json())
        self.assertIn('refresh', response.json())
        user = User.objects.get(email='new.student@example.com')
        self.assertEqual(user.google_sub, 'google-sub-123')
        self.assertFalse(user.has_usable_password())
        verify_token.assert_called_once()
        self.assertEqual(verify_token.call_args.kwargs['audience'], 'google-client-id')

    @override_settings(GOOGLE_CLIENT_ID='google-client-id')
    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_google_login_links_by_verified_email_without_changing_role(self, verify_token):
        user = User.objects.create_user(
            username='existing-admin',
            email='admin@example.com',
            password='test-password',
            role=User.Role.ADMIN,
            is_staff=True,
        )
        verify_token.return_value = {
            'sub': 'google-sub-admin',
            'email': 'ADMIN@example.com',
            'email_verified': True,
        }

        response = self.client.post(
            self.endpoint,
            {'credential': 'valid-google-id-token'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.google_sub, 'google-sub-admin')
        self.assertEqual(user.role, User.Role.ADMIN)
        self.assertTrue(user.is_staff)

    @override_settings(GOOGLE_CLIENT_ID='google-client-id')
    @patch('apps.accounts.views.id_token.verify_oauth2_token')
    def test_google_login_rejects_unverified_email(self, verify_token):
        verify_token.return_value = {
            'sub': 'google-sub-unverified',
            'email': 'unverified@example.com',
            'email_verified': False,
        }

        response = self.client.post(
            self.endpoint,
            {'credential': 'valid-google-id-token'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(User.objects.filter(email='unverified@example.com').exists())

    def test_google_login_requires_configured_client_id(self):
        response = self.client.post(
            self.endpoint,
            {'credential': 'some-token'},
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 503)
