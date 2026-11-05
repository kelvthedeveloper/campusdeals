from django.contrib.auth import authenticate, get_user_model
from django.db import models
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import PlatformSettings
from .serializers import PasswordChangeSerializer, PlatformSettingsSerializer, RegisterSerializer, UserSerializer

User = get_user_model()


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
