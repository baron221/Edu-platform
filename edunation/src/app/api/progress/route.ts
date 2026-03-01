import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { sendCourseCompletionEmail } from '@/lib/email';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        const userEmail = (session?.user as any)?.email;
        const userName = session?.user?.name || 'Student';

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { courseId, lessonId, completed, watchedSec } = body;

        if (!courseId || !lessonId) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        const existingProgress = await prisma.progress.findUnique({
            where: { userId_lessonId: { userId, lessonId } }
        });
        const wasAlreadyCompleted = existingProgress?.completed === true;

        const progress = await prisma.progress.upsert({
            where: { userId_lessonId: { userId, lessonId } },
            update: {
                completed: completed !== undefined ? completed : undefined,
                watchedSec: watchedSec !== undefined ? watchedSec : undefined
            },
            create: {
                userId, courseId, lessonId,
                completed: completed || false,
                watchedSec: watchedSec || 0
            }
        });

        if (completed && !wasAlreadyCompleted) {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { currentStreak: true, lastActivityDate: true }
            });

            const now = new Date();
            let newStreak = 1;

            if (user?.lastActivityDate) {
                const lastActivity = new Date(user.lastActivityDate);
                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const lastMidnight = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
                const diffDays = Math.round((todayMidnight.getTime() - lastMidnight.getTime()) / 86400000);

                if (diffDays === 0) newStreak = user.currentStreak || 1;
                else if (diffDays === 1) newStreak = (user.currentStreak || 0) + 1;
                else newStreak = 1;
            }

            await prisma.user.update({
                where: { id: userId },
                data: { points: { increment: 50 }, currentStreak: newStreak, lastActivityDate: now }
            });
        }

        // Check if all lessons are done → mark enrollment complete + send email
        if (completed) {
            const courseLessons = await prisma.lesson.count({ where: { courseId } });
            const completedLessons = await prisma.progress.count({
                where: { userId, courseId, completed: true }
            });

            if (completedLessons >= courseLessons) {
                // Mark enrollment as completed
                await prisma.enrollment.update({
                    where: { userId_courseId: { userId, courseId } },
                    data: { completed: true }
                });

                // Auto-issue certificate if not already done
                const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
                const cert = await prisma.certificate.upsert({
                    where: { userId_courseId: { userId, courseId } },
                    update: {},
                    create: { userId, courseId }
                });

                // Send completion email
                if (userEmail && course) {
                    await sendCourseCompletionEmail(userEmail, userName, course.title, cert.id);
                }
            }
        }

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error updating progress:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
