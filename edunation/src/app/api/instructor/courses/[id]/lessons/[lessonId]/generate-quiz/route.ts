import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const quizSchema = z.object({
    title: z.string().describe("A short, descriptive title for the quiz"),
    questions: z.array(
        z.object({
            questionText: z.string().describe("The text of the multiple-choice question"),
            options: z.array(z.string()).length(4).describe("An array of exactly 4 possible text options"),
            correctAnswerIndex: z.number().int().min(0).max(3).describe("The index (0-3) of the correct option in the options array"),
            explanation: z.string().describe("A 1-2 sentence explanation of why this answer is correct")
        })
    ).length(5).describe("An array of exactly 5 multiple choice questions")
});

function getLangInstruction(language: string): string {
    if (language === 'uz') {
        return "Respond entirely in Uzbek language. All questions, options, and explanations must be written in Uzbek.";
    }
    if (language === 'ru') {
        return "Respond entirely in Russian language. All questions, options, and explanations must be written in Russian.";
    }
    return "Respond entirely in English.";
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const userId = (session.user as any).id;
        const role = (session.user as any).role;

        // Verify ownership
        const course = await prisma.course.findUnique({
            where: { id: resolvedParams.id },
            select: { instructorId: true, title: true, category: true }
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        if (role !== 'admin' && course.instructorId !== userId) {
            return NextResponse.json({ error: 'Forbidden: You do not own this course' }, { status: 403 });
        }

        const lesson = await prisma.lesson.findUnique({
            where: { id: resolvedParams.lessonId, courseId: resolvedParams.id },
            select: { id: true, title: true, content: true }
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        const body = await request.json().catch(() => ({}));
        const language: string = (body.language as string) || 'en';
        const langInstruction = getLangInstruction(language);

        const hasContent = lesson.content && lesson.content.trim().length > 50;

        const prompt = hasContent
            ? [
                `You are an expert educational AI. ${langInstruction}`,
                `Generate a 5-question multiple-choice quiz based STRICTLY on the following lesson text. Make sure to also provide a suitable title for the quiz.`,
                `Do not include external knowledge that is not covered in the text.`,
                ``,
                `Course: ${course.title} (${course.category})`,
                `Lesson Title: ${lesson.title}`,
                ``,
                `Lesson Content:`,
                lesson.content,
            ].join('\n')
            : [
                `You are an expert educational AI. ${langInstruction}`,
                `Generate a 5-question multiple-choice quiz that tests understanding of the topic "${lesson.title}"`,
                `from the course "${course.title}" (category: ${course.category}). Make sure to also provide a suitable title for the quiz.`,
                ``,
                `The quiz should cover fundamental concepts, best practices, and key ideas a student would learn`,
                `in a real video lesson on this topic. Make the questions practical and educational.`,
            ].join('\n');

        // Call Gemini
        const { object: quizResponse } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: quizSchema,
            prompt,
        });

        // Save to Database
        const createdQuiz = await prisma.quiz.create({
            data: {
                lessonId: lesson.id,
                title: quizResponse.title,
                questions: {
                    create: quizResponse.questions.map((q, idx) => ({
                        text: q.questionText,
                        explanation: q.explanation,
                        order: idx,
                        options: {
                            create: q.options.map((optText, optIdx) => ({
                                text: optText,
                                isCorrect: optIdx === q.correctAnswerIndex
                            }))
                        }
                    }))
                }
            },
            include: {
                questions: {
                    include: {
                        options: true
                    }
                }
            }
        });

        return NextResponse.json(createdQuiz, { status: 201 });

    } catch (error) {
        console.error('[GENERATE_QUIZ_ERROR]', error);
        return NextResponse.json({ error: 'Failed to generate and save quiz. Please try again.' }, { status: 500 });
    }
}
