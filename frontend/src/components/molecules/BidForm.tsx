'use client';

import { useState } from 'react';
import api from '@/utils/api';
import Button from '@/components/atoms/Button';
import { Gavel } from 'lucide-react';
import { formatMoneyGHS } from '@/utils/money';

interface BidFormProps {
    auctionId: number;
    currentPrice: string;
    isActive: boolean;
    onBidSuccess: (newPrice: string) => void;
}

export default function BidForm({ auctionId, currentPrice, isActive, onBidSuccess }: BidFormProps) {
    const [bidAmount, setBidAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleBid = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const { data } = await api.post(`/auctions/${auctionId}/bid/`, { amount: bidAmount });
            setSuccess('Bid placed successfully!');
            onBidSuccess(data.new_price);
            setBidAmount('');
        } catch (err: unknown) {
            const errorObj = err as { response?: { data?: { error?: string } } };
            setError(errorObj.response?.data?.error || 'Failed to place bid.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleBid} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-primary mb-2">Your Bid (GHS)</label>
                <div className="relative">
                    <input
                        type="number"
                        value={bidAmount}
                        onChange={(e) => setBidAmount(e.target.value)}
                        step="0.01"
                        placeholder={`Min ${formatMoneyGHS((parseFloat(currentPrice) + 1).toFixed(2), { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                        className="w-full bg-white border border-slate-200 rounded-lg py-3 px-4 focus:ring-2 focus:ring-action/20 focus:border-action outline-none text-lg font-bold"
                    />
                </div>
            </div>

            {error && <p className="text-xs font-bold text-red-500">{error}</p>}
            {success && <p className="text-xs font-bold text-emerald-600">{success}</p>}

            <Button type="submit" className="w-full py-4 shadow-xl shadow-blue-500/10" disabled={!isActive || loading} loading={loading}>
                <Gavel className="h-5 w-5 mr-2" />
                Place Bid Now
            </Button>
        </form>
    );
}
