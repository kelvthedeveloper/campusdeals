'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import Card from '@/components/molecules/Card';
import DataTable from '@/components/molecules/DataTable';
import { Calendar, CheckCircle2, Clock4, XCircle, AlertCircle } from 'lucide-react';
import { Booking } from '@/types';

export default function DashboardBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const { data } = await api.get('/services/bookings/');
                setBookings(data);
            } catch (error) {
                console.error('Error fetching bookings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, []);

    const cancelBooking = async (id: number) => {
        setCancellingId(id);
        try {
            await api.delete(`/services/bookings/${id}/`);
            setBookings((prev) => prev.filter((b) => b.id !== id));
        } catch (error) {
            console.error('Error cancelling booking:', error);
            alert('Failed to cancel booking. Please try again.');
        } finally {
            setCancellingId(null);
        }
    };

    const statusBadge = (status: string) => {
        const s = String(status || '').toUpperCase();
        const base = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold';
        if (s === 'CONFIRMED' || s === 'COMPLETED') {
            return (
                <span className={`${base} text-emerald-600 bg-emerald-50`}>
                    <CheckCircle2 className="h-3 w-3" />
                    {s}
                </span>
            );
        }
        if (s === 'PENDING') {
            return (
                <span className={`${base} text-amber-600 bg-amber-50`}>
                    <Clock4 className="h-3 w-3" />
                    {s}
                </span>
            );
        }
        if (s === 'CANCELLED') {
            return (
                <span className={`${base} text-red-600 bg-red-50`}>
                    <XCircle className="h-3 w-3" />
                    {s}
                </span>
            );
        }
        return (
            <span className={`${base} text-slate-600 bg-slate-50`}>
                <AlertCircle className="h-3 w-3" />
                {s || 'UNKNOWN'}
            </span>
        );
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-primary tracking-tight">My Bookings</h1>
                <p className="text-secondary mt-1">Manage your professional campus service appointments.</p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <Card className="p-6">
                        <DataTable<Booking>
                            columns={[
                                {
                                    header: 'Service',
                                    key: 'service_name',
                                    render: (booking) => (
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 bg-blue-50 text-action rounded-lg flex items-center justify-center">
                                                <Calendar className="h-4 w-4" />
                                            </div>
                                            <span className="font-bold">{booking.service_name}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Date & Time',
                                    key: 'date',
                                    render: (booking) => (
                                        <div className="flex items-center gap-2">
                                            <Clock4 className="h-4 w-4 text-slate-400" />
                                            <span>{booking.date} at {booking.time}</span>
                                        </div>
                                    )
                                },
                                {
                                    header: 'Status',
                                    key: 'status',
                                    render: (booking) => statusBadge(booking.status)
                                },
                                {
                                    header: 'Actions',
                                    key: 'actions',
                                    render: (booking) => (
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => cancelBooking(booking.id)}
                                                disabled={cancellingId === booking.id || String(booking.status || '').toUpperCase() === 'CANCELLED'}
                                                className="text-xs font-bold text-secondary hover:text-primary transition disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {cancellingId === booking.id ? 'Cancelling...' : 'Cancel'}
                                            </button>
                                            <a
                                                href={`mailto:support@campusdeals.local?subject=${encodeURIComponent(`Service booking #${booking.id}`)}`}
                                                className="text-xs font-bold text-action hover:underline"
                                            >
                                                Contact
                                            </a>
                                        </div>
                                    )
                                }
                            ]}
                            data={bookings}
                            emptyMessage="No bookings found."
                        />
                    </Card>
                </div>
            )}
        </div>
    );
}
