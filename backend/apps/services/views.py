from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Booking, Service
from .serializers import BookingSerializer, ServiceSerializer


class ServiceListView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = ServiceSerializer

    def get_queryset(self):
        return Service.objects.filter(is_active=True)


class BookingListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        qs = Booking.objects.filter(user=request.user).select_related('service', 'user')
        return Response(BookingSerializer(qs, many=True).data)

    def post(self, request):
        serializer = BookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking = serializer.save(user=request.user)
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class BookingDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, booking_id: int):
        Booking.objects.filter(id=booking_id, user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    def patch(self, request, booking_id: int):
        if not request.user.is_staff:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        booking = Booking.objects.filter(id=booking_id).select_related('service', 'user').first()
        if not booking:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        if 'staff' in data:
            booking.staff_id = data.get('staff') or None
        if 'status' in data and data.get('status'):
            booking.status = data.get('status')

        booking.save()
        return Response(BookingSerializer(booking).data)


class AdminServiceListCreateView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        services = Service.objects.all().order_by('name')
        return Response(ServiceSerializer(services, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = ServiceSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        service = serializer.save()
        return Response(ServiceSerializer(service, context={'request': request}).data, status=status.HTTP_201_CREATED)


class AdminServiceDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request, service_id: int):
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ServiceSerializer(service, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, service_id: int):
        Service.objects.filter(id=service_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminServiceStatusView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, service_id: int):
        try:
            service = Service.objects.get(id=service_id)
        except Service.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        is_active = request.data.get('is_active')
        service.is_active = bool(is_active)
        service.save(update_fields=['is_active'])
        return Response(ServiceSerializer(service, context={'request': request}).data)
