from django.test import TestCase

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
