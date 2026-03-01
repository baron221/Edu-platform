import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/instructors — list all instructors with their profile & stats
export async function GET() {
    const instructors = await prisma.user.findMany({
        where: { role: 'instructor' },
        select: {
            id: true,
            name: true,
            image: true,
            instructorProfile: true,
            instructorSubscription: true,
        },
    });

    // For each instructor, fetch their courses + aggregate stats
    const enriched = await Promise.all(
        instructors.map(async (u) => {
            const courses = await prisma.course.findMany({
                where: { instructorId: u.id, published: true },
                include: {
                    _count: { select: { enrollments: true, reviews: true } },
                    reviews: { select: { rating: true } },
                },
            });

            const totalStudents = courses.reduce((s, c) => s + c._count.enrollments, 0);
            const allRatings = courses.flatMap(c => c.reviews.map(r => r.rating));
            const avgRating = allRatings.length
                ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
                : 0;

            return {
                ...u,
                courseCount: courses.length,
                totalStudents,
                avgRating,
            };
        })
    );

    return NextResponse.json(enriched);
}
