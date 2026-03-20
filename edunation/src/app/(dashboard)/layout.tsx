'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import AIAssistant from '@/components/AIAssistant';
import NotificationBell from '@/components/NotificationBell';
import { useLanguage } from '@/context/LanguageContext';
import styles from './layout.module.css';

const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/courses', label: 'Courses', icon: '📚' },
    { href: '/admin/users', label: 'Users', icon: '👥' },
];

const LANGS = [
    { code: 'en', label: 'EN' },
    { code: 'uz', label: 'UZ' },
    { code: 'ru', label: 'RU' },
] as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { language, setLanguage, t } = useLanguage();
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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationBell />
                </div>
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

                        let items = [];
                        if (userRole === 'admin') {
                            items = [
                                { href: '/admin', label: t.sidebar.adminDashboard, icon: '📊' },
                                { href: '/admin/courses/all', label: t.sidebar.allCourses, icon: '🌍' },
                                { href: '/admin/purchases', label: 'Ledger', icon: '💸' },
                                { href: '/admin/users', label: t.sidebar.users, icon: '👥' },
                                { href: '/admin/promo-codes', label: t.adminPromo.title, icon: '🎟️' },
                                { href: '/admin/experts', label: t.sidebar.experts, icon: '⭐' },
                                { href: '/instructor/courses', label: t.sidebar.teachingConsole, icon: '🛠️' },
                                { href: '/instructor/analytics', label: t.sidebar.instructorAnalytics, icon: '📈' },
                                { href: '/dashboard', label: t.sidebar.switchToStudent, icon: '🎓' },
                            ];
                        } else if (userRole === 'instructor') {
                            items = [
                                { href: '/instructor/courses', label: t.sidebar.teachingConsole, icon: '🛠️' },
                                { href: '/instructor/analytics', label: t.sidebar.analytics, icon: '📈' },
                                { href: '/dashboard', label: t.sidebar.myLearning, icon: '🎓' },
                                { href: '/dashboard/sessions', label: t.sidebar.mySessions, icon: '📅' },
                            ];
                        } else {
                            items = [
                                { href: '/dashboard', label: t.sidebar.myLearning, icon: '🎓' },
                                { href: '/dashboard/sessions', label: t.sidebar.mySessions, icon: '📅' },
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
                    <Link href="/" className={styles.viewSiteBtn}>
                        {t.sidebar.viewSite}
                    </Link>
                    <button
                        className={styles.signOutBtn}
                        onClick={() => signOut({ callbackUrl: '/' })}
                    >
                        {t.sidebar.signOut}
                    </button>
                </div>
            </aside>

            {/* Content Area */}
            <div className={styles.contentWrapper}>
                {/* Top Navigation */}
                <header className={styles.topNav}>
                    <div className={styles.topNavLeft}>
                        {/* Placeholder for Breadcrumbs or Title */}
                        <h2 className={styles.pageTitleHeader}>
                            {(() => {
                                if (pathname === '/admin') return t.sidebar.adminDashboard;
                                if (pathname === '/instructor/courses') return t.sidebar.teachingConsole;
                                if (pathname === '/dashboard') return t.sidebar.myLearning;
                                return '';
                            })()}
                        </h2>
                    </div>

                    <div className={styles.topNavRight}>
                        {/* Language Switcher */}
                        <div className={styles.langSwitcher}>
                            {LANGS.map(l => (
                                <button
                                    key={l.code}
                                    className={`${styles.langBtn} ${language === l.code ? styles.langBtnActive : ''}`}
                                    onClick={() => setLanguage(l.code)}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>

                        <div className={styles.divider} />

                        <NotificationBell />

                        <div className={styles.divider} />

                        <div className={styles.userProfile}>
                            <div className={styles.userAvatar}>
                                {session?.user?.name?.charAt(0).toUpperCase() ?? 'U'}
                            </div>
                            <div className={styles.userMeta}>
                                <div className={styles.userNameHeader}>{session?.user?.name ?? 'User'}</div>
                                <div className={styles.userRoleHeader}>
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
                    </div>
                </header>

                <main className={styles.main}>
                    {children}
                </main>
            </div>

            {/* Global AI Assistant for Instructors/Admins */}
            <AIAssistant />
        </div>
    );
}
