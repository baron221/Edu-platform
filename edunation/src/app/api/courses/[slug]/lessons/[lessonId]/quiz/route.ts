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

        // 1. Fetch the lesson content to use as the factual baseline
        const lesson = await prisma.lesson.findUnique({
            where: { id: resolvedParams.lessonId },
            select: { title: true, content: true },
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        if (!lesson.content || lesson.content.trim() === '') {
            return NextResponse.json(
                { error: 'This lesson has no text content. The instructor needs to add reading material or an AI-generated transcript first before a quiz can be generated.' },
                { status: 400 }
            );
        }

        // 2. Call Gemini to generate the quiz
        const { object: quizResponse } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: quizSchema,
            prompt: `
        You are an expert educational AI. 
        Generate a 5-question multiple-choice quiz based STRICTLY on the following lesson text. 
        Do not include external knowledge that isn't covered in the text.
        
        Lesson Title: ${lesson.title}
        
        Lesson Content:
        ${lesson.content}
      `,
        });

        return NextResponse.json({ quiz: quizResponse.questions }, { status: 200 });
    } catch (error) {
        console.error('[AI_QUIZ_ERROR]', error);
        return NextResponse.json({ error: 'Failed to generate quiz' }, { status: 500 });
    }
}
