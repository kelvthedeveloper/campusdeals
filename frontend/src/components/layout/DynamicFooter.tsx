'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

/**
 * DynamicFooter handles the conditional rendering of the site-wide footer.
 * It ensures the footer is hidden on Dashboard and Admin management pages
 * to maintain a clean, professional application interface.
 */
export default function DynamicFooter() {
    const pathname = usePathname();

    // Check if the current path is inside admin or dashboard
    // These paths have their own specialized UI structures that don't include the marketing footer
    const hideOnPaths = ['/admin', '/dashboard'];
    const shouldHide = hideOnPaths.some(path => pathname?.startsWith(path));

    if (shouldHide || pathname === '/auth/login' || pathname === '/auth/register') {
        return null;
    }

    return <Footer />;
}
