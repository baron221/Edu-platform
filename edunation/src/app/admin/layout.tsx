'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import AIAssistant from '@/components/AIAssistant';
import styles from './layout.module.css';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/courses', label: 'Courses', icon: '📚' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <div className={styles.shell}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <div className={styles.brandLogo}>
                        <span className={styles.brandIcon}>🎓</span>
                        <span className={styles.brandName}>EduNation<span className={styles.brandAccent}>Uz</span></span>
                    </div>
                    <span className={styles.adminBadge}>{(session?.user as any)?.role === 'admin' ? 'ADMIN' : 'INSTRUCTOR'}</span>
                </div>

                <nav className={styles.nav}>
                    {navItems.map(item => {
                        // Hide Users tab for non-admins
                        const userRole = (session?.user as any)?.role;
                        if (item.href === '/admin/users' && userRole !== 'admin') return null;

                        const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {session?.user?.name?.charAt(0).toUpperCase() ?? 'I'}
                        </div>
                        <div>
                            <div className={styles.userName}>{session?.user?.name ?? 'Instructor'}</div>
                            <div className={styles.userRole}>{(session?.user as any)?.role === 'admin' ? 'Administrator' : 'Instructor'}</div>
                        </div>
                    </div>
                    <button
                        className={styles.signOutBtn}
                        onClick={() => signOut({ callbackUrl: '/' })}
                    >
                        🚪 Sign Out
                    </button>
                    <Link href="/" className={styles.viewSiteBtn}>
                        🌐 View Site
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <main className={styles.main}>
                {children}
            </main>

            {/* Global AI Assistant for Instructors/Admins */}
            <AIAssistant />
        </div>
    );
}
