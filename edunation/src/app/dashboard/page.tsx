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

    return (
        <div className={styles.page}>
            <section className={styles.header}>
                <div className="container">
                    <h1 className={styles.title}>My Learning</h1>
                    <p className={styles.subtitle}>Welcome back, {session?.user?.name || 'Student'}. Here are your enrolled courses.</p>
                </div>
            </section>

            <section className={styles.content}>
                <div className="container">
                    {enrollments.length > 0 ? (
                        <div className="grid-3">
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
                </div>
            </section>
        </div>
    );
}
