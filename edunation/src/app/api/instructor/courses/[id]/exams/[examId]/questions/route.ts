import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; examId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'instructor' && (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { examId } = await params;

        const questions = await prisma.examQuestion.findMany({
            where: { examId },
            include: { options: true },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json(questions);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; examId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || (session.user as any).role !== 'instructor' && (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { examId } = await params;
        const body = await request.json();

        // Create question
        const question = await prisma.examQuestion.create({
            data: {
                examId,
                type: body.type, // MCQ or CODING
                text: body.text,
                explanation: body.explanation,
                order: body.order || 0,
                points: body.points || 1,
                language: body.language,
                starterCode: body.starterCode,
                testCases: body.testCases ? body.testCases : undefined
            }
        });

        // If MCQ, create options
        if (body.type === 'MCQ' && body.options) {
            await prisma.examOption.createMany({
                data: body.options.map((opt: any) => ({
                    questionId: question.id,
                    text: opt.text,
                    isCorrect: opt.isCorrect
                }))
            });
        }

        return NextResponse.json(question);
    } catch (error) {
        console.error('[EXAM_QUESTION_POST]', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
