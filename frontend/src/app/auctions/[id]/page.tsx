'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import AuctionTimer from '@/components/atoms/AuctionTimer';
import BidForm from '@/components/molecules/BidForm';
import { History, AlertCircle } from 'lucide-react';
import { Auction } from '@/types';
import { formatMoneyGHS } from '@/utils/money';

export default function AuctionRoomPage() {
    const { id } = useParams();
    const [auction, setAuction] = useState<Auction | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchStatus = useCallback(async () => {
        try {
            const { data } = await api.get(`/auctions/${id}/status/`);
            if (auction && data.current_price !== auction.current_price) {
                setAuction((prev: Auction | null) => prev ? ({ ...prev, ...data }) : null);
            }
        } catch (error) {
            console.error('Error polling status:', error);
        }
    }, [id, auction]);

    useEffect(() => {
        const fetchInitial = async () => {
            try {
                const { data } = await api.get(`/auctions/${id}/`);
                setAuction(data);
            } catch (error) {
                console.error('Error fetching auction:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitial();
    }, [id]);

    useEffect(() => {
        const poll = setInterval(fetchStatus, 5000);
        return () => clearInterval(poll);
    }, [fetchStatus]);

    const handleBidSuccess = (newPrice: string) => {
        setAuction((prev: Auction | null) => prev ? ({ ...prev, current_price: newPrice }) : null);
    };

    // Removed handleBid function

    if (loading) return <div className="p-10 sm:p-20 text-center text-secondary">Entering auction room...</div>;
    if (!auction) return <div className="p-10 sm:p-20 text-center text-primary font-bold">Auction not found.</div>;

    return (
        <div className="bg-slate-50 min-h-screen py-10 sm:py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Item Showcase - Main Column */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="p-0">
                            <div className="relative aspect-video">
                                <Image
                                    src={auction.image || '/placeholder-auction.svg'}
                                    alt={auction.title}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                                <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6 bg-white shadow-2xl rounded-2xl p-4 sm:p-6 border border-slate-100">
                                    <span className="text-secondary text-[10px] uppercase font-bold tracking-widest block mb-1">Time Remaining</span>
                                    <div className="text-3xl font-black">
                                        <AuctionTimer endTime={auction.end_time} />
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200">
                            <h1 className="text-3xl font-extrabold text-primary mb-4">{auction.title}</h1>
                            <p className="text-secondary leading-relaxed mb-6">
                                {auction.description || 'No detailed description provided for this auction item.'}
                            </p>
                            <div className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                                <AlertCircle className="h-5 w-5 text-action flex-shrink-0" />
                                <p className="text-xs text-secondary font-medium">
                                    All bids are final. Ensure you have the funds available before placing a bid.
                                    Auction ends automatically at the specified time.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bidding Controls - Sidebar */}
                    <div className="space-y-6">
                        <Card className="p-8 border-action/20 bg-blue-50/10">
                            <div className="mb-8 text-center">
                                <span className="text-secondary text-[10px] uppercase font-bold tracking-widest block mb-1">Current Highest Bid</span>
                                <div className="text-5xl font-black text-primary">{formatMoneyGHS(auction.current_price)}</div>
                                {auction.winner && (
                                    <div className="mt-2 inline-flex items-center text-emerald-600 text-xs font-bold">
                                        Winner: {auction.winner}
                                    </div>
                                )}
                            </div>

                            <BidForm
                                auctionId={parseInt(id as string)}
                                currentPrice={auction.current_price}
                                isActive={auction.is_active}
                                onBidSuccess={handleBidSuccess}
                            />
                        </Card>

                        {/* Recent History Mockup (or fetch if endpoint exists) */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <History className="h-4 w-4 text-primary" />
                                <h3 className="text-sm font-extrabold text-primary uppercase tracking-tight">Bid History</h3>
                            </div>
                            <div className="space-y-4">
                                {auction.bids?.slice(0, 5).map((bid) => (
                                    <div key={bid.id} className="flex justify-between items-center text-sm border-b border-slate-50 pb-3 last:border-0">
                                        <span className="font-bold text-primary">{bid.bidder_username}</span>
                                        <span className="font-mono font-bold text-action">{formatMoneyGHS(bid.amount)}</span>
                                    </div>
                                ))}
                                {(!auction.bids || auction.bids.length === 0) && (
                                    <p className="text-xs text-secondary text-center italic py-4">No bids placed yet.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
