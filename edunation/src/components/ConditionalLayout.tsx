'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboardRoute = /^\/(admin|instructor|dashboard|sessions)(\/|$)/.test(pathname || '') &&
        !pathname?.startsWith('/instructors');

    return (
        <>
            {!isDashboardRoute && <Navbar />}
            <main>{children}</main>
            {!isDashboardRoute && <Footer />}
        </>
    );
}
