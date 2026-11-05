'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Card from '@/components/molecules/Card';
import api from '@/utils/api';
import { showError } from '@/utils/alert';
import {
    BarChart3,
    DollarSign,
    Users,
    Package,
    ArrowUpRight,
    Download
} from 'lucide-react';
import { formatMoneyGHS } from '@/utils/money';

export default function AdminReportsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/auth/analytics/summary/');
                setData(res.data);
            } catch (e) {
                console.error('Error fetching analytics summary:', e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const kpis = useMemo(() => {
        if (!data) return null;
        const revenue = Number(data?.payments?.success_amount_total ?? 0);
        const orders = Number(data?.orders?.total ?? 0);
        const users = Number(data?.users?.total ?? 0);
        const products = Number(data?.products?.total ?? 0);
        return { revenue, orders, users, products };
    }, [data]);

    const downloadPdf = async () => {
        try {
            const res = await api.get('/auth/analytics/summary.pdf', { responseType: 'blob' });
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `campusdeals-report-${new Date().toISOString().slice(0, 10)}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Error downloading PDF report:', e);
            showError('Download Failed', 'Failed to download PDF report.');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-8 w-64 bg-slate-200 rounded" />
                <div className="h-96 bg-white rounded-2xl border border-slate-100" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary tracking-tight">Reporting & Analytics</h1>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">In-depth performance metrics and platform growth data</p>
                </div>
                <button
                    onClick={downloadPdf}
                    disabled={!data}
                    className="flex items-center gap-2 px-4 py-2 bg-[#1E3A4C] text-white rounded-xl text-xs font-bold hover:shadow-lg transition disabled:opacity-50"
                >
                    <Download className="h-4 w-4" />
                    Download Full Report
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Revenue (Successful Payments)</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-black text-primary">{formatMoneyGHS(kpis?.revenue ?? 0)}</h2>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <DollarSign className="h-5 w-5" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Orders</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-black text-primary">{(kpis?.orders ?? 0).toLocaleString()}</h2>
                        <div className="h-10 w-10 rounded-xl bg-action/10 text-action flex items-center justify-center">
                            <ArrowUpRight className="h-5 w-5" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Users</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-black text-primary">{(kpis?.users ?? 0).toLocaleString()}</h2>
                        <div className="h-10 w-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">Products</p>
                    <div className="flex items-end justify-between">
                        <h2 className="text-3xl font-black text-primary">{(kpis?.products ?? 0).toLocaleString()}</h2>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <Package className="h-5 w-5" />
                        </div>
                    </div>
                </Card>
            </div>

            <Card className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-extrabold text-primary">Last 7 Days</h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-action rounded-full" />
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Orders</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-3 w-3 bg-emerald-400 rounded-full" />
                            <span className="text-[10px] font-bold text-secondary uppercase tracking-widest">Revenue</span>
                        </div>
                    </div>
                </div>

                <div className="h-64 flex items-end justify-between gap-4 px-4 border-b border-l border-slate-100">
                    {(data?.orders?.daily_count_7d || []).map((p: any, idx: number) => {
                        const orders = Number(p.value ?? 0);
                        const revenue = Number(data?.orders?.daily_revenue_7d?.[idx]?.value ?? 0);
                        const maxOrders = Math.max(...(data?.orders?.daily_count_7d || []).map((x: any) => Number(x.value ?? 0)), 1);
                        const maxRevenue = Math.max(...(data?.orders?.daily_revenue_7d || []).map((x: any) => Number(x.value ?? 0)), 1);
                        const ordersPct = Math.max(5, Math.round((orders / maxOrders) * 100));
                        const revenuePct = Math.max(5, Math.round((revenue / maxRevenue) * 100));
                        const label = String(p.date).slice(5);
                        return (
                            <div key={p.date} className="flex-1 flex flex-col items-center group">
                                <div className="w-full flex justify-center gap-1 h-full items-end pb-2">
                                    <div style={{ height: `${ordersPct}%` }} className="w-3 bg-action/20 group-hover:bg-action rounded-t transition-all" />
                                    <div style={{ height: `${revenuePct}%` }} className="w-3 bg-emerald-400/20 group-hover:bg-emerald-400 rounded-t transition-all" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-400 mt-2">{label}</span>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="p-8">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Auction Performance</h3>
                    <div className="space-y-4">
                        {[{
                            item: 'Active Auctions',
                            right: `${data?.auctions?.active ?? 0} / ${data?.auctions?.total ?? 0}`,
                            pct: Math.min(100, Math.round(((Number(data?.auctions?.active ?? 0)) / Math.max(1, Number(data?.auctions?.total ?? 0))) * 100)),
                        }, {
                            item: 'Total Bids',
                            right: `${data?.auctions?.bids_total ?? 0}`,
                            pct: 100,
                        }, {
                            item: 'Bids (Last 7d)',
                            right: `${data?.auctions?.bids_last_7d ?? 0}`,
                            pct: 60,
                        }].map((metric: any) => (
                            <div key={metric.item}>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                                    <span className="text-secondary">{metric.item}</span>
                                    <span className="text-primary">{metric.right}</span>
                                </div>
                                <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-action" style={{ width: `${metric.pct}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-8">
                    <h3 className="text-sm font-black text-primary uppercase tracking-widest mb-6 border-b border-slate-100 pb-4">Sales Channels</h3>
                    <div className="flex items-center justify-around h-32">
                        {/* Simple Donut Chart Representation */}
                        <div className="h-32 w-32 border-[16px] border-slate-50 rounded-full relative">
                            <div className="absolute inset-0 border-[16px] border-action rounded-full border-t-transparent border-l-transparent transform rotate-12" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-primary">{data?.users?.active ? Math.min(99, Math.round((Number(data.users.active) / Math.max(1, Number(data.users.total))) * 100)) : 0}%</span>
                                <span className="text-[8px] font-bold text-secondary uppercase tracking-widest">Active Users</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 bg-action rounded" />
                                <span className="text-xs font-bold text-secondary">Active Users</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="h-3 w-3 bg-slate-200 rounded" />
                                <span className="text-xs font-bold text-secondary">Inactive Users</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
