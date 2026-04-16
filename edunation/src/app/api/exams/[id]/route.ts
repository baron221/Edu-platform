import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: examId } = await params;

        // Fetch exam with questions (but hide isCorrect for security during the exam)
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                questions: {
                    orderBy: { order: 'asc' },
                    include: {
                        options: {
                            select: { id: true, text: true } // Do NOT include isCorrect here!
                        }
                    }
                },
                attempts: {
                    where: { userId: (session.user as any).id },
                    select: { id: true, status: true, startTime: true, submittedAt: true, score: true }
                }
            }
        });

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        return NextResponse.json(exam);
    } catch (error) {
        console.error('[EXAM_GET_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
