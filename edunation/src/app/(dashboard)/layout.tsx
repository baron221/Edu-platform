'use client';
import { useState, useEffect } from 'react';
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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Close sidebar on route change
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    return (
        <div className={styles.shell}>
            {/* Mobile Header */}
            <header className={styles.mobileHeader}>
                <button
                    className={styles.menuToggle}
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Open sidebar"
                >
                    ☰
                </button>
                <div className={styles.mobileBrand}>
                    <span className={styles.brandIcon}>🎓</span>
                    <span className={styles.brandName}>EduNation<span className={styles.brandAccent}>Uz</span></span>
                </div>
                <div style={{ width: 40 }} /> {/* Spacer */}
            </header>

            {/* Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className={styles.sidebarOverlay}
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.brand}>
                    <div className={styles.brandLogo}>
                        <span className={styles.brandIcon}>🎓</span>
                        <span className={styles.brandName}>EduNation<span className={styles.brandAccent}>Uz</span></span>
                    </div>
                    <button
                        className={styles.closeSidebar}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        ✕
                    </button>
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
                                { href: '/instructor/courses', label: 'Teaching Console', icon: '🛠️' },
                                { href: '/instructor/analytics', label: 'Instructor Analytics', icon: '📈' },
                                { href: '/dashboard', label: 'Switch to Student', icon: '🎓' },
                            ];
                        } else if (userRole === 'instructor') {
                            items = [
                                { href: '/instructor/courses', label: 'Teaching Console', icon: '🛠️' },
                                { href: '/instructor/analytics', label: 'Analytics', icon: '📈' },
                                { href: '/dashboard', label: 'My Learning Center', icon: '🎓' },
                                { href: '/dashboard/sessions', label: 'My Sessions', icon: '📅' },
                            ];
                        } else {
                            // Student or Expert
                            items = [
                                { href: '/dashboard', label: 'Learning Center', icon: '🎓' },
                                { href: '/dashboard/sessions', label: 'My Sessions', icon: '📅' },
                            ];
                        }

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
                        🌐 Home Page
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
