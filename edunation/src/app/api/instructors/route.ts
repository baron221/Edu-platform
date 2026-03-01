import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/instructors — list all instructors with stats
export async function GET() {
    // --- Source 1: Real user accounts with instructor/admin role ---
    const userInstructors = await prisma.user.findMany({
        where: { role: { in: ['instructor', 'admin'] } },
        select: {
            id: true,
            name: true,
            image: true,
            instructorProfile: true,
            instructorSubscription: true,
        },
    });

    const enrichedUsers = await Promise.all(
        userInstructors.map(async (u) => {
            const courses = await prisma.course.findMany({
                where: {
                    published: true,
                    OR: [
                        { instructorId: u.id },
                        { instructor: u.name ?? '__no_match__', instructorId: null },
                    ],
                },
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
                id: u.id,
                name: u.name,
                image: u.image,
                instructorProfile: u.instructorProfile,
                instructorSubscription: u.instructorSubscription,
                courseCount: courses.length,
                totalStudents,
                avgRating,
                isRealUser: true,
            };
        })
    );

    // --- Source 2: Virtual instructors from course.instructor string field ---
    // Group courses by instructor name (those not linked to any user)
    const unlinkedCourses = await prisma.course.findMany({
        where: { published: true, instructorId: null },
        select: {
            instructor: true,
            _count: { select: { enrollments: true, reviews: true } },
            reviews: { select: { rating: true } },
        },
    });

    // Group by instructor name
    const byName = new Map<string, { totalStudents: number; courseCount: number; allRatings: number[] }>();
    for (const c of unlinkedCourses) {
        const name = c.instructor || 'Unknown';
        // Skip if a real user with this name already exists
        if (enrichedUsers.some(u => u.name === name)) continue;

        const existing = byName.get(name) || { totalStudents: 0, courseCount: 0, allRatings: [] };
        existing.courseCount += 1;
        existing.totalStudents += c._count.enrollments;
        existing.allRatings.push(...c.reviews.map(r => r.rating));
        byName.set(name, existing);
    }

    const virtualInstructors = Array.from(byName.entries()).map(([name, stats]) => ({
        id: `virtual_${name.toLowerCase().replace(/\s+/g, '_')}`,
        name,
        image: null,
        instructorProfile: null,
        instructorSubscription: null,
        courseCount: stats.courseCount,
        totalStudents: stats.totalStudents,
        avgRating: stats.allRatings.length
            ? Math.round((stats.allRatings.reduce((a, b) => a + b, 0) / stats.allRatings.length) * 10) / 10
            : 0,
        isRealUser: false,
    }));

    // Merge and sort by courseCount descending
    const all = [...enrichedUsers, ...virtualInstructors]
        .sort((a, b) => b.courseCount - a.courseCount);

    return NextResponse.json(all);
}
