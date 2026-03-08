'use client';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from '../auth.module.css';

function ResetPasswordForm() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.');
            setStatus('error');
            return;
        }

        if (password.length < 6) {
            setErrorMsg('Password must be at least 6 characters.');
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMsg('');

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to complete reset.');
            }

            setStatus('success');
        } catch (err: any) {
            setErrorMsg(err.message || 'Something went wrong. Please try again.');
            setStatus('error');
        }
    };

    if (!token) {
        return (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Invalid Request</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
                    No reset token was found in the URL. Please use the link provided in your email.
                </p>
                <p style={{ marginTop: '24px' }}>
                    <Link href="/forgot-password" className={styles.submitBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Request New Link
                    </Link>
                </p>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Password Reset Successfully</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '15px', lineHeight: 1.5 }}>
                    Your password has been changed. You can now use it to sign in to your account.
                </p>
                <p style={{ marginTop: '24px' }}>
                    <Link href="/login" className={styles.submitBtn} style={{ display: 'inline-block', textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </p>
            </div>
        );
    }

    return (
        <>
            {status === 'error' && (
                <div className={styles.errorBanner} style={{ marginBottom: '24px' }}>
                    ⚠️ {errorMsg}
                </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit} autoComplete="off">
                <div className={styles.field}>
                    <label className={styles.label}>New Password</label>
                    <input
                        type="password"
                        className="input"
                        placeholder="••••••••"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        disabled={status === 'loading'}
                    />
                </div>

                <div className={styles.field}>
                    <label className={styles.label}>Confirm New Password</label>
                    <input
                        type="password"
                        className="input"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        required
                        disabled={status === 'loading'}
                    />
                </div>

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={status === 'loading'}
                >
                    {status === 'loading' ? 'Saving...' : 'Set New Password'}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
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

                <h1 className={styles.title}>Secure your account</h1>
                <p className={styles.subtitle}>Enter a new password to use for EduNationUz.</p>

                <Suspense fallback={<div className={styles.spinner} style={{ margin: '0 auto' }}></div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </div>
    );
}
