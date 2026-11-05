 'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Button from '@/components/atoms/Button';
import api from '@/utils/api';
import { Auction, Product, Service } from '@/types';
import { 
    ArrowRight, 
    Gavel, 
    ShieldCheck, 
    Sparkles, 
    Store, 
    Truck, 
    Users,
    Monitor,
    Wrench,
    Wifi,
    Headphones,
    Laptop,
    Printer,
    BookOpen,
    Shirt,
    Palette,
    HelpCircle,
    Settings,
    Network,
    Cpu,
    Smartphone
} from 'lucide-react';
import { formatMoneyGHS } from '@/utils/money';

function formatTimeLeft(endTime: string) {
    const end = new Date(endTime).getTime();
    const now = Date.now();
    const diff = Math.max(0, end - now);
    const totalSeconds = Math.floor(diff / 1000);
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
}

function ratingFor(id: string | number) {
    const n = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10) || 1;
    const r = 4.1 + ((n * 13) % 9) / 10;
    return Math.min(4.9, Math.round(r * 10) / 10);
}

// Map service names to appropriate icons
function getServiceIcon(name: string) {
    const lower = name.toLowerCase();
    if (lower.includes('computer') || lower.includes('laptop') || lower.includes('repair')) return Wrench;
    if (lower.includes('setup') || lower.includes('configuration')) return Settings;
    if (lower.includes('network') || lower.includes('wifi') || lower.includes('router')) return Wifi;
    if (lower.includes('support') || lower.includes('consulting') || lower.includes('it')) return Headphones;
    if (lower.includes('hardware') || lower.includes('installation')) return Cpu;
    if (lower.includes('printer') || lower.includes('scanner')) return Printer;
    if (lower.includes('tutoring') || lower.includes('assignment') || lower.includes('help')) return BookOpen;
    if (lower.includes('design') || lower.includes('graphic')) return Palette;
    if (lower.includes('laundry') || lower.includes('cleaning')) return Shirt;
    if (lower.includes('phone') || lower.includes('mobile')) return Smartphone;
    if (lower.includes('monitor') || lower.includes('screen')) return Monitor;
    if (lower.includes('server') || lower.includes('cloud')) return Network;
    return Sparkles;
}

export default function Home() {
    const [products, setProducts] = useState<Product[]>([]);
    const [auctions, setAuctions] = useState<Auction[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setTick] = useState(0);
    const [promoIndex, setPromoIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => setTick((t) => t + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const promoTimer = setInterval(() => setPromoIndex((i) => i + 1), 4500);
        return () => clearInterval(promoTimer);
    }, []);

    useEffect(() => {
        const fetchHome = async () => {
            setLoading(true);
            try {
                const [prodRes, auctionRes, svcRes] = await Promise.all([
                    api.get('/store/products/'),
                    api.get('/auctions/'),
                    api.get('/services/'),
                ]);
                // Handle paginated responses (DRF returns {count, next, previous, results})
                const prodData = Array.isArray(prodRes.data) ? prodRes.data : prodRes.data?.results || [];
                const auctionData = Array.isArray(auctionRes.data) ? auctionRes.data : auctionRes.data?.results || [];
                const svcData = Array.isArray(svcRes.data) ? svcRes.data : svcRes.data?.results || [];
                setProducts(prodData);
                setAuctions(auctionData);
                setServices(svcData);
            } catch {
                setProducts([]);
                setAuctions([]);
                setServices([]);
            } finally {
                setLoading(false);
            }
        };
        fetchHome();
    }, []);

    const trending = useMemo(() => {
        const list = (products || []).slice(0, 6);
        if (list.length > 0) return list;
        return [
            { id: 101, name: 'HP EliteBook 840 (Clean)', slug: 'hp-elitebook-840', description: '', base_price: '45000', stock: 3, image: null, category: null, variants: [] },
            { id: 102, name: 'Calculus Textbook (Like New)', slug: 'calculus-textbook', description: '', base_price: '6500', stock: 8, image: null, category: null, variants: [] },
            { id: 103, name: 'AirPods Pro (Used)', slug: 'airpods-pro-used', description: '', base_price: '28000', stock: 2, image: null, category: null, variants: [] },
            { id: 104, name: 'Scientific Calculator', slug: 'scientific-calculator', description: '', base_price: '3500', stock: 12, image: null, category: null, variants: [] },
            { id: 105, name: 'Android Phone (Student Price)', slug: 'android-phone', description: '', base_price: '38000', stock: 5, image: null, category: null, variants: [] },
            { id: 106, name: 'Desk Lamp + Extension', slug: 'desk-lamp-extension', description: '', base_price: '4200', stock: 9, image: null, category: null, variants: [] },
        ] as Product[];
    }, [products]);

    const auctionPreview = useMemo(() => {
        const list = (auctions || [])
            .filter((a) => a.is_active)
            .slice()
            .sort((a, b) => new Date(a.end_time).getTime() - new Date(b.end_time).getTime())
            .slice(0, 3);
        if (list.length > 0) return list;
        return [
            { id: 201, title: 'Vintage iPod Classic', current_price: '12500', end_time: new Date(Date.now() + 45 * 60 * 1000).toISOString(), image: null, owner: 'Admin', is_active: true, winner: null, bids: [{ id: 1, bidder_id: 1, bidder_username: 'john', amount: '12000', created_at: new Date().toISOString() }] },
            { id: 202, title: 'Old-School DSLR Camera', current_price: '55000', end_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), image: null, owner: 'Admin', is_active: true, winner: null, bids: [{ id: 1, bidder_id: 2, bidder_username: 'mary', amount: '52000', created_at: new Date().toISOString() }, { id: 2, bidder_id: 3, bidder_username: 'tobi', amount: '55000', created_at: new Date().toISOString() }] },
            { id: 203, title: 'Gaming Keyboard (Retro)', current_price: '9000', end_time: new Date(Date.now() + 18 * 60 * 1000).toISOString(), image: null, owner: 'Admin', is_active: true, winner: null, bids: [] },
        ] as Auction[];
    }, [auctions]);

    const servicePreview = useMemo(() => {
        const list = (services || []).filter((s) => s.is_active).slice(0, 5);
        if (list.length > 0) return list;
        return [
            { id: 301, name: 'Tutoring', description: 'One-on-one help for tough courses and test prep.', is_active: true, image: null },
            { id: 302, name: 'Laptop Repair', description: 'Quick fixes for battery, keyboard, and software issues.', is_active: true, image: null },
            { id: 303, name: 'Laundry Service', description: 'Pick-up and drop-off laundry around campus.', is_active: true, image: null },
            { id: 304, name: 'Graphic Design', description: 'Logos, flyers, and class presentations.', is_active: true, image: null },
            { id: 305, name: 'Assignment Help', description: 'Guidance and proofreading before deadlines.', is_active: true, image: null },
        ] as Service[];
    }, [services]);

    const promos = useMemo(() => {
        const month = new Date().getMonth();
        const seasonal =
            month === 0
                ? { title: 'New Semester Savings', subtitle: 'Kick off the term with student-friendly prices.', href: '/store?tag=new' }
                : month === 1
                    ? { title: 'Valentine Week Deals', subtitle: 'Gifts, tech & accessories under budget.', href: '/store' }
                    : month >= 7 && month <= 9
                        ? { title: 'Back-to-Campus Picks', subtitle: 'Laptops, textbooks, and essentials in stock.', href: '/store' }
                        : { title: 'Campus Promo', subtitle: 'Fresh drops and limited-time discounts.', href: '/store' };

        return [
            seasonal,
            { title: 'Free delivery (selected areas)', subtitle: 'Fast campus dispatch on qualifying orders.', href: '/store' },
            { title: 'Live auctions ending soon', subtitle: 'Bid now before the timer hits zero.', href: '/auctions' },
        ];
    }, []);

    const activePromo = promos.length ? promos[promoIndex % promos.length] : null;

    const liveLoopProducts = useMemo(() => {
        const base = (products || []).slice(0, 12);
        const list = base.length ? base : trending;
        return list;
    }, [products, trending]);

    const loopedLiveProducts = useMemo(() => {
        const list = liveLoopProducts || [];
        return list.length ? [...list, ...list] : [];
    }, [liveLoopProducts]);

    return (
        <div className="flex flex-col w-full bg-slate-50">
            <style jsx global>{`
                @keyframes cd-marquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-50%);
                    }
                }
                .cd-marquee-track {
                    animation: cd-marquee 28s linear infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .cd-marquee-track {
                        animation: none;
                    }
                }
            `}</style>

            {activePromo && (
                <section className="bg-gradient-to-r from-primary via-[#1E3A4C] to-action text-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center">
                                    <Sparkles className="h-4 w-4" />
                                </div>
                                <div>
                                    <div className="text-xs font-black uppercase tracking-widest opacity-90">{activePromo.title}</div>
                                    <div className="text-[11px] text-white/80 font-medium">{activePromo.subtitle}</div>
                                </div>
                            </div>
                            <Link href={activePromo.href} className="text-xs font-black uppercase tracking-widest inline-flex items-center gap-2 hover:underline">
                                View promo
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            <section className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-action/10 blur-2xl" />
                <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-2xl" />

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-action rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                                <Sparkles className="h-3 w-3" />
                                Verified campus store
                            </div>
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-primary tracking-tight leading-[1.08]">
                                Shop Deals &amp; Bid Live Within Your Campus Community.
                            </h1>
                            <p className="text-lg text-secondary mt-5 leading-relaxed max-w-xl">
                                Shop affordable tech, textbooks, and student services. Safe, verified, and built for campus life.
                            </p>

                            <div className="mt-8 flex flex-wrap items-center gap-3">
                                <Link href="/store">
                                    <Button size="lg" className="gap-2">
                                        Browse Store
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/auctions">
                                    <Button variant="outline" size="lg">View Live Auctions</Button>
                                </Link>
                            </div>

                            <div className="mt-6 flex flex-wrap gap-3 text-sm">
                                <div className="inline-flex items-center gap-2 bg-white/70 border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                                    <Users className="h-4 w-4 text-action" />
                                    <span className="font-black text-primary">1,240+</span>
                                    <span className="text-secondary">Active Students</span>
                                </div>
                                <div className="inline-flex items-center gap-2 bg-white/70 border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                                    <Store className="h-4 w-4 text-emerald-600" />
                                    <span className="font-black text-primary">3,500+</span>
                                    <span className="text-secondary">Products Listed</span>
                                </div>
                                <div className="inline-flex items-center gap-2 bg-white/70 border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    <span className="font-black text-primary">Secure</span>
                                    <span className="text-secondary">Campus Shopping</span>
                                </div>
                            </div>
                        </div>

                        {/* Right side - Hero Visual */}
                        <div className="relative hidden lg:block">
                            <div className="relative">
                                {/* Main floating card - Featured Product from DB */}
                                {products.length > 0 ? (
                                    <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                                        <div className="flex items-start gap-4">
                                            <div className="relative h-24 w-24 rounded-2xl bg-slate-50 shrink-0 overflow-hidden">
                                                <Image
                                                    src={products[0].image || '/placeholder-product.svg'}
                                                    alt={products[0].name}
                                                    fill
                                                    className="object-cover"
                                                    unoptimized={!!products[0].image}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-2">
                                                    <Sparkles className="h-3 w-3" />
                                                    Trending Now
                                                </div>
                                                <h3 className="text-sm font-black text-primary leading-tight line-clamp-2">{products[0].name}</h3>
                                                <p className="text-xs text-secondary mt-1 line-clamp-1">{products[0].category?.name || 'CampusDeals Store'}</p>
                                                <div className="mt-3 flex items-center gap-3">
                                                    <span className="text-lg font-black text-action">{formatMoneyGHS(products[0].base_price)}</span>
                                                    {products[0].stock > 0 ? (
                                                        <span className="text-xs text-emerald-600 font-bold">In Stock</span>
                                                    ) : (
                                                        <span className="text-xs text-red-500 font-bold">Out of Stock</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="absolute -bottom-3 left-6 right-6 bg-gradient-to-r from-action to-blue-600 text-white text-center text-xs font-bold py-2 rounded-xl shadow-lg">
                                            🔥 Featured Product
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 p-6 transform rotate-[-2deg]">
                                        <div className="flex items-center justify-center h-32">
                                            <div className="text-sm text-secondary">Loading featured product...</div>
                                        </div>
                                    </div>
                                )}

                                {/* Secondary floating card */}
                                <div className="absolute -bottom-8 -right-4 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 transform rotate-[6deg] hover:rotate-0 transition-transform duration-500 w-48">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                            <Gavel className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <div className="text-xs font-black text-primary">Live Auction</div>
                                            <div className="text-[10px] text-secondary">Ends in 2h 15m</div>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-xs font-bold text-action">Current bid: ¢1,250</div>
                                </div>

                                {/* Decorative elements */}
                                <div className="absolute -top-6 -left-6 h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center">
                                    <div className="h-10 w-10 bg-action/20 rounded-full flex items-center justify-center">
                                        <Sparkles className="h-5 w-5 text-action" />
                                    </div>
                                </div>
                                <div className="absolute top-1/2 -right-8 h-12 w-12 bg-emerald-50 rounded-full flex items-center justify-center">
                                    <ShieldCheck className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-gradient-to-b from-blue-50/40 via-white to-white border-b border-blue-200/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6">
                        <div>
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">Live listings</h2>
                            <p className="text-secondary mt-2">A real-time loop of what’s currently in the store.</p>
                        </div>
                        <Link href="/store" className="text-sm font-black text-action hover:underline">Browse store</Link>
                    </div>

                    <div className="relative overflow-hidden rounded-3xl border border-blue-200/40 bg-white">
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white to-transparent pointer-events-none z-10" />
                        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none z-10" />

                        <div className="cd-marquee-track flex w-[200%]">
                            <div className="flex w-1/2 gap-3 p-4">
                                {loopedLiveProducts.slice(0, Math.ceil(loopedLiveProducts.length / 2)).map((p) => (
                                    <Link
                                        key={`live-a-${p.id}`}
                                        href={p.slug ? `/store/${p.slug}` : '/store'}
                                        className="group flex items-center gap-3 min-w-[300px] rounded-2xl border border-slate-200 bg-white hover:shadow-md transition overflow-hidden"
                                    >
                                        <div className="relative h-16 w-16 bg-slate-50 shrink-0">
                                            <Image
                                                src={p.image || '/placeholder-product.svg'}
                                                alt={p.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized={!!p.image}
                                            />
                                        </div>
                                        <div className="py-3 pr-3 flex-1 min-w-0">
                                            <div className="text-xs font-black text-primary line-clamp-1">{p.name}</div>
                                            <div className="mt-1 flex items-center justify-between">
                                                <div className="text-xs font-bold text-action">{formatMoneyGHS(p.base_price)}</div>
                                                <div className="text-[11px] text-secondary">⭐ {ratingFor(p.id)}</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <div className="flex w-1/2 gap-3 p-4">
                                {loopedLiveProducts.slice(Math.ceil(loopedLiveProducts.length / 2)).map((p) => (
                                    <Link
                                        key={`live-b-${p.id}`}
                                        href={p.slug ? `/store/${p.slug}` : '/store'}
                                        className="group flex items-center gap-3 min-w-[300px] rounded-2xl border border-slate-200 bg-white hover:shadow-md transition overflow-hidden"
                                    >
                                        <div className="relative h-16 w-16 bg-slate-50 shrink-0">
                                            <Image
                                                src={p.image || '/placeholder-product.svg'}
                                                alt={p.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-500"
                                                unoptimized={!!p.image}
                                            />
                                        </div>
                                        <div className="py-3 pr-3 flex-1 min-w-0">
                                            <div className="text-xs font-black text-primary line-clamp-1">{p.name}</div>
                                            <div className="mt-1 flex items-center justify-between">
                                                <div className="text-xs font-bold text-action">{formatMoneyGHS(p.base_price)}</div>
                                                <div className="text-[11px] text-secondary">⭐ {ratingFor(p.id)}</div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-gradient-to-b from-emerald-50/35 via-slate-50 to-slate-50 border-y border-emerald-200/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-primary">5,000+</div>
                            <div className="text-xs font-bold text-secondary uppercase tracking-wider mt-1">Students</div>
                        </div>
                        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-primary">8,200+</div>
                            <div className="text-xs font-bold text-secondary uppercase tracking-wider mt-1">Transactions</div>
                        </div>
                        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-primary">120+</div>
                            <div className="text-xs font-bold text-secondary uppercase tracking-wider mt-1">Services</div>
                        </div>
                        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 text-center">
                            <div className="text-2xl font-black text-primary">99%</div>
                            <div className="text-xs font-bold text-secondary uppercase tracking-wider mt-1">Positive Reviews</div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="trending" className="py-16 bg-gradient-to-b from-indigo-50/35 via-white to-white border-b border-indigo-200/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-primary tracking-tight">Trending on Campus</h2>
                            <p className="text-secondary mt-2">Real listings students are viewing right now.</p>
                        </div>
                        <Link href="/store" className="text-sm font-black text-action hover:underline">View all</Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trending.slice(0, 6).map((p) => (
                            <div key={p.id} className="rounded-3xl border border-indigo-200/30 bg-white hover:shadow-md transition overflow-hidden">
                                <div className="relative aspect-[16/10] bg-slate-50">
                                    <Image
                                        src={p.image || '/placeholder-product.svg'}
                                        alt={p.name}
                                        fill
                                        className="object-cover"
                                        unoptimized={!!p.image}
                                    />
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="text-sm font-black text-primary line-clamp-2">{p.name}</div>
                                            <div className="text-xs text-secondary mt-1">CampusDeals Store</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-black text-action">{formatMoneyGHS(p.base_price)}</div>
                                            <div className="text-xs text-secondary mt-1">⭐ {ratingFor(p.id)}</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between">
                                        <div className="text-xs font-bold text-secondary">
                                            {p.stock === 0 ? 'Out of stock' : p.stock <= 5 ? 'Low stock' : 'In stock'}
                                        </div>
                                        <Link href={p.slug ? `/store/${p.slug}` : '/store'}>
                                            <Button size="sm" className="gap-2">
                                                View Item
                                                <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="auctions" className="py-16 bg-gradient-to-b from-amber-50/45 via-slate-50 to-slate-50 border-b border-amber-200/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-primary tracking-tight">Live Auctions Ending Soon</h2>
                            <p className="text-secondary mt-2">Bid early. Win fast. Campus-only listings.</p>
                        </div>
                        <Link href="/auctions" className="text-sm font-black text-action hover:underline">See live auctions</Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {auctionPreview.map((a) => {
                            const bidderCount = new Set((a.bids || []).map((b) => b.bidder_id)).size;
                            return (
                                <div key={a.id} className="rounded-3xl border border-amber-200/30 bg-white hover:shadow-md transition overflow-hidden">
                                    <div className="relative aspect-[16/10] bg-slate-100">
                                        <Image
                                            src={a.image || '/placeholder-auction.svg'}
                                            alt={a.title}
                                            fill
                                            className="object-cover"
                                            unoptimized={!!a.image}
                                        />
                                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[11px] font-black px-3 py-1 rounded-full border border-amber-200 text-amber-700">
                                            Ends in {formatTimeLeft(a.end_time)}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="text-sm font-black text-primary line-clamp-2">{a.title}</div>
                                            <Gavel className="h-5 w-5 text-action" />
                                        </div>
                                        <div className="mt-3 grid grid-cols-3 gap-3">
                                            <div className="bg-white/70 border border-amber-200/25 rounded-2xl p-3">
                                                <div className="text-[11px] font-bold text-secondary uppercase tracking-wider">Current</div>
                                                <div className="text-sm font-black text-primary">{formatMoneyGHS(a.current_price)}</div>
                                            </div>
                                            <div className="bg-white/70 border border-amber-200/25 rounded-2xl p-3">
                                                <div className="text-[11px] font-bold text-secondary uppercase tracking-wider">Bidders</div>
                                                <div className="text-sm font-black text-primary">{bidderCount}</div>
                                            </div>
                                            <div className="bg-white/70 border border-amber-200/25 rounded-2xl p-3">
                                                <div className="text-[11px] font-bold text-secondary uppercase tracking-wider">Bids</div>
                                                <div className="text-sm font-black text-primary">{(a.bids || []).length}</div>
                                            </div>
                                        </div>
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-xs font-bold text-secondary">Urgent deal</div>
                                            <Link href={`/auctions/${a.id}`}>
                                                <Button size="sm" className="bg-amber-600 hover:bg-amber-700">Place Bid</Button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section id="services" className="py-16 bg-gradient-to-b from-cyan-50/30 via-white to-white border-b border-cyan-200/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between gap-6 mb-8">
                        <div>
                            <h2 className="text-3xl font-extrabold text-primary tracking-tight">Student Services Available Near You</h2>
                            <p className="text-secondary mt-2">Book help on campus — fast, reliable, and verified.</p>
                        </div>
                        <Link href="/services" className="text-sm font-black text-action hover:underline">Browse services</Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                        {servicePreview.map((s) => {
                            const ServiceIcon = getServiceIcon(s.name);
                            return (
                                <div key={s.id} className="rounded-3xl border border-cyan-200/30 bg-white hover:shadow-md transition p-5 flex flex-col">
                                    <div className="h-12 w-12 rounded-2xl bg-blue-50 text-action flex items-center justify-center mb-4">
                                        <ServiceIcon className="h-6 w-6" />
                                    </div>
                                    <div className="text-sm font-black text-primary">{s.name}</div>
                                    <div className="text-xs text-secondary mt-2 line-clamp-3">{s.description}</div>
                                    <div className="mt-4 text-xs font-bold text-secondary">Starting from <span className="text-primary">student-friendly rates</span></div>
                                    <div className="mt-4">
                                        <Link href={`/services/${s.id}`}>
                                            <Button size="sm" className="w-full">Book Now</Button>
                                        </Link>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <section id="how-it-works" className="py-16 bg-gradient-to-b from-violet-50/30 via-slate-50 to-slate-50 border-b border-violet-200/25">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl font-extrabold text-primary tracking-tight">How It Works</h2>
                        <p className="text-secondary mt-2">Three simple steps to shop, bid, and get your items.</p>
                    </div>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="rounded-3xl border border-violet-200/25 bg-white p-6">
                            <div className="text-xs font-black text-action">1</div>
                            <div className="mt-2 text-lg font-black text-primary">Browse &amp; Choose</div>
                            <div className="mt-2 text-sm text-secondary">Browse products, search by category, and save your favorites.</div>
                        </div>
                        <div className="rounded-3xl border border-violet-200/25 bg-white p-6">
                            <div className="text-xs font-black text-action">2</div>
                            <div className="mt-2 text-lg font-black text-primary">Checkout or Bid</div>
                            <div className="mt-2 text-sm text-secondary">Add to cart and checkout, or join live auctions and place bids.</div>
                        </div>
                        <div className="rounded-3xl border border-violet-200/25 bg-white p-6">
                            <div className="text-xs font-black text-action">3</div>
                            <div className="mt-2 text-lg font-black text-primary">Secure Payment &amp; Delivery</div>
                            <div className="mt-2 text-sm text-secondary">Secure checkout, clear updates, and campus-friendly delivery options.</div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="trust" className="py-16 bg-gradient-to-b from-rose-50/20 via-white to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        <div className="lg:col-span-6">
                            <h2 className="text-3xl font-extrabold text-primary tracking-tight">Safe &amp; Verified Campus Store</h2>
                            <p className="text-secondary mt-3">Built for trust — designed to feel like a real marketplace with real protection.</p>
                            <div className="mt-6 space-y-3">
                                <div className="flex items-start gap-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <ShieldCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                                    <div>
                                        <div className="font-black text-primary text-sm">Student-friendly shopping</div>
                                        <div className="text-sm text-secondary">Clear product details and reliable campus support.</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <Truck className="h-5 w-5 text-action mt-0.5" />
                                    <div>
                                        <div className="font-black text-primary text-sm">Secure payments</div>
                                        <div className="text-sm text-secondary">Clear order records and a safer checkout flow.</div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-slate-50 border border-slate-200/60 rounded-2xl p-4">
                                    <Users className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <div className="font-black text-primary text-sm">Support you can trust</div>
                                        <div className="text-sm text-secondary">Fast responses and clear updates on orders and auctions.</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-6">
                            <div className="rounded-3xl border-2 border-action/30 bg-gradient-to-br from-white via-white to-blue-50/40 shadow-sm p-6 ring-1 ring-action/10">
                                <div className="text-sm font-black text-primary">Live activity</div>
                                <div className="text-secondary text-sm mt-1">A small snapshot of what’s happening now.</div>
                                <div className="mt-5 space-y-3">
                                    {(loading ? [1, 2, 3, 4] : [1, 2, 3, 4]).map((i) => (
                                        <div key={i} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-10 w-10 rounded-2xl bg-blue-50 text-action flex items-center justify-center font-black">CD</div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-black text-primary truncate">
                                                        {trending[i % trending.length]?.name || 'New listing added'}
                                                    </div>
                                                    <div className="text-xs text-secondary truncate">
                                                        CampusDeals Store · ⭐ {ratingFor(i)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-bold text-secondary whitespace-nowrap">just now</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6">
                                    <Link href="/store">
                                        <Button variant="outline" className="w-full">Explore the store</Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
