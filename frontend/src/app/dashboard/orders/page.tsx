'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import DataTable from '@/components/molecules/DataTable';
import { ShoppingBag, CreditCard, ChevronRight } from 'lucide-react';
import { formatMoneyGHS } from '@/utils/money';
import { useRouter } from 'next/navigation';

interface Order {
    id: number;
    total_amount: string;
    status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
    created_at: string;
    items?: Array<{ id: number; quantity: number }>;
}

export default function DashboardOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/payments/orders/');
                const list = Array.isArray(data) ? data : data?.results || [];
                setOrders(list);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const itemCountFor = (o: Order) => (o.items || []).reduce((sum, it) => sum + (it.quantity || 0), 0);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">Order History</h1>
                <p className="text-secondary mt-1">Track your purchases and payment status.</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <Card className="p-6">
                    <DataTable<Order>
                        columns={[
                            {
                                header: 'Order Ref',
                                key: 'id',
                                render: (o) => (
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-blue-50 text-action rounded-lg flex items-center justify-center">
                                            <ShoppingBag className="h-4 w-4" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-primary">ORD-{o.id}</span>
                                            <span className="text-[10px] text-secondary">{itemCountFor(o)} items</span>
                                        </div>
                                    </div>
                                )
                            },
                            {
                                header: 'Date',
                                key: 'created_at',
                                render: (o) => <span className="text-xs font-medium">{new Date(o.created_at).toLocaleDateString()}</span>
                            },
                            {
                                header: 'Amount',
                                key: 'total_amount',
                                render: (o) => <span className="font-bold text-primary">{formatMoneyGHS(o.total_amount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            },
                            {
                                header: 'Payment Status',
                                key: 'status',
                                render: (o) => (
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                        o.status === 'DELIVERED'
                                            ? 'bg-emerald-50 text-emerald-600'
                                            : o.status === 'SHIPPED' || o.status === 'PROCESSING'
                                                ? 'bg-blue-50 text-blue-600'
                                                : o.status === 'PENDING'
                                                    ? 'bg-amber-50 text-amber-600'
                                                    : 'bg-red-50 text-red-600'
                                        }`}>
                                        <CreditCard className="h-3 w-3" />
                                        {o.status}
                                    </span>
                                )
                            },
                            {
                                header: 'Details',
                                key: 'actions',
                                render: (o) => (
                                    <button
                                        onClick={() => router.push(`/dashboard/orders/${o.id}`)}
                                        className="flex items-center gap-1 text-xs font-bold text-action hover:underline"
                                    >
                                        View Details <ChevronRight className="h-3 w-3" />
                                    </button>
                                )
                            }
                        ]}
                        data={orders}
                        emptyMessage="You haven't placed any orders yet."
                    />
                </Card>
            )}
        </div>
    );
}
