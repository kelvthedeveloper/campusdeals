'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/molecules/Card';
import Button from '@/components/atoms/Button';
import Modal from '@/components/atoms/Modal';
import {
    Calendar,
    Search,
    User,
    Clock,
    Settings,
    MoreVertical,
    CheckCircle2,
    XCircle,
    Loader2,
    Shield,
    Users,
    ClipboardList,
    AlertCircle,
    ArrowUpRight
} from 'lucide-react';
import api from '@/utils/api';
import { Booking, User as UserType } from '@/types';
import { showError } from '@/utils/alert';

export default function AdminServicesPage() {
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [staff, setStaff] = useState<UserType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchData = async () => {
        try {
            const [bookingsRes, staffRes] = await Promise.all([
                api.get('/services/bookings/'),
                api.get('/auth/users/', { params: { role: 'STAFF' } })
            ]);
            setBookings(bookingsRes.data);
            setStaff(staffRes.data);
        } catch (error) {
            console.error('Error fetching admin service data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateBooking = async (payload: Partial<Booking>) => {
        if (!selectedBooking) return;
        setIsSaving(true);
        try {
            await api.patch(`/services/bookings/${selectedBooking.id}/`, payload);
            fetchData();
            setIsAssignModalOpen(false);
            setIsStatusModalOpen(false);
            setSelectedBooking(null);
        } catch (error) {
            console.error('Error updating booking:', error);
            showError('Update Failed', 'Failed to update booking.');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredBookings = bookings.filter(b =>
        b.service_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.user_username?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'CONFIRMED': return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'CANCELLED': return 'bg-rose-50 text-rose-700 border-rose-100';
            default: return 'bg-slate-50 text-slate-700 border-slate-100';
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
                    <h1 className="text-2xl font-black text-primary tracking-tight">Service Management</h1>
                    <p className="text-xs font-bold text-secondary uppercase tracking-widest mt-1">Manage bookings, assign staff, and track progress</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Service Analytics</Button>
                    <Button onClick={() => router.push('/admin/services/catalog')}>Manage Catalog</Button>
                </div>
            </div>

            <Card className="overflow-hidden border-slate-200">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Find booking by service or user..."
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
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Booking Info</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Schedule</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Assigned Staff</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest">Status</th>
                                <th className="px-6 py-4 text-[10px] font-black text-secondary uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredBookings.map((b) => (
                                <tr key={b.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                                                <ClipboardList className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-primary">{b.service_name}</p>
                                                <p className="text-[10px] text-secondary font-medium">B-ID: cd-{b.id.toString().padStart(4, '0')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <User className="h-3 w-3 text-slate-400" />
                                            <span className="text-sm font-bold text-primary">{b.user_username || 'Guest'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-0.5">
                                            <div className="flex items-center gap-1 text-xs font-bold text-primary">
                                                <Calendar className="h-3 w-3" />
                                                {b.date}
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-secondary">
                                                <Clock className="h-3 w-3" />
                                                {b.time}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(b as any).staff_name ? (
                                            <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-wider border border-blue-100">
                                                <Shield className="h-3 w-3" />
                                                {(b as any).staff_name}
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setSelectedBooking(b);
                                                    setIsAssignModalOpen(true);
                                                }}
                                                className="text-[10px] font-black text-action uppercase tracking-widest hover:underline"
                                            >
                                                + Assign Staff
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 border rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusColor(b.status)}`}>
                                            {b.status === 'COMPLETED' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                            {b.status}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedBooking(b);
                                                    setIsStatusModalOpen(true);
                                                }}
                                                className="p-2 text-slate-400 hover:text-action transition-all hover:bg-white rounded-lg shadow-sm"
                                            >
                                                <Settings className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredBookings.length === 0 && (
                    <div className="py-20 text-center">
                        <ClipboardList className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-primary">No bookings found</h3>
                        <p className="text-sm text-secondary">No one has scheduled services yet.</p>
                    </div>
                )}
            </Card>

            {/* Assign Staff Modal */}
            <Modal
                isOpen={isAssignModalOpen}
                onClose={() => setIsAssignModalOpen(false)}
                title="Assign Staff Member"
                size="sm"
            >
                <div className="space-y-6">
                    <div className="space-y-1.5 text-center">
                        <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-500 mb-4">
                            <Users className="h-8 w-8" />
                        </div>
                        <h4 className="text-lg font-black text-primary">Who is handling this?</h4>
                        <p className="text-sm text-secondary px-4 leading-relaxed">
                            Assigning a staff member will notify them of the scheduled <span className="font-bold text-primary">{selectedBooking?.service_name}</span>.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-secondary uppercase tracking-widest px-1">Available Staff Members</label>
                        <div className="grid grid-cols-1 gap-2">
                            {staff.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => handleUpdateBooking({ staff: s.id as any })}
                                    disabled={isSaving}
                                    className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:border-action hover:shadow-lg transition-all text-left"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-primary">{s.username}</p>
                                            <p className="text-[10px] text-secondary">{s.email}</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-slate-300" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => setIsAssignModalOpen(false)}
                        className="w-full py-3 bg-slate-50 text-secondary rounded-xl font-bold text-sm hover:bg-slate-100 transition"
                    >
                        Cancel
                    </button>
                </div>
            </Modal>

            {/* Status Update Modal */}
            <Modal
                isOpen={isStatusModalOpen}
                onClose={() => setIsStatusModalOpen(false)}
                title="Update Booking Status"
                size="sm"
            >
                <div className="space-y-6">
                    <div className="space-y-1.5 text-center">
                        <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-4">
                            <Settings className="h-8 w-8" />
                        </div>
                        <h4 className="text-lg font-black text-primary">Change Status</h4>
                        <p className="text-sm text-secondary px-4 leading-relaxed">
                            Update the current progress of the <span className="font-bold text-primary">{selectedBooking?.service_name}</span> booking.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => handleUpdateBooking({ status })}
                                disabled={isSaving || selectedBooking?.status === status}
                                className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${selectedBooking?.status === status
                                    ? 'bg-primary border-primary text-white shadow-lg'
                                    : 'bg-white border-slate-100 text-slate-600 hover:border-action hover:bg-slate-50'
                                    }`}
                            >
                                <span className="text-xs font-black uppercase tracking-widest">{status}</span>
                                {selectedBooking?.status === status && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                        ))}
                    </div>

                    <button
                        onClick={() => setIsStatusModalOpen(false)}
                        className="w-full py-3 bg-slate-50 text-secondary rounded-xl font-bold text-sm hover:bg-slate-100 transition"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
}
