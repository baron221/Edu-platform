import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { id: courseId } = await params;
        const { userId, lessonId } = await req.json();

        if (!userId || !lessonId) {
            return new NextResponse('Missing userId or lessonId', { status: 400 });
        }

        // Verify the user is an admin or the instructor of this course
        const userRole = (session.user as any).role;
        const currentUserId = (session.user as any).id;
        
        let isAuthorized = userRole === 'admin';
        if (!isAuthorized && userRole === 'instructor') {
            const course = await prisma.course.findUnique({
                where: { id: courseId }
            });
            if (course?.instructorId === currentUserId) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // Upsert progress to set unlockedByInstructor = true
        const progress = await prisma.progress.upsert({
            where: {
                userId_lessonId: {
                    userId,
                    lessonId
                }
            },
            update: {
                unlockedByInstructor: true
            },
            create: {
                userId,
                courseId,
                lessonId,
                unlockedByInstructor: true,
                completed: false,
                watchedSec: 0
            }
        });

        return NextResponse.json(progress);
    } catch (error) {
        console.error('Error unlocking lesson:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
