import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/instructors/[slug] — full instructor profile
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;

    const profile = await prisma.instructorProfile.findUnique({
        where: { slug },
        include: { user: { select: { id: true, name: true, image: true, role: true } } },
    });

    if (!profile) return new NextResponse('Not found', { status: 404 });

    const courses = await prisma.course.findMany({
        where: { instructorId: profile.userId, published: true },
        include: {
            _count: { select: { enrollments: true, reviews: true } },
            reviews: { select: { rating: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    const totalStudents = courses.reduce((s, c) => s + c._count.enrollments, 0);
    const allRatings = courses.flatMap(c => c.reviews.map(r => r.rating));
    const avgRating = allRatings.length
        ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
        : 0;
    const totalReviews = courses.reduce((s, c) => s + c._count.reviews, 0);

    const subscription = await prisma.instructorSubscription.findUnique({
        where: { userId: profile.userId },
    });

    return NextResponse.json({
        profile,
        courses,
        stats: { totalStudents, avgRating, totalReviews, courseCount: courses.length },
        subscription,
    });
}
