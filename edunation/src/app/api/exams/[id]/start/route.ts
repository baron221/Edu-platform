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

        // 1. Verify exam exists
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            select: { id: true, title: true }
        });

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        // 2. Check if attempt already exists (One-time submission rule)
        const existing = await prisma.examAttempt.findUnique({
            where: {
                userId_examId: { userId, examId }
            }
        });

        if (existing) {
            return NextResponse.json({ 
                error: 'You have already started or submitted this exam.',
                attempt: existing 
            }, { status: 400 });
        }

        // 3. Create new attempt
        const attempt = await prisma.examAttempt.create({
            data: {
                examId,
                userId,
                status: 'IN_PROGRESS',
                startTime: new Date()
            }
        });

        return NextResponse.json(attempt, { status: 201 });
    } catch (error) {
        console.error('[EXAM_START_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
