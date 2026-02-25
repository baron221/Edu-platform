import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const [totalCourses, totalUsers, totalEnrollments, recentUsers] = await Promise.all([
            prisma.course.count(),
            prisma.user.count(),
            prisma.enrollment.count(),
            prisma.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: { id: true, name: true, email: true, role: true, createdAt: true },
            }),
        ]);

        return NextResponse.json({ totalCourses, totalUsers, totalEnrollments, recentUsers });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
    }
}
