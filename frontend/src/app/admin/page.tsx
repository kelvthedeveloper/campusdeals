'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/molecules/Card';
import {
    Package,
    ShoppingCart,
    TrendingUp,
    AlertTriangle,
    Users,
    ArrowUpRight,
    Search,
    Gavel,
    Calendar,
    History as HistoryIcon
} from 'lucide-react';
import { formatMoneyGHS } from '@/utils/money';
import api from '@/utils/api';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState({
        total_products: 0,
        total_orders: 0,
        total_stock: 0,
        out_of_stock: 0,
        total_users: 0,
        active_users: 0,
        active_auctions: 0,
        active_bookings: 0,
        total_revenue: 0
    });
    const [categories, setCategories] = useState<any[]>([]);
    const [auctions, setAuctions] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const results = await Promise.allSettled([
                    api.get('/auth/analytics/summary/'),
                    api.get('/auctions/'),
                    api.get('/services/bookings/'),
                    api.get('/store/categories/'),
                    api.get('/payments/orders/')
                ]);

                const [summaryRes, auctionsRes, bookingsRes, categoriesRes, ordersRes] = results;

                const logFailure = (label: string, res: PromiseSettledResult<any>) => {
                    if (res.status === 'rejected') {
                        const err: any = res.reason;
                        const status = err?.response?.status;
                        const data = err?.response?.data;
                        console.error(`[AdminDashboard] ${label} failed`, { status, data, err });
                    }
                };

                logFailure('/auth/analytics/summary/', summaryRes);
                logFailure('/auctions/', auctionsRes);
                logFailure('/services/bookings/', bookingsRes);
                logFailure('/store/categories/', categoriesRes);
                logFailure('/payments/orders/', ordersRes);

                const auctionsData = auctionsRes.status === 'fulfilled' ? (auctionsRes.value.data ?? []) : [];
                const bookingsData = bookingsRes.status === 'fulfilled' ? (bookingsRes.value.data ?? []) : [];
                const categoriesData = categoriesRes.status === 'fulfilled' ? (categoriesRes.value.data ?? []) : [];
                const ordersData = ordersRes.status === 'fulfilled' ? (ordersRes.value.data ?? []) : [];

                // Handle paginated responses
                const auctionsArray = Array.isArray(auctionsData) ? auctionsData : (auctionsData.results || []);
                const bookingsArray = Array.isArray(bookingsData) ? bookingsData : (bookingsData.results || []);
                const categoriesArray = Array.isArray(categoriesData) ? categoriesData : (categoriesData.results || []);
                const ordersArray = Array.isArray(ordersData) ? ordersData : (ordersData.results || []);

                setAuctions(auctionsArray.slice(0, 5)); // Top 5 active auctions
                setBookings(bookingsArray.slice(0, 5)); // Top 5 bookings
                setCategories(categoriesArray.slice(0, 5)); // Top 5 categories
                setOrders(ordersArray.slice(0, 10)); // Top 10 recent orders

                // Calculate revenue from orders (only PAID or PROCESSING orders)
                const revenue = ordersArray.reduce((sum: number, order: any) => {
                    const amount = parseFloat(order.total_amount || 0);
                    return sum + (isNaN(amount) ? 0 : amount);
                }, 0);

                const summary = summaryRes.status === 'fulfilled' ? (summaryRes.value.data ?? {}) : {};
                const totalProducts = Number(summary?.products?.total ?? 0);
                const totalOrders = Number(summary?.orders?.total ?? ordersArray.length);
                const totalStock = Number(summary?.products?.total_stock ?? 0);
                const outOfStock = Number(summary?.products?.out_of_stock ?? 0);
                const totalUsers = Number(summary?.users?.total ?? 0);
                const activeUsers = Number(summary?.users?.active ?? 0);
                const activeAuctions = Number(summary?.auctions?.active ?? auctionsArray.filter((a: any) => a.is_active).length);
                const activeBookings = Number(summary?.service_bookings?.total ?? bookingsArray.length);

                setStats({
                    total_products: Number.isFinite(totalProducts) ? totalProducts : 0,
                    total_orders: Number.isFinite(totalOrders) ? totalOrders : 0,
                    total_stock: Number.isFinite(totalStock) ? totalStock : 0,
                    out_of_stock: Number.isFinite(outOfStock) ? outOfStock : 0,
                    total_users: Number.isFinite(totalUsers) ? totalUsers : 0,
                    active_users: Number.isFinite(activeUsers) ? activeUsers : 0,
                    active_auctions: Number.isFinite(activeAuctions) ? activeAuctions : 0,
                    active_bookings: Number.isFinite(activeBookings) ? activeBookings : 0,
                    total_revenue: revenue
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    const kpiCards = [
        { name: 'Total Products', value: stats.total_products, icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { name: 'Orders', value: stats.total_orders, icon: ShoppingCart, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
        { name: 'Total Stock', value: stats.total_stock, icon: TrendingUp, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100' },
        { name: 'Out of Stock', value: stats.out_of_stock, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50', border: 'border-rose-100' },
    ];

    if (loading) return <div className="space-y-8 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-white rounded-2xl border border-slate-100 col-span-2" />
            <div className="h-64 bg-white rounded-2xl border border-slate-100" />
        </div>
    </div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-primary tracking-tight">Over View</h1>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-secondary uppercase tracking-widest">Auto Update</span>
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiCards.map((card) => (
                    <div key={card.name} className={`bg-white p-6 rounded-2xl border ${card.border} flex items-center justify-between shadow-sm hover:shadow-md transition-shadow`}>
                        <div className="flex items-center gap-4">
                            <div className={`${card.bg} p-3 rounded-xl`}>
                                <card.icon className={`h-6 w-6 ${card.color}`} />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-primary">{(card.value ?? 0).toLocaleString()}</p>
                                <p className="text-xs font-bold text-secondary uppercase tracking-wider">{card.name}</p>
                            </div>
                        </div>
                        <div className="self-end pb-1 pr-1">
                            <button className="p-1 hover:bg-slate-50 rounded text-slate-400">
                                <ArrowUpRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Users Summary */}
                <Card className="p-8">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h3 className="text-lg font-extrabold text-primary">No of users</h3>
                            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Total Active Customers</p>
                        </div>
                        <button className="p-1 hover:bg-slate-50 rounded text-slate-400">
                            <ArrowUpRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center">
                            <Users className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <p className="text-4xl font-black text-primary">{stats.active_users}</p>
                            <p className="text-xs font-bold text-secondary">Total Customers</p>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-slate-50">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-secondary">New Signups</span>
                            <span className="text-xs font-bold text-emerald-600">+12%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-action w-2/3" />
                        </div>
                    </div>
                </Card>

                {/* Inventory Values (Semi-Circle Chart Representation) */}
                <Card className="p-8">
                    <h3 className="text-lg font-extrabold text-primary mb-8">Inventory Values</h3>
                    <div className="relative h-32 flex items-center justify-center">
                        {/* CSS Circle chart hack */}
                        <div className="h-32 w-32 rounded-full border-[12px] border-slate-100 relative">
                            <div className="absolute inset-0 rounded-full border-[12px] border-action border-t-transparent border-l-transparent transform rotate-45" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-primary">68%</span>
                                <span className="text-[10px] text-secondary font-bold">AVAIL</span>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-blue-100" />
                            <span className="text-xs text-secondary font-medium whitespace-nowrap">Sold units</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded bg-blue-800" />
                            <span className="text-xs text-secondary font-medium whitespace-nowrap">Total units</span>
                        </div>
                    </div>
                </Card>

                {/* Top Sales by Category */}
                <Card className="p-8">
                    <h3 className="text-lg font-extrabold text-primary mb-8">Top categories</h3>
                    <div className="space-y-4">
                        {categories.length > 0 ? (
                            categories.map((category: any, index: number) => {
                                const productCount = category.product_count || 0;
                                const maxCount = Math.max(...categories.map((c: any) => c.product_count || 0), 1);
                                const percentage = Math.round((productCount / maxCount) * 100);
                                const widths = ['w-[95%]', 'w-[80%]', 'w-[65%]', 'w-[50%]', 'w-[35%]'];
                                const widthClass = widths[index] || 'w-[30%]';
                                return (
                                    <div key={category.id} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-primary truncate">{category.name}</span>
                                            <span className="text-secondary">{productCount} products</span>
                                        </div>
                                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                                            <div className={`h-full bg-[#1E3A4C] ${widthClass} rounded-full`} />
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-sm text-secondary">No categories found</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Second Row - Recent Listings & Active Auctions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-extrabold text-primary">Active Auctions</h3>
                        <Gavel className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="space-y-6">
                        {auctions.length > 0 ? (
                            auctions.map((auction: any) => (
                                <div key={auction.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                                            <HistoryIcon className="h-5 w-5 text-action" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-primary">{auction.title || 'Untitled Auction'}</p>
                                            <p className="text-[10px] text-secondary">
                                                {auction.is_active ? 'Active' : 'Ended'} • Ends {new Date(auction.end_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-primary">
                                            {formatMoneyGHS(auction.current_bid || auction.starting_bid || 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">
                                            {auction.bid_count || 0} Bids
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-secondary">No active auctions</p>
                        )}
                    </div>
                </Card>

                <Card className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-extrabold text-primary">Recent Service Bookings</h3>
                        <Calendar className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="space-y-6">
                        {bookings.length > 0 ? (
                            bookings.map((booking: any) => (
                                <div key={booking.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-primary">{booking.service_name || 'Service Booking'}</p>
                                            <p className="text-[10px] text-secondary">
                                                Booked on {new Date(booking.created_at || booking.booking_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-tighter ${
                                        booking.status === 'CONFIRMED' || booking.status === 'COMPLETED'
                                            ? 'bg-emerald-50 text-emerald-700'
                                            : booking.status === 'CANCELLED'
                                            ? 'bg-rose-50 text-rose-700'
                                            : 'bg-amber-50 text-amber-700'
                                    }`}>
                                        {booking.status || 'Pending'}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-secondary">No recent bookings</p>
                        )}
                    </div>
                </Card>
            </div>

            {/* Third Row - Orders & Revenue */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Revenue Summary */}
                <Card className="p-8 lg:col-span-1">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-extrabold text-primary">Revenue</h3>
                            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Total Earnings</p>
                        </div>
                        <div className="p-2 bg-emerald-50 rounded-xl">
                            <TrendingUp className="h-5 w-5 text-emerald-600" />
                        </div>
                    </div>
                    <div className="mb-6">
                        <p className="text-3xl font-black text-primary">{formatMoneyGHS(stats.total_revenue)}</p>
                        <p className="text-xs text-secondary mt-1">From {stats.total_orders} orders</p>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-secondary">Avg. Order Value</span>
                            <span className="font-bold text-primary">
                                {stats.total_orders > 0 ? formatMoneyGHS(stats.total_revenue / stats.total_orders) : formatMoneyGHS(0)}
                            </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-3/4 rounded-full" />
                        </div>
                    </div>
                </Card>

                {/* Recent Orders */}
                <Card className="p-8 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-extrabold text-primary">Recent Orders</h3>
                            <p className="text-[10px] text-secondary font-bold uppercase tracking-widest">Latest Customer Orders</p>
                        </div>
                        <ShoppingCart className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                        {orders.length > 0 ? (
                            orders.map((order: any) => (
                                <div key={order.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm">
                                            <ShoppingCart className="h-5 w-5 text-action" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-primary">Order #{order.id}</p>
                                            <p className="text-[10px] text-secondary">
                                                {order.user_username || order.user_email || 'Guest'} • {new Date(order.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-tighter ${
                                            order.status === 'DELIVERED'
                                                ? 'bg-emerald-50 text-emerald-700'
                                                : order.status === 'CANCELLED'
                                                ? 'bg-rose-50 text-rose-700'
                                                : order.status === 'SHIPPED' || order.status === 'PROCESSING'
                                                ? 'bg-blue-50 text-blue-700'
                                                : 'bg-amber-50 text-amber-700'
                                        }`}>
                                            {order.status || 'Pending'}
                                        </span>
                                        <p className="text-xs font-bold text-primary">
                                            {formatMoneyGHS(order.total_amount || 0)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-secondary text-center py-8">No orders yet</p>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
