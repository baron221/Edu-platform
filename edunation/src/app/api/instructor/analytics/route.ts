import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

function getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getMonthLabel(key: string): string {
    const [year, month] = key.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        const role = (session?.user as any)?.role;

        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const whereClause = role === 'admin' ? {} : { instructorId: userId };

        // Fetch all relevant data in parallel
        const [courses, purchases, enrollments] = await Promise.all([
            prisma.course.findMany({
                where: whereClause,
                include: {
                    _count: { select: { enrollments: true, lessons: true } },
                    reviews: { select: { rating: true } },
                    enrollments: { select: { enrolledAt: true } },
                    purchases: {
                        where: { status: 'completed' },
                        select: { amount: true, createdAt: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.purchase.findMany({
                where: {
                    status: 'completed',
                    course: whereClause,
                },
                select: { amount: true, createdAt: true, courseId: true },
            }),
            prisma.enrollment.findMany({
                where: { course: whereClause },
                select: { enrolledAt: true, courseId: true },
            }),
        ]);

        // ── Overview Stats ──
        const totalEarnings = purchases.reduce((sum, p) => sum + p.amount, 0);
        const totalEnrollments = enrollments.length;
        const activeCourses = courses.filter(c => c.published).length;

        let totalRatingSum = 0;
        let totalRatingCount = 0;
        courses.forEach(c => {
            c.reviews.forEach(r => {
                totalRatingSum += r.rating;
                totalRatingCount++;
            });
        });
        const avgRating = totalRatingCount > 0
            ? Math.round((totalRatingSum / totalRatingCount) * 10) / 10
            : 0;

        // ── Per-course breakdown ──
        const courseStats = courses.map(c => {
            const courseRatings = c.reviews.map(r => r.rating);
            const courseAvgRating = courseRatings.length > 0
                ? Math.round((courseRatings.reduce((a, b) => a + b, 0) / courseRatings.length) * 10) / 10
                : 0;
            const revenue = c.purchases.reduce((sum, p) => sum + p.amount, 0);

            return {
                id: c.id,
                title: c.title,
                category: c.category,
                level: c.level,
                isFree: c.isFree,
                published: c.published,
                enrollments: c._count.enrollments,
                lessons: c._count.lessons,
                avgRating: courseAvgRating,
                reviewCount: courseRatings.length,
                revenue,
            };
        });

        // ── Enrollment Trend (last 6 months) ──
        const now = new Date();
        const monthKeys: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            monthKeys.push(getMonthKey(d));
        }

        const enrollmentsByMonth: Record<string, number> = {};
        monthKeys.forEach(k => { enrollmentsByMonth[k] = 0; });
        enrollments.forEach(e => {
            const key = getMonthKey(new Date(e.enrolledAt));
            if (key in enrollmentsByMonth) enrollmentsByMonth[key]++;
        });

        const enrollmentTrend = monthKeys.map(key => ({
            month: getMonthLabel(key),
            count: enrollmentsByMonth[key],
        }));

        // ── Revenue Trend (last 6 months) ──
        const revenueByMonth: Record<string, number> = {};
        monthKeys.forEach(k => { revenueByMonth[k] = 0; });
        purchases.forEach(p => {
            const key = getMonthKey(new Date(p.createdAt));
            if (key in revenueByMonth) revenueByMonth[key] += p.amount;
        });

        const revenueTrend = monthKeys.map(key => ({
            month: getMonthLabel(key),
            amount: revenueByMonth[key],
        }));

        // ── Top performer ──
        const topCourse = [...courseStats].sort((a, b) => b.enrollments - a.enrollments)[0] || null;

        return NextResponse.json({
            overview: {
                totalEarnings,
                totalEnrollments,
                avgRating,
                activeCourses,
                totalCourses: courses.length,
                totalReviews: totalRatingCount,
            },
            courseStats,
            enrollmentTrend,
            revenueTrend,
            topCourse,
        });
    } catch (err) {
        console.error('[instructor/analytics]', err);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
