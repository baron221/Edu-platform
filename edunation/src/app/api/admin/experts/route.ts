import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { notifyExpertApproved, notifyExpertRejected } from '@/lib/telegram';

// GET /api/admin/experts — list all applications
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status') ?? 'pending';

    const applications = await prisma.expertApplication.findMany({
        where: status === 'all' ? {} : { status },
        include: { user: { select: { name: true, email: true, image: true } } },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(applications);
}

// PATCH /api/admin/experts — approve or reject an application
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id, action, adminNote } = await req.json(); // action: 'approve' | 'reject'

    const application = await prisma.expertApplication.findUnique({
        where: { id },
        include: { user: { select: { id: true, name: true, email: true, telegramId: true } } },
    });
    if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    await prisma.expertApplication.update({
        where: { id },
        data: { status: newStatus, adminNote: adminNote ?? null },
    });

    if (action === 'approve') {
        await prisma.user.update({
            where: { id: application.userId },
            data: { isExpert: true },
        });
        notifyExpertApproved({ name: application.user.name, email: application.user.email, telegramId: application.user.telegramId }).catch(() => { });
    } else {
        await prisma.user.update({
            where: { id: application.userId },
            data: { isExpert: false },
        });
        notifyExpertRejected({ name: application.user.name, email: application.user.email, adminNote, telegramId: application.user.telegramId }).catch(() => { });
    }

    return NextResponse.json({ ok: true, status: newStatus });
}
