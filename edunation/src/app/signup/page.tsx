'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../auth.module.css';

export default function SignupPage() {
    const { t } = useLanguage();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'student' | 'instructor'>('student');
    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Redirect if already signed in
    useEffect(() => {
        if (status === 'authenticated') {
            const userRole = (session?.user as any)?.role;
            if (userRole === 'admin' || userRole === 'instructor') {
                router.push('/admin/courses');
            } else {
                router.push('/');
            }
        }
    }, [status, session, router]);

    if (status === 'authenticated') return null;

    const handleEmailSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading('email');
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, role }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Registration failed.');
                setLoading(null);
                return;
            }
            // Auto sign-in after registration
            const result = await signIn('credentials', { email, password, redirect: false });
            if (result?.ok) {
                // Hard reload to guarantee fresh session with correct DB role
                window.location.href = role === 'instructor' ? '/admin/courses' : '/';
            } else {
                setError('Login failed after registration. Please log in manually.');
                setLoading(null);
            }
        } catch {
            setError('Something went wrong. Please try again.');
            setLoading(null);
        }
    };

    const handleOAuth = async (provider: 'google' | 'github') => {
        setLoading(provider);
        setError('');
        try {
            await signIn(provider, { callbackUrl: '/' });
        } catch {
            setError('Authentication failed. Please try again.');
            setLoading(null);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.bg} />
            <div className={styles.orb1} />
            <div className={styles.orb2} />

            <div className={styles.card}>
                <Link href="/" className={styles.logo}>
                    <span>🎓</span>
                    <span>EduNation<span className="gradient-text">Uz</span></span>
                </Link>

                <h1 className={styles.title}>{t.auth.signupTitle}</h1>
                <p className={styles.subtitle}>{t.auth.signupSubtitle}</p>

                <div className={styles.planHighlight}>
                    <span>🎉</span>
                    <span>{t.auth.freeBadge}</span>
                </div>

                {/* OAuth Buttons — featured prominently for signup */}
                <div className={styles.oauthPrimary}>
                    <button
                        type="button"
                        className={`${styles.oauthBtn} ${styles.oauthGoogle}`}
                        onClick={() => handleOAuth('google')}
                        disabled={loading !== null}
                        id="btn-google-signup"
                    >
                        {loading === 'google' ? (
                            <span className={styles.spinner} />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                        <span>{loading === 'google' ? t.shared.loading : 'Sign up with Google'}</span>
                    </button>

                    <button
                        type="button"
                        className={`${styles.oauthBtn} ${styles.oauthGithub}`}
                        onClick={() => handleOAuth('github')}
                        disabled={loading !== null}
                        id="btn-github-signup"
                    >
                        {loading === 'github' ? (
                            <span className={styles.spinner} />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                            </svg>
                        )}
                        <span>{loading === 'github' ? t.shared.loading : 'Sign up with GitHub'}</span>
                    </button>
                </div>

                {error && (
                    <div className={styles.errorBanner}>
                        ⚠️ {error}
                    </div>
                )}

                <div className={styles.divider}><span>{t.auth.orSignupWith} email</span></div>

                <form className={styles.form} onSubmit={handleEmailSignup}>
                    {/* Role Selector */}
                    <div className={styles.field}>
                        <label className={styles.label}>I am signing up as</label>
                        <div className={styles.roleToggle}>
                            <button
                                type="button"
                                className={`${styles.roleBtn} ${role === 'student' ? styles.roleBtnActive : ''}`}
                                onClick={() => setRole('student')}
                            >
                                <span className={styles.roleIcon}>🎓</span>
                                <span className={styles.roleLabel}>Student</span>
                                <span className={styles.roleDesc}>I want to learn</span>
                            </button>
                            <button
                                type="button"
                                className={`${styles.roleBtn} ${role === 'instructor' ? styles.roleBtnActive : ''}`}
                                onClick={() => setRole('instructor')}
                            >
                                <span className={styles.roleIcon}>👩‍🏫</span>
                                <span className={styles.roleLabel}>Teacher</span>
                                <span className={styles.roleDesc}>I want to teach</span>
                            </button>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>{t.auth.nameLabel}</label>
                        <input type="text" className="input" placeholder={t.auth.namePlaceholder}
                            value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>{t.auth.emailLabel}</label>
                        <input type="email" className="input" placeholder={t.auth.emailPlaceholder}
                            value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>{t.auth.passwordLabel}</label>
                        <input type="password" className="input" placeholder={t.auth.passwordPlaceholder}
                            value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
                    </div>
                    <button type="submit" className="btn btn-secondary"
                        style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>
                        {t.auth.signupBtn}
                    </button>
                    <p className={styles.terms}>
                        {t.auth.terms} <a href="#">{t.auth.termsLink}</a> {t.auth.and} <a href="#">{t.auth.privacyLink}</a>.
                    </p>
                </form>

                <p className={styles.switch}>
                    {t.auth.haveAccount}{' '}
                    <Link href="/login" className={styles.switchLink}>{t.auth.logIn}</Link>
                </p>
            </div>
        </div>
    );
}
