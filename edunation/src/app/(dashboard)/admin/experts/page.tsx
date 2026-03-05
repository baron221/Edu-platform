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
                <div className={styles.list}>
                    {loading && <p className={styles.loading}>{t.adminExperts.loading}</p>}
                    {!loading && applications.length === 0 && <p className={styles.empty}>{t.adminExperts.noApps}</p>}
                    {applications.map(app => (
                        <div key={app.id} className={styles.card}>
                            <div className={styles.cardLeft}>
                                <div className={styles.userRow}>
                                    {app.user.image ? <Image src={app.user.image} alt={app.user.name ?? ''} width={40} height={40} className={styles.avatar} /> : <div className={styles.avatarFallback}>{app.user.name?.charAt(0) ?? '?'}</div>}
                                    <div>
                                        <div className={styles.userName}>{app.user.name}</div>
                                        <div className={styles.userEmail}>{app.user.email}</div>
                                    </div>
                                </div>
                                <div className={styles.appMeta}>
                                    <span>🔧 {app.skills}</span>
                                    <span>💰 {app.hourlyRate.toLocaleString()} UZS/hr</span>
                                    {app.telegramUsername && <span>📲 @{app.telegramUsername}</span>}
                                </div>
                                <p className={styles.motivation}>{app.motivation}</p>
                                {app.adminNote && <p className={styles.adminNote}>{t.adminExperts.noteLabel} {app.adminNote}</p>}
                            </div>
                            <div className={styles.cardRight}>
                                <span className={styles.statusBadge} style={{ color: STATUS_COLORS[app.status] ?? '#64748b', borderColor: (STATUS_COLORS[app.status] ?? '#64748b') + '40', background: (STATUS_COLORS[app.status] ?? '#64748b') + '14' }}>
                                    {app.status}
                                </span>
                                {app.status === 'pending' && (
                                    <div className={styles.actionBtns}>
                                        <button className={styles.approveBtn} disabled={actionLoading === app.id + 'approve'} onClick={() => handleAction(app.id, 'approve')}>
                                            {t.adminExperts.btnApprove}
                                        </button>
                                        <button className={styles.rejectBtn} disabled={actionLoading === app.id + 'reject'} onClick={() => { setNoteModal({ id: app.id, action: 'reject' }); }}>
                                            {t.adminExperts.btnReject}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Sessions Tab */}
            {tab === 'sessions' && (
                <div className={styles.list}>
                    {sessions.length === 0 && <p className={styles.empty}>{t.adminExperts.noSessions}</p>}
                    {sessions.map(s => (
                        <div key={s.id} className={styles.card}>
                            <div className={styles.cardLeft}>
                                <div className={styles.sessionParties}>
                                    <span>🎓 <strong>{s.expert.name}</strong></span>
                                    <span className={styles.arrow}>→</span>
                                    <span>👤 <strong>{s.student.name}</strong></span>
                                </div>
                                <div className={styles.appMeta}>
                                    <span>📖 {s.topic}</span>
                                    <span>🕐 {new Date(s.scheduledAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}</span>
                                    <span>⏱ {s.durationHours}h</span>
                                    <span>💰 {s.totalPrice.toLocaleString()} UZS</span>
                                </div>
                                {s.receiptUrl && <a href={s.receiptUrl} target="_blank" rel="noreferrer" className={styles.receiptLink}>{t.adminExperts.viewReceipt}</a>}
                                {s.meetLink && <a href={s.meetLink} target="_blank" rel="noreferrer" className={styles.meetLink}>{t.adminExperts.meetLink}</a>}
                            </div>
                            <div className={styles.cardRight}>
                                <span className={styles.statusBadge} style={{ color: STATUS_COLORS[s.status] ?? '#64748b', borderColor: (STATUS_COLORS[s.status] ?? '#64748b') + '40', background: (STATUS_COLORS[s.status] ?? '#64748b') + '14' }}>
                                    {s.status.replace('_', ' ')}
                                </span>
                                {(s.status === 'receipt_uploaded' || s.status === 'pending') && (
                                    <div className={styles.actionBtns}>
                                        <button className={styles.approveBtn} disabled={actionLoading === s.id + 'confirm'} onClick={() => handleSessionAction(s.id, 'confirm')}>
                                            {actionLoading === s.id + 'confirm' ? '…' : t.adminExperts.btnConfirm}
                                        </button>
                                        <button className={styles.rejectBtn} disabled={actionLoading === s.id + 'cancel'} onClick={() => handleSessionAction(s.id, 'cancel')}>
                                            {t.adminExperts.btnCancel}
                                        </button>
                                    </div>
                                )}
                            </div>
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
                            <button className={styles.rejectBtn} onClick={() => handleAction(noteModal.id, noteModal.action, adminNote)}>{t.adminExperts.modalConfirm}</button>
                            <button className={styles.cancelBtn} onClick={() => setNoteModal(null)}>{t.adminExperts.modalCancel}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
