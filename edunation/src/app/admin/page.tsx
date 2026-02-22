'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Stats {
    totalCourses: number;
    totalUsers: number;
    totalEnrollments: number;
    recentUsers: { id: string; name: string | null; email: string | null; role: string; createdAt: string }[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(r => r.json())
            .then(data => { setStats(data); setLoading(false); });
    }, []);

    if (loading) return <div className={styles.loading}>Loading dashboard...</div>;

    const statCards = [
        { label: 'Total Courses', value: stats?.totalCourses ?? 0, icon: '📚', color: '#7c3aed', href: '/admin/courses' },
        { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👥', color: '#06b6d4', href: '/admin/users' },
        { label: 'Enrollments', value: stats?.totalEnrollments ?? 0, icon: '🎓', color: '#10b981', href: '/admin/users' },
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Dashboard</h1>
                    <p className={styles.subtitle}>Welcome to the EduNationUz admin panel.</p>
                </div>
                <Link href="/admin/courses/new" className={styles.newBtn}>
                    + New Course
                </Link>
            </div>

            {/* Stat Cards */}
            <div className={styles.statsGrid}>
                {statCards.map(card => (
                    <Link key={card.label} href={card.href} className={styles.statCard}>
                        <div className={styles.statIcon} style={{ background: `${card.color}18`, color: card.color }}>{card.icon}</div>
                        <div className={styles.statValue}>{card.value.toLocaleString()}</div>
                        <div className={styles.statLabel}>{card.label}</div>
                    </Link>
                ))}
            </div>

            {/* Recent Users */}
            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>Recent Sign-ups</h2>
                <div className={styles.table}>
                    <div className={styles.tableHead}>
                        <span>Name</span>
                        <span>Email</span>
                        <span>Role</span>
                        <span>Joined</span>
                    </div>
                    {stats?.recentUsers.map(u => (
                        <div key={u.id} className={styles.tableRow}>
                            <span className={styles.tdName}>{u.name ?? '—'}</span>
                            <span className={styles.tdEmail}>{u.email}</span>
                            <span className={`${styles.tdBadge} ${u.role === 'admin' ? styles.badgeAdmin : styles.badgeStudent}`}>
                                {u.role}
                            </span>
                            <span className={styles.tdDate}>{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                    ))}
                </div>
                <Link href="/admin/users" className={styles.viewAll}>View all users →</Link>
            </div>
        </div>
    );
}
