import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

export async function GET() {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const [enrollments, allProgress, user, certificates] = await Promise.all([
        prisma.enrollment.findMany({
            where: { userId },
            include: {
                course: {
                    include: { _count: { select: { lessons: true, enrollments: true } } }
                }
            },
            orderBy: { enrolledAt: 'desc' }
        }),
        prisma.progress.findMany({ where: { userId, completed: true } }),
        prisma.user.findUnique({
            where: { id: userId },
            select: { currentStreak: true, lastActivityDate: true, points: true }
        }),
        prisma.certificate.findMany({
            where: { userId },
            include: { course: { select: { title: true, slug: true, category: true } } },
            orderBy: { issuedAt: 'desc' }
        })
    ]);

    // Streak calculation
    let activeStreak = user?.currentStreak || 0;
    if (user?.lastActivityDate) {
        const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
        const lastMidnight = new Date(user.lastActivityDate); lastMidnight.setHours(0, 0, 0, 0);
        const diffDays = Math.round((todayMidnight.getTime() - lastMidnight.getTime()) / 86400000);
        if (diffDays > 1) activeStreak = 0;
    }

    // Continue Learning
    const recentEnrollment = enrollments.find(e => !e.completed);
    let nextLesson = null;
    let recentEnrollmentSlug = null;
    let recentEnrollmentTitle = null;

    if (recentEnrollment) {
        const completedIds = allProgress.filter(p => p.courseId === recentEnrollment.courseId).map(p => p.lessonId);
        const allLessons = await prisma.lesson.findMany({
            where: { courseId: recentEnrollment.courseId },
            orderBy: { order: 'asc' }
        });
        nextLesson = allLessons.find(l => !completedIds.includes(l.id)) || null;
        recentEnrollmentSlug = recentEnrollment.course.slug;
        recentEnrollmentTitle = recentEnrollment.course.title;
    }

    // Recommendations
    const enrolledIds = enrollments.map(e => e.courseId);
    const recommendations = await prisma.course.findMany({
        where: { id: { notIn: enrolledIds }, published: true },
        take: 3,
        orderBy: { enrollments: { _count: 'desc' } },
        include: { _count: { select: { lessons: true, enrollments: true } } }
    });

    return NextResponse.json({
        enrollments,
        allProgress,
        user,
        certificates,
        recommendations,
        nextLesson,
        recentEnrollmentSlug,
        recentEnrollmentTitle,
        activeStreak,
        totalLessonsDone: allProgress.length,
        totalCompleted: enrollments.filter(e => e.completed).length,
    });
}
