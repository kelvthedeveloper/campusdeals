'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import DataTable from '@/components/molecules/DataTable';
import { Gavel, TrendingUp } from 'lucide-react';
import AuctionTimer from '@/components/atoms/AuctionTimer';
import Link from 'next/link';
import { Auction } from '@/types';
import { formatMoneyGHS } from '@/utils/money';

export default function DashboardAuctionsPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const { data } = await api.get('/auctions/');
                const list = Array.isArray(data) ? data : data?.results || [];
                setAuctions(list);
            } catch (error) {
                console.error('Error fetching auctions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuctions();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">Auction Activity</h1>
                <p className="text-secondary mt-1">Track your active bids and won auctions.</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-28 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <div className="space-y-4">
                    <Card className="p-6">
                        <DataTable<Auction>
                            columns={[
                                {
                                    header: 'Auction Item',
                                    key: 'title',
                                    render: (auction) => (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                                                <Gavel className="h-4 w-4" />
                                            </div>
                                            <span className="font-bold">{auction.title}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Current Bid',
                                    key: 'current_price',
                                    render: (auction) => (
                                        <div className="flex flex-col">
                                            <span className="font-bold text-action">{formatMoneyGHS(auction.current_price)}</span>
                                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold uppercase">
                                                <TrendingUp className="h-2 w-2" />
                                                Leading
                                            </span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Time Remaining',
                                    key: 'end_time',
                                    render: (auction) => <AuctionTimer endTime={auction.end_time} />
                                },
                                {
                                    header: 'Actions',
                                    key: 'actions',
                                    render: (auction) => (
                                        <Link href={`/auctions/${auction.id}`}>
                                            <button className="text-xs font-bold text-action hover:underline">View Room</button>
                                        </Link>
                                    )
                                }
                            ]}
                            data={auctions}
                            emptyMessage="No auctions found. Browse live auctions to start bidding."
                        />
                    </Card>
                </div>
            )}
        </div>
    );
}
