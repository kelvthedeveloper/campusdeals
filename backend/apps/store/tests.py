from django.test import TestCase

from .models import Category
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
