'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import AuctionCard from '@/components/molecules/AuctionCard';
import { Gavel } from 'lucide-react';
import { Auction } from '@/types';

export default function AuctionListPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            router.replace('/admin');
        }
    }, [user, router]);

    useEffect(() => {
        const fetchAuctions = async () => {
            try {
                const { data } = await api.get('/auctions/');
                const auctionList = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.results)
                        ? data.results
                        : [];
                setAuctions(auctionList);
            } catch (error) {
                console.error('Error fetching auctions:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAuctions();
    }, []);

    return (
        <div className="bg-slate-50 min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div className="max-w-xl">
                        <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-2 flex items-center gap-3">
                            <Gavel className="h-10 w-10 text-action" />
                            Live Auctions
                        </h1>
                        <p className="text-secondary">Bid on vintage tech and campus collectibles. High urgency, student-only bidding.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-xl h-[400px] animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : (
                    <>
                        {auctions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {auctions.map((auction) => (
                                    <AuctionCard
                                        key={auction.id}
                                        id={auction.id}
                                        title={auction.title}
                                        current_price={auction.current_price}
                                        end_time={auction.end_time}
                                        image={auction.image}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                                <Gavel className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-primary">No live auctions</h3>
                                <p className="text-secondary text-sm">Check back later or explore the store.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
