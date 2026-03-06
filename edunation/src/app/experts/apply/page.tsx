'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

export default function ApplyExpertPage() {
    const { t } = useLanguage();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [form, setForm] = useState({ motivation: '', skills: '', hourlyRate: '', telegramUsername: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [existing, setExisting] = useState<{ status: string } | null>(null);
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        fetch('/api/experts/my-status')
            .then(r => r.json())
            .then(d => {
                if (d.application) setExisting(d.application);
                setChecking(false);
            })
            .catch(() => setChecking(false));
    }, [status]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!form.skills.trim() || !form.motivation.trim() || !form.hourlyRate) {
            setError(t.applyExpert.fillRequired);
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/experts/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    motivation: form.motivation,
                    skills: form.skills,
                    hourlyRate: Number(form.hourlyRate),
                    telegramUsername: form.telegramUsername,
                }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? 'Failed to submit'); return; }
            setSuccess(true);
        } catch {
            setError(t.applyExpert.networkError);
        } finally {
            setLoading(false);
        }
    };

    if (status === 'loading' || checking) return <div className={styles.page}><div className={styles.loading}><div className={styles.spinner} /></div></div>;

    if (existing) {
        const statusMap: Record<string, { icon: string; label: string; color: string }> = {
            pending: { icon: '⏳', label: t.applyExpert.statusPending, color: '#fbbf24' },
            approved: { icon: '✅', label: t.applyExpert.statusApproved, color: '#10b981' },
            rejected: { icon: '❌', label: t.applyExpert.statusRejected, color: '#ef4444' },
        };
        const s = statusMap[existing.status] ?? statusMap.pending;
        return (
            <div className={styles.page}>
                <div className={styles.container}>
                    <div className={styles.statusCard}>
                        <div className={styles.statusIcon}>{s.icon}</div>
                        <h2 className={styles.statusTitle} style={{ color: s.color }}>{s.label}</h2>
                        {existing.status === 'pending' && <p className={styles.statusSub}>{t.applyExpert.descPending}</p>}
                        {existing.status === 'approved' && <p className={styles.statusSub}>{t.applyExpert.descApproved}</p>}
                        {existing.status === 'rejected' && <p className={styles.statusSub}>{t.applyExpert.descRejected}</p>}
                        <Link href="/experts" className="btn btn-primary" style={{ marginTop: '16px' }}>{t.applyExpert.viewDir}</Link>
                    </div>
                </div>
            </div>
        );
    }

    if (success) return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.statusCard}>
                    <div className={styles.statusIcon}>🎉</div>
                    <h2 className={styles.statusTitle} style={{ color: '#10b981' }}>{t.applyExpert.successTitle}</h2>
                    <p className={styles.statusSub}>{t.applyExpert.successSub}</p>
                    <Link href="/experts" className="btn btn-primary" style={{ marginTop: '16px' }}>{t.applyExpert.back.replace('← ', '')}</Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.header}>
                    <Link href="/experts" className={styles.backBtn}>{t.applyExpert.back}</Link>
                    <h1 className={styles.title}>{t.applyExpert.title1} <span className="gradient-text">{t.applyExpert.titleGrad}</span></h1>
                    <p className={styles.sub}>{t.applyExpert.subtitle}</p>
                </div>

                <div className={styles.card}>
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.field}>
                            <label>{t.applyExpert.skillsLabel} <span className={styles.req}>*</span></label>
                            <input
                                className={styles.input}
                                placeholder={t.applyExpert.skillsPlaceholder}
                                value={form.skills}
                                onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
                            />
                            <span className={styles.hint}>{t.applyExpert.skillsHint}</span>
                        </div>

                        <div className={styles.field}>
                            <label>{t.applyExpert.rateLabel} <span className={styles.req}>*</span></label>
                            <input
                                className={styles.input}
                                type="number"
                                placeholder="e.g. 100000"
                                min={10000}
                                value={form.hourlyRate}
                                onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))}
                            />
                            <span className={styles.hint}>{t.applyExpert.rateHint}</span>
                        </div>

                        <div className={styles.field}>
                            <label>{t.applyExpert.motivationLabel} <span className={styles.req}>*</span></label>
                            <textarea
                                className={styles.textarea}
                                placeholder={t.applyExpert.motivationPlaceholder}
                                rows={5}
                                value={form.motivation}
                                onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))}
                            />
                        </div>

                        <div className={styles.field}>
                            <label>{t.applyExpert.telegramLabel} <span className={styles.opt}>{t.applyExpert.opt}</span></label>
                            <input
                                className={styles.input}
                                placeholder="@username"
                                value={form.telegramUsername}
                                onChange={e => setForm(f => ({ ...f, telegramUsername: e.target.value }))}
                            />
                            <span className={styles.hint}>{t.applyExpert.telegramHint}</span>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center' }}>
                            {loading ? t.applyExpert.submitting : t.applyExpert.submitBtn}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
