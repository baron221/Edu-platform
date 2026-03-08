'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../auth.module.css';

export default function ForgotPasswordPage() {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to send recovery email.');
            }

            setStatus('success');
        } catch (err: any) {
            setErrorMsg(err.message || 'Something went wrong. Please try again.');
            setStatus('error');
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

                <h1 className={styles.title}>Reset Password</h1>
                <p className={styles.subtitle}>Enter your email address and we will send you a link to reset your password.</p>

                {status === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
                        <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Check your email</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
                            We have sent a password reset link to <strong style={{ color: 'var(--text-main)' }}>{email}</strong>.
                        </p>
                        <p style={{ marginTop: '24px' }}>
                            <Link href="/login" className={styles.submitBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
                                Back to Sign In
                            </Link>
                        </p>
                    </div>
                ) : (
                    <>
                        {status === 'error' && (
                            <div className={styles.errorBanner} style={{ marginBottom: '24px' }}>
                                ⚠️ {errorMsg}
                            </div>
                        )}

                        <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
                            <div className={styles.field}>
                                <label className={styles.label}>{t.auth.emailLabel}</label>
                                <input
                                    type="email"
                                    className="input"
                                    placeholder={t.auth.emailPlaceholder}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    autoComplete="email"
                                    required
                                    disabled={status === 'loading'}
                                />
                            </div>

                            <button
                                type="submit"
                                className={styles.submitBtn}
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? 'Sending...' : 'Send Recovery Link'}
                            </button>
                        </form>

                        <p className={styles.switch}>
                            Remember your password?{' '}
                            <Link href="/login" className={styles.switchLink}>Sign in</Link>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
