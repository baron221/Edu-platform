import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/experts — public list of approved experts
export async function GET() {
    try {
        const experts = await prisma.user.findMany({
            where: { isExpert: true },
            select: {
                id: true,
                name: true,
                image: true,
                expertApplications: {
                    where: { status: 'approved' },
                    select: { skills: true, hourlyRate: true, motivation: true },
                    take: 1,
                },
                _count: { select: { enrollments: true } },
            },
            orderBy: { name: 'asc' },
        });

        const result = experts.map(u => ({
            id: u.id,
            name: u.name,
            image: u.image,
            skills: u.expertApplications[0]?.skills ?? '',
            hourlyRate: u.expertApplications[0]?.hourlyRate ?? 0,
            motivation: u.expertApplications[0]?.motivation ?? '',
            enrolledCourses: u._count.enrollments,
        }));

        return NextResponse.json(result);
    } catch (err) {
        console.error('[EXPERTS_GET]', err);
        return NextResponse.json({ error: 'Failed to fetch experts' }, { status: 500 });
    }
}
