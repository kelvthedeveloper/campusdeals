from rest_framework import serializers

from .models import Category, Favorite, Product, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    parent = serializers.SerializerMethodField()
    parent_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    children = serializers.SerializerMethodField()
    product_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent', 'parent_id', 'is_active', 'sort_order', 'created_at', 'product_count', 'children')

    def get_parent(self, obj):
        if not obj.parent_id:
            return None
        p = obj.parent
        if not p:
            return None
        return {'id': p.id, 'name': p.name, 'slug': p.slug}

    def get_children(self, obj):
        children = obj.children.filter(is_active=True).order_by('sort_order', 'name')
        return CategorySerializer(children, many=True, context=self.context).data


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ('id', 'name', 'sku', 'additional_price', 'stock_quantity')


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    image = serializers.ImageField(required=False, allow_null=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    is_favorited = serializers.SerializerMethodField()

    class Meta:
        model = Product
        read_only_fields = ('slug',)
        fields = (
            'id',
            'name',
            'slug',
            'description',
            'base_price',
            'stock',
            'image',
            'category',
            'category_id',
            'variants',
            'is_active',
            'is_favorited',
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        img = None
        try:
            if instance.image:
                img = instance.image.url
        except Exception:
            img = None
        data['image'] = img
        return data

    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            validated_data['category_id'] = category_id
        return super().create(validated_data)

    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id is not None:
            instance.category_id = category_id
        return super().update(instance, validated_data)

    def get_is_favorited(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return Favorite.objects.filter(user=request.user, product=obj).exists()


class FavoriteSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ('id', 'product', 'created_at')
