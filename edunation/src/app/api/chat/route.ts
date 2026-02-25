import { streamText } from 'ai';
import { google } from '@ai-sdk/google';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = streamText({
        model: google('gemini-1.5-flash'),
        system: `You are a helpful, expert teaching assistant for the e-learning platform EduNationUz.
    Your goal is to help students understand course material, explain concepts clearly, and guide them to the right answers without simply doing the work for them.
    Keep your answers concise, encouraging, and formatted in clean markdown. 
    If a student asks a highly complex technical question, break it down step-by-step.
    Always be polite and professional.`,
        messages,
    });

    return result.toDataStreamResponse();
}
