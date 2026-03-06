'use client';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import styles from './page.module.css';
import { useEffect, useState } from 'react';

interface DashboardData {
    enrollments: any[];
    allProgress: any[];
    user: { currentStreak: number; lastActivityDate: string | null; points: number } | null;
    certificates: any[];
    recommendations: any[];
    nextLesson: any;
    recentEnrollmentTitle: string | null;
    recentEnrollmentSlug: string | null;
    activeStreak: number;
    totalLessonsDone: number;
    totalCompleted: number;
}

export default function DashboardPage() {
    const { t } = useLanguage();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/dashboard')
            .then(r => r.json())
            .then(d => { setData(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    if (loading || !data) {
        return (
            <div className={styles.page}>
                <section className={styles.header}>
                    <div className="container">
                        <div className={styles.headerFlex}>
                            <div>
                                <div style={{ width: 200, height: 36, background: 'var(--border)', borderRadius: 8, marginBottom: 8 }} />
                                <div style={{ width: 140, height: 20, background: 'var(--border)', borderRadius: 6 }} />
                            </div>
                        </div>
                        <div className={styles.statsRow}>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={styles.statCard} style={{ background: 'var(--border)' }} />
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    const {
        enrollments, allProgress, certificates, recommendations,
        nextLesson, recentEnrollmentTitle, recentEnrollmentSlug,
        activeStreak, totalLessonsDone, totalCompleted, user
    } = data;

    const progressFor = (courseId: string, totalLessons: number) => {
        if (totalLessons === 0) return 0;
        const done = allProgress.filter((p: any) => p.courseId === courseId).length;
        return Math.round((done / totalLessons) * 100);
    };

    return (
        <div className={styles.page}>
            {/* Hero Header */}
            <section className={styles.header}>
                <div className="container">
                    <div className={styles.headerFlex}>
                        <div>
                            <h1 className={styles.title}>{t.dashboard.title}</h1>
                            <p className={styles.subtitle}>{t.dashboard.subtitle} 👋</p>
                        </div>
                        <div className={styles.streakBadge}>🔥 {activeStreak} {t.dashboard.streak}</div>
                    </div>

                    {/* Stats Row */}
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{enrollments.length}</span>
                            <span className={styles.statLabel}>{t.dashboard.stats.enrolled}</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{totalLessonsDone}</span>
                            <span className={styles.statLabel}>{t.dashboard.stats.lessonsCompleted}</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{totalCompleted}</span>
                            <span className={styles.statLabel}>{t.dashboard.stats.coursesFinished}</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{certificates.length}</span>
                            <span className={styles.statLabel}>{t.dashboard.stats.certificates}</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{user?.points || 0}</span>
                            <span className={styles.statLabel}>{t.dashboard.stats.xp}</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.content}>
                <div className="container">

                    {/* Continue Learning */}
                    {nextLesson && recentEnrollmentSlug && (
                        <div className={styles.continueSection}>
                            <h2 className={styles.sectionTitle}>{t.dashboard.continueLearning}</h2>
                            <div className={styles.continueCard}>
                                <div className={styles.continueInfo}>
                                    <span className={styles.continueCourseName}>{recentEnrollmentTitle}</span>
                                    <h3 className={styles.continueLessonTitle}>{nextLesson.title}</h3>
                                </div>
                                <Link href={`/courses/${recentEnrollmentSlug}`} className="btn btn-primary" style={{ flexShrink: 0 }}>
                                    {t.dashboard.resume}
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* My Courses */}
                    <h2 className={styles.sectionTitle}>{t.dashboard.myCourses}</h2>
                    {enrollments.length > 0 ? (
                        <div className={styles.courseProgressGrid}>
                            {enrollments.map((en: any) => {
                                const pct = progressFor(en.courseId, en.course._count.lessons);
                                const doneLessons = allProgress.filter((p: any) => p.courseId === en.courseId).length;
                                return (
                                    <Link key={en.course.id} href={`/courses/${en.course.slug}`} className={styles.progressCard}>
                                        <div className={styles.progressCardHeader}>
                                            <div className={styles.progressCardCat}>{en.course.category}</div>
                                            <div className={styles.progressCardPct}>{pct}%</div>
                                        </div>
                                        <h3 className={styles.progressCardTitle}>{en.course.title}</h3>
                                        <div className={styles.progressTrack}>
                                            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                                        </div>
                                        <div className={styles.progressMeta}>
                                            <span>{t.dashboard.lessonsProgress(doneLessons, en.course._count.lessons)}</span>
                                            {en.completed && <span className={styles.completedBadge}>{t.dashboard.completed}</span>}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>📚</div>
                            <h3>{t.dashboard.noCourses}</h3>
                            <p>{t.dashboard.noCoursesDesc}</p>
                            <Link href="/courses" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                                {t.dashboard.browseCourses}
                            </Link>
                        </div>
                    )}

                    {/* Certificates */}
                    {certificates.length > 0 && (
                        <div className={styles.certificatesSection}>
                            <h2 className={styles.sectionTitle}>{t.dashboard.myCertificates}</h2>
                            <div className={styles.certsGrid}>
                                {certificates.map((cert: any) => (
                                    <Link key={cert.id} href={`/certificate/${cert.id}`} className={styles.certCard}>
                                        <div className={styles.certIcon}>🏅</div>
                                        <div className={styles.certInfo}>
                                            <div className={styles.certTitle}>{cert.course.title}</div>
                                            <div className={styles.certDate}>
                                                {t.dashboard.certIssued} {new Date(cert.issuedAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className={styles.certArrow}>→</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div className={styles.recommendationsSection}>
                            <h2 className={styles.sectionTitle}>{t.dashboard.recommended}</h2>
                            <p className={styles.sectionSubtitle}>{t.dashboard.recommendedDesc}</p>
                            <div className="grid-3">
                                {recommendations.map((course: any) => (
                                    <Link key={course.id} href={`/courses/${course.slug}`} className={styles.recCard}>
                                        <div className={styles.recCat}>{course.category}</div>
                                        <h3 className={styles.recTitle}>{course.title}</h3>
                                        <div className={styles.recMeta}>{course._count.lessons} lessons • {course._count.enrollments} students</div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
