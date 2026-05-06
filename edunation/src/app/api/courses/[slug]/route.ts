import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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
                exams: true,
                lessons: {
                    orderBy: { order: 'asc' },
                    include: {
                        quizzes: {
                            include: {
                                questions: {
                                    include: {
                                        options: true
                                    },
                                    orderBy: { order: 'asc' }
                                }
                            }
                        },
                        resources: true
                    }
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

            // Subscriptions are effectively unlimited for now
            isSubscribed = true;

            progress = await prisma.progress.findMany({
                where: {
                    userId,
                    courseId: course.id
                }
            });
            getsUniversityFreeAccess = true; // Everyone gets free access
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

