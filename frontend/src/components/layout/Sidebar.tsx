'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    ShoppingBag,
    Gavel,
    Calendar,
    User,
    Heart,
    LogOut,
    ShieldAlert,
    Package,
    Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function Sidebar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();

    const customerItems = [
        { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Orders', href: '/dashboard/orders', icon: ShoppingBag },
        { name: 'My Auctions', href: '/dashboard/auctions', icon: Gavel },
        { name: 'My Bookings', href: '/dashboard/bookings', icon: Calendar },
        { name: 'Favorites', href: '/dashboard/favorites', icon: Heart },
        { name: 'Profile', href: '/dashboard/profile', icon: User },
    ];

    const staffItems = [
        { name: 'Staff Overview', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Moderate Store', href: '/admin/products', icon: Package },
        { name: 'Moderate Auctions', href: '/admin/auctions', icon: Gavel },
        { name: 'Moderate Services', href: '/admin/services', icon: Calendar },
    ];

    const adminItems = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        ...staffItems.slice(1),
        { name: 'User Management', href: '/admin/users', icon: Users },
        { name: 'System Settings', href: '/admin/settings', icon: ShieldAlert },
    ];

    const getNavItems = () => {
        if (user?.role === 'ADMIN') return adminItems;
        if (user?.role === 'STAFF') return staffItems;
        return customerItems;
    };

    const navItems = getNavItems();

    const handleLogout = () => {
        logout();
    };

    return (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col lg:h-screen lg:sticky lg:top-0 max-h-screen">
            <div className="p-6 border-b border-slate-50">
                <h2 className="text-xl font-black text-primary tracking-tight">Dashboard</h2>
            </div>

            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all',
                                isActive
                                    ? 'bg-blue-50 text-action'
                                    : 'text-secondary hover:bg-slate-50 hover:text-primary'
                            )}
                        >
                            <item.icon className={cn('h-5 w-5', isActive ? 'text-action' : 'text-slate-400')} />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-100">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-all"
                >
                    <LogOut className="h-5 w-5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
