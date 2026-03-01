import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const analyticsSchema = z.object({
    overallSentiment: z.enum(['Positive', 'Neutral', 'Confused', 'Frustrated']).describe("The general mood or sentiment of the students asking these questions."),
    topStruggles: z.array(z.string()).describe("A list of 3-5 specific concepts or topics that students are frequently asking about or struggling to understand."),
    recommendations: z.array(z.string()).describe("A list of 3 actionable recommendations for the instructor based on these chats (e.g., 'Add a clearer explanation of React Context')."),
    summary: z.string().describe("A 2 sentence executive summary of the student chat activity.")
});

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userRole = (session?.user as any)?.role;
        const userId = (session?.user as any)?.id;

        if (!session || (userRole !== 'admin' && userRole !== 'instructor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get recent chat messages (last 50 for analytics) to analyze
        // Normally you'd filter this by the instructor's specific courses. For the MVP, we fetch general recent chats.
        const recentChats = await prisma.chatMessage.findMany({
            where: { role: 'user' },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        if (recentChats.length === 0) {
            return NextResponse.json({
                message: 'No student chat data available yet to analyze.'
            });
        }

        const chatLogText = recentChats.map(c => `- ${c.content}`).join('\n');

        const { object } = await generateObject({
            model: google('gemini-2.5-flash'),
            schema: analyticsSchema,
            system: `You are an expert educational AI analyst. Your job is to analyze the recent questions and interactions 
            students have had with the AI Tutor on the EduNation platform.
            Identify what they are struggling with most, their general sentiment (are they frustrated? asking lots of questions?), 
            and provide concrete recommendations for the human instructor.`,
            prompt: `Here are the 50 most recent questions students have asked the AI tutor:\n\n${chatLogText}`
        });

        return NextResponse.json({ data: object });

    } catch (error: any) {
        console.error("AI ANALYTICS ERROR:", error);
        return NextResponse.json({ error: error.message || 'Failed to generate analytics' }, { status: 500 });
    }
}
