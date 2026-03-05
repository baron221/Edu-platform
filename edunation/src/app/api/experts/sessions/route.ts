import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { notifyNewExpertSession } from '@/lib/telegram';

// POST /api/experts/sessions
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!student) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { expertId, topic, scheduledAt, durationHours } = await req.json();

    if (!expertId || !topic?.trim() || !scheduledAt) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const expert = await prisma.user.findFirst({
        where: { id: expertId, isExpert: true },
        select: {
            id: true,
            name: true,
            telegramId: true,
            expertApplications: {
                where: { status: 'approved' },
                select: { hourlyRate: true },
                take: 1,
            },
        },
    });

    if (!expert) return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
    if (expert.id === student.id) return NextResponse.json({ error: 'Cannot book yourself' }, { status: 400 });

    const hours = Math.max(1, Math.min(8, Number(durationHours) || 1));
    const hourlyRate = expert.expertApplications[0]?.hourlyRate ?? 0;
    const totalPrice = hourlyRate * hours;

    const expertSession = await prisma.expertSession.create({
        data: {
            expertId: expert.id,
            studentId: student.id,
            topic: topic.trim(),
            scheduledAt: new Date(scheduledAt),
            durationHours: hours,
            totalPrice,
        },
    });

    // Notify expert channel & DM
    notifyNewExpertSession({
        expertName: expert.name,
        studentName: student.name,
        topic: topic.trim(),
        scheduledAt: new Date(scheduledAt),
        totalPrice,
        expertTelegramId: expert.telegramId,
    }).catch(() => { });

    return NextResponse.json({ ok: true, session: expertSession });
}
