'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import AIAssistant from '@/components/AIAssistant';
import NotificationBell from '@/components/NotificationBell';
import BottomNav from '@/components/BottomNav';
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
                <div className={styles.mobileActions}>
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
                    <Link href="/" className={styles.brandLogo}>
                        <span className={styles.brandIcon}>🎓</span>
                        <span className={styles.brandName}>EduNation<span className={styles.brandAccent}>Uz</span></span>
                    </Link>
                    <button
                        className={styles.closeSidebar}
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        ✕
                    </button>
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
                    {/* Language Switcher - Mobile Only */}
                    <div className={`${styles.langSwitcher} ${styles.mobileOnly}`}>
                        {LANGS.map(l => (
                            <button
                                key={l.code}
                                className={`${styles.langBtn} ${language === l.code ? styles.langBtnActive : ''}`}
                                onClick={() => setLanguage(l.code)}
                                title={l.code.toUpperCase()}
                            >
                                {l.label}
                            </button>
                        ))}
                    </div>

                    {/* User Info - Mobile Only */}
                    <div className={`${styles.userInfo} ${styles.mobileOnly}`}>
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
                        {t.sidebar.signOut}
                    </button>
                    <Link href="/" className={styles.viewSiteBtn}>
                        {t.sidebar.viewSite}
                    </Link>
                </div>
            </aside>

            {/* Main */}
            <main className={styles.main}>
                <header className={styles.topbar}>
                    <div className={styles.topbarLeft}>
                        <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>
                            {pathname === '/dashboard' ? t.sidebar.myLearning : 
                             pathname === '/dashboard/sessions' ? t.sidebar.mySessions : 
                             pathname.startsWith('/admin') ? t.sidebar.adminDashboard : 
                             pathname.startsWith('/instructor') ? t.sidebar.teachingConsole : 
                             'Dashboard'}
                        </h2>
                    </div>

                    <div className={styles.topbarRight}>
                        <div className={styles.topbarActions}>
                            {/* Language Switcher */}
                            <div className={styles.topbarLangSwitcher}>
                                {LANGS.map(l => (
                                    <button
                                        key={l.code}
                                        className={`${styles.topbarLangBtn} ${language === l.code ? styles.topbarLangBtnActive : ''}`}
                                        onClick={() => setLanguage(l.code)}
                                    >
                                        {l.label}
                                    </button>
                                ))}
                            </div>
                            
                            <NotificationBell />
                            
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

                        <div className={styles.topbarUserInfo}>
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
                    </div>
                </header>

                <div className={styles.contentWrapper}>
                    {children}
                </div>
            </main>

            {/* Global AI Assistant for Instructors/Admins */}
            <AIAssistant />

            {/* Bottom Nav for Mobile */}
            <BottomNav />
        </div>
    );
}
