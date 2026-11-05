'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import { formatMoneyGHS } from '@/utils/money';
import { ArrowLeft, ShoppingBag } from 'lucide-react';

interface OrderItem {
    id: number;
    product: number;
    product_name: string;
    quantity: number;
    price: string;
}

interface OrderDetail {
    id: number;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    total_amount: string;
    currency?: string;
    created_at: string;
    items: OrderItem[];
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            if (!id) return;
            try {
                const { data } = await api.get(`/payments/orders/${id}/`);
                setOrder(data);
            } catch (error) {
                console.error('Error fetching order:', error);
                setOrder(null);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [id]);

    const itemCount = useMemo(() => {
        return (order?.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);
    }, [order]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 w-56 bg-slate-200 rounded animate-pulse" />
                <div className="h-64 bg-slate-100 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-sm font-black text-action hover:underline inline-flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </button>
                </div>
                <Card className="p-8">
                    <div className="text-sm text-secondary">Order not found.</div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="text-sm font-black text-action hover:underline inline-flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </button>
                    </div>
                    <h1 className="text-3xl font-extrabold text-primary tracking-tight mt-3">Order ORD-{order.id}</h1>
                    <p className="text-secondary mt-1">Placed on {new Date(order.created_at).toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 lg:col-span-1">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 text-action rounded-xl flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="text-xs font-bold text-secondary uppercase tracking-wider">Status</div>
                            <div className="text-sm font-black text-primary">{order.status}</div>
                        </div>
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div>
                            <div className="text-xs font-bold text-secondary uppercase tracking-wider">Items</div>
                            <div className="text-lg font-black text-primary">{itemCount}</div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-secondary uppercase tracking-wider">Total</div>
                            <div className="text-lg font-black text-action">{formatMoneyGHS(order.total_amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-extrabold text-primary">Items</h2>
                        <Link href="/store" className="text-xs font-black text-action hover:underline">Continue shopping</Link>
                    </div>
                    <div className="divide-y divide-slate-100">
                        {(order.items || []).map((it) => (
                            <div key={it.id} className="py-4 flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                    <div className="text-sm font-black text-primary truncate">{it.product_name}</div>
                                    <div className="text-xs text-secondary">Qty: {it.quantity}</div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className="text-sm font-black text-primary">{formatMoneyGHS(it.price, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    <div className="text-[11px] text-secondary">Line: {formatMoneyGHS(String(Number(it.price) * Number(it.quantity)), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </div>
                            </div>
                        ))}
                        {(order.items || []).length === 0 && (
                            <div className="py-10 text-sm text-secondary italic">No items found for this order.</div>
                        )}
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                        <Button variant="outline" onClick={() => router.push('/dashboard/orders')}>Back to Orders</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
