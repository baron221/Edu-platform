import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { google } from '@ai-sdk/google';
import { generateObject } from 'ai';
import { z } from 'zod';

const summarySchema = z.object({
    title: z.string().describe("A short, catchy title for this resource, e.g., 'Lesson Highlights' or 'Cheat Sheet'"),
    markdownSummary: z.string().describe("A comprehensive Markdown-formatted summary of the lesson. Include bullet points, bold text for key terms, and code snippets if applicable.")
});

function getLangInstruction(language: string): string {
    if (language === 'uz') {
        return "Respond entirely in Uzbek language. The summary must be written in Uzbek.";
    }
    if (language === 'ru') {
        return "Respond entirely in Russian language. The summary must be written in Russian.";
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
                `Generate a highly structured Markdown summary or "cheat sheet" based STRICTLY on the following lesson text. Make sure to provide a suitable title.`,
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
                `Generate a highly structured Markdown summary or "cheat sheet" that explains the core concepts of the topic "${lesson.title}"`,
                `from the course "${course.title}" (category: ${course.category}). Make sure to provide a suitable title.`,
                ``,
                `The summary should cover fundamental concepts, best practices, and key ideas a student would learn`,
                `in a real video lesson on this topic. Use bullet points and appropriate markdown hierarchies.`,
            ].join('\n');

        // Call Gemini
        const { object: summaryResponse } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: summarySchema,
            prompt,
        });

        // Save to Database as a new Resource
        const createdResource = await prisma.resource.create({
            data: {
                lessonId: lesson.id,
                title: summaryResponse.title,
                description: summaryResponse.markdownSummary, // Store the markdown map here
                type: 'summary', // custom type so we know it's AI generated text
                url: null
            }
        });

        return NextResponse.json(createdResource, { status: 201 });

    } catch (error) {
        console.error('[GENERATE_SUMMARY_ERROR]', error);
        return NextResponse.json({ error: 'Failed to generate and save summary. Please try again.' }, { status: 500 });
    }
}
