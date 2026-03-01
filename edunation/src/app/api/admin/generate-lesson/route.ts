import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        const userId = (session?.user as any)?.id;

        if (!session || (userRole !== 'admin' && userRole !== 'instructor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { lessonId, courseTitle, lessonTitle, lessonDescription, customPrompt } = body;

        if (!lessonId) {
            return NextResponse.json({ error: 'Missing lesson ID' }, { status: 400 });
        }

        // Verify the instructor owns this course (or is admin)
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { course: true }
        });

        if (!lesson) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        if (userRole !== 'admin' && lesson.course.instructorId !== userId) {
            return NextResponse.json({ error: 'Unauthorized to edit this lesson' }, { status: 403 });
        }

        console.log(`Generating AI content for lesson: ${lessonTitle}`);

        // Instruct Gemini to write the actual educational content for this lesson
        const { text } = await generateText({
            model: google('gemini-2.5-flash'),
            system: `You are an expert curriculum designer and educator for EduNationUz. 
            Write the comprehensive educational content for a specific lesson inside a broader course.
            The content should be formatted in clean Markdown, ready to be displayed to students.
            Make it highly engaging, educational, and easy to read with headers, bullet points, and code blocks (if applicable).
            Do NOT include a main # Heading at the very top, as the lesson title is already displayed by the UI. Start directly with the content.`,
            prompt: `
Course Title: ${courseTitle}
Lesson Title: ${lessonTitle}
Lesson Description: ${lessonDescription || 'N/A'}
${customPrompt ? `\nInstructor's specific instructions for this content: ${customPrompt}` : ''}

Please write the full markdown content for this lesson now:`,
        });

        // Save the generated content directly to the database
        const updatedLesson = await prisma.lesson.update({
            where: { id: lessonId },
            data: { content: text }
        });

        return NextResponse.json({
            message: 'Lesson content generated successfully!',
            lesson: updatedLesson
        });

    } catch (error: any) {
        console.error("AI LESSON GENERATION ERROR:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate lesson content' }, { status: 500 });
    }
}
