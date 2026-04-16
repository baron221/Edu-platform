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
        const { answers } = await request.json(); // Map of { questionId: answerTextOrOptionId }

        // 1. Fetch the attempt to verify it's valid
        const attempt = await prisma.examAttempt.findUnique({
            where: { userId_examId: { userId, examId } },
            include: { 
                exam: { 
                    include: { 
                        questions: { 
                            include: { options: true } 
                        } 
                    } 
                } 
            }
        });

        if (!attempt) {
            return NextResponse.json({ error: 'No exam attempt found' }, { status: 404 });
        }

        if (attempt.status !== 'IN_PROGRESS') {
            return NextResponse.json({ error: 'Exam already submitted' }, { status: 400 });
        }

        // 2. Validate Time Limit (with 30s grace period)
        const now = new Date();
        const startTime = new Date(attempt.startTime);
        const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
        
        if (elapsedMinutes > attempt.exam.timeLimit + 0.5) {
             // We still process it but could flag it or auto-submit earlier
             console.log(`Late submission from user ${userId} for exam ${examId}`);
        }

        // 3. Grade the questions
        let totalScore = 0;
        const responseData = [];

        for (const q of attempt.exam.questions) {
            const userAnswer = answers[q.id];
            let isCorrect = false;
            let pointsEarned = 0;

            if (q.type === 'MCQ') {
                const correctOption = q.options.find(o => o.isCorrect);
                if (correctOption && userAnswer === correctOption.id) {
                    isCorrect = true;
                    pointsEarned = q.points;
                }
            } else if (q.type === 'CODING') {
                // Coding questions typically require manual review or full Judge0 pass.
                // For this implementation, we mark them for review (pointsEarned = 0 initially).
                isCorrect = false; 
                pointsEarned = 0;
            }

            totalScore += pointsEarned;
            responseData.push({
                attemptId: attempt.id,
                questionId: q.id,
                answer: String(userAnswer || ''),
                isCorrect,
                pointsEarned,
            });
        }

        // 4. Update Database in Transaction
        await prisma.$transaction([
            prisma.examResponse.createMany({
                data: responseData
            }),
            prisma.examAttempt.update({
                where: { id: attempt.id },
                data: {
                    status: 'SUBMITTED',
                    submittedAt: now,
                    score: totalScore
                }
            })
        ]);

        return NextResponse.json({ 
            success: true, 
            score: totalScore,
            totalPossible: attempt.exam.questions.reduce((sum, q) => sum + q.points, 0)
        });

    } catch (error) {
        console.error('[EXAM_SUBMISSION_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
