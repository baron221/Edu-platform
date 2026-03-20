'use client';

import { useEffect, useState } from 'react';
import styles from './page.module.css';

interface User {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    createdAt: string;
    subscription: { plan: string; status: string } | null;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Modal state
    const [editingSub, setEditingSub] = useState<User | null>(null);
    const [subPlan, setSubPlan] = useState('starter');
    const [subEndDate, setSubEndDate] = useState('');
    const [subMaxCourses, setSubMaxCourses] = useState(3);
    const [savingSub, setSavingSub] = useState(false);

    const load = () =>
        fetch('/api/admin/users').then(r => r.json()).then(data => { setUsers(data); setLoading(false); });

    useEffect(() => { load(); }, []);

    const changeRole = async (id: string, role: string) => {
        await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, role }),
        });
        load();
    };

    const handleEditSub = (u: User) => {
        setEditingSub(u);
        setSubPlan(u.subscription?.plan || 'starter');

        let dateToSet = '';
        if (u.subscription && (u.subscription as any).endDate) {
            const d = new Date((u.subscription as any).endDate);
            dateToSet = d.toISOString().split('T')[0]; // Format yyyy-mm-dd
        } else {
            const nextMonth = new Date();
            nextMonth.setDate(nextMonth.getDate() + 30);
            dateToSet = nextMonth.toISOString().split('T')[0];
        }
        setSubEndDate(dateToSet);
        setSubMaxCourses((u.subscription as any)?.maxCourses || (u.subscription?.plan === 'studio' ? 999 : u.subscription?.plan === 'pro' ? 20 : 3));
    };

    const saveSubscription = async () => {
        if (!editingSub) return;
        setSavingSub(true);
        try {
            const res = await fetch('/api/admin/users/subscription', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: editingSub.id,
                    plan: subPlan,
                    endDate: subEndDate,
                    maxCourses: subMaxCourses
                }),
            });
            if (!res.ok) throw new Error('Failed to update subscription');
            setEditingSub(null);
            load();
        } catch (e) {
            console.error(e);
            alert("Failed to update subscription");
        } finally {
            setSavingSub(false);
        }
    };

    const filtered = users.filter(u => {
        const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Users Content</h1>
                    <p className={styles.subtitle}>{users.length} registered users</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['all', 'admin', 'instructor', 'student'].map(r => (
                            <button
                                key={r}
                                onClick={() => setRoleFilter(r)}
                                className={`btn ${roleFilter === r ? 'btn-primary' : 'btn-secondary'}`}
                                style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                            >
                                {r.charAt(0).toUpperCase() + r.slice(1)}
                            </button>
                        ))}
                    </div>
                    <input
                        className={styles.searchInput}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name or email..."
                    />
                </div>
            </div>

            {loading ? <div className={styles.loading}>Loading users...</div> : (
                <div className={styles.tableWrapper}>
                    <div className={styles.tableHead}>
                        <span>Name</span>
                        <span>Email</span>
                        <span>Role</span>
                        <span>Subscription</span>
                        <span>Joined</span>
                        <span>Actions</span>
                    </div>
                    {filtered.map(u => (
                        <div key={u.id} className={styles.tableRow}>
                            <span className={styles.tdName}>{u.name ?? '—'}</span>
                            <span className={styles.tdEmail}>{u.email}</span>
                            <span>
                                <span className={`${styles.badge} ${u.role === 'admin' ? styles.badgeAdmin : u.role === 'instructor' ? styles.badgeInstructor : styles.badgeStudent}`}>
                                    {u.role}
                                </span>
                            </span>
                            <span>
                                <span className={`${styles.badge} ${u.subscription?.plan === 'pro' ? styles.badgePro : styles.badgeFree}`}>
                                    {u.subscription?.plan ?? 'free'}
                                </span>
                            </span>
                            <span className={styles.tdDate}>{new Date(u.createdAt).toLocaleDateString()}</span>
                            <span className={styles.actions} style={{ display: 'flex', gap: '8px' }}>
                                <select
                                    className={styles.roleSelect}
                                    value={u.role}
                                    onChange={(e) => changeRole(u.id, e.target.value)}
                                    style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--card-bg)', color: 'white' }}
                                >
                                    <option value="student">Student</option>
                                    <option value="instructor">Instructor</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <button
                                    onClick={() => handleEditSub(u)}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        border: '1px solid #7c3aed',
                                        background: 'rgba(124, 58, 237, 0.1)',
                                        color: '#a78bfa',
                                        cursor: 'pointer',
                                    }}
                                    title="Override Subscription"
                                >
                                    💳
                                </button>
                            </span>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className={styles.empty}>No users found.</div>
                    )}
                </div>
            )}

            {/* Subscription Override Modal */}
            {editingSub && (
                <div style={{
                    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
                }} onClick={() => setEditingSub(null)}>
                    <div style={{
                        background: 'var(--bg-card)', width: '100%', maxWidth: '400px', borderRadius: '16px', padding: '24px',
                        border: '1px solid var(--border)', boxShadow: '0 24px 60px rgba(0,0,0,0.3)'
                    }} onClick={e => e.stopPropagation()}>
                        <h2 style={{ fontSize: '20px', marginBottom: '16px', fontWeight: 600 }}>Subscription Override</h2>
                        <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '24px' }}>
                            Manually override the instructor plan for <strong>{editingSub.name || editingSub.email}</strong>.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Plan Tier</label>
                                <select
                                    value={subPlan}
                                    onChange={e => {
                                        setSubPlan(e.target.value);
                                        setSubMaxCourses(e.target.value === 'studio' ? 999 : e.target.value === 'pro' ? 20 : 3);
                                    }}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }}
                                >
                                    <option value="starter">Starter</option>
                                    <option value="pro">Pro</option>
                                    <option value="studio">Studio</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>End Date / Expiration</label>
                                <input
                                    type="date"
                                    value={subEndDate}
                                    onChange={e => setSubEndDate(e.target.value)}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '4px' }}>Max Course Quota</label>
                                <input
                                    type="number"
                                    value={subMaxCourses}
                                    onChange={e => setSubMaxCourses(parseInt(e.target.value))}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setEditingSub(null)}
                                style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={saveSubscription}
                                disabled={savingSub}
                                style={{ flex: 1, padding: '10px', background: '#7c3aed', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 600, cursor: savingSub ? 'not-allowed' : 'pointer', opacity: savingSub ? 0.7 : 1 }}
                            >
                                {savingSub ? 'Saving...' : 'Save Override'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
