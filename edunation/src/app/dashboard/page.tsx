import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import styles from './page.module.css';

export const metadata = {
    title: 'My Learning | EduNation',
};

export default function DashboardPage() {
    return <DashboardContent />;
}

async function DashboardContent() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        redirect('/login?callbackUrl=/dashboard');
    }

    // Fetch enrollments with course + lesson count
    const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
            course: {
                include: {
                    _count: { select: { lessons: true, enrollments: true } }
                }
            }
        },
        orderBy: { enrolledAt: 'desc' }
    });

    // Fetch all progress for per-course progress bars
    const allProgress = await prisma.progress.findMany({
        where: { userId, completed: true },
    });

    // Fetch user info (streak, points)
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, lastActivityDate: true, points: true }
    });

    // Fetch certificates
    const certificates = await prisma.certificate.findMany({
        where: { userId },
        include: { course: { select: { title: true, slug: true, category: true } } },
        orderBy: { issuedAt: 'desc' }
    });

    // Calculate streak
    let activeStreak = user?.currentStreak || 0;
    if (user?.lastActivityDate) {
        const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        const lastMidnight = new Date(user.lastActivityDate); lastMidnight.setHours(0, 0, 0, 0);
        const diffDays = Math.round((todayMidnight.getTime() - lastMidnight.getTime()) / 86400000);
        if (diffDays > 1) activeStreak = 0;
    }

    // Find "Continue Learning" — first non-completed enrollment
    const recentEnrollment = enrollments.find(e => !e.completed);
    let nextLesson = null;
    if (recentEnrollment) {
        const completedIds = allProgress.filter(p => p.courseId === recentEnrollment.courseId).map(p => p.lessonId);
        const allLessons = await prisma.lesson.findMany({
            where: { courseId: recentEnrollment.courseId },
            orderBy: { order: 'asc' }
        });
        nextLesson = allLessons.find(l => !completedIds.includes(l.id));
    }

    // Recommendations
    const enrolledCourseIds = enrollments.map(e => e.courseId);
    const recommendations = await prisma.course.findMany({
        where: { id: { notIn: enrolledCourseIds }, published: true },
        take: 3,
        orderBy: { enrollments: { _count: 'desc' } },
        include: { _count: { select: { lessons: true, enrollments: true } } }
    });

    // Helper: progress % per course
    const progressFor = (courseId: string, totalLessons: number) => {
        if (totalLessons === 0) return 0;
        const done = allProgress.filter(p => p.courseId === courseId).length;
        return Math.round((done / totalLessons) * 100);
    };

    const totalLessonsDone = allProgress.length;
    const totalEnrolled = enrollments.length;
    const totalCompleted = enrollments.filter(e => e.completed).length;

    return (
        <div className={styles.page}>
            {/* Hero Header */}
            <section className={styles.header}>
                <div className="container">
                    <div className={styles.headerFlex}>
                        <div>
                            <h1 className={styles.title}>My Learning</h1>
                            <p className={styles.subtitle}>Welcome back, {session?.user?.name?.split(' ')[0] || 'Student'}! 👋</p>
                        </div>
                        <div className={styles.streakBadge}>🔥 {activeStreak} Day Streak</div>
                    </div>

                    {/* Stats Row */}
                    <div className={styles.statsRow}>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{totalEnrolled}</span>
                            <span className={styles.statLabel}>Courses Enrolled</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{totalLessonsDone}</span>
                            <span className={styles.statLabel}>Lessons Completed</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{totalCompleted}</span>
                            <span className={styles.statLabel}>Courses Finished</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{certificates.length}</span>
                            <span className={styles.statLabel}>Certificates Earned</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{user?.points || 0}</span>
                            <span className={styles.statLabel}>XP Points</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.content}>
                <div className="container">

                    {/* Continue Learning */}
                    {nextLesson && recentEnrollment && (
                        <div className={styles.continueSection}>
                            <h2 className={styles.sectionTitle}>▶ Continue Learning</h2>
                            <div className={styles.continueCard}>
                                <div className={styles.continueInfo}>
                                    <span className={styles.continueCourseName}>{recentEnrollment.course.title}</span>
                                    <h3 className={styles.continueLessonTitle}>{nextLesson.title}</h3>
                                </div>
                                <Link href={`/courses/${recentEnrollment.course.slug}`} className="btn btn-primary" style={{ flexShrink: 0 }}>
                                    Resume →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* My Courses with progress */}
                    <h2 className={styles.sectionTitle}>📚 My Courses</h2>
                    {enrollments.length > 0 ? (
                        <div className={styles.courseProgressGrid}>
                            {enrollments.map((en: any) => {
                                const pct = progressFor(en.courseId, en.course._count.lessons);
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
                                            <span>{allProgress.filter(p => p.courseId === en.courseId).length}/{en.course._count.lessons} lessons</span>
                                            {en.completed && <span className={styles.completedBadge}>✅ Completed</span>}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>📚</div>
                            <h3>No courses yet</h3>
                            <p>Explore our catalog to start learning today.</p>
                            <Link href="/courses" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                                Browse Courses
                            </Link>
                        </div>
                    )}

                    {/* Certificates */}
                    {certificates.length > 0 && (
                        <div className={styles.certificatesSection}>
                            <h2 className={styles.sectionTitle}>🎓 My Certificates</h2>
                            <div className={styles.certsGrid}>
                                {certificates.map((cert: any) => (
                                    <Link key={cert.id} href={`/certificate/${cert.id}`} className={styles.certCard}>
                                        <div className={styles.certIcon}>🏅</div>
                                        <div className={styles.certInfo}>
                                            <div className={styles.certTitle}>{cert.course.title}</div>
                                            <div className={styles.certDate}>
                                                Issued {new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
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
                            <h2 className={styles.sectionTitle}>✨ Recommended For You</h2>
                            <p className={styles.sectionSubtitle}>Popular courses you haven&apos;t taken yet.</p>
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
