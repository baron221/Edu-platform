import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const courseId = params.id;
        const userRole = (session.user as any)?.role;

        // Verify the user is the instructor of this course or an admin
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        if (userRole !== 'admin' && course.instructorId !== session.user.id) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch users who are enrolled or have progress
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    { enrollments: { some: { courseId } } },
                    { progress: { some: { courseId } } }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                university: true,
                progress: {
                    where: { courseId },
                    select: {
                        lessonId: true,
                        completed: true,
                        watchedSec: true,
                        updatedAt: true,
                        unlockedByInstructor: true
                    }
                }
            }
        });

        const studentsData = users.map(user => {
            const completedCount = user.progress.filter(p => p.completed).length;
            const totalWatchedSec = user.progress.reduce((sum, p) => sum + (p.watchedSec || 0), 0);
            
            // find the latest progress update
            let lastActive = null;
            if (user.progress.length > 0) {
                lastActive = user.progress.reduce((latest, current) => {
                    return current.updatedAt > latest.updatedAt ? current : latest;
                }).updatedAt;
            }

            return {
                id: user.id,
                name: user.name,
                email: user.email,
                university: user.university,
                completedLessons: completedCount,
                totalWatchedSec,
                lastActive,
                progress: user.progress
            };
        });

        // Also fetch course total lessons and lesson titles to show X / Total and unlock dropdown
        const lessons = await prisma.lesson.findMany({
            where: { courseId },
            orderBy: { order: 'asc' },
            select: { id: true, title: true, order: true }
        });

        return NextResponse.json({ students: studentsData, lessons });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
