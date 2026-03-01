'use client';
import { useEffect, useState } from 'react';
import styles from '../users/page.module.css';

export default function AdminPurchasesPage() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'purchases' | 'subscriptions'>('purchases');

    const load = () => {
        setLoading(true);
        fetch('/api/admin/purchases')
            .then(r => r.json())
            .then(data => {
                setPurchases(data.purchases || []);
                setSubscriptions(data.subscriptions || []);
                setLoading(false);
            });
    };

    useEffect(() => { load(); }, []);

    const deleteTransaction = async (id: string, type: 'purchase' | 'subscription') => {
        if (!confirm(`WARNING: Are you sure you want to refund/revoke this ${type}? This un-enrolls the student or revokes the plan and deletes the record.`)) return;
        await fetch(`/api/admin/purchases?id=${id}&type=${type}`, { method: 'DELETE' });
        load();
    };

    return (
        <div className={styles.page} style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Financial Ledger</h1>
                    <p className={styles.subtitle}>{purchases.length} course enrollments, {subscriptions.length} active subscriptions</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className={`btn ${activeTab === 'purchases' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('purchases')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                        Course Purchases
                    </button>
                    <button
                        className={`btn ${activeTab === 'subscriptions' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActiveTab('subscriptions')}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                        Subscriptions
                    </button>
                </div>
            </div>

            {loading ? <div className={styles.loading}>Loading ledger data...</div> : (
                <div className={styles.tableWrapper}>
                    {activeTab === 'purchases' ? (
                        <>
                            <div className={styles.tableHead} style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr auto' }}>
                                <span>User</span>
                                <span>Course</span>
                                <span>Amount</span>
                                <span>Provider</span>
                                <span>Date</span>
                                <span>Actions</span>
                            </div>
                            {purchases.map(p => (
                                <div key={p.id} className={styles.tableRow} style={{ gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr auto' }}>
                                    <span>
                                        <div style={{ fontWeight: 600 }}>{p.user?.name || 'Unknown User'}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{p.user?.email}</div>
                                    </span>
                                    <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{p.course?.title}</span>
                                    <span style={{ color: '#10b981', fontWeight: 600 }}>{(p.amount / 100).toLocaleString()} UZS</span>
                                    <span>
                                        <span className={styles.badge} style={{ textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                                            {p.provider}
                                        </span>
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                                        {new Date(p.createdAt).toLocaleString()}
                                    </span>
                                    <span className={styles.actions}>
                                        <button
                                            onClick={() => deleteTransaction(p.id, 'purchase')}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 600
                                            }}
                                        >
                                            Refund / Revoke
                                        </button>
                                    </span>
                                </div>
                            ))}
                            {purchases.length === 0 && <div className={styles.empty}>No course purchases found.</div>}
                        </>
                    ) : (
                        <>
                            <div className={styles.tableHead} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto' }}>
                                <span>User</span>
                                <span>Plan</span>
                                <span>Status</span>
                                <span>Provider</span>
                                <span>Date</span>
                                <span>Actions</span>
                            </div>
                            {subscriptions.map(s => (
                                <div key={s.id} className={styles.tableRow} style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto' }}>
                                    <span>
                                        <div style={{ fontWeight: 600 }}>{s.user?.name || 'Unknown User'}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{s.user?.email}</div>
                                    </span>
                                    <span style={{ textTransform: 'capitalize', fontWeight: 600, color: s.plan === 'studio' ? '#a78bfa' : s.plan === 'pro' ? '#f59e0b' : '#10b981' }}>
                                        {s.plan}
                                    </span>
                                    <span>
                                        <span className={styles.badge} style={{ background: s.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', color: s.status === 'completed' ? '#10b981' : '#f59e0b' }}>
                                            {s.status}
                                        </span>
                                    </span>
                                    <span>
                                        <span className={styles.badge} style={{ textTransform: 'uppercase', background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                                            {s.provider}
                                        </span>
                                    </span>
                                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                                        {new Date(s.createdAt).toLocaleString()}
                                    </span>
                                    <span className={styles.actions}>
                                        <button
                                            onClick={() => deleteTransaction(s.id, 'subscription')}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '12px',
                                                fontWeight: 600
                                            }}
                                        >
                                            Refund / Cancel
                                        </button>
                                    </span>
                                </div>
                            ))}
                            {subscriptions.length === 0 && <div className={styles.empty}>No subscription payments found.</div>}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
