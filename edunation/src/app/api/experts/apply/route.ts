import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { notifyExpertApplication } from '@/lib/telegram';

// POST /api/experts/apply
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Cannot apply if already an expert or has a pending/approved application
    const existing = await prisma.expertApplication.findFirst({
        where: { userId: user.id, status: { in: ['pending', 'approved'] } },
    });
    if (existing) {
        return NextResponse.json({ error: 'Application already exists', status: existing.status }, { status: 409 });
    }

    const { motivation, skills, hourlyRate, telegramUsername } = await req.json();

    if (!motivation?.trim() || !skills?.trim() || !hourlyRate) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const application = await prisma.expertApplication.create({
        data: {
            userId: user.id,
            motivation: motivation.trim(),
            skills: skills.trim(),
            hourlyRate: Number(hourlyRate),
            telegramUsername: telegramUsername?.trim() || null,
        },
    });

    // Notify Telegram expert channel (non-blocking)
    notifyExpertApplication({
        name: user.name,
        email: user.email,
        skills: skills.trim(),
        motivation: motivation.trim(),
        hourlyRate: Number(hourlyRate),
        telegramUsername,
    }).catch(() => { });

    return NextResponse.json({ ok: true, application });
}
