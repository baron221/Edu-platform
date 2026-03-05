import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/experts/my-status
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, isExpert: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const application = await prisma.expertApplication.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
    });

    const sessionsAsStudent = await prisma.expertSession.findMany({
        where: { studentId: user.id },
        include: {
            expert: { select: { name: true, image: true } },
        },
        orderBy: { scheduledAt: 'asc' },
    });

    const sessionsAsExpert = await prisma.expertSession.findMany({
        where: { expertId: user.id },
        include: {
            student: { select: { name: true, image: true } },
        },
        orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({
        isExpert: user.isExpert,
        application,
        sessionsAsStudent,
        sessionsAsExpert,
    });
}
