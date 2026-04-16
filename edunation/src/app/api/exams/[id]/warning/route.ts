import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: examId } = await params;
        const userId = (session.user as any).id;

        // Increment the warning count for this attempt
        await prisma.examAttempt.update({
            where: {
                userId_examId: { userId, examId }
            },
            data: {
                warningCount: { increment: 1 }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[EXAM_WARNING_POST]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
