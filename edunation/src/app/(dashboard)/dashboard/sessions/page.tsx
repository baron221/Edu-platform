'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

interface Session {
    id: string; topic: string; scheduledAt: string; durationHours: number;
    totalPrice: number; status: string; meetLink: string | null;
    expert: { name: string | null; image: string | null };
}

export default function MySessionsPage() {
    const { t } = useLanguage();
    const { data: session, status } = useSession();
    const router = useRouter();
    const [sessionsAsStudent, setSessionsAsStudent] = useState<Session[]>([]);
    const [sessionsAsExpert, setSessionsAsExpert] = useState<Session[]>([]);
    const [isExpert, setIsExpert] = useState(false);
    const [activeTab, setActiveTab] = useState<'student' | 'expert'>('student');
    const [loading, setLoading] = useState(true);

    const STATUS_MAP: Record<string, { label: string; color: string; icon: string }> = {
        pending: { label: t.studentSessions.statusPending, color: '#fbbf24', icon: '⏳' },
        receipt_uploaded: { label: t.studentSessions.statusReceipt, color: '#60a5fa', icon: '📤' },
        confirmed: { label: t.studentSessions.statusConfirmed, color: '#10b981', icon: '✅' },
        cancelled: { label: t.studentSessions.statusCancelled, color: '#ef4444', icon: '❌' },
        completed: { label: t.studentSessions.statusCompleted, color: '#a78bfa', icon: '🎓' },
    };

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
    }, [status, router]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        fetch('/api/experts/my-status')
            .then(r => r.json())
            .then(d => {
                setSessionsAsStudent(d.sessionsAsStudent ?? []);
                setSessionsAsExpert(d.sessionsAsExpert ?? []);
                setIsExpert(d.isExpert);
                // If they are only an expert and have no student bookings, default to expert tab
                if (d.isExpert && (d.sessionsAsStudent?.length === 0) && (d.sessionsAsExpert?.length > 0)) {
                    setActiveTab('expert');
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [status]);

    if (loading) return <div className={styles.page}><div className={styles.loadingWrap}><div className={styles.spinner} /></div></div>;

    const currentSessions = activeTab === 'student' ? sessionsAsStudent : sessionsAsExpert;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t.studentSessions.title}</h1>
                <Link href="/experts" className="btn btn-primary btn-sm">{t.studentSessions.browseExperts}</Link>
            </div>

            {isExpert && (
                <div className={styles.tabs} style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
                    <button
                        className={`${styles.tab} ${activeTab === 'student' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('student')}
                        style={{ background: activeTab === 'student' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
                    >
                        {t.studentSessions.tabStudent} ({sessionsAsStudent.length})
                    </button>
                    <button
                        className={`${styles.tab} ${activeTab === 'expert' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('expert')}
                        style={{ background: activeTab === 'expert' ? 'var(--primary)' : 'transparent', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '8px', color: '#fff', cursor: 'pointer' }}
                    >
                        {t.studentSessions.tabExpert} ({sessionsAsExpert.length})
                    </button>
                </div>
            )}

            {currentSessions.length === 0 ? (
                <div className={styles.empty}>
                    <div className={styles.emptyIcon}>{activeTab === 'student' ? '📅' : '👨‍🏫'}</div>
                    <h3>{activeTab === 'student' ? t.studentSessions.emptyTitle : 'No sessions as expert yet'}</h3>
                    <p>{activeTab === 'student' ? t.studentSessions.emptySub : 'Students will appear here once they book with you.'}</p>
                    {activeTab === 'student' && <Link href="/experts" className="btn btn-primary" style={{ marginTop: '16px' }}>{t.studentSessions.btnFind}</Link>}
                </div>
            ) : (
                <div className={styles.list}>
                    {currentSessions.map(s => {
                        const st = STATUS_MAP[s.status] ?? STATUS_MAP.pending;
                        const oppositeParty = activeTab === 'student' ? s.expert : (s as any).student;
                        return (
                            <div key={s.id} className={styles.card}>
                                <div className={styles.cardLeft}>
                                    <div className={styles.expertInfo}>
                                        {oppositeParty.image ? (
                                            <Image src={oppositeParty.image} alt={oppositeParty.name ?? ''} width={44} height={44} className={styles.avatar} />
                                        ) : (
                                            <div className={styles.avatarFallback}>{oppositeParty.name?.charAt(0) ?? '?'}</div>
                                        )}
                                        <div>
                                            <div className={styles.expertName}>{oppositeParty.name}</div>
                                            <div className={styles.topic}>{s.topic}</div>
                                        </div>
                                    </div>
                                    <div className={styles.meta}>
                                        <span>🕐 {new Date(s.scheduledAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</span>
                                        <span>⏱ {s.durationHours}h</span>
                                        <span>💰 {s.totalPrice.toLocaleString()} UZS</span>
                                    </div>
                                </div>
                                <div className={styles.cardRight}>
                                    <span className={styles.statusBadge} style={{ color: st.color, borderColor: st.color + '40', background: st.color + '14' }}>
                                        {st.icon} {st.label}
                                    </span>
                                    {s.meetLink && (
                                        <a href={s.meetLink} target="_blank" rel="noreferrer" className="btn btn-primary btn-sm">
                                            {t.studentSessions.joinMeet}
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
