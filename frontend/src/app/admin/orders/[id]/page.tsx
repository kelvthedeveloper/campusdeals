'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import {
    ShoppingCart,
    ArrowLeft,
    Package,
    User,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    Truck,
    MapPin,
    Calendar
} from 'lucide-react';
import { formatMoneyGHS } from '@/utils/money';
import api from '@/utils/api';
import { Order } from '@/types';
import { showSuccess, showError } from '@/utils/alert';

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data } = await api.get(`/payments/orders/${orderId}/`);
                setOrder(data);
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();
    }, [orderId]);

    const updateStatus = async (newStatus: string) => {
        setUpdating(true);
        try {
            const { data } = await api.patch(`/payments/orders/${orderId}/`, { status: newStatus });
            setOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
            showSuccess('Status Updated', `Order status changed to ${newStatus}`);
        } catch (error: any) {
            console.error('Error updating order status:', error);
            const message = error?.response?.data?.detail || error?.response?.data?.error || 'Failed to update status';
            showError('Update Failed', message);
        } finally {
            setUpdating(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DELIVERED': return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
            case 'CANCELLED': return <XCircle className="h-5 w-5 text-rose-600" />;
            case 'SHIPPED': return <Truck className="h-5 w-5 text-blue-600" />;
            case 'PROCESSING': return <Package className="h-5 w-5 text-blue-600" />;
            default: return <Clock className="h-5 w-5 text-amber-600" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'DELIVERED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-200';
            case 'SHIPPED':
            case 'PROCESSING': return 'bg-blue-50 text-blue-700 border-blue-200';
            default: return 'bg-amber-50 text-amber-700 border-amber-200';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-48 bg-slate-200 rounded" />
                <div className="h-96 bg-white rounded-2xl border border-slate-100" />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="text-center py-20">
                <ShoppingCart className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-primary">Order not found</h3>
                <p className="text-sm text-secondary mb-4">The order you're looking for doesn't exist.</p>
                <Button variant="outline" onClick={() => router.push('/admin/orders')}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Orders
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" onClick={() => router.push('/admin/orders')} className="p-2">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black text-primary tracking-tight">Order #{order.id}</h1>
                        <p className="text-xs font-bold text-secondary uppercase tracking-widest">
                            Placed on {new Date(order.created_at || '').toLocaleDateString()}
                        </p>
                    </div>
                </div>
                <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(order.status)}`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-2">{order.status}</span>
                </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items */}
                    <Card className="p-6">
                        <h3 className="text-lg font-extrabold text-primary mb-6 flex items-center gap-2">
                            <Package className="h-5 w-5 text-slate-400" />
                            Order Items
                        </h3>
                        {order.items && order.items.length > 0 ? (
                            <div className="space-y-4">
                                {order.items.map((item: any, index: number) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                                                <Package className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-primary">{item.product_name || `Product #${item.product}`}</p>
                                                <p className="text-xs text-secondary">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-sm text-primary">
                                            {formatMoneyGHS(parseFloat(item.price || 0) * item.quantity)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-secondary">No items in this order.</p>
                        )}
                        <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-sm font-bold text-secondary">Total Amount</span>
                            <span className="text-2xl font-black text-primary">{formatMoneyGHS(order.total_amount)}</span>
                        </div>
                    </Card>

                    {/* Customer Info */}
                    <Card className="p-6">
                        <h3 className="text-lg font-extrabold text-primary mb-6 flex items-center gap-2">
                            <User className="h-5 w-5 text-slate-400" />
                            Customer Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Name</p>
                                <p className="font-bold text-primary">{order.user_username || 'Guest User'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Email</p>
                                <p className="font-bold text-primary">{order.user_email || 'No email provided'}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Phone Number</p>
                                <p className="font-bold text-primary">{order.user_phone_number || 'Not provided'}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-1">Default Address</p>
                                <p className="font-bold text-primary">{order.user_address || 'No address on file'}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Order Summary */}
                    <Card className="p-6">
                        <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Order Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Order ID</span>
                                <span className="font-bold text-primary">#{order.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Date</span>
                                <span className="font-bold text-primary">{new Date(order.created_at || '').toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Status</span>
                                <span className="font-bold text-primary">{order.status}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-secondary">Total</span>
                                <span className="font-bold text-primary">{formatMoneyGHS(order.total_amount)}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Update Status */}
                    <Card className="p-6">
                        <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-4">Update Status</h3>
                        <div className="space-y-2">
                            {[
                                { key: 'PENDING', label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                                { key: 'PROCESSING', label: 'Processing', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                { key: 'SHIPPED', label: 'Shipped', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                                { key: 'DELIVERED', label: 'Delivered', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                                { key: 'CANCELLED', label: 'Cancelled', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                            ].map(({ key, label, color }) => (
                                <button
                                    key={key}
                                    onClick={() => updateStatus(key)}
                                    disabled={updating || order.status === key}
                                    className={`w-full py-2 px-4 rounded-lg text-xs font-bold uppercase transition border ${
                                        order.status === key
                                            ? `${color} cursor-default`
                                            : 'bg-white border-slate-200 text-primary hover:bg-slate-50'
                                    }`}
                                >
                                    {order.status === key ? '✓ ' : ''}{label}
                                </button>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
