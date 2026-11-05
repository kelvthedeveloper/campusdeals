'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import { formatMoneyGHS } from '@/utils/money';
import { Heart, Trash2 } from 'lucide-react';
import { Product } from '@/types';

interface Favorite {
    id: number;
    created_at: string;
    product: Product;
}

export default function FavoritesPage() {
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);
    const [removingId, setRemovingId] = useState<number | null>(null);

    const fetchFavorites = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/store/favorites/');
            const list = Array.isArray(data) ? data : data?.results || [];
            setFavorites(list);
        } catch (error) {
            console.error('Error fetching favorites:', error);
            setFavorites([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFavorites();
    }, []);

    const removeFavorite = async (fav: Favorite) => {
        const productId = Number(fav.product?.id);
        if (!productId) return;

        setRemovingId(fav.id);
        try {
            await api.delete(`/store/favorites/${productId}/`);
            setFavorites((prev) => prev.filter((f) => f.id !== fav.id));
        } catch (error) {
            console.error('Error removing favorite:', error);
            alert('Failed to remove favorite. Please try again.');
        } finally {
            setRemovingId(null);
        }
    };

    const sorted = useMemo(() => {
        return [...favorites].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [favorites]);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">My Favorites</h1>
                <p className="text-secondary mt-1">Saved items you can come back to later.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 bg-white border border-slate-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : sorted.length === 0 ? (
                <Card className="p-8 sm:p-12 text-center">
                    <div className="h-16 w-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="h-8 w-8" />
                    </div>
                    <h2 className="text-xl font-bold text-primary mb-2">No favorites yet</h2>
                    <p className="text-secondary mb-6">Tap the heart on any product to save it here.</p>
                    <Link href="/store">
                        <Button>Browse Store</Button>
                    </Link>
                </Card>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sorted.map((fav) => (
                        <Card key={fav.id} className="overflow-hidden">
                            <Link href={fav.product?.slug ? `/store/${fav.product.slug}` : '/store'} className="block">
                                <div className="relative aspect-[16/10] bg-slate-50">
                                    <Image
                                        src={fav.product?.image || '/placeholder-product.svg'}
                                        alt={fav.product?.name || 'Product'}
                                        fill
                                        className="object-cover"
                                        unoptimized={!!fav.product?.image}
                                    />
                                </div>
                            </Link>

                            <div className="p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <Link href={fav.product?.slug ? `/store/${fav.product.slug}` : '/store'} className="text-sm font-black text-primary hover:text-action transition line-clamp-2">
                                            {fav.product?.name}
                                        </Link>
                                        <div className="text-xs text-secondary mt-1 line-clamp-1">{fav.product?.category?.name || 'CampusDeals Store'}</div>
                                    </div>
                                    <button
                                        onClick={() => removeFavorite(fav)}
                                        disabled={removingId === fav.id}
                                        className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-rose-600 transition disabled:opacity-50"
                                        title="Remove from favorites"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>

                                <div className="mt-4 flex items-center justify-between">
                                    <div className="text-lg font-black text-action">{formatMoneyGHS(fav.product?.base_price || '0')}</div>
                                    <Link href={fav.product?.slug ? `/store/${fav.product.slug}` : '/store'}>
                                        <Button size="sm">View</Button>
                                    </Link>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
