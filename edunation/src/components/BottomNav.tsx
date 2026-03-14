'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './BottomNav.module.css';

export default function BottomNav() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { t } = useLanguage();

    const navItems = [
        { label: 'Home', icon: '🏠', path: '/' },
        { label: 'Browse', icon: '🔍', path: '/courses' },
        { label: 'Learning', icon: '🎓', path: '/dashboard' },
        { label: 'Profile', icon: '👤', path: session ? (session.user as any).role === 'admin' ? '/admin' : (session.user as any).role === 'instructor' ? '/instructor/courses' : '/dashboard' : '/login' },
    ];

    return (
        <nav className={styles.bottomNav}>
            <div className={styles.inner}>
                {navItems.map((item) => {
                    const isActive = pathname === item.path || (item.path !== '/' && pathname?.startsWith(item.path));
                    return (
                        <Link
                            key={item.label}
                            href={item.path}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
