'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Language } from '@/lib/translations';
import styles from './Navbar.module.css';

const LANGUAGES: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'uz', label: "O'zbek", flag: '🇺🇿' },
    { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export default function Navbar() {
    const { t, language, setLanguage } = useLanguage();
    const { data: session } = useSession();
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const langRef = useRef<HTMLDivElement>(null);
    const userRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
            if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Body scroll lock - refined
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
            // We don't use touchAction: none because it blocks scrolling inside the fixed menu
        } else {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
            document.documentElement.style.overflow = 'unset';
        };
    }, [menuOpen]);

    const currentLang = LANGUAGES.find(l => l.code === language)!;

    const userInitials = session?.user?.name
        ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const hasScrolledBackground = scrolled;

    return (
        <nav className={`${styles.nav} ${hasScrolledBackground ? styles.scrolled : ''}`}>
            <div className={`container ${styles.navInner}`}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <span className={styles.logoIcon}>🎓</span>
                    <span className={styles.logoText}>
                        EduNation<span className="gradient-text">Uz</span>
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className={styles.links}>
                    <Link href="/courses" className={styles.link}>{t.nav.courses}</Link>
                    <Link href="/instructors" className={styles.link}>{t.nav.instructors}</Link>
                    <Link href="/pricing" className={styles.link}>{t.nav.pricing}</Link>
                    <Link href="/about" className={styles.link}>{t.nav.about}</Link>
                </div>

                {/* Right Side: CTA + Language + Auth */}
                <div className={styles.cta}>
                    {/* Experts CTA */}
                    <Link href="/experts" className={styles.expertCta}>
                        {t.experts?.label || '⭐ Experts'}
                    </Link>

                    {/* Language Dropdown */}
                    <div className={styles.langSwitcher} ref={langRef}>
                        <button
                            className={styles.langBtn}
                            onClick={() => setLangOpen(!langOpen)}
                            aria-label={t.nav.selectLanguage || "Select language"}
                        >
                            <span className={styles.langFlag}>{currentLang.flag}</span>
                            <span className={`${styles.langArrow} ${langOpen ? styles.langArrowOpen : ''}`}>▾</span>
                        </button>

                        {langOpen && (
                            <div className={styles.langDropdown}>
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        className={`${styles.langOption} ${language === lang.code ? styles.langOptionActive : ''}`}
                                        onClick={() => { setLanguage(lang.code); setLangOpen(false); }}
                                    >
                                        <span className={styles.langFlag}>{lang.flag}</span>
                                        <span>{lang.label}</span>
                                        {language === lang.code && <span className={styles.langCheck}>✓</span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Auth: show user menu if logged in, otherwise show login/signup */}
                    {session ? (
                        <div className={styles.userMenu} ref={userRef}>
                            <button
                                className={styles.userBtn}
                                onClick={() => setUserOpen(!userOpen)}
                                aria-label={t.nav.userMenu || "User menu"}
                            >
                                {session.user?.image ? (
                                    <Image
                                        src={session.user.image}
                                        alt={session.user.name ?? 'User'}
                                        width={32}
                                        height={32}
                                        className={styles.userPhoto}
                                    />
                                ) : (
                                    <div className={styles.userInitials}>{userInitials}</div>
                                )}
                                <span className={styles.userName}>
                                    {session.user?.name?.split(' ')[0] ?? 'User'}
                                </span>
                                {typeof (session.user as any)?.points === 'number' && (
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span className={styles.userPoints}>
                                            <span style={{ color: '#fbbf24', marginRight: '4px' }}>★</span>
                                            {(session.user as any).points}
                                        </span>
                                        {(session.user as any)?.currentStreak > 0 && (
                                            <span className={styles.userPoints}>
                                                <span style={{ color: '#f59e0b', marginRight: '4px' }}>🔥</span>
                                                {(session.user as any).currentStreak}
                                            </span>
                                        )}
                                    </div>
                                )}
                                <span className={`${styles.langArrow} ${userOpen ? styles.langArrowOpen : ''}`}>▾</span>
                            </button>

                            {userOpen && (
                                <div className={styles.userDropdown}>
                                    <div className={styles.userDropdownHeader}>
                                        <div className={styles.userDropdownName}>{session.user?.name}</div>
                                        <div className={styles.userDropdownEmail}>{session.user?.email}</div>
                                        {typeof (session.user as any)?.points === 'number' && (
                                            <div className={styles.userDropdownPoints}>
                                                Your Points: <strong>{(session.user as any).points}</strong>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.userDropdownDivider} />
                                    <Link href="/dashboard" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                        🎓 {t.nav.myLearning}
                                    </Link>
                                    <Link href="/dashboard/sessions" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                        📅 {t.nav.mySessions}
                                    </Link>
                                    <Link href="/leaderboard" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                        🏆 {t.nav.leaderboard}
                                    </Link>
                                    {(session.user as any)?.role === 'admin' && (
                                        <>
                                            <Link href="/admin" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                                📊 {t.nav.adminDashboard}
                                            </Link>
                                            <Link href="/instructor/courses" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                                🛠️ {t.nav.instructorDashboard}
                                            </Link>
                                        </>
                                    )}
                                    {(session.user as any)?.role === 'instructor' && (
                                        <Link href="/instructor/courses" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                            🛠️ {t.nav.instructorDashboard}
                                        </Link>
                                    )}
                                    {(session.user as any)?.role !== 'instructor' && (session.user as any)?.role !== 'admin' && (
                                        <Link href="/instructor/subscribe" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                            🎓 {t.nav.becomeInstructor}
                                        </Link>
                                    )}
                                    <Link href="/courses" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                        📚 {t.nav.courses}
                                    </Link>
                                    <Link href="/pricing" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                        💎 {t.nav.pricing}
                                    </Link>
                                    <Link href="/settings" className={styles.userDropdownItem} onClick={() => setUserOpen(false)}>
                                        ⚙️ {t.settings?.title || 'Account Settings'}
                                    </Link>
                                    <div className={styles.userDropdownDivider} />
                                    <button
                                        className={`${styles.userDropdownItem} ${styles.signOutBtn}`}
                                        onClick={() => signOut({ callbackUrl: '/' })}
                                    >
                                        🚪 {t.nav.signOut}
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <Link href="/login" className="btn btn-secondary btn-sm">{t.nav.login}</Link>
                            <Link href="/signup" className="btn btn-primary btn-sm">{t.nav.startFree}</Link>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger */}
                <button
                    className={`${styles.hamburger} ${menuOpen ? styles.open : ''}`}
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle menu"
                >
                    <span /><span /><span />
                </button>
            </div>

            {/* Mobile Menu */}
            <div className={`${styles.mobileMenu} ${menuOpen ? styles.mobileOpen : ''}`}>
                {/* Mobile Language switcher - Moved to top */}
                <div className={styles.mobileLang}>
                    {LANGUAGES.map(lang => (
                        <button
                            key={lang.code}
                            className={`${styles.mobileLangBtn} ${language === lang.code ? styles.mobileLangActive : ''}`}
                            onClick={() => setLanguage(lang.code)}
                        >
                            {lang.flag} {lang.label}
                        </button>
                    ))}
                </div>

                {/* Featured Expert Link - Moved to top */}
                <Link 
                    href="/experts" 
                    className={styles.mobileExpertLink} 
                    onClick={() => setMenuOpen(false)}
                >
                    <span className={styles.mobileExpertIcon}>⭐</span>
                    <span className={styles.mobileExpertText}>{t.experts?.label || 'EXPERT NETWORK'}</span>
                    <span className={styles.mobileExpertArrow}>→</span>
                </Link>

                <div className={styles.mobileMenuDivider} />

                {/* Main Links */}
                <div className={styles.mobileMainLinks}>
                    <Link href="/courses" onClick={() => setMenuOpen(false)}>{t.nav.courses}</Link>
                    <Link href="/instructors" onClick={() => setMenuOpen(false)}>{t.nav.instructors}</Link>
                    <Link href="/pricing" onClick={() => setMenuOpen(false)}>{t.nav.pricing}</Link>
                    <Link href="/about" onClick={() => setMenuOpen(false)}>{t.nav.about}</Link>
                </div>

                <div className={styles.mobileCta}>
                    {session ? (
                        <>
                            <Link href="/dashboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                                🎓 {t.nav.myLearning}
                            </Link>
                            <Link href="/dashboard/sessions" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                                📅 {t.nav.mySessions}
                            </Link>
                            <Link href="/leaderboard" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                                🏆 {t.nav.leaderboard}
                            </Link>
                            {(session.user as any)?.role === 'admin' && (
                                <>
                                    <Link href="/admin" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                                        📊 {t.nav.adminDashboard}
                                    </Link>
                                    <Link href="/instructor/courses" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                                        🛠️ {t.nav.instructorDashboard}
                                    </Link>
                                </>
                            )}
                            {(session.user as any)?.role === 'instructor' && (
                                <Link href="/instructor/courses" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                                    🛠️ {t.nav.instructorDashboard}
                                </Link>
                            )}
                            {(session.user as any)?.role !== 'instructor' && (session.user as any)?.role !== 'admin' && (
                                <Link href="/instructor/subscribe" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                                    🎓 {t.nav.becomeInstructor}
                                </Link>
                            )}
                            <Link href="/settings" className={styles.mobileLink} onClick={() => setMenuOpen(false)}>
                                ⚙️ {t.settings?.title || 'Account Settings'}
                            </Link>
                            <div className={styles.mobileDivider} />
                            <button
                                className="btn btn-secondary"
                                style={{ width: '100%' }}
                                onClick={() => { signOut({ callbackUrl: '/' }); setMenuOpen(false); }}
                            >
                                🚪 {t.nav.signOut}
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="btn btn-secondary" onClick={() => setMenuOpen(false)}>{t.nav.login}</Link>
                            <Link href="/signup" className="btn btn-primary" onClick={() => setMenuOpen(false)}>{t.nav.startFree}</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}
