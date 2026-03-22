import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Cache for 30 seconds to keep it "realtime" without hammering the DB
export const revalidate = 30;

export async function GET() {
    const [
        totalStudents,
        totalCourses,
        totalInstructors,
        totalEnrollments,
        avgRatingRaw,
        totalReviews,
        totalLessons,
        lastCompletedCert,
        recentCourse,
    ] = await Promise.all([
        (prisma as any).user.count(),
        (prisma as any).course.count({ where: { published: true } }),
        // Count distinct instructors from published courses
        (prisma as any).course.findMany({
            where: { published: true },
            select: { instructor: true },
            distinct: ['instructor'],
        }).then((r: any) => r.length),
        (prisma as any).enrollment.count(),
        // Average review rating
        (prisma as any).review.aggregate({ _avg: { rating: true } }),
        (prisma as any).review.count(),
        (prisma as any).lesson.count({ where: { course: { published: true } } }),
        // Most recent certificate issued
        (prisma as any).certificate.findFirst({
            orderBy: { issuedAt: 'desc' },
            include: { course: { select: { title: true } } },
        }),
        // Most recently published course
        (prisma as any).course.findFirst({
            where: { published: true },
            orderBy: { createdAt: 'desc' },
            select: { title: true, category: true },
        }),
    ]);

    const avgRating = avgRatingRaw._avg.rating
        ? Math.round(avgRatingRaw._avg.rating * 10) / 10
        : 0;

    return NextResponse.json({
        totalStudents,
        totalCourses,
        totalInstructors,
        totalEnrollments,
        totalLessons,
        avgRating,
        totalReviews,
        satisfactionRate: totalReviews > 0
            ? Math.round(
                (avgRating / 5) * 100
            )
            : 98, // default until reviews exist
        lastCompletedCourseTitle: lastCompletedCert?.course?.title || null,
        recentCourseTitle: recentCourse?.title || null,
        recentCourseCategory: recentCourse?.category || null,
        // For social proof: how many enrolled this week
        recentEnrollCount: await (prisma as any).enrollment.count({
            where: {
                enrolledAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            }
        }),
    });
}
