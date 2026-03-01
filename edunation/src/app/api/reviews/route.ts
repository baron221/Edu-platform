import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// GET /api/reviews?courseId=xxx — get all reviews for a course
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return new NextResponse('Missing courseId', { status: 400 });
        }

        const reviews = await prisma.review.findMany({
            where: { courseId },
            include: {
                user: {
                    select: { name: true, image: true }
                }
            },
            orderBy: { createdAt: 'desc' },
        });

        // Compute average rating
        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

        return NextResponse.json({ reviews, avgRating: Math.round(avgRating * 10) / 10 });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

// POST /api/reviews — create or update a review (1 per user per course)
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { courseId, rating, comment } = await req.json();

        if (!courseId || !rating || rating < 1 || rating > 5) {
            return new NextResponse('Invalid data. Rating must be 1-5.', { status: 400 });
        }

        // Verify the user is enrolled in the course
        const enrollment = await prisma.enrollment.findUnique({
            where: { userId_courseId: { userId, courseId } }
        });

        if (!enrollment) {
            return new NextResponse('You must be enrolled to review this course.', { status: 403 });
        }

        // Upsert — one review per user per course
        const review = await prisma.review.upsert({
            where: { userId_courseId: { userId, courseId } },
            update: { rating, comment },
            create: { userId, courseId, rating, comment },
            include: {
                user: { select: { name: true, image: true } }
            }
        });

        return NextResponse.json(review);
    } catch (error) {
        console.error('Error submitting review:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
