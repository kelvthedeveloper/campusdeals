'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/utils/api';
import Button from '@/components/atoms/Button';
import Card from '@/components/molecules/Card';
import Input from '@/components/atoms/Input';
import { Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Service } from '@/types';

export default function ServiceBookingPage() {
    const { id } = useParams();
    const router = useRouter();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        date: '',
        time: '',
        notes: ''
    });
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            router.push(`/auth/login?redirect=/services/${id}`);
            return;
        }

        const fetchService = async () => {
            try {
                const { data } = await api.get('/services/');
                const found = data.find((s: Service) => s.id === parseInt(id as string));
                setService(found);
            } catch (error) {
                console.error('Error fetching service:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchService();
    }, [id, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/services/bookings/', {
                service: parseInt(id as string),
                ...formData
            });
            setSuccess(true);
        } catch (error) {
            console.error('Booking failed:', error);
            alert('Failed to book service. Ensure you are logged in.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-10 sm:p-20 text-center text-secondary">Loading service details...</div>;
    if (!service) return <div className="p-10 sm:p-20 text-center text-primary font-bold">Service not found.</div>;

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="max-w-md w-full p-6 sm:p-8 text-center border-emerald-100 bg-emerald-50/10">
                    <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
                    <h2 className="text-2xl font-extrabold text-primary mb-2">Booking Confirmed!</h2>
                    <p className="text-secondary mb-8">
                        Your request for <span className="font-bold text-primary">{service.name}</span> has been sent to the provider.
                    </p>
                    <Button className="w-full" onClick={() => router.push('/dashboard')}>
                        Go to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen py-10 sm:py-12 lg:py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    {/* Service Info */}
                    <div className="lg:col-span-2">
                        <h1 className="text-3xl font-extrabold text-primary mb-4">{service.name}</h1>
                        <p className="text-secondary leading-relaxed mb-8">
                            {service.description}
                        </p>
                    </div>

                    {/* Booking Form */}
                    <Card className="lg:col-span-3 p-5 sm:p-8 shadow-xl border-white">
                        <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-action" />
                            Schedule your service
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Input
                                    label="Date"
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                                <Input
                                    label="Preferred Time"
                                    type="time"
                                    required
                                    value={formData.time}
                                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-semibold text-primary flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Additional Notes
                                </label>
                                <textarea
                                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action transition min-h-[120px]"
                                    placeholder="Tell the provider about your specific needs..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>

                            <Button type="submit" className="w-full py-4" loading={submitting}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Confirm Booking
                            </Button>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
