import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/experts/[expertId]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ expertId: string }> }) {
    const { expertId } = await params;

    const expert = await prisma.user.findFirst({
        where: { id: expertId, isExpert: true },
        select: {
            id: true,
            name: true,
            image: true,
            expertApplications: {
                where: { status: 'approved' },
                select: { skills: true, hourlyRate: true, motivation: true, telegramUsername: true },
                take: 1,
            },
            _count: { select: { enrollments: true } },
        },
    });

    if (!expert) return NextResponse.json({ error: 'Expert not found' }, { status: 404 });

    return NextResponse.json({
        id: expert.id,
        name: expert.name,
        image: expert.image,
        skills: expert.expertApplications[0]?.skills ?? '',
        hourlyRate: expert.expertApplications[0]?.hourlyRate ?? 0,
        motivation: expert.expertApplications[0]?.motivation ?? '',
        telegramUsername: expert.expertApplications[0]?.telegramUsername ?? null,
        enrolledCourses: expert._count.enrollments,
    });
}
