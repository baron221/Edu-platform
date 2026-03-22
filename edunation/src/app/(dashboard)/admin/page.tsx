'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

interface Stats {
    totalCourses: number;
    totalUsers: number;
    totalEnrollments: number;
    totalRevenue: number;
    pendingPaymentsCount: number;
    pendingPayments: {
        id: string;
        userId: string;
        courseId: string | null;
        planId: string | null;
        receiptUrl: string;
        status: string;
        createdAt: string;
        user: { name: string | null; email: string | null };
        course: { title: string; price: number } | null;
    }[];
    recentUsers: { id: string; name: string | null; email: string | null; role: string; createdAt: string }[];
    courseDropoffs: { title: string; enrollments: number; completions: number; totalLessons: number; avgProgress: number }[];
}

export default function AdminDashboard() {
    const { t } = useLanguage();
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
        { label: t.admin.totalRevenue, value: `${(stats?.totalRevenue ?? 0).toLocaleString('ru-RU')} UZS`, icon: '💰', color: '#fbbf24', href: '/admin/courses' },
        { label: t.admin.totalCourses, value: stats?.totalCourses ?? 0, icon: '📚', color: '#7c3aed', href: '/admin/courses' },
        { label: t.admin.totalUsers, value: stats?.totalUsers ?? 0, icon: '👥', color: '#06b6d4', href: '/admin/users' },
        { label: t.admin.pendingPayments, value: stats?.pendingPaymentsCount ?? 0, icon: '💳', color: (stats?.pendingPaymentsCount ?? 0) > 0 ? '#ef4444' : '#10b981', href: '/admin/payments' },
    ];

    const handleStatusUpdate = async (id: string, status: 'approved' | 'rejected') => {
        if (!confirm(`Are you sure you want to ${status} this payment?`)) return;
        try {
            const res = await fetch('/api/admin/manual-payments', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) {
                // Refresh stats
                const r = await fetch('/api/admin/stats');
                const data = await r.json();
                setStats(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

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
                    <h1 className={styles.title}>{t.admin.dashboardTitle}</h1>
                    <p className={styles.subtitle}>{t.admin.dashboardSubtitle}</p>
                </div>
                <Link href="/admin/courses/new" className={styles.newBtn}>
                    {t.admin.newCourse}
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

            {/* Pending Approvals Section */}
            {stats?.pendingPayments && stats.pendingPayments.length > 0 && (
                <div className={styles.section} style={{ marginBottom: '40px', border: '1px solid #7c3aed44' }}>
                    <div className={styles.sectionHeaderFlex}>
                        <h2 className={styles.sectionTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>
                            💳 {t.admin.pendingPayments} <span style={{ fontSize: '12px', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px', marginLeft: '8px' }}>{stats.pendingPaymentsCount}</span>
                        </h2>
                        <Link href="/admin/payments" className={styles.aiBtnSubtle}>View All</Link>
                    </div>
                    <div className={styles.table} style={{ padding: '0 24px 24px' }}>
                        {stats.pendingPayments.map(p => (
                            <div key={p.id} className={styles.tableRow} style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr' }}>
                                <div className={styles.userInfo}>
                                    <span className={styles.tdName}>{p.user.name || 'User'}</span>
                                    <br /><small style={{ color: '#64748b' }}>{p.user.email}</small>
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600 }}>{p.courseId ? `📚 ${p.course?.title}` : `⭐ Plan: ${p.planId}`}</span>
                                </div>
                                <div>
                                    <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed', textDecoration: 'underline', fontSize: '13px' }}>View Receipt</a>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                    <button 
                                        onClick={() => handleStatusUpdate(p.id, 'approved')}
                                        style={{ padding: '4px 10px', borderRadius: '6px', background: '#10b981', color: 'white', fontSize: '12px', fontWeight: 600 }}
                                    >Approve</button>
                                    <button 
                                        onClick={() => handleStatusUpdate(p.id, 'rejected')}
                                        style={{ padding: '4px 10px', borderRadius: '6px', background: '#ef4444', color: 'white', fontSize: '12px', fontWeight: 600 }}
                                    >Reject</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* AI Student Sentiment Analytics */}
            <div className={styles.section} style={{ marginBottom: '40px' }}>
                <div className={styles.sectionHeaderFlex}>
                    <h2 className={styles.sectionTitle} style={{ borderBottom: 'none', paddingBottom: 0 }}>{t.admin.aiInsights}</h2>
                    <button
                        onClick={fetchAnalytics}
                        className={styles.aiBtnSubtle}
                        disabled={loadingAnalytics}
                    >
                        {loadingAnalytics ? t.admin.loading : t.admin.loadInsights}
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
                <h2 className={styles.sectionTitle}>{t.admin.courseDropoff}</h2>
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
                <h2 className={styles.sectionTitle}>{t.admin.recentUsers}</h2>
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
