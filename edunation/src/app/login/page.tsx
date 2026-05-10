'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../auth.module.css';

export default function LoginPage() {
    const { t } = useLanguage();
    const { data: session, status } = useSession();
    const router = useRouter();

    const [role, setRole] = useState<'student' | 'instructor'>('student');



    const [loading, setLoading] = useState<string | null>(null);
    const [error, setError] = useState('');

    // Dev Auth state
    const [devName, setDevName] = useState('');
    const [devId, setDevId] = useState('');

    // Redirect if already signed in
    useEffect(() => {
        if (status === 'authenticated') {
            const role = (session?.user as any)?.role;
            if (role === 'admin') {
                router.push('/admin');
            } else if (role === 'instructor') {
                router.push('/instructor/courses');
            } else {
                router.push('/');
            }
        }
    }, [status, session, router]);

    if (status === 'authenticated') return null;




    const handleOAuth = async (provider: 'google') => {
        setLoading(provider);
        setError('');
        document.cookie = `edu_role=${role}; path=/; max-age=3600;`;
        try {
            await signIn(provider, { callbackUrl: '/' });
        } catch {
            setError('Authentication failed. Please try again.');
            setLoading(null);
        }
    };

    const handleDevAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading('dev-auth');
        try {
            const result = await signIn('credentials', {
                redirect: false,
                name: devName,
                idCode: devId,
            });

            if (result?.error) {
                setError(result.error);
            }
        } catch (err: any) {
            setError('Something went wrong.');
        } finally {
            setLoading(null);
        }
    };

    const handleTelegram = () => {
        setLoading('telegram');
        setError('');
        document.cookie = `edu_role=${role}; path=/; max-age=3600;`;

        const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID ?? '8657675755';
        const origin = window.location.origin;
        const returnTo = `${origin}/api/auth/telegram/callback`;

        const popup = window.open(
            `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&return_to=${encodeURIComponent(returnTo)}&request_access=write`,
            'telegram_login',
            'width=550,height=470,top=200,left=200'
        );

        const onMessage = async (event: MessageEvent) => {
            if (event.origin !== origin) return;
            if (event.data?.type !== 'telegram_auth') return;

            window.removeEventListener('message', onMessage);
            clearInterval(closedTimer);

            if (event.data.error) {
                setError('Telegram sign-in failed: ' + event.data.error);
                setLoading(null);
                return;
            }

            try {
                const result = await signIn('telegram', {
                    redirect: false,
                    telegramToken: event.data.token,
                });
                if (result?.error) throw new Error(result.error);
            } catch (err: any) {
                setError(err.message ?? 'Telegram sign-in failed.');
                setLoading(null);
            }
        };

        window.addEventListener('message', onMessage);

        const closedTimer = setInterval(() => {
            if (popup?.closed) {
                clearInterval(closedTimer);
                window.removeEventListener('message', onMessage);
                setLoading(null);
            }
        }, 500);
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

                <div className={styles.headerRow}>
                    <h1 className={styles.title} style={{ marginBottom: 0 }}>{t.auth.loginTitle}</h1>
                    <Link href="/join" className={styles.quickAccessLink}>
                        ⚡ Tezkor kirish
                    </Link>
                </div>
                <p className={styles.subtitle}>{t.auth.loginSubtitle}</p>

                {/* Role Selector */}
                <div className={styles.field} style={{ marginBottom: '24px' }}>
                    <div className={styles.roleHeaderContainer}>
                        <label className={styles.label}>{t.auth.roleLabel}</label>
                        <span className={styles.roleWarning}>{t.auth.roleWarning}</span>
                    </div>
                    <div className={styles.roleToggle}>
                        <button
                            type="button"
                            className={`${styles.roleBtn} ${role === 'student' ? styles.roleBtnActive : ''}`}
                            onClick={() => setRole('student')}
                        >
                            <span className={styles.roleIcon}>🎓</span>
                            <span className={styles.roleLabel}>{t.auth.roleStudent}</span>
                        </button>
                        <button
                            type="button"
                            className={`${styles.roleBtn} ${role === 'instructor' ? styles.roleBtnActive : ''}`}
                            onClick={() => setRole('instructor')}
                        >
                            <span className={styles.roleIcon}>👩‍🏫</span>
                            <span className={styles.roleLabel}>{t.auth.roleTeacher}</span>
                        </button>
                    </div>
                </div>

                <div className={styles.oauthPrimary}>
                    <button
                        type="button"
                        className={`${styles.oauthBtn} ${styles.oauthGoogle}`}
                        onClick={() => handleOAuth('google')}
                        disabled={loading !== null}
                        id="btn-google-login"
                    >
                        {loading === 'google' ? <span className={styles.spinner} /> : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                        )}
                    </button>


                    <button
                        type="button"
                        className={`${styles.oauthBtn} ${styles.oauthTelegram}`}
                        onClick={handleTelegram}
                        disabled={loading !== null}
                        id="btn-telegram-login"
                    >
                        {loading === 'telegram' ? <span className={styles.spinner} /> : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path fill="white" d="M17.76 7.28L15.4 17.6c-.17.76-.63.95-1.27.59l-3.5-2.58-1.69 1.63c-.19.18-.34.34-.7.34l.25-3.54 6.4-5.78c.28-.25-.06-.38-.43-.14L6.2 13.15 2.76 12.1c-.74-.23-.75-.74.15-1.1L16.71 6.18c.62-.23 1.16.14.96 1.1" />
                            </svg>
                        )}
                    </button>
                </div>

                {error && (
                    <div className={styles.errorBanner}>
                        ⚠️ {error}
                    </div>
                )}



            </div>
        </div>
    );
}
