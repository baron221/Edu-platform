'use client';
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isDashboardRoute = pathname?.startsWith('/admin') ||
        pathname?.startsWith('/instructor') ||
        pathname?.startsWith('/dashboard') ||
        pathname?.startsWith('/sessions');

    return (
        <>
            {!isDashboardRoute && <Navbar />}
            <main>{children}</main>
            {!isDashboardRoute && <Footer />}
        </>
    );
}
