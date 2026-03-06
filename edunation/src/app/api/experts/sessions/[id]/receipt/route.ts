import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// PATCH /api/experts/sessions/[id]/receipt — student uploads receipt URL
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const student = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!student) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const expertSession = await prisma.expertSession.findUnique({ where: { id } });
    if (!expertSession || expertSession.studentId !== student.id) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { receiptUrl } = await req.json();
    if (!receiptUrl) return NextResponse.json({ error: 'Receipt URL required' }, { status: 400 });

    const updated = await prisma.expertSession.update({
        where: { id },
        data: { receiptUrl, status: 'receipt_uploaded' },
    });

    return NextResponse.json({ ok: true, session: updated });
}
