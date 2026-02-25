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

        // University Free Access Check
        const isUniversityStudent = /^\d{6}@npuu\.uz$/i.test(userEmail);
        const isEligibleCategory = ['math', 'it', 'web development', 'computer science', 'english'].includes(course.category.toLowerCase());
        const getsUniversityFreeAccess = isUniversityStudent && isEligibleCategory;

        // Only allow enrollment if the course is free (for this endpoint)
        if (!course.isFree && !getsUniversityFreeAccess) {
            // For paid courses, we'd normally verify payment here. 
            // Since there's no payment gateway yet, we just block free enrollment.
            // UNLESS the user has an active Pro subscription.
            const subscription = await prisma.subscription.findUnique({
                where: { userId }
            });
            const isPro = subscription?.status === 'active' && subscription.plan !== 'free';
            if (!isPro) {
                return new NextResponse('Payment required', { status: 402 });
            }
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
