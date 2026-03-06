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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
                    <span className={styles.adminBadge}>
                        {(() => {
                            const u = session?.user as any;
                            if (u?.role === 'admin') return 'ADMIN';
                            if (u?.role === 'instructor') return 'INSTRUCTOR';
                            if (u?.isExpert) return 'EXPERT';
                            return 'STUDENT';
                        })()}
                    </span>
                </div>

                <nav className={styles.nav}>
                    {(() => {
                        const u = session?.user as any;
                        const userRole = u?.role;
                        const isExpert = u?.isExpert;

                        let items = [];
                        if (userRole === 'admin') {
                            items = [
                                { href: '/admin', label: 'Admin Dashboard', icon: '📊' },
                                { href: '/admin/courses/all', label: 'Global Courses', icon: '🌍' },
                                { href: '/admin/purchases', label: 'Ledger', icon: '💸' },
                                { href: '/admin/users', label: 'Users', icon: '👥' },
                                { href: '/admin/experts', label: 'Experts', icon: '⭐' },
                                { href: '/instructor/courses', label: 'My Courses', icon: '📚' },
                                { href: '/dashboard/sessions', label: 'My Sessions', icon: '📅' },
                            ];
                        } else if (userRole === 'instructor') {
                            items = [
                                { href: '/instructor/courses', label: 'My Courses', icon: '📚' },
                                { href: '/instructor/subscribe', label: 'Subscription', icon: '💳' },
                                { href: '/dashboard/sessions', label: 'My Sessions', icon: '📅' },
                            ];
                        } else {
                            // Student or Expert
                            items = [
                                { href: '/dashboard', label: 'Learning Center', icon: '🎓' },
                                { href: '/dashboard/sessions', label: 'My Sessions', icon: '📅' },
                            ];
                        }

                        // If user is an expert but not instructor/admin, maybe they need some instructor-like links? 
                        // For now keep it simple and focus on Sessions.

                        return items.map(item => {
                            const isActive = pathname === item.href || (item.href !== '/admin' && item.href !== '/instructor/courses' ? pathname.startsWith(item.href) : pathname === item.href || pathname.startsWith(item.href + '/'));
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
                        });
                    })()}
                </nav>

                <div className={styles.sidebarFooter}>
                    <div className={styles.userInfo}>
                        <div className={styles.userAvatar}>
                            {session?.user?.name?.charAt(0).toUpperCase() ?? 'I'}
                        </div>
                        <div>
                            <div className={styles.userName}>{session?.user?.name ?? 'User'}</div>
                            <div className={styles.userRole}>
                                {(() => {
                                    const u = session?.user as any;
                                    if (u?.role === 'admin') return 'Administrator';
                                    if (u?.role === 'instructor') return 'Instructor';
                                    if (u?.isExpert) return 'Expert';
                                    return 'Student';
                                })()}
                            </div>
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
