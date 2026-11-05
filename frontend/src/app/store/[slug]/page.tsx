'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/utils/api';
import Button from '@/components/atoms/Button';
import { useCart } from '@/context/CartContext';
import { ShoppingCart, Heart, ShieldCheck, Truck, Check } from 'lucide-react';
import { Product, ProductVariant } from '@/types';
import { formatMoneyGHS } from '@/utils/money';

export default function ProductDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
    const [added, setAdded] = useState(false);
    const { addToCart } = useCart();
    const [favLoading, setFavLoading] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            if (!slug) return;
            try {
                console.log(`[ProductDetail] Fetching product with slug: ${slug}`);
                const { data } = await api.get(`/store/products/${slug}/`);
                console.log(`[ProductDetail] Product fetched successfully:`, data);
                setProduct(data);
                if (data.variants && data.variants.length > 0) {
                    setSelectedVariant(data.variants[0]);
                }
            } catch (error: any) {
                console.error('[ProductDetail] Error fetching product:', error);
                if (error.response?.status === 404) {
                    console.error(`[ProductDetail] Product with slug "${slug}" not found in database`);
                }
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [slug]);

    const handleAddToCart = () => {
        if (!product) return;

        addToCart({
            id: Number(product.id),
            name: product.name,
            slug: product.slug,
            price: currentPrice,
            image: product.image,
            quantity: 1,
            variantId: selectedVariant?.id,
            variantName: selectedVariant?.name
        });

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const toggleFavorite = async () => {
        if (!product) return;
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token) {
            router.push(`/auth/login?redirect=/store/${product.slug}`);
            return;
        }

        setFavLoading(true);
        try {
            if (product.is_favorited) {
                await api.delete(`/store/favorites/${product.id}/`);
                setProduct((prev) => (prev ? { ...prev, is_favorited: false } : prev));
            } else {
                await api.post('/store/favorites/', { product: Number(product.id) });
                setProduct((prev) => (prev ? { ...prev, is_favorited: true } : prev));
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('Failed to update favorites. Please try again.');
        } finally {
            setFavLoading(false);
        }
    };

    if (loading) return <div className="p-10 sm:p-20 text-center text-secondary">Loading product details...</div>;
    if (!product) return <div className="p-10 sm:p-20 text-center text-primary font-bold">Product not found.</div>;

    const currentPrice = selectedVariant
        ? (parseFloat(product.base_price) + parseFloat(selectedVariant.additional_price)).toFixed(2)
        : product.base_price;

    return (
        <div className="bg-white min-h-screen py-10 sm:py-12 lg:py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16">
                    {/* Visuals */}
                    <div className="space-y-4">
                        <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
                            <Image
                                src={product.image || '/placeholder-product.svg'}
                                alt={product.name}
                                fill
                                className="object-cover"
                                unoptimized
                            />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        <div className="mb-8">
                            <span className="text-secondary text-sm font-bold uppercase tracking-widest mb-2 block">
                                {product.category?.name}
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight mb-4">{product.name}</h1>
                            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                                <span className="text-2xl sm:text-3xl font-black text-action">{formatMoneyGHS(currentPrice)}</span>
                                {product.stock > 0 ? (
                                    <span className="bg-emerald-50 text-emerald-600 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-100">
                                        In Stock ({product.stock})
                                    </span>
                                ) : (
                                    <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100">
                                        Out of Stock
                                    </span>
                                )}
                            </div>
                        </div>

                        <p className="text-secondary leading-relaxed mb-8">
                            {product.description || 'No description provided for this item.'}
                        </p>

                        {/* Variants */}
                        {product.variants?.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-primary uppercase tracking-wider mb-4">Select Option</h3>
                                <div className="flex flex-wrap gap-3">
                                    {product.variants.map((variant: ProductVariant) => (
                                        <button
                                            key={variant.id}
                                            onClick={() => setSelectedVariant(variant)}
                                            className={`px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm ${selectedVariant?.id === variant.id
                                                ? 'border-action bg-blue-50 text-action'
                                                : 'border-slate-100 hover:border-slate-200 text-secondary'
                                                }`}
                                        >
                                            {variant.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 pt-4 border-t border-slate-100">
                            <Button
                                className={`w-full sm:flex-1 py-4 shadow-lg transition-all ${added ? 'bg-emerald-600 hover:bg-emerald-700' : 'shadow-blue-500/20'}`}
                                size="lg"
                                onClick={handleAddToCart}
                                disabled={product.stock <= 0}
                            >
                                {added ? (
                                    <>
                                        <Check className="h-5 w-5 mr-3" />
                                        Added to Cart!
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="h-5 w-5 mr-3" />
                                        Add to Cart
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline"
                                className={`w-full sm:w-auto px-5 ${product.is_favorited ? 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-50' : ''}`}
                                onClick={toggleFavorite}
                                disabled={favLoading}
                            >
                                <Heart className={`h-5 w-5 ${product.is_favorited ? 'fill-current' : ''}`} />
                            </Button>
                        </div>

                        {/* USP List */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <ShieldCheck className="h-5 w-5 text-action" />
                                <span className="text-xs font-semibold text-secondary text-left">Buyer Protection Included</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <Truck className="h-5 w-5 text-action" />
                                <span className="text-xs font-semibold text-secondary text-left">Fast Campus Delivery</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
