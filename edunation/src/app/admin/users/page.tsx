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

    const filtered = users.filter(u =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Users</h1>
                    <p className={styles.subtitle}>{users.length} registered users</p>
                </div>
                <input
                    className={styles.searchInput}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name or email..."
                />
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
                                <span className={`${styles.badge} ${u.role === 'admin' ? styles.badgeAdmin : styles.badgeStudent}`}>
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
                                {u.role === 'admin' ? (
                                    <button className={styles.demoteBtn} onClick={() => changeRole(u.id, 'student')}>
                                        Demote
                                    </button>
                                ) : (
                                    <button className={styles.promoteBtn} onClick={() => changeRole(u.id, 'admin')}>
                                        Make Admin
                                    </button>
                                )}
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
