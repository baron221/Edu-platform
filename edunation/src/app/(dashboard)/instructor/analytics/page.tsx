'use client';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

interface CourseStats {
    id: string;
    title: string;
    category: string;
    level: string;
    isFree: boolean;
    published: boolean;
    enrollments: number;
    lessons: number;
    avgRating: number;
    reviewCount: number;
    revenue: number;
}

interface TrendPoint {
    month: string;
    count?: number;
    amount?: number;
}

interface Analytics {
    overview: {
        totalEarnings: number;
        totalEnrollments: number;
        avgRating: number;
        activeCourses: number;
        totalCourses: number;
        totalReviews: number;
    };
    courseStats: CourseStats[];
    enrollmentTrend: TrendPoint[];
    revenueTrend: TrendPoint[];
    topCourse: CourseStats | null;
}

function formatUZS(amount: number): string {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
    return amount.toLocaleString('ru-RU');
}

function StarRating({ rating, count }: { rating: number; count: number }) {
    const stars = Math.round(rating);
    return (
        <span>
            <span className={styles.stars}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>
            {' '}
            <span style={{ color: '#94a3b8', fontSize: 11 }}>
                {rating > 0 ? `${rating.toFixed(1)} (${count})` : '—'}
            </span>
        </span>
    );
}

function BarChart({ data, valueKey, color }: {
    data: TrendPoint[];
    valueKey: 'count' | 'amount';
    color: 'purple' | 'green';
}) {
    const values = data.map(d => (d[valueKey] as number) ?? 0);
    const max = Math.max(...values, 1);

    return (
        <div className={styles.chartGrid}>
            {data.map((point, i) => {
                const val = (point[valueKey] as number) ?? 0;
                const heightPct = (val / max) * 100;
                return (
                    <div key={i} className={styles.chartBar}>
                        <div className={styles.barValue}>
                            {valueKey === 'amount' ? (val > 0 ? formatUZS(val) : '—') : val}
                        </div>
                        <div
                            className={`${styles.barFill} ${color === 'green' ? styles.barFillRevenue : ''}`}
                            style={{ height: `${Math.max(heightPct, 3)}%` }}
                        />
                        <div className={styles.barLabel}>{point.month}</div>
                    </div>
                );
            })}
        </div>
    );
}

export default function InstructorAnalyticsPage() {
    const { t } = useLanguage();
    const [data, setData] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [chartTab, setChartTab] = useState<'enrollments' | 'revenue'>('enrollments');

    useEffect(() => {
        fetch('/api/instructor/analytics')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner} />
                <span>Loading your analytics...</span>
            </div>
        );
    }

    if (!data) {
        return <div className={styles.loading}>Failed to load analytics.</div>;
    }

    const { overview, courseStats, enrollmentTrend, revenueTrend, topCourse } = data;

    const statCards = [
        {
            icon: '💰',
            value: `${formatUZS(overview.totalEarnings)} UZS`,
            label: t.instructor.totalEarnings,
            color: '#f59e0b',
            iconBg: '#fef3c7',
        },
        {
            icon: '🎓',
            value: overview.totalEnrollments.toLocaleString(),
            label: t.instructor.totalEnrollments,
            color: '#7c3aed',
            iconBg: '#f3eeff',
        },
        {
            icon: '⭐',
            value: overview.avgRating > 0 ? `${overview.avgRating}/5` : '—',
            label: `${t.instructor.avgRating} (${overview.totalReviews} reviews)`,
            color: '#f59e0b',
            iconBg: '#fffbeb',
        },
        {
            icon: '📚',
            value: `${overview.activeCourses}/${overview.totalCourses}`,
            label: t.instructor.publishedCourses,
            color: '#10b981',
            iconBg: '#ecfdf5',
        },
    ];

    return (
        <div className={styles.page}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.title}>{t.instructor.analyticsTitle}</h1>
                <p className={styles.subtitle}>{t.instructor.analyticsSubtitle}</p>
            </div>

            {/* Stat Cards */}
            <div className={styles.statsGrid}>
                {statCards.map((card, i) => (
                    <div
                        key={i}
                        className={styles.statCard}
                        style={{ '--card-color': card.color, '--icon-bg': card.iconBg } as React.CSSProperties}
                    >
                        <div className={styles.statIcon}>{card.icon}</div>
                        <div className={styles.statValue}>{card.value}</div>
                        <div className={styles.statLabel}>{card.label}</div>
                    </div>
                ))}
            </div>

            {/* Top Performer + Chart */}
            <div className={styles.bodyGrid}>
                {/* Top Performer */}
                {topCourse ? (
                    <div className={styles.topCard}>
                        <div className={styles.topLabel}>{t.instructor.topCourse}</div>
                        <div className={styles.topTitle}>{topCourse.title}</div>
                        <div className={styles.topMeta}>
                            <div className={styles.topMetaItem}>
                                <div className={styles.topMetaValue}>{topCourse.enrollments}</div>
                                <div className={styles.topMetaLabel}>Enrollments</div>
                            </div>
                            <div className={styles.topMetaItem}>
                                <div className={styles.topMetaValue}>
                                    {topCourse.avgRating > 0 ? `${topCourse.avgRating}/5` : '—'}
                                </div>
                                <div className={styles.topMetaLabel}>Avg Rating</div>
                            </div>
                            <div className={styles.topMetaItem}>
                                <div className={styles.topMetaValue}>
                                    {topCourse.isFree ? 'Free' : `${formatUZS(topCourse.revenue)} UZS`}
                                </div>
                                <div className={styles.topMetaLabel}>Revenue</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: '#f8fafc', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: 14, padding: 32 }}>
                        No courses yet — create your first course!
                    </div>
                )}

                {/* Chart Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.cardTitle}>{t.instructor.trendTitle}</div>
                        <div className={styles.tabGroup}>
                            <button
                                className={`${styles.tab} ${chartTab === 'enrollments' ? styles.tabActive : ''}`}
                                onClick={() => setChartTab('enrollments')}
                            >
                                {t.instructor.enrollmentsTab}
                            </button>
                            <button
                                className={`${styles.tab} ${chartTab === 'revenue' ? styles.tabActive : ''}`}
                                onClick={() => setChartTab('revenue')}
                            >
                                {t.instructor.revenueTab}
                            </button>
                        </div>
                    </div>
                    <div className={styles.cardBody}>
                        {chartTab === 'enrollments' ? (
                            <BarChart data={enrollmentTrend} valueKey="count" color="purple" />
                        ) : (
                            <BarChart data={revenueTrend} valueKey="amount" color="green" />
                        )}
                    </div>
                </div>
            </div>

            {/* Per-course Table */}
            <div className={styles.cardFull}>
                <div className={styles.cardHeader}>
                    <div className={styles.cardTitle}>{t.instructor.courseBreakdown}</div>
                </div>
                <div className={styles.cardBody}>
                    {courseStats.length === 0 ? (
                        <div className={styles.noData}>
                            <div className={styles.noDataIcon}>📭</div>
                            <div>No courses found. Start by creating your first course!</div>
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>{t.instructor.colCourse}</th>
                                        <th>{t.instructor.colStatus}</th>
                                        <th>{t.instructor.colLessons}</th>
                                        <th>{t.instructor.colEnrollments}</th>
                                        <th>{t.instructor.colRating}</th>
                                        <th>{t.instructor.colRevenue}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {courseStats.map(c => (
                                        <tr key={c.id}>
                                            <td>
                                                <div className={styles.courseTitle}>{c.title}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                                    {c.category} • {c.level}
                                                    {c.isFree && <span className={styles.badgeFree}>Free</span>}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.badge} ${c.published ? styles.badgePublished : styles.badgeDraft}`}>
                                                {c.published ? `● ${t.instructor.published}` : `○ ${t.instructor.draft}`}
                                                </span>
                                            </td>
                                            <td style={{ fontWeight: 600 }}>{c.lessons}</td>
                                            <td style={{ fontWeight: 600 }}>{c.enrollments.toLocaleString()}</td>
                                            <td>
                                                <StarRating rating={c.avgRating} count={c.reviewCount} />
                                            </td>
                                            <td style={{ fontWeight: 600 }}>
                                                {c.isFree
                                                    ? <span style={{ color: '#10b981' }}>Free</span>
                                                    : (c.revenue > 0
                                                        ? <span>{formatUZS(c.revenue)} UZS</span>
                                                        : <span style={{ color: '#94a3b8' }}>—</span>)
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
