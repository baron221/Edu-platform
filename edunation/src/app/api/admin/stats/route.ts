import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const [totalCourses, totalUsers, totalEnrollments, recentUsers, enrollments] = await Promise.all([
            prisma.course.count(),
            prisma.user.count(),
            prisma.enrollment.count(),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, role: true, createdAt: true },
            }),
            prisma.enrollment.findMany({
                include: {
                    course: {
                        include: {
                            _count: { select: { lessons: true } }
                        }
                    },
                    user: {
                        include: {
                            progress: true
                        }
                    }
                }
            })
        ]);

        // Calculate Revenue from non-free courses
        let totalRevenue = 0;

        // Calculate drop-off points per course
        const courseStats: Record<string, { title: string, enrollments: number, completions: number, totalLessons: number, avgProgress: number }> = {};

        enrollments.forEach(en => {
            if (!en.course.isFree) {
                totalRevenue += en.course.price;
            }

            const courseId = en.course.id;
            if (!courseStats[courseId]) {
                courseStats[courseId] = {
                    title: en.course.title,
                    enrollments: 0,
                    completions: 0,
                    totalLessons: en.course._count.lessons,
                    avgProgress: 0
                };
            }

            courseStats[courseId].enrollments += 1;

            // Calculate progress for this user in this course
            const userProgress = en.user.progress.filter(p => p.courseId === courseId && p.completed).length;
            const progressPercent = en.course._count.lessons > 0 ? (userProgress / en.course._count.lessons) * 100 : 0;

            courseStats[courseId].avgProgress += progressPercent;

            if (en.completed) {
                courseStats[courseId].completions += 1;
            }
        });

        // Finalize average progress
        const courseDropoffs = Object.values(courseStats).map(stat => ({
            ...stat,
            avgProgress: stat.enrollments > 0 ? Array.from(stat.avgProgress.toString()).reduce((a, b) => a + Number(b), 0) / stat.enrollments : 0
        })).sort((a, b) => b.enrollments - a.enrollments).slice(0, 5); // Top 5

        return NextResponse.json({
            totalCourses,
            totalUsers,
            totalEnrollments,
            recentUsers,
            totalRevenue,
            courseDropoffs
        });
    } catch (e) {
        console.error('Error fetching admin stats:', e);
        return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }
}
