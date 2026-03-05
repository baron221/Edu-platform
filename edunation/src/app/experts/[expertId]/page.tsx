'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

interface Expert {
    id: string; name: string; image: string | null;
    skills: string; hourlyRate: number; motivation: string;
    enrolledCourses: number; telegramUsername: string | null;
}

export default function ExpertBookingPage() {
    const { t } = useLanguage();
    const { expertId } = useParams<{ expertId: string }>();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [expert, setExpert] = useState<Expert | null>(null);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ topic: '', scheduledAt: '', durationHours: 1 });
    const [step, setStep] = useState<'book' | 'receipt' | 'done'>('book');
    const [sessionId, setSessionId] = useState('');
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/experts/${expertId}`)
            .then(r => r.json())
            .then(d => { setExpert(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [expertId]);

    const totalPrice = expert ? expert.hourlyRate * form.durationHours : 0;

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session) { router.push('/login'); return; }
        setError(''); setSubmitting(true);
        try {
            const res = await fetch('/api/experts/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ expertId, topic: form.topic, scheduledAt: form.scheduledAt, durationHours: form.durationHours }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error ?? 'Failed to book'); return; }
            setSessionId(data.session.id);
            setStep('receipt');
        } catch { setError('Network error.'); }
        finally { setSubmitting(false); }
    };

    const handleReceipt = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiptFile) { setError('Please select a receipt image.'); return; }
        setError(''); setSubmitting(true);
        try {
            const fd = new FormData();
            fd.append('file', receiptFile);
            const upRes = await fetch('/api/upload', { method: 'POST', body: fd });
            const upData = await upRes.json();
            if (!upRes.ok) { setError('Upload failed.'); return; }

            const res = await fetch(`/api/experts/sessions/${sessionId}/receipt`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ receiptUrl: upData.url }),
            });
            if (!res.ok) { setError('Failed to save receipt.'); return; }
            setStep('done');
        } catch { setError('Network error.'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className={styles.page}><div className={styles.loadingWrap}><div className={styles.spinner} /></div></div>;
    if (!expert) return <div className={styles.page}><div className={styles.container}><p style={{ color: '#ef4444' }}>{t.bookExpert.notFound}</p></div></div>;

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <Link href="/experts" className={styles.backBtn}>{t.bookExpert.back}</Link>

                {/* Expert Profile Card */}
                <div className={styles.profileCard}>
                    <div className={styles.profileLeft}>
                        {expert.image ? (
                            <Image src={expert.image} alt={expert.name ?? ''} width={80} height={80} className={styles.profileAvatar} />
                        ) : (
                            <div className={styles.profileAvatarFallback}>{expert.name?.charAt(0) ?? '?'}</div>
                        )}
                        <div>
                            <div className={styles.profileBadge}>{t.bookExpert.badge}</div>
                            <h1 className={styles.profileName}>{expert.name}</h1>
                            <div className={styles.profileRate}>{expert.hourlyRate.toLocaleString()} <span>{t.bookExpert.perHour}</span></div>
                        </div>
                    </div>
                    <div className={styles.profileSkills}>
                        {expert.skills.split(',').map(s => s.trim()).filter(Boolean).map(s => (
                            <span key={s} className={styles.skill}>{s}</span>
                        ))}
                    </div>
                    <p className={styles.profileBio}>{expert.motivation}</p>
                    <div className={styles.profileMeta}>
                        <span>📚 {expert.enrolledCourses} {t.bookExpert.coursesEnrolled}</span>
                        {expert.telegramUsername && <span>📲 @{expert.telegramUsername}</span>}
                    </div>
                </div>

                {/* Booking Steps */}
                <div className={styles.stepsRow}>
                    {(['book', 'receipt', 'done'] as const).map((s, i) => (
                        <div key={s} className={`${styles.step} ${step === s ? styles.stepActive : ''} ${['receipt', 'done'].indexOf(s) <= ['book', 'receipt', 'done'].indexOf(step) ? styles.stepDone : ''}`}>
                            <div className={styles.stepNum}>{i + 1}</div>
                            <span>{s === 'book' ? t.bookExpert.stepTime : s === 'receipt' ? t.bookExpert.stepReceipt : t.bookExpert.stepDone}</span>
                        </div>
                    ))}
                </div>

                {step === 'book' && (
                    <form className={styles.formCard} onSubmit={handleBook}>
                        <h2 className={styles.formTitle}>{t.bookExpert.titleBook}</h2>

                        <div className={styles.field}>
                            <label>{t.bookExpert.topicLabel} <span className={styles.req}>*</span></label>
                            <input className={styles.input} placeholder={t.bookExpert.topicHint} required value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))} />
                        </div>

                        <div className={styles.field}>
                            <label>{t.bookExpert.dateLabel} <span className={styles.req}>*</span></label>
                            <input className={styles.input} type="datetime-local" required value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} min={new Date().toISOString().slice(0, 16)} />
                        </div>

                        <div className={styles.field}>
                            <label>{t.bookExpert.durationLabel}</label>
                            <div className={styles.durationRow}>
                                {[1, 2, 3].map(h => (
                                    <button key={h} type="button"
                                        className={`${styles.durationBtn} ${form.durationHours === h ? styles.durationActive : ''}`}
                                        onClick={() => setForm(f => ({ ...f, durationHours: h }))}>
                                        {h}h
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.priceBox}>
                            <span>{t.bookExpert.totalPrice}</span>
                            <strong>{totalPrice.toLocaleString()} UZS</strong>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <button className="btn btn-primary" type="submit" disabled={submitting} style={{ width: '100%', justifyContent: 'center' }}>
                            {submitting ? t.bookExpert.booking : t.bookExpert.bookBtn}
                        </button>
                        {!session && <p className={styles.loginNote}>{t.bookExpert.loginNote1} <Link href="/login" style={{ color: '#a78bfa' }}>{t.bookExpert.loginNote2}</Link> {t.bookExpert.loginNote3}</p>}
                    </form>
                )}

                {step === 'receipt' && (
                    <form className={styles.formCard} onSubmit={handleReceipt}>
                        <h2 className={styles.formTitle}>{t.bookExpert.titleReceipt}</h2>
                        <div className={styles.payInfo}>
                            <p>{t.bookExpert.payNote1} <strong>{totalPrice.toLocaleString()} {t.bookExpert.payNote2}</strong> {t.bookExpert.payNote3}</p>
                            {expert.telegramUsername && <p>{t.bookExpert.contactExpert1}<strong>@{expert.telegramUsername}</strong>{t.bookExpert.contactExpert2}</p>}
                        </div>

                        <div className={styles.field}>
                            <label>{t.bookExpert.receiptLabel} <span className={styles.req}>*</span></label>
                            <input type="file" accept="image/*,.pdf" className={styles.fileInput}
                                onChange={e => setReceiptFile(e.target.files?.[0] ?? null)} />
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <button className="btn btn-primary" type="submit" disabled={submitting || !receiptFile} style={{ width: '100%', justifyContent: 'center' }}>
                            {submitting ? t.bookExpert.uploading : t.bookExpert.submitReceipt}
                        </button>
                    </form>
                )}

                {step === 'done' && (
                    <div className={styles.successCard}>
                        <div className={styles.successIcon}>🎉</div>
                        <h2 className={styles.successTitle}>{t.bookExpert.successTitle}</h2>
                        <p className={styles.successSub}>{t.bookExpert.successSub1} <Link href="/dashboard/sessions" style={{ color: '#a78bfa' }}>{t.bookExpert.successSub2}</Link> {t.bookExpert.successSub3}</p>
                        <Link href="/experts" className="btn btn-primary" style={{ marginTop: '20px' }}>{t.bookExpert.browseMore}</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
