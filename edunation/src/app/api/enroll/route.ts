import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const userEmail = (session?.user as any)?.email || '';

        const body = await request.json();
        const { courseId } = body;

        if (!courseId) {
            return new NextResponse('Missing courseId', { status: 400 });
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId
                }
            }
        });

        if (existingEnrollment) {
            return new NextResponse('Already enrolled', { status: 400 });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId }
        });

        if (!course) {
            return new NextResponse('Course not found', { status: 404 });
        }

        const enrollment = await prisma.enrollment.create({
            data: {
                userId,
                courseId
            }
        });

        return NextResponse.json(enrollment);
    } catch (error) {
        console.error('Error enrolling:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
