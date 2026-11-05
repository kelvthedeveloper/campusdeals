'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import {
    Gavel,
    Search,
    Clock,
    CheckCircle,
    XCircle,
    User,
    Calendar,
    ArrowUpRight,
    AlertCircle,
    Loader2,
    Eye,
    Shield,
    Edit,
    Trash2
} from 'lucide-react';
import api from '@/utils/api';
import { Auction, Bid } from '@/types';
import { formatMoneyGHS } from '@/utils/money';
import { showSuccess, showError } from '@/utils/alert';

export default function AdminAuctionsPage() {
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isBidsModalOpen, setIsBidsModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
    const [auctionBids, setAuctionBids] = useState<Bid[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isBidsLoading, setIsBidsLoading] = useState(false);

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingAuction, setEditingAuction] = useState<any>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [auctionToDelete, setAuctionToDelete] = useState<Auction | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAuction, setNewAuction] = useState<any>(null);
    const [createImageFile, setCreateImageFile] = useState<File | null>(null);

    const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

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
            console.error('Error fetching admin auctions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setLoading(true);
        await fetchAuctions();
    };

    useEffect(() => {
        fetchAuctions();
    }, []);

    const handleViewBids = async (auction: Auction) => {
        setSelectedAuction(auction);
        setIsBidsModalOpen(true);
        setIsBidsLoading(true);
        try {
            const { data } = await api.get(`/auctions/${auction.id}/bids/`);
            setAuctionBids(data);
        } catch (error) {
            console.error('Error fetching bids:', error);
        } finally {
            setIsBidsLoading(false);
        }
    };

    const handleConfirmWinner = async () => {
        if (!selectedAuction || auctionBids.length === 0) return;
        setIsSaving(true);
        try {
            // Confirm the highest bidder as winner and close auction
            const highestBid = auctionBids[0];
            await api.patch(`/auctions/${selectedAuction.id}/`, {
                is_active: false,
                winner_id: (highestBid as any).bidder_id
            });
            fetchAuctions();
            setIsConfirmModalOpen(false);
            setSelectedAuction(null);
            showSuccess('Winner Confirmed', 'Auction winner has been confirmed and auction closed.');
        } catch (error) {
            console.error('Error confirming winner:', error);
            showError('Failed', 'Failed to confirm winner.');
        } finally {
            setIsSaving(false);
        }
    };

    const toDatetimeLocal = (iso: string) => {
        if (!iso) return '';
        const d = new Date(iso);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    const openEdit = async (auction: Auction) => {
        setIsSaving(true);
        try {
            const { data } = await api.get(`/auctions/${auction.id}/`);
            setEditingAuction({
                id: data.id,
                title: data.title,
                description: data.description,
                start_price: data.start_price,
                end_time: data.end_time,
                is_active: data.is_active,
                image: data.image,
            });
            setImageFile(null);
            setIsEditModalOpen(true);
        } catch (error) {
            console.error('Error loading auction details:', error);
            showError('Failed', 'Failed to load auction details.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveAuction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAuction?.id) return;

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', editingAuction.title);
            formData.append('description', editingAuction.description || '');
            formData.append('start_price', String(editingAuction.start_price));
            formData.append('end_time', String(editingAuction.end_time));
            formData.append('is_active', editingAuction.is_active ? 'true' : 'false');
            if (imageFile) {
                formData.append('image', imageFile);
            }
            await api.patch(`/auctions/${editingAuction.id}/`, formData);
            await fetchAuctions();
            setIsEditModalOpen(false);
            setEditingAuction(null);
            setImageFile(null);
            showSuccess('Auction Saved', 'Auction updated successfully.');
        } catch (error) {
            console.error('Error saving auction:', error);
            showError('Failed', 'Failed to save auction.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteAuction = async () => {
        if (!auctionToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/auctions/${auctionToDelete.id}/`);
            await fetchAuctions();
            setAuctionToDelete(null);
            showSuccess('Auction Deleted', 'Auction has been removed.');
        } catch (error) {
            console.error('Error deleting auction:', error);
            showError('Failed', 'Failed to delete auction.');
        } finally {
            setIsDeleting(false);
        }
    };

    const openCreate = () => {
        const now = new Date();
        const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        setNewAuction({
            title: '',
            description: '',
            start_price: '0.00',
            end_time: end.toISOString(),
            is_active: true,
        });
        setCreateImageFile(null);
        setIsCreateModalOpen(true);
    };

    const handleCreateAuction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAuction) return;

        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append('title', newAuction.title);
            formData.append('description', newAuction.description || '');
            formData.append('start_price', String(newAuction.start_price));
            formData.append('end_time', String(newAuction.end_time));
            formData.append('is_active', newAuction.is_active ? 'true' : 'false');
            if (createImageFile) {
                formData.append('image', createImageFile);
            }

            await api.post('/auctions/', formData);
            await fetchAuctions();
            setIsCreateModalOpen(false);
            setNewAuction(null);
            setCreateImageFile(null);
            showSuccess('Auction Created', 'New auction has been created.');
        } catch (error) {
            console.error('Error creating auction:', error);
            showError('Failed', 'Failed to create auction.');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredAuctions = auctions.filter(a =>
        a.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded" />
        <div className="h-96 bg-white rounded-2xl border border-slate-100" />
    </div>;

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-primary tracking-tight">Auction Control</h1>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Monitor bids, confirm winners, and manage timelines</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsLogsModalOpen(true)}>Auction Logs</Button>
                    <Button size="sm" onClick={openCreate}>New Auction</Button>
                </div>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find auction by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Auction Item</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Pricing</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Time</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredAuctions.map((a) => (
                                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 border border-slate-100 overflow-hidden">
                                                {a.image ? (
                                                    <img src={a.image as string} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    <Gavel className="h-5 w-5" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-primary">{a.title}</p>
                                                <div className="flex items-center gap-1.5 text-secondary">
                                                    <Calendar className="h-3 w-3" />
                                                    <span className="text-[10px] font-medium">Ends: {new Date(a.end_time).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-black text-primary">{formatMoneyGHS(a.current_price)}</p>
                                            <p className="text-[10px] text-secondary font-bold uppercase tracking-tighter">Current Bid</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-2 ${a.is_active ? 'text-action' : 'text-slate-400'}`}>
                                            <Clock className="h-4 w-4" />
                                            <span className="text-xs font-bold">{a.is_active ? 'Active' : 'Closed'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {a.winner ? (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg uppercase tracking-wider">
                                                <Shield className="h-3 w-3" />
                                                Winner: {a.winner}
                                            </div>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${a.is_active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'} text-[10px] font-black rounded-lg uppercase tracking-wider`}>
                                                {a.is_active ? 'Open' : 'Pending Confirmation'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleViewBids(a)}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-primary hover:bg-slate-50 transition uppercase tracking-widest shadow-sm"
                                            >
                                                <Eye className="h-3 w-3" />
                                                Bids
                                            </button>

                                            <button
                                                onClick={() => openEdit(a)}
                                                className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>

                                            <button
                                                onClick={() => setAuctionToDelete(a)}
                                                className="p-2 text-slate-400 hover:text-rose-500 transition-all hover:bg-white rounded-lg shadow-sm"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            {!a.winner && !a.is_active && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedAuction(a);
                                                        handleViewBids(a).then(() => setIsConfirmModalOpen(true));
                                                    }}
                                                    className="px-3 py-1.5 bg-action text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:shadow-lg transition"
                                                >
                                                    Confirm Win
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Bids Modal */}
            <Modal
                isOpen={isBidsModalOpen}
                onClose={() => setIsBidsModalOpen(false)}
                title={`Bids for ${selectedAuction?.title}`}
                size="md"
            >
                {isBidsLoading ? (
                    <div className="py-20 text-center">
                        <Loader2 className="h-8 w-8 animate-spin text-action mx-auto" />
                        <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-4">Retrieving bid history...</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {auctionBids.length > 0 ? (
                            <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                                {auctionBids.map((bid, i) => (
                                    <div key={bid.id} className={`flex items-center justify-between p-4 ${i === 0 ? 'bg-emerald-50/50' : 'bg-white'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${i === 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                {i === 0 ? <Shield className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-primary">{bid.bidder_username}</p>
                                                <p className="text-[10px] text-secondary">{new Date(bid.created_at).toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-black ${i === 0 ? 'text-emerald-600' : 'text-primary'}`}>{formatMoneyGHS(bid.amount)}</p>
                                            {i === 0 && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Highest Bid</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center text-slate-400">
                                <Search className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-widest">No bids placed yet</p>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Confirm Winner Modal */}
            <Modal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                title="Confirm Auction Winner"
                size="sm"
            >
                <div className="space-y-6 text-center">
                    <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500">
                        <CheckCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-primary">Award to {auctionBids[0]?.bidder_username}?</h4>
                        <p className="text-sm text-secondary mt-1 leading-relaxed px-4">
                            The highest bid of <span className="font-bold text-primary">{formatMoneyGHS(auctionBids[0]?.amount)}</span> will be confirmed and the winner notified.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleConfirmWinner}
                            disabled={isSaving}
                            className="w-full py-3 bg-action text-white rounded-xl font-bold text-sm hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Notify Winner'}
                        </button>
                        <button
                            onClick={() => setIsConfirmModalOpen(false)}
                            className="w-full py-3 bg-slate-50 text-secondary rounded-xl font-bold text-sm hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Auction Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setEditingAuction(null);
                    setImageFile(null);
                }}
                title="Edit Auction"
                size="lg"
            >
                <form onSubmit={handleSaveAuction} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={editingAuction?.title || ''}
                                    onChange={(e) => setEditingAuction({ ...editingAuction, title: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Start Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={editingAuction?.start_price || ''}
                                    onChange={(e) => setEditingAuction({ ...editingAuction, start_price: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">End Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={toDatetimeLocal(editingAuction?.end_time || '')}
                                    onChange={(e) => setEditingAuction({ ...editingAuction, end_time: new Date(e.target.value).toISOString() })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Auction Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                                {editingAuction?.image && !imageFile && (
                                    <p className="text-[10px] text-secondary font-bold px-1">Current image is set</p>
                                )}
                                {imageFile && (
                                    <p className="text-[10px] text-secondary font-bold px-1">Selected: {imageFile.name}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={!!editingAuction?.is_active}
                                    onChange={(e) => setEditingAuction({ ...editingAuction, is_active: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-action focus:ring-action"
                                />
                                <label htmlFor="is_active" className="text-xs font-bold text-primary select-none cursor-pointer">
                                    Auction is Active
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Description</label>
                                <textarea
                                    rows={10}
                                    value={editingAuction?.description || ''}
                                    onChange={(e) => setEditingAuction({ ...editingAuction, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-medium leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="outline" type="button" onClick={() => {
                            setIsEditModalOpen(false);
                            setEditingAuction(null);
                            setImageFile(null);
                        }}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Auction'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Auction Modal */}
            <Modal
                isOpen={!!auctionToDelete}
                onClose={() => setAuctionToDelete(null)}
                title="Confirm Deletion"
                size="sm"
            >
                <div className="space-y-6 text-center">
                    <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-500">
                        <AlertCircle className="h-8 w-8" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-primary">Are you absolutely sure?</h4>
                        <p className="text-sm text-secondary mt-1 leading-relaxed px-4">
                            Deleting <span className="font-bold text-primary">"{auctionToDelete?.title}"</span> cannot be undone.
                        </p>
                    </div>
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={handleDeleteAuction}
                            disabled={isDeleting}
                            className="w-full py-3 bg-rose-500 text-white rounded-xl font-bold text-sm hover:bg-rose-600 transition disabled:opacity-50 flex items-center justify-center"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Yes, Delete Auction'}
                        </button>
                        <button
                            onClick={() => setAuctionToDelete(null)}
                            className="w-full py-3 bg-slate-50 text-secondary rounded-xl font-bold text-sm hover:bg-slate-100 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>

            {/* New Auction Modal */}
            <Modal
                isOpen={isCreateModalOpen}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setNewAuction(null);
                    setCreateImageFile(null);
                }}
                title="New Auction"
                size="lg"
            >
                <form onSubmit={handleCreateAuction} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    value={newAuction?.title || ''}
                                    onChange={(e) => setNewAuction({ ...newAuction, title: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Start Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={newAuction?.start_price || ''}
                                    onChange={(e) => setNewAuction({ ...newAuction, start_price: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">End Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={toDatetimeLocal(newAuction?.end_time || '')}
                                    onChange={(e) => setNewAuction({ ...newAuction, end_time: new Date(e.target.value).toISOString() })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Auction Image</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setCreateImageFile(e.target.files?.[0] ?? null)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-bold"
                                />
                                {createImageFile && (
                                    <p className="text-[10px] text-secondary font-bold px-1">Selected: {createImageFile.name}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    id="new_is_active"
                                    checked={!!newAuction?.is_active}
                                    onChange={(e) => setNewAuction({ ...newAuction, is_active: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-action focus:ring-action"
                                />
                                <label htmlFor="new_is_active" className="text-xs font-bold text-primary select-none cursor-pointer">
                                    Auction is Active
                                </label>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Description</label>
                                <textarea
                                    rows={10}
                                    required
                                    value={newAuction?.description || ''}
                                    onChange={(e) => setNewAuction({ ...newAuction, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-action/10 focus:border-action transition text-sm font-medium leading-relaxed"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                        <Button variant="outline" type="button" onClick={() => {
                            setIsCreateModalOpen(false);
                            setNewAuction(null);
                            setCreateImageFile(null);
                        }}>Cancel</Button>
                        <Button type="submit" disabled={isSaving} className="min-w-[140px]">
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Create Auction'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Auction Logs Modal */}
            <Modal
                isOpen={isLogsModalOpen}
                onClose={() => setIsLogsModalOpen(false)}
                title="Auction Logs"
                size="sm"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Total</p>
                            <p className="text-2xl font-black text-primary mt-1">{auctions.length}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Active</p>
                            <p className="text-2xl font-black text-primary mt-1">{auctions.filter(a => a.is_active).length}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Closed</p>
                            <p className="text-2xl font-black text-primary mt-1">{auctions.filter(a => !a.is_active).length}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-secondary uppercase tracking-widest">Winners</p>
                            <p className="text-2xl font-black text-primary mt-1">{auctions.filter(a => !!a.winner).length}</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" className="flex-1" onClick={handleRefresh}>Refresh</Button>
                        <Button variant="outline" type="button" className="flex-1" onClick={() => setIsLogsModalOpen(false)}>Close</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
