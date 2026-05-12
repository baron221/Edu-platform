'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BottomNav from '@/components/BottomNav';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboardRoute = /^\/(admin|instructor|dashboard|sessions|community)(\/|$)/.test(pathname || '') &&
        !pathname?.startsWith('/instructors') &&
        pathname !== '/instructor/subscribe';

    return (
        <>
            {!isDashboardRoute && <Navbar />}
            <main>{children}</main>
            {!isDashboardRoute && (
                <>
                    <Footer />
                    <BottomNav />
                </>
            )}
        </>
    );
}
