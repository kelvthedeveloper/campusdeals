from django.db.models import Count
from django.utils.text import slugify
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import Category, Favorite, Product
from .serializers import CategorySerializer, FavoriteSerializer, ProductSerializer


class CategoriesView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return (
            Category.objects.filter(is_active=True, parent__isnull=True)
            .annotate(product_count=Count('products'))
            .prefetch_related('children')
        )


class StoreCategoriesView(ListAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = CategorySerializer

    def get_queryset(self):
        return (
            Category.objects.filter(is_active=True)
            .annotate(product_count=Count('products'))
            .prefetch_related('children')
        )


class StoreProductListView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        qs = Product.objects.filter(is_active=True).select_related('category').prefetch_related('variants')

        search = request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)

        category_slug = request.query_params.get('category')
        if category_slug:
            qs = qs.filter(category__slug=category_slug)

        from rest_framework.pagination import PageNumberPagination

        paginator = PageNumberPagination()
        page = paginator.paginate_queryset(qs, request)
        serializer = ProductSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        category_id = data.get('category_id')
        if category_id not in (None, ''):
            data['category_id'] = int(category_id)

        serializer = ProductSerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        return Response(ProductSerializer(product, context={'request': request}).data, status=status.HTTP_201_CREATED)


class StoreProductDetailView(APIView):
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self, slug: str):
        return Product.objects.filter(is_active=True, slug=slug).select_related('category').prefetch_related('variants').first()

    def get(self, request, slug: str):
        product = self.get_object(slug)
        if not product:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProductSerializer(product, context={'request': request}).data)

    def patch(self, request, slug: str):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        product = Product.objects.filter(slug=slug).first()
        if not product:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        if 'category_id' in data:
            cid = data.get('category_id')
            data['category_id'] = None if cid in (None, '') else int(cid)

        serializer = ProductSerializer(product, data=data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, slug: str):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        Product.objects.filter(slug=slug).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FavoriteListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        favorites = Favorite.objects.filter(user=request.user).select_related('product', 'product__category')
        return Response(FavoriteSerializer(favorites, many=True, context={'request': request}).data)

    def post(self, request):
        product_id = request.data.get('product')
        if not product_id:
            return Response({'detail': 'product is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'detail': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

        Favorite.objects.get_or_create(user=request.user, product=product)
        return Response({'detail': 'favorited'}, status=status.HTTP_201_CREATED)


class FavoriteDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id: int):
        Favorite.objects.filter(user=request.user, product_id=product_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCategoryListCreateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request):
        qs = Category.objects.all().select_related('parent').prefetch_related('children').order_by('sort_order', 'name')
        return Response(CategorySerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        data = request.data.copy()
        parent_id = data.get('parent_id')
        data['parent_id'] = None if parent_id in ('', None) else parent_id
        if not data.get('slug') and data.get('name'):
            data['slug'] = slugify(str(data.get('name')))

        serializer = CategorySerializer(data=data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        obj = serializer.save()
        return Response(CategorySerializer(obj, context={'request': request}).data, status=status.HTTP_201_CREATED)


class AdminCategoryDetailView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, category_id: int):
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data.copy()
        if 'parent_id' in data:
            parent_id = data.get('parent_id')
            data['parent_id'] = None if parent_id in ('', None) else parent_id

        serializer = CategorySerializer(category, data=data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, category_id: int):
        Category.objects.filter(id=category_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCategoryStatusView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def patch(self, request, category_id: int):
        try:
            category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        category.is_active = bool(request.data.get('is_active'))
        category.save(update_fields=['is_active'])
        return Response(CategorySerializer(category, context={'request': request}).data)


