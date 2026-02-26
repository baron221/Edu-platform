import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateObject, generateText } from 'ai';
import { google } from '@ai-sdk/google';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// Define the exact JSON structure we want the AI to return
const courseSchema = z.object({
    title: z.string().describe("A catchy, professional title for the course."),
    description: z.string().describe("A comprehensive 1-2 paragraph description of what the student will learn."),
    category: z.string().describe("A broad category like 'Technology', 'Business', 'Design', etc."),
    level: z.enum(["Beginner", "Intermediate", "Advanced"]),
    lessons: z.array(
        z.object({
            title: z.string(),
            description: z.string().describe("A 1-2 sentence description of this specific lesson."),
            order: z.number().describe("The sequential order of this lesson.")
        })
    ).describe("A list of 5 to 10 logical lessons that make up this course.")
});

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        const userId = (session?.user as any)?.id;
        const userName = (session?.user as any)?.name || 'Instructor';

        if (!session || (userRole !== 'admin' && userRole !== 'instructor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { topic, customInstructions } = body;

        console.log("Generating AI Course for topic:", topic);

        // Instruct Gemini 2.5 Flash to generate the course based on our highly specific JSON schema
        const { object } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: courseSchema,
            system: `You are an expert curriculum designer and educator for EduNationUz. 
            Create a highly structured, engaging, and comprehensive course outline about the requested topic. 
            Ensure the content is accurate and follows a logical learning progression.
            ${customInstructions ? `The user also provided these specific instructions: ${customInstructions}` : ''}`,
            prompt: `Topic: ${topic}`,
        });

        // Generate a URL-friendly slug
        let slug = object.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)+/g, '');

        // Generate a random thumbnail (we can use unplash source for a placeholder)
        const encodedTopic = encodeURIComponent(object.category.toLowerCase() || topic);
        const randomThumbnail = `https://source.unsplash.com/800x600/?${encodedTopic},education`;

        // Attempt to create the entire course bundle in a Prisma transaction
        // First ensure slug is unique
        const existingCourse = await prisma.course.findUnique({ where: { slug } });
        if (existingCourse) {
            slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
        }

        const newCourse = await prisma.course.create({
            data: {
                title: object.title,
                slug,
                description: object.description,
                category: object.category,
                level: object.level,
                price: 0, // Default to free while in draft
                isFree: true,
                published: false, // Start as unpublished so the instructor can edit!
                instructor: userName,
                instructorId: userId,
                thumbnail: randomThumbnail,
                lessons: {
                    create: object.lessons.map(l => ({
                        title: l.title,
                        description: l.description,
                        order: l.order,
                        isFree: l.order === 1 // Make the first lesson free by default
                    }))
                }
            }
        });

        return NextResponse.json({
            message: 'Course generated successfully!',
            course: newCourse,
            data: object
        });

    } catch (error: any) {
        console.error("AI GENERATION ERROR:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate course' }, { status: 500 });
    }
}
