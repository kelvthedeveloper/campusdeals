import Link from 'next/link';
import Image from 'next/image';
import { Github, Twitter, Instagram, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-primary text-white py-14">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4">
                        <Image
                            src="/campusdeals-logo-white.png"
                            alt="CampusDeals"
                            width={260}
                            height={56}
                            className="h-10 w-auto"
                        />
                        <p className="text-secondary text-sm leading-relaxed mt-3 max-w-sm">
                            A trusted student marketplace for campus-only listings, live auctions, and reliable services.
                        </p>
                        <div className="mt-6">
                            <p className="text-xs font-bold uppercase tracking-wider text-white/80 mb-2">Get campus deals in your inbox</p>
                            <form
                                onSubmit={(e) => e.preventDefault()}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="email"
                                    placeholder="you@school.edu"
                                    className="w-full bg-white/10 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-action/30"
                                />
                                <button
                                    type="submit"
                                    className="shrink-0 bg-action hover:bg-blue-700 transition text-white text-sm font-bold rounded-xl px-4 py-2"
                                >
                                    Subscribe
                                </button>
                            </form>
                            <p className="text-[11px] text-white/60 mt-2">No spam. Unsubscribe anytime.</p>
                        </div>
                    </div>

                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Marketplace</h3>
                            <ul className="space-y-2 text-sm text-secondary">
                                <li><Link href="/store" className="hover:text-white transition">Store</Link></li>
                                <li><Link href="/auctions" className="hover:text-white transition">Auctions</Link></li>
                                <li><Link href="/services" className="hover:text-white transition">Services</Link></li>
                                <li><Link href="/#how-it-works" className="hover:text-white transition">How It Works</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Support</h3>
                            <ul className="space-y-2 text-sm text-secondary">
                                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
                                <li><Link href="/auth/login" className="hover:text-white transition">Account</Link></li>
                                <li><Link href="/cart" className="hover:text-white transition">Cart</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Legal</h3>
                            <ul className="space-y-2 text-sm text-secondary">
                                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
                                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">For Students</h3>
                            <ul className="space-y-2 text-sm text-secondary">
                                <li><Link href="/store" className="hover:text-white transition">Browse Deals</Link></li>
                                <li><Link href="/auctions" className="hover:text-white transition">Bid Live</Link></li>
                                <li><Link href="/services" className="hover:text-white transition">Book Services</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h3>
                            <ul className="space-y-2 text-sm text-secondary">
                                <li><Link href="/#how-it-works" className="hover:text-white transition">How It Works</Link></li>
                                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div className="flex items-center gap-2 text-sm text-secondary">
                        <Mail className="h-4 w-4" />
                        <span>campus-support@campusdeals.com</span>
                    </div>
                    <div className="flex gap-3">
                        <Link href="#" className="p-2 bg-slate-800 rounded-full hover:bg-action transition" aria-label="Twitter">
                            <Twitter className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="p-2 bg-slate-800 rounded-full hover:bg-action transition" aria-label="Instagram">
                            <Instagram className="h-4 w-4" />
                        </Link>
                        <Link href="#" className="p-2 bg-slate-800 rounded-full hover:bg-action transition" aria-label="GitHub">
                            <Github className="h-4 w-4" />
                        </Link>
                    </div>
                </div>

                <div className="mt-6 text-center text-xs text-secondary">
                    <p>© {new Date().getFullYear()} CampusDeals. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
