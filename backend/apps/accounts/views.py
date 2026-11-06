import logging
import secrets

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.db import models, transaction
from django.utils.text import slugify
from google.auth.exceptions import GoogleAuthError
from google.auth.transport.requests import Request as GoogleAuthRequest
from google.oauth2 import id_token
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PlatformSettings
from .serializers import (
    GoogleAuthSerializer,
    PasswordChangeSerializer,
    PlatformSettingsSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()
logger = logging.getLogger(__name__)


def _tokens_for_user(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {'refresh': str(refresh), 'access': str(refresh.access_token)}


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'detail': 'registered'}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)
        if not user.is_active:
            return Response({'detail': 'User is inactive'}, status=status.HTTP_403_FORBIDDEN)

        tokens = _tokens_for_user(user)
        return Response(tokens)


class GoogleLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not settings.GOOGLE_CLIENT_ID:
            return Response(
                {'detail': 'Google sign-in is not configured'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            claims = id_token.verify_oauth2_token(
                serializer.validated_data['credential'],
                GoogleAuthRequest(),
                audience=settings.GOOGLE_CLIENT_ID,
            )
        except ValueError:
            return Response({'detail': 'Invalid Google credential'}, status=status.HTTP_400_BAD_REQUEST)
        except GoogleAuthError:
            logger.exception('Google ID token verification is unavailable')
            return Response(
                {'detail': 'Google sign-in is temporarily unavailable'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        google_sub = claims.get('sub')
        raw_email = claims.get('email')
        email = raw_email.strip().lower() if isinstance(raw_email, str) else ''
        if not isinstance(google_sub, str) or not google_sub or not email or claims.get('email_verified') is not True:
            return Response(
                {'detail': 'Google must provide a verified email address'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            user = User.objects.filter(google_sub=google_sub).first()
            if user is None:
                matching_users = list(User.objects.filter(email__iexact=email)[:2])
                if len(matching_users) > 1:
                    return Response(
                        {'detail': 'Multiple accounts use this email. Contact support to link Google sign-in.'},
                        status=status.HTTP_409_CONFLICT,
                    )

                if matching_users:
                    user = matching_users[0]
                    if user.google_sub and user.google_sub != google_sub:
                        return Response(
                            {'detail': 'This account is linked to a different Google account.'},
                            status=status.HTTP_409_CONFLICT,
                        )
                else:
                    username_base = slugify(email.partition('@')[0])[:140] or 'google-user'
                    username = f'{username_base}-{secrets.token_hex(4)}'
                    while User.objects.filter(username=username).exists():
                        username = f'{username_base}-{secrets.token_hex(4)}'

                    given_name = claims.get('given_name')
                    family_name = claims.get('family_name')
                    user = User(
                        username=username,
                        email=email,
                        first_name=given_name[:150] if isinstance(given_name, str) else '',
                        last_name=family_name[:150] if isinstance(family_name, str) else '',
                        google_sub=google_sub,
                    )
                    user.set_unusable_password()
                    user.save()

            if not user.is_active:
                return Response({'detail': 'User is inactive'}, status=status.HTTP_403_FORBIDDEN)

            if user.google_sub is None:
                user.google_sub = google_sub
                user.save(update_fields=['google_sub'])

        return Response({**_tokens_for_user(user), 'username': user.username})


class RefreshView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_str = request.data.get('refresh')
        if not refresh_str:
            return Response({'detail': 'refresh is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            refresh = RefreshToken(refresh_str)
            return Response({'access': str(refresh.access_token)})
        except Exception:
            return Response({'detail': 'Invalid refresh token'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        if not request.user.check_password(serializer.validated_data['current_password']):
            return Response({'detail': 'Current password is incorrect'}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        return Response({'detail': 'password changed'})


class PlatformSettingsView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get_object(self):
        obj = PlatformSettings.objects.first()
        if not obj:
            obj = PlatformSettings.objects.create()
        return obj

    def get(self, request):
        obj = self.get_object()
        return Response(PlatformSettingsSerializer(obj).data)

    def put(self, request):
        obj = self.get_object()
        serializer = PlatformSettingsSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        from apps.auctions.models import Auction
        from apps.payments.models import Order
        from apps.services.models import Booking
        from apps.store.models import Product

        users_total = User.objects.count()
        users_active = User.objects.filter(is_active=True).count()

        products_total = Product.objects.count()
        total_stock = Product.objects.aggregate(s=models.Sum('stock'))['s'] or 0
        out_of_stock = Product.objects.filter(stock__lte=0).count()

        orders_total = Order.objects.count()
        active_auctions = Auction.objects.filter(is_active=True).count()
        service_bookings_total = Booking.objects.count()

        return Response({
            'users': {'total': users_total, 'active': users_active},
            'products': {'total': products_total, 'total_stock': total_stock, 'out_of_stock': out_of_stock},
            'orders': {'total': orders_total},
            'auctions': {'active': active_auctions},
            'service_bookings': {'total': service_bookings_total},
        })


class UserAdminListCreateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = User.objects.all().order_by('-date_joined')
        return Response(UserSerializer(qs, many=True).data)

    def post(self, request):
        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role', User.Role.STAFF)

        if not username or not email or not password:
            return Response({'detail': 'username, email, password are required'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=username, email=email, password=password)
        user.role = role if role in User.Role.values else User.Role.STAFF
        user.is_staff = True
        if user.role == User.Role.ADMIN:
            user.is_superuser = True
        is_active = request.data.get('is_active')
        if is_active is not None:
            user.is_active = bool(is_active)
        user.save()

        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class UserAdminDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, user_id: int):
        user = User.objects.filter(id=user_id).first()
        if not user:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()

        role = data.get('role')
        if role:
            if role not in User.Role.values:
                return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
            user.role = role
            user.is_staff = role in (User.Role.STAFF, User.Role.ADMIN)
            user.is_superuser = role == User.Role.ADMIN

        if 'is_active' in data:
            user.is_active = bool(data.get('is_active'))

        user.save()
        return Response(UserSerializer(user).data)

    def delete(self, request, user_id: int):
        if request.user.id == user_id:
            return Response({'detail': 'Cannot delete yourself'}, status=status.HTTP_400_BAD_REQUEST)
        User.objects.filter(id=user_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
