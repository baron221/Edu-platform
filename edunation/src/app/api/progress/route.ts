import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await request.json();
        const { courseId, lessonId, completed, watchedSec } = body;

        if (!courseId || !lessonId) {
            return new NextResponse('Missing required fields', { status: 400 });
        }

        // Check if the lesson was already completed before we update it
        const existingProgress = await prisma.progress.findUnique({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId
                }
            }
        });

        const wasAlreadyCompleted = existingProgress?.completed === true;

        // Upsert progress
        const progress = await prisma.progress.upsert({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId
                }
            },
            update: {
                completed: completed !== undefined ? completed : undefined,
                watchedSec: watchedSec !== undefined ? watchedSec : undefined
            },
            create: {
                userId,
                courseId,
                lessonId,
                completed: completed || false,
                watchedSec: watchedSec || 0
            }
        });

        // Award points if the lesson was just completed for the first time
        if (completed && !wasAlreadyCompleted) {
            // First, get the user's current streak info
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { currentStreak: true, lastActivityDate: true }
            });

            const now = new Date();
            let newStreak = 1;

            if (user?.lastActivityDate) {
                const lastActivity = new Date(user.lastActivityDate);

                // Set both to midnight to compare just the date parts easily
                const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const lastMidnight = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());

                const msInDay = 24 * 60 * 60 * 1000;
                const diffDays = Math.round((todayMidnight.getTime() - lastMidnight.getTime()) / msInDay);

                if (diffDays === 0) {
                    // Already studied today, keep current streak
                    newStreak = user.currentStreak || 1;
                } else if (diffDays === 1) {
                    // Studied yesterday, increment streak
                    newStreak = (user.currentStreak || 0) + 1;
                } else {
                    // Missed a day or more, reset to 1
                    newStreak = 1;
                }
            }

            await prisma.user.update({
                where: { id: userId },
                data: {
                    points: { increment: 50 }, // Award 50 points per lesson
                    currentStreak: newStreak,
                    lastActivityDate: now
                }
            });
        }

        // Check if all lessons in the course are completed
        // to mark the enrollment as completed
        if (completed) {
            const courseLessons = await prisma.lesson.count({
                where: { courseId }
            });

            const completedLessons = await prisma.progress.count({
                where: {
                    userId,
                    courseId,
                    completed: true
                }
            });

            if (completedLessons >= courseLessons) {
                await prisma.enrollment.update({
                    where: {
                        userId_courseId: {
                            userId,
                            courseId
                        }
                    },
                    data: {
                        completed: true
                    }
                });
            }
        }

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error updating progress:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
