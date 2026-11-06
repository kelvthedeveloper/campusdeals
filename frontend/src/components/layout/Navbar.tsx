'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, User, ChevronDown } from 'lucide-react';
import Button from '../atoms/Button';
import { useCart } from '@/context/CartContext';

import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';
import { Category } from '@/types';

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout: handleLogout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { totalCount } = useCart();
    const [categories, setCategories] = useState<Category[]>([]);
    const [categorySlug, setCategorySlug] = useState('');
    const [currentHash, setCurrentHash] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const { data } = await api.get('/categories/');
                setCategories(Array.isArray(data) ? data : []);
            } catch {
                setCategories([]);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const update = () => setCurrentHash(window.location.hash || '');
        update();
        window.addEventListener('hashchange', update);
        return () => window.removeEventListener('hashchange', update);
    }, []);

    const isAdminPath = pathname?.startsWith('/admin');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            window.location.href = `/store?search=${encodeURIComponent(searchQuery.trim())}`;
            setSearchQuery('');
        }
    };

    const linkClass = (active: boolean) => {
        return `${
            active
                ? 'text-primary font-black'
                : 'text-secondary hover:text-primary font-medium'
        } transition relative`;
    };

    const underlineClass = (active: boolean) => {
        return active
            ? 'after:content-["" ] after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-action after:rounded-full'
            : '';
    };

    const isStore = !!pathname?.startsWith('/store');
    const isAuctions = !!pathname?.startsWith('/auctions');
    const isServices = !!pathname?.startsWith('/services');
    const isHowItWorks = pathname === '/' && currentHash === '#how-it-works';

    const allCategoryOptions = useMemo(() => {
        const flat: { slug: string; name: string }[] = [];
        for (const main of categories) {
            flat.push({ slug: main.slug, name: main.name });
            for (const sub of main.children || []) {
                flat.push({ slug: sub.slug, name: `${main.name} — ${sub.name}` });
            }
        }
        return flat;
    }, [categories]);

    if (isAdminPath) {
        return null;
    }

    return (
        <nav className="sticky top-0 z-50 bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Brand */}
                    <div className="flex-shrink-0">
                        <Link href="/" className="text-2xl font-bold text-primary tracking-tight">
                            <Image
                                src="/campusdeals-logo.png"
                                alt="CampusDeals"
                                width={260}
                                height={56}
                                className="h-10 w-auto"
                                priority
                            />
                        </Link>
                    </div>

                    {/* Links - Desktop */}
                    <div className="hidden md:flex items-center gap-6 px-6">
                        {user?.role !== 'ADMIN' && (
                            <>
                                <Link href="/store" className={`${linkClass(isStore)} ${underlineClass(isStore)}`}>Store</Link>
                                <Link href="/auctions" className={`flex items-center gap-1.5 ${linkClass(isAuctions)} ${underlineClass(isAuctions)}`}>
                                    Auctions
                                </Link>
                                <Link href="/services" className={`${linkClass(isServices)} ${underlineClass(isServices)}`}>Services</Link>
                                <Link href="/#how-it-works" className={`${linkClass(isHowItWorks)} ${underlineClass(isHowItWorks)}`}>How It Works</Link>
                            </>
                        )}
                        {user?.role === 'ADMIN' && (
                            <Link href="/admin" className="text-action font-bold hover:underline">Admin Panel</Link>
                        )}
                    </div>

                    {/* Search + Category - Desktop */}
                    <div className="hidden md:flex flex-1 items-center gap-3 max-w-xl px-4">
                        <form onSubmit={handleSearch} className="relative w-full">
                            <input
                                type="text"
                                placeholder="Search items, textbooks, laptops..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action transition"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </form>

                        {user?.role !== 'ADMIN' && (
                            <select
                                value={categorySlug}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setCategorySlug(next);
                                    if (next) {
                                        window.location.href = `/store?category=${encodeURIComponent(next)}`;
                                    }
                                }}
                                className="hidden lg:block bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-secondary focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action transition"
                            >
                                <option value="">All categories</option>
                                {allCategoryOptions.map((c) => (
                                    <option key={c.slug} value={c.slug}>{c.name}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <Link href="/cart" className="relative cursor-pointer hover:bg-slate-50 p-2 rounded-full transition">
                            <ShoppingCart className="h-5 w-5 text-primary" />
                            {totalCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-action text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full animate-in zoom-in duration-300">
                                    {totalCount}
                                </span>
                            )}
                        </Link>

                        {user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                    className="flex items-center gap-1 p-1 rounded-full hover:bg-slate-100 transition"
                                >
                                    <div className="h-8 w-8 rounded-full bg-action/10 overflow-hidden flex items-center justify-center">
                                        {user.profile_picture_url ? (
                                            <Image
                                                src={user.profile_picture_url}
                                                alt={user.username}
                                                width={32}
                                                height={32}
                                                className="object-cover h-full w-full"
                                                unoptimized
                                            />
                                        ) : (
                                            <User className="h-5 w-5 text-action" />
                                        )}
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                </button>

                                {profileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 z-50">
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <p className="text-sm font-bold text-primary">{user.username}</p>
                                            <p className="text-xs text-secondary">{user.email}</p>
                                        </div>
                                        <Link
                                            href="/dashboard"
                                            className="block px-4 py-2 text-sm text-secondary hover:bg-slate-50 hover:text-primary"
                                            onClick={() => setProfileMenuOpen(false)}
                                        >
                                            Dashboard
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setProfileMenuOpen(false);
                                                handleLogout();
                                            }}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link href="/auth/login" className="hidden sm:block">
                                    <Button variant="ghost" size="sm">Login</Button>
                                </Link>
                                <Link href="/auth/register" className="hidden sm:block">
                                    <Button size="sm">Register</Button>
                                </Link>
                            </>
                        )}

                        <button
                            className="md:hidden p-2 rounded-lg hover:bg-slate-50 transition"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6 text-primary" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4 shadow-xl animate-in slide-in-from-top duration-300">
                    {user?.role !== 'ADMIN' ? (
                        <>
                            <Link href="/store" className="block text-secondary font-bold hover:text-action px-2" onClick={() => setMobileMenuOpen(false)}>Store</Link>
                            <Link href="/auctions" className="block text-secondary font-bold hover:text-action px-2" onClick={() => setMobileMenuOpen(false)}>Auctions</Link>
                            <Link href="/services" className="block text-secondary font-bold hover:text-action px-2" onClick={() => setMobileMenuOpen(false)}>Services</Link>
                            <Link href="/#how-it-works" className="block text-secondary font-bold hover:text-action px-2" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
                        </>
                    ) : (
                        <Link href="/admin" className="block text-action font-bold px-2" onClick={() => setMobileMenuOpen(false)}>Admin Panel</Link>
                    )}
                    <div className="px-2 pt-2">
                        <form onSubmit={(e) => {
                            handleSearch(e);
                            setMobileMenuOpen(false);
                        }} className="relative">
                            <input
                                type="text"
                                placeholder="Search deals..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action transition"
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        </form>
                    </div>
                    <hr className="border-slate-50" />
                    {user ? (
                        <>
                            <Link href="/dashboard" className="block text-secondary font-bold hover:text-action px-2" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                            <button onClick={handleLogout} className="block w-full text-left text-red-500 font-bold px-2">Logout</button>
                        </>
                    ) : (
                        <>
                            <Link href="/auth/login" className="block text-secondary font-bold hover:text-action px-2" onClick={() => setMobileMenuOpen(false)}>Login</Link>
                            <Link href="/auth/register" className="block text-action font-bold hover:text-blue-700 px-2" onClick={() => setMobileMenuOpen(false)}>Register</Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    );
}
