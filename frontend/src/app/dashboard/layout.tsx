"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            const redirect = typeof window !== 'undefined' ? window.location.pathname : '/dashboard';
            router.replace(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
            return;
        }
        if (!loading && user?.role === 'ADMIN') {
            router.replace('/admin');
        }
    }, [loading, user, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="h-10 w-10 border-4 border-action border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    if (user?.role === 'ADMIN') {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-slate-50">
            <aside className="hidden lg:block">
                <Sidebar />
            </aside>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <aside
                className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
                    <div className="text-sm font-black text-primary">Dashboard</div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="p-2 rounded-lg hover:bg-slate-50 transition"
                        aria-label="Close menu"
                    >
                        <X className="h-5 w-5 text-primary" />
                    </button>
                </div>
                <Sidebar />
            </aside>

            <div className="flex-1 flex flex-col min-h-screen">
                <header className="lg:hidden h-14 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center px-4">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-slate-50 transition"
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5 text-primary" />
                    </button>
                    <div className="ml-2 text-sm font-black text-primary">Dashboard</div>
                </header>

                <main className="flex-1 p-4 sm:p-6 lg:p-12 overflow-y-auto">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
