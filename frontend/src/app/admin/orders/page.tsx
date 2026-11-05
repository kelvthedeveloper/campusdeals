'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import {
    ShoppingCart,
    Search,
    Filter,
    MoreHorizontal,
    CreditCard,
    CheckCircle2,
    XCircle,
    Clock,
    FileText,
    ArrowUpRight,
    Trash2
} from 'lucide-react';
import { formatMoneyGHS } from '@/utils/money';
import api from '@/utils/api';
import { Order } from '@/types';
import { useRouter } from 'next/navigation';
import { showSuccess, showError, showConfirm } from '@/utils/alert';

export default function AdminOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [showStatusDropdown, setShowStatusDropdown] = useState(false);

    const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await api.get('/payments/orders/');
                const ordersList = Array.isArray(data) ? data : (data.results || []);
                setOrders(ordersList);
            } catch (error) {
                console.error('Error fetching admin orders:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(o => {
        const matchesSearch = String(o.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (o.user_username || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalRevenue = orders.reduce((sum, o) => sum + (parseFloat(String(o.total_amount)) || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    const exportToCSV = () => {
        const headers = ['Order ID', 'Customer', 'Email', 'Amount', 'Status', 'Date'];
        const rows = filteredOrders.map(o => [
            o.id,
            o.user_username || 'Guest',
            o.user_email || '',
            o.total_amount,
            o.status,
            new Date(o.created_at || '').toLocaleDateString()
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDeleteOrder = async (order: Order) => {
        const confirmed = await showConfirm(
            'Delete Order',
            `Are you sure you want to delete order #${order.id}? This action cannot be undone.`,
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        setIsDeleting(true);
        try {
            await api.delete(`/payments/orders/${order.id}/`);
            setOrders(prev => prev.filter(o => o.id !== order.id));
            showSuccess('Order Deleted', 'Order has been removed successfully.');
        } catch (error: any) {
            console.error('Error deleting order:', error);
            showError('Delete Failed', error?.response?.data?.detail || 'Failed to delete order.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-96 bg-white rounded-2xl border border-slate-100" />
    </div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary tracking-tight">Orders & Revenue</h1>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Track transactions, verify payments, and manage fulfillment</p>
                </div>
                <Button variant="outline" className="flex items-center gap-2" onClick={exportToCSV}>
                    <FileText className="h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find order by number or customer..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto relative">
                        <button 
                            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-primary hover:bg-slate-50 transition"
                        >
                            <Filter className="h-4 w-4" />
                            {statusFilter === 'ALL' ? 'Status' : statusFilter}
                        </button>
                        {showStatusDropdown && (
                            <div className="absolute top-full right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg z-10 py-2">
                                {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map(status => (
                                    <button
                                        key={status}
                                        onClick={() => { setStatusFilter(status); setShowStatusDropdown(false); }}
                                        className={`w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition ${
                                            statusFilter === status ? 'text-action bg-slate-50' : 'text-primary'
                                        }`}
                                    >
                                        {status === 'ALL' ? 'All Statuses' : status}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Order ID</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Payment</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredOrders.map((o) => (
                                <tr key={o.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <ShoppingCart className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-primary">#{o.id}</p>
                                                <p className="text-[10px] text-secondary font-medium">Placed: {new Date(o.created_at || Date.now()).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-sm font-bold text-primary">{o.user_username || 'Guest User'}</p>
                                        <p className="text-[10px] text-secondary">{o.user_email || 'No email'}</p>
                                        <p className="text-[10px] text-slate-400">{o.user_phone_number || 'No phone'}</p>
                                    </td>
                                    <td className="px-6 py-4 italic text-sm font-black text-primary">
                                        {formatMoneyGHS(o.total_amount ?? 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                            o.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700' :
                                            o.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700' :
                                            o.status === 'SHIPPED' || o.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700' :
                                            'bg-amber-50 text-amber-700'
                                        }`}>
                                            {o.status === 'DELIVERED' ? <CheckCircle2 className="h-3 w-3" /> :
                                                o.status === 'CANCELLED' ? <XCircle className="h-3 w-3" /> :
                                                <Clock className="h-3 w-3" />}
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => router.push(`/admin/orders/${o.id}`)}
                                                className="p-2 text-slate-400 hover:text-action transition" 
                                                title="View Details"
                                            >
                                                <ArrowUpRight className="h-4 w-4" />
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteOrder(o)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition" 
                                                title="Delete Order"
                                                disabled={isDeleting}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            <button className="p-2 text-slate-400 hover:text-primary transition">
                                                <MoreHorizontal className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="py-20 text-center">
                        <ShoppingCart className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary">No orders recorded</h3>
                        <p className="text-sm text-secondary">New orders will appear here automatically.</p>
                    </div>
                )}
            </Card>

            {/* Payment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                <Card className="p-8 bg-gradient-to-br from-primary to-[#1E3A4C] text-white overflow-hidden relative">
                    <div className="relative z-10">
                        <CreditCard className="h-8 w-8 text-white/20 mb-4" />
                        <h3 className="text-sm font-bold uppercase tracking-widest opacity-60">Total Revenue</h3>
                        <p className="text-4xl font-black mt-1">{formatMoneyGHS(totalRevenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-xs opacity-60 mt-2">{orders.length} orders • Avg: {formatMoneyGHS(avgOrderValue)}</p>
                    </div>
                    {/* Decorative shape */}
                    <div className="absolute -bottom-12 -right-12 h-40 w-40 bg-white/5 rounded-full blur-3xl" />
                </Card>

                <Card className="p-8 border-slate-200">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-6">Payment Method Breakdown</h3>
                    <div className="space-y-4">
                        {[
                            { name: 'Paystack (Card)', value: '78%', color: 'bg-emerald-500', w: 'w-[78%]' },
                            { name: 'Bank Transfer', value: '15%', color: 'bg-blue-500', w: 'w-[15%]' },
                            { name: 'Auction Credits', value: '7%', color: 'bg-amber-500', w: 'w-[7%]' },
                        ].map(method => (
                            <div key={method.name}>
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider mb-1">
                                    <span className="text-secondary">{method.name}</span>
                                    <span className="text-primary">{method.value}</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <div className={`${method.color} h-full ${method.w}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
