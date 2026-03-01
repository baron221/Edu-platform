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
                            <span className={styles.actions}>
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
                            </span>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className={styles.empty}>No users found.</div>
                    )}
                </div>
            )}
        </div>
    );
}
