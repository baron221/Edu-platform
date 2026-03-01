'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface Stats {
    totalCourses: number;
    totalUsers: number;
    totalEnrollments: number;
    totalRevenue: number;
    recentUsers: { id: string; name: string | null; email: string | null; role: string; createdAt: string }[];
    courseDropoffs: { title: string; enrollments: number; completions: number; totalLessons: number; avgProgress: number }[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    useEffect(() => {
        fetch('/api/admin/stats')
            .then(r => r.json())
            .then(data => { setStats(data); setLoading(false); });
    }, []);

    if (loading) return <div className={styles.loading}>Loading dashboard...</div>;

    const statCards = [
        { label: 'Total Revenue', value: `${(stats?.totalRevenue ?? 0).toLocaleString('ru-RU')} UZS`, icon: '💰', color: '#fbbf24', href: '/admin/courses' },
        { label: 'Total Courses', value: stats?.totalCourses ?? 0, icon: '📚', color: '#7c3aed', href: '/admin/courses' },
        { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: '👥', color: '#06b6d4', href: '/admin/users' },
        { label: 'Enrollments', value: stats?.totalEnrollments ?? 0, icon: '🎓', color: '#10b981', href: '/admin/users' },
    ];

    const fetchAnalytics = async () => {
        setLoadingAnalytics(true);
        try {
            const res = await fetch('/api/admin/analytics');
            const data = await res.json();
            if (res.ok && data.data) {
                setAnalytics(data.data);
            } else {
                alert(data.message || data.error || 'Failed to fetch analytics.');
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred fetching AI analytics");
        } finally {
            setLoadingAnalytics(false);
        }
    };

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

            {/* AI Student Sentiment Analytics */}
            <div className={styles.section} style={{ marginBottom: '40px' }}>
                <div className={styles.sectionHeaderFlex}>
                    <h2 className={styles.sectionTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>🧠 AI Student Insights</h2>
                    <button
                        onClick={fetchAnalytics}
                        className={styles.aiBtnSubtle}
                        disabled={loadingAnalytics}
                    >
                        {loadingAnalytics ? 'Analyzing...' : 'Refresh Insights ✨'}
                    </button>
                </div>

                {loadingAnalytics ? (
                    <div className={styles.analyticsLoading}>
                        <div className={styles.spinner}></div>
                        <span>AI is reading recent student chats and analyzing sentiment...</span>
                    </div>
                ) : analytics ? (
                    <div className={styles.analyticsWrapper}>
                        <div className={styles.analyticsSummary}>
                            <strong>Summary:</strong> {analytics.summary}
                        </div>
                        <div className={styles.analyticsGrid}>
                            <div className={styles.analyticsCard}>
                                <h3>Overall Sentiment</h3>
                                <div className={`${styles.sentimentBadge} ${styles['sentiment' + analytics.overallSentiment]}`}>
                                    {analytics.overallSentiment}
                                </div>
                            </div>
                            <div className={styles.analyticsCard}>
                                <h3>Top Student Struggles</h3>
                                <ul>
                                    {analytics.topStruggles.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                </ul>
                            </div>
                            <div className={styles.analyticsCard}>
                                <h3>AI Recommendations</h3>
                                <ul>
                                    {analytics.recommendations.map((r: string, i: number) => <li key={i}>{r}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className={styles.analyticsEmpty}>
                        Click "Refresh Insights" to have the AI analyze recent student questions.
                    </div>
                )}
            </div>

            {/* Course Engagement & Drop-offs */}
            <div className={styles.section} style={{ marginBottom: '40px' }}>
                <h2 className={styles.sectionTitle}>📉 Course Engagement & Drop-offs</h2>
                <div className={styles.dropoffContainer}>
                    {stats?.courseDropoffs && stats.courseDropoffs.length > 0 ? (
                        stats.courseDropoffs.map((course, i) => (
                            <div key={i} className={styles.dropoffCard}>
                                <div className={styles.dropoffHeader}>
                                    <h3 className={styles.dropoffTitle}>{course.title}</h3>
                                    <span className={styles.dropoffStats}>{course.enrollments} Enrollments</span>
                                </div>
                                <div className={styles.dropoffMetrics}>
                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>Avg. Progress</span>
                                        <span className={styles.metricValue}>{Math.round(course.avgProgress)}%</span>
                                    </div>
                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>Completions</span>
                                        <span className={styles.metricValue}>{course.completions}</span>
                                    </div>
                                    <div className={styles.metric}>
                                        <span className={styles.metricLabel}>Drop-off Rate</span>
                                        <span className={styles.metricValue} style={{ color: '#ef4444' }}>
                                            {course.enrollments > 0 ? Math.round(((course.enrollments - course.completions) / course.enrollments) * 100) : 0}%
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${Math.round(course.avgProgress)}%` }}></div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.emptyState}>Not enough data to analyze drop-offs yet.</div>
                    )}
                </div>
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
