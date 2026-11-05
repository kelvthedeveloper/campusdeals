'use client';

import { useMemo, useState, useEffect } from 'react';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import { ShoppingBag, Gavel, Calendar, ArrowUpRight, TrendingUp } from 'lucide-react';
import { Auction, Booking, Order, User } from '@/types';
import { formatMoneyGHS } from '@/utils/money';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [auctions, setAuctions] = useState<Auction[]>([]);

    useEffect(() => {
        const fetchDashboard = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const [ordersRes, bookingsRes, auctionsRes] = await Promise.all([
                    api.get('/payments/orders/'),
                    api.get('/services/bookings/'),
                    api.get('/auctions/'),
                ]);

                const orderList = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.results || [];
                const bookingList = Array.isArray(bookingsRes.data) ? bookingsRes.data : bookingsRes.data?.results || [];
                const auctionList = Array.isArray(auctionsRes.data) ? auctionsRes.data : auctionsRes.data?.results || [];

                setOrders(orderList);
                setBookings(bookingList);
                setAuctions(auctionList);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                setOrders([]);
                setBookings([]);
                setAuctions([]);
            } finally {
                setLoading(false);
            }
        };
        if (!authLoading) {
            fetchDashboard();
        }
    }, [authLoading, user]);

    const activeOrdersCount = useMemo(() => {
        return (orders || []).filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED').length;
    }, [orders]);

    const activeBookingsCount = useMemo(() => {
        return (bookings || []).filter((b) => String(b.status || '').toUpperCase() !== 'CANCELLED').length;
    }, [bookings]);

    const activeAuctionsCount = useMemo(() => {
        return (auctions || []).filter((a) => a.is_active).length;
    }, [auctions]);

    if (authLoading || loading) return <div className="animate-pulse space-y-8">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-32 bg-slate-200 rounded-xl" />
            <div className="h-32 bg-slate-200 rounded-xl" />
            <div className="h-32 bg-slate-200 rounded-xl" />
        </div>
    </div>;

    if (!user) {
        return null;
    }

    const customerStats = [
        { name: 'Active Orders', value: String(activeOrdersCount), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Live Auctions', value: String(activeAuctionsCount), icon: Gavel, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { name: 'Bookings', value: String(activeBookingsCount), icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const adminStats = [
        { name: 'Total Revenue', value: formatMoneyGHS(0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
        { name: 'Live Auctions', value: '0', icon: Gavel, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { name: 'New Bookings', value: '0', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    ];

    const stats = user?.role === 'CUSTOMER' ? customerStats : adminStats;

    return (
        <div className="space-y-12">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">
                    Welcome back, {user?.username}!
                </h1>
                <p className="text-secondary mt-1">
                    Here&apos;s what is happening with your account today.
                </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.name} className="p-6">
                        <div className="flex items-center justify-between">
                            <div className={stat.bg + ' p-3 rounded-xl'}>
                                <stat.icon className={'h-6 w-6 ' + stat.color} />
                            </div>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                <TrendingUp className="h-3 w-3" />
                                +0%
                            </span>
                        </div>
                        <div className="mt-4">
                            <span className="text-2xl font-black text-primary">{stat.value}</span>
                            <span className="block text-xs font-bold text-secondary uppercase tracking-wider mt-1">{stat.name}</span>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Activities */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-extrabold text-primary">
                            {user?.role === 'CUSTOMER' ? 'Recent Orders' : 'Recent System Sales'}
                        </h3>
                        <button
                            onClick={() => router.push('/dashboard/orders')}
                            className="text-action text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                            View All <ArrowUpRight className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="text-center py-12">
                        <ShoppingBag className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-sm text-secondary italic">No recent activity.</p>
                    </div>
                </Card>

                <Card className="p-8">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-extrabold text-primary">
                            {user?.role === 'CUSTOMER' ? 'Live Auctions' : 'Hot Auctions'}
                        </h3>
                        <button
                            onClick={() => router.push('/dashboard/auctions')}
                            className="text-action text-xs font-bold flex items-center gap-1 hover:underline"
                        >
                            View All <ArrowUpRight className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="text-center py-12">
                        <Gavel className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-sm text-secondary italic">Nothing to show right now.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
