import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/admin/experts/sessions — all sessions
export async function GET() {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sessions = await prisma.expertSession.findMany({
        include: {
            expert: { select: { name: true, email: true, image: true, telegramId: true } },
            student: { select: { name: true, email: true, image: true, telegramId: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(sessions);
}
