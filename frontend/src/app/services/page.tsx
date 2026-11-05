'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import ServiceCard from '@/components/molecules/ServiceCard';
import { Calendar, Sparkles } from 'lucide-react';
import { Service } from '@/types';

export default function ServicesPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.role === 'ADMIN') {
            router.replace('/admin');
        }
    }, [user, router]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const { data } = await api.get('/services/');
                setServices(data);
            } catch (error) {
                console.error('Error fetching services:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

    return (
        <div className="bg-white min-h-screen py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-action rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                        <Sparkles className="h-3 w-3" />
                        Campus Professional
                    </div>
                    <h1 className="text-4xl font-extrabold text-primary tracking-tight mb-4">Campus Services</h1>
                    <p className="text-secondary text-lg leading-relaxed">
                        Book reliable student and professional services directly on campus.
                        Verified providers, transparent pricing, and secure booking.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-slate-50 rounded-2xl h-[250px] animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <>
                        {services.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {services.map((service) => (
                                    <ServiceCard
                                        key={service.id}
                                        id={service.id}
                                        name={service.name}
                                        description={service.description}
                                        image={service.image}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-primary">No services available</h3>
                                <p className="text-secondary text-sm">Check back soon for new campus professionals.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
