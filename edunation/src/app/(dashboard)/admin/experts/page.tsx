'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

type Tab = 'applications' | 'sessions';

interface Application {
    id: string; motivation: string; skills: string; hourlyRate: number;
    telegramUsername: string | null; status: string; adminNote: string | null;
    createdAt: string; user: { name: string | null; email: string | null; image: string | null };
}

interface Session {
    id: string; topic: string; scheduledAt: string; durationHours: number;
    totalPrice: number; status: string; receiptUrl: string | null; meetLink: string | null;
    expert: { name: string | null; email: string | null; image: string | null };
    student: { name: string | null; email: string | null; image: string | null };
}

const STATUS_COLORS: Record<string, string> = {
    pending: '#fbbf24', approved: '#10b981', rejected: '#ef4444',
    receipt_uploaded: '#60a5fa', confirmed: '#10b981', cancelled: '#ef4444', completed: '#a78bfa',
};

// Simple SVG Icons to replace emojis
const SvgIcons = {
    Code: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>,
    Dollar: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    Send: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>,
    Book: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
    Clock: () => <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    ArrowRight: () => <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>,
    ExternalLink: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>,
    Video: () => <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
    Check: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
    X: () => <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
};

export default function AdminExpertsPage() {
    const { t } = useLanguage();
    const [tab, setTab] = useState<Tab>('applications');
    const [applications, setApplications] = useState<Application[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState('');
    const [noteModal, setNoteModal] = useState<{ id: string; action: string } | null>(null);
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        fetch('/api/admin/experts?status=all')
            .then(r => r.json()).then(d => { setApplications(Array.isArray(d) ? d : []); setLoading(false); });
        fetch('/api/admin/experts/sessions')
            .then(r => r.json()).then(d => { setSessions(Array.isArray(d) ? d : []); });
    }, []);

    const handleAction = async (id: string, action: string, note?: string) => {
        setActionLoading(id + action);
        try {
            const res = await fetch('/api/admin/experts', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action, adminNote: note }),
            });
            if (res.ok) {
                setApplications(prev => prev.map(a => a.id === id ? { ...a, status: action === 'approve' ? 'approved' : 'rejected', adminNote: note ?? null } : a));
            }
        } finally { setActionLoading(''); setNoteModal(null); setAdminNote(''); }
    };

    const handleSessionAction = async (id: string, action: string) => {
        setActionLoading(id + action);
        try {
            const res = await fetch(`/api/admin/experts/sessions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action }),
            });
            if (res.ok) {
                const data = await res.json();
                setSessions(prev => prev.map(s => s.id === id ? { ...s, status: data.status } : s));

                if (action === 'confirm' && data.webhookFired) {
                    if (data.webhookStatus === 200) {
                        alert("✅ " + t.adminExperts.alertConfirmedLink);
                    } else if (data.webhookStatus === 0) {
                        alert("⚠️ Webhook URL present but request failed to start. Check server logs.");
                    } else {
                        alert(`⚠️ Automation received but returned error code: ${data.webhookStatus}. Check n8n!`);
                    }
                } else if (action === 'confirm') {
                    alert(t.adminExperts.alertConfirmedNoLink);
                }
            }
        } finally { setActionLoading(''); }
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t.adminExperts.title}</h1>
            </div>

            <div className={styles.tabs}>
                <button className={`${styles.tab} ${tab === 'applications' ? styles.tabActive : ''}`} onClick={() => setTab('applications')}>
                    {t.adminExperts.tabApps} <span className={styles.badge}>{applications.filter(a => a.status === 'pending').length}</span>
                </button>
                <button className={`${styles.tab} ${tab === 'sessions' ? styles.tabActive : ''}`} onClick={() => setTab('sessions')}>
                    {t.adminExperts.tabSessions} <span className={styles.badge}>{sessions.filter(s => s.status === 'receipt_uploaded').length}</span>
                </button>
            </div>

            {/* Applications Tab */}
            {tab === 'applications' && (
                <div className={styles.grid}>
                    {loading && <p className={styles.loading}>{t.adminExperts.loading}</p>}
                    {!loading && applications.length === 0 && <p className={styles.empty}>{t.adminExperts.noApps}</p>}

                    {applications.map(app => (
                        <div key={app.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.userRow}>
                                    {app.user.image ? <Image src={app.user.image} alt={app.user.name ?? ''} width={46} height={46} className={styles.avatar} /> : <div className={styles.avatarFallback}>{app.user.name?.charAt(0) ?? '?'}</div>}
                                    <div>
                                        <div className={styles.userName}>{app.user.name}</div>
                                        <div className={styles.userEmail}>{app.user.email}</div>
                                    </div>
                                </div>
                                <span className={styles.statusBadge} style={{ color: STATUS_COLORS[app.status] ?? '#64748b', borderColor: (STATUS_COLORS[app.status] ?? '#64748b') + '40', background: (STATUS_COLORS[app.status] ?? '#64748b') + '14' }}>
                                    {app.status}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.appMeta}>
                                    <span className={styles.metaTag}><SvgIcons.Code /> {app.skills}</span>
                                    <span className={styles.metaTag}><SvgIcons.Dollar /> {app.hourlyRate.toLocaleString()} UZS/hr</span>
                                    {app.telegramUsername && <span className={styles.metaTag}><SvgIcons.Send /> @{app.telegramUsername}</span>}
                                </div>
                                <div className={styles.motivation}>{app.motivation}</div>
                                {app.adminNote && <div className={styles.adminNote}><strong>Note:</strong> {app.adminNote}</div>}
                            </div>

                            {app.status === 'pending' && (
                                <div className={styles.cardFooter}>
                                    <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={actionLoading === app.id + 'approve'} onClick={() => handleAction(app.id, 'approve')}>
                                        <SvgIcons.Check /> {t.adminExperts.btnApprove}
                                    </button>
                                    <button className={`${styles.btn} ${styles.btnDanger}`} disabled={actionLoading === app.id + 'reject'} onClick={() => { setNoteModal({ id: app.id, action: 'reject' }); }}>
                                        <SvgIcons.X /> {t.adminExperts.btnReject}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Sessions Tab */}
            {tab === 'sessions' && (
                <div className={styles.grid}>
                    {sessions.length === 0 && <p className={styles.empty}>{t.adminExperts.noSessions}</p>}

                    {sessions.map(s => (
                        <div key={s.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <div className={styles.sessionParties}>
                                    <div className={styles.party}>
                                        {s.expert.image ? <Image src={s.expert.image} alt="Expert" width={24} height={24} /> : null}
                                        {s.expert.name?.split(' ')[0]}
                                    </div>
                                    <div className={styles.arrow}><SvgIcons.ArrowRight /></div>
                                    <div className={styles.party}>
                                        {s.student.image ? <Image src={s.student.image} alt="Student" width={24} height={24} /> : null}
                                        {s.student.name?.split(' ')[0]}
                                    </div>
                                </div>
                                <span className={styles.statusBadge} style={{ color: STATUS_COLORS[s.status] ?? '#64748b', borderColor: (STATUS_COLORS[s.status] ?? '#64748b') + '40', background: (STATUS_COLORS[s.status] ?? '#64748b') + '14' }}>
                                    {s.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className={styles.cardBody}>
                                <div className={styles.appMeta}>
                                    <span className={styles.metaTag}><SvgIcons.Book /> {s.topic}</span>
                                    <span className={styles.metaTag}><SvgIcons.Clock /> {new Date(s.scheduledAt).toLocaleString('uz-UZ', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({s.durationHours}h)</span>
                                    <span className={styles.metaTag}><SvgIcons.Dollar /> {s.totalPrice.toLocaleString()} UZS</span>
                                </div>

                                <div className={styles.links}>
                                    {s.receiptUrl && <a href={s.receiptUrl} target="_blank" rel="noreferrer" className={`${styles.actionLink} ${styles.linkBlue}`}><SvgIcons.ExternalLink /> {t.adminExperts.viewReceipt}</a>}
                                    {s.meetLink && <a href={s.meetLink} target="_blank" rel="noreferrer" className={`${styles.actionLink} ${styles.linkGreen}`}><SvgIcons.Video /> {t.adminExperts.meetLink}</a>}
                                </div>
                            </div>

                            {(s.status === 'receipt_uploaded' || s.status === 'pending') && (
                                <div className={styles.cardFooter}>
                                    <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={actionLoading === s.id + 'confirm'} onClick={() => handleSessionAction(s.id, 'confirm')}>
                                        {actionLoading === s.id + 'confirm' ? '...' : <><SvgIcons.Check /> {t.adminExperts.btnConfirm}</>}
                                    </button>
                                    <button className={`${styles.btn} ${styles.btnDanger}`} disabled={actionLoading === s.id + 'cancel'} onClick={() => handleSessionAction(s.id, 'cancel')}>
                                        <SvgIcons.X /> {t.adminExperts.btnCancel}
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Reject Note Modal */}
            {noteModal && (
                <div className={styles.modalOverlay} onClick={() => setNoteModal(null)}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()}>
                        <h3>{t.adminExperts.modalTitle}</h3>
                        <textarea className={styles.modalTextarea} placeholder={t.adminExperts.modalPlaceholder} value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={4} />
                        <div className={styles.modalBtns}>
                            <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handleAction(noteModal.id, noteModal.action, adminNote)}>{t.adminExperts.modalConfirm}</button>
                            <button className={`${styles.btn} ${styles.btnGhost}`} onClick={() => setNoteModal(null)}>{t.adminExperts.modalCancel}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
