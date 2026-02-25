import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const { slug } = await params;

        const course = await prisma.course.findUnique({
            where: { slug },
            include: {
                lessons: {
                    orderBy: { order: 'asc' }
                },
                _count: {
                    select: { enrollments: true, reviews: true }
                }
            }
        });

        if (!course) {
            return new NextResponse('Course not found', { status: 404 });
        }

        let isEnrolled = false;
        let isSubscribed = false;
        let progress: any[] = [];
        let getsUniversityFreeAccess = false;

        const userId = (session?.user as any)?.id;
        const userEmail = (session?.user as any)?.email || '';

        if (userId) {
            const enrollment = await prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId: userId,
                        courseId: course.id
                    }
                }
            });
            isEnrolled = !!enrollment;

            const subscription = await prisma.subscription.findUnique({
                where: { userId: userId }
            });
            isSubscribed = subscription?.status === 'active' && subscription.plan !== 'free';

            progress = await prisma.progress.findMany({
                where: {
                    userId,
                    courseId: course.id
                }
            });
            const isUniversityStudent = /^\d{6}@npuu\.uz$/i.test(userEmail);
            const isEligibleCategory = ['math', 'it', 'web development', 'computer science', 'english'].includes(course.category.toLowerCase());
            getsUniversityFreeAccess = isUniversityStudent && isEligibleCategory;
        }

        return NextResponse.json({
            ...course,
            isEnrolled,
            isSubscribed,
            progress,
            getsUniversityFreeAccess
        });
    } catch (error) {
        console.error('Error fetching course:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
