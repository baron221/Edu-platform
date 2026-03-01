import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

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
        const recentEnrollment = await prisma.enrollment.findFirst({
            where: { userId, completed: false },
            orderBy: { enrolledAt: 'desc' },
            include: { course: true }
        });

        let nextLesson = null;
        if (recentEnrollment) {
            // Find the most recent progress for this course
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
        }

        // 3. Recommended Courses (Top enrolled courses the user IS NOT already enrolled in)
        const enrolledCourseIds = (await prisma.enrollment.findMany({
            where: { userId },
            select: { courseId: true }
        })).map((e: any) => e.courseId);

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

        return NextResponse.json({
            streak: activeStreak,
            continueLearning: nextLesson ? {
                course: recentEnrollment?.course,
                lesson: nextLesson
            } : null,
            recommendations
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
