import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import CourseCard from '@/components/CourseCard';
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

    const enrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
            course: {
                include: {
                    _count: {
                        select: { lessons: true, enrollments: true }
                    }
                }
            }
        },
        orderBy: { enrolledAt: 'desc' }
    });

    // 1. Fetch User Streak Info
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true, lastActivityDate: true }
    });

    // Calculate if streak is active today
    let activeStreak = user?.currentStreak || 0;
    if (user?.lastActivityDate) {
        const now = new Date();
        const lastActivity = new Date(user.lastActivityDate);
        const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const lastMidnight = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());

        const msInDay = 24 * 60 * 60 * 1000;
        const diffDays = Math.round((todayMidnight.getTime() - lastMidnight.getTime()) / msInDay);

        if (diffDays > 1) {
            // Streak was lost
            activeStreak = 0;
        }
    }

    // 2. Fetch "Continue Learning" (Next incomplete lesson from recently enrolled course)
    const recentEnrollment = enrollments.find(e => !e.completed);
    let nextLesson = null;
    let continueCourseSlug = null;

    if (recentEnrollment) {
        const progress = await prisma.progress.findMany({
            where: { userId, courseId: recentEnrollment.courseId },
            include: { lesson: true }
        });

        const completedLessonIds = progress.filter(p => p.completed).map(p => p.lessonId);

        const allLessons = await prisma.lesson.findMany({
            where: { courseId: recentEnrollment.courseId },
            orderBy: { order: 'asc' }
        });

        nextLesson = allLessons.find(l => !completedLessonIds.includes(l.id));
        continueCourseSlug = recentEnrollment.course.slug;
    }

    // 3. Recommended Courses
    const enrolledCourseIds = enrollments.map(e => e.courseId);

    const recommendations = await prisma.course.findMany({
        where: {
            id: { notIn: enrolledCourseIds },
            published: true
        },
        take: 3,
        orderBy: {
            enrollments: {
                _count: 'desc'
            }
        },
        include: {
            _count: {
                select: { lessons: true, enrollments: true }
            }
        }
    });

    return (
        <div className={styles.page}>
            <section className={styles.header}>
                <div className="container">
                    <div className={styles.headerFlex}>
                        <div>
                            <h1 className={styles.title}>My Learning</h1>
                            <p className={styles.subtitle}>Welcome back, {session?.user?.name || 'Student'}.</p>
                        </div>
                        <div className={styles.streakBadge}>
                            🔥 {activeStreak} Day Streak
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles.content}>
                <div className="container">

                    {nextLesson && continueCourseSlug && (
                        <div className={styles.continueSection}>
                            <h2 className={styles.sectionTitle}>Continue Learning</h2>
                            <div className={styles.continueCard}>
                                <div className={styles.continueInfo}>
                                    <span className={styles.continueCourseName}>{recentEnrollment?.course?.title}</span>
                                    <h3 className={styles.continueLessonTitle}>{nextLesson.title}</h3>
                                </div>
                                <Link href={`/courses/${continueCourseSlug}`} className="btn btn-primary" style={{ flexShrink: 0 }}>
                                    Resume Course ▶
                                </Link>
                            </div>
                        </div>
                    )}

                    <h2 className={styles.sectionTitle}>Your Enrolled Courses</h2>
                    {enrollments.length > 0 ? (
                        <div className="grid-3" style={{ marginBottom: '40px' }}>
                            {enrollments.map((en: any) => (
                                <CourseCard key={en.course.id} course={en.course} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>📚</div>
                            <h3>You haven't enrolled in any courses yet</h3>
                            <p>Explore our catalog to start learning today.</p>
                            <Link href="/courses" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
                                Browse Courses
                            </Link>
                        </div>
                    )}

                    {recommendations.length > 0 && (
                        <div className={styles.recommendationsSection}>
                            <h2 className={styles.sectionTitle}>Recommended For You</h2>
                            <p className={styles.sectionSubtitle}>Based on popular courses you haven't taken yet.</p>
                            <div className="grid-3">
                                {recommendations.map((course: any) => (
                                    <CourseCard key={course.id} course={course} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
