import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

// Define the Strict JSON Schema for Gemini
const quizSchema = z.object({
    questions: z.array(
        z.object({
            questionText: z.string().describe("The text of the multiple-choice question"),
            options: z.array(z.string()).length(4).describe("An array of exactly 4 possible text options"),
            correctAnswerIndex: z.number().int().min(0).max(3).describe("The index (0-3) of the correct option in the options array"),
            explanation: z.string().describe("A 1-2 sentence explanation of why this answer is correct")
        })
    ).length(5).describe("An array of exactly 5 multiple choice questions")
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;

        // 1. Fetch lesson + course context
        const lesson = await prisma.lesson.findUnique({
            where: { id: resolvedParams.lessonId },
            select: {
                title: true,
                content: true,
                course: { select: { title: true, category: true, instructor: true } }
            },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        const hasContent = lesson.content && lesson.content.trim().length > 50;

        // Build prompt — use rich content if available, fall back to title + course context
        const prompt = hasContent
            ? `You are an expert educational AI.
Generate a 5-question multiple-choice quiz based STRICTLY on the following lesson text.
Do not include external knowledge that isn't covered in the text.

Course: ${lesson.course?.title || ''} (${lesson.course?.category || ''})
Lesson Title: ${lesson.title}

Lesson Content:
${lesson.content}`
            : `You are an expert educational AI.
Generate a 5-question multiple-choice quiz that tests understanding of the topic "${lesson.title}" 
from the course "${lesson.course?.title || 'the course'}" (category: ${lesson.course?.category || 'general'}).

The quiz should cover fundamental concepts, best practices, and key ideas a student would learn 
in a real video lesson on this topic. Make the questions practical and educational.`;

        // 2. Call Gemini to generate the quiz
        const { object: quizResponse } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: quizSchema,
            prompt,
        });

        return NextResponse.json({
            quiz: quizResponse.questions,
            generatedFrom: hasContent ? 'content' : 'topic',
        }, { status: 200 });

    } catch (error) {
        console.error('[AI_QUIZ_ERROR]', error);
        return NextResponse.json({ error: 'Failed to generate quiz. Please try again.' }, { status: 500 });
    }
}
