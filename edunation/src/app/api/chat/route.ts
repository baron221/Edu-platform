import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log("INCOMING CHAT REQUEST:", { ...body, images: body.images ? `[${body.images.length} images]` : 'none' });

        const { messages, chatId, context, lessonId, images } = body;
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        // Determine or create session ID
        let currentChatId = chatId;

        if (!currentChatId) {
            const newSession = await prisma.chatSession.create({
                data: {
                    userId: userId || null, // allow null for anonymous
                    title: 'Chat Session',
                }
            });
            currentChatId = newSession.id;
        } else {
            // Ensure the session exists
            const existingSession = await prisma.chatSession.findUnique({ where: { id: currentChatId } });
            if (!existingSession) {
                await prisma.chatSession.create({
                    data: {
                        id: currentChatId,
                        userId: userId || null,
                        title: 'Chat Session',
                    }
                });
            }
        }

        // Save the incoming user message to the DB
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === 'user') {
            const textContent = lastUserMessage.parts?.map((p: any) => p.text).join('') || lastUserMessage.content || '';
            await prisma.chatMessage.create({
                data: {
                    chatSessionId: currentChatId,
                    role: 'user',
                    content: textContent,
                }
            });
        }

        let systemPromptContext = context ? `\n\nCurrent Context: ${context}` : '';

        if (lessonId) {
            const lesson = await prisma.lesson.findUnique({
                where: { id: lessonId },
                select: { content: true }
            }) as any;
            if (lesson && lesson.content) {
                systemPromptContext += `\n\nLesson Knowledge Base:\n${lesson.content}`;
            }
        }

        const coreMessages = messages.map((m: any) => {
            let content = m.content;
            if (!content && m.parts) {
                content = m.parts.reduce((acc: string, part: any) => {
                    if (part.type === 'text') return acc + part.text;
                    return acc;
                }, '');
            }
            return {
                role: m.role,
                content: content || ''
            };
        });

        // Inject images into the last user message for multimodal processing
        if (images && images.length > 0) {
            console.log("Processing images:", images.length);
            const lastMsg = coreMessages[coreMessages.length - 1];
            if (lastMsg && lastMsg.role === 'user') {
                if (typeof lastMsg.content === 'string') {
                    lastMsg.content = [{ type: 'text', text: lastMsg.content }];
                }
                images.forEach((imgData: string) => {
                    const mimeType = imgData.split(';')[0].split(':')[1];
                    const base64Data = imgData.split(',')[1];
                    (lastMsg.content as any[]).push({ type: 'image', image: base64Data, mimeType });
                });
                console.log("Appended images to last message parts.");
            }
        }

        console.log("Calling streamText...");

        const result = streamText({
            model: google('gemini-2.5-flash'),
            system: `You are a helpful, expert teaching assistant for the e-learning platform EduNationUz.
    Your goal is to help students understand course material, explain concepts clearly, and guide them to the right answers without simply doing the work for them.
    Keep your answers concise, encouraging, and formatted in clean markdown. 
    If a student asks a highly complex technical question, break it down step-by-step.
    Always be polite and professional.` + systemPromptContext,
            messages: coreMessages,
            onFinish: async ({ text }) => {
                // Save the AI's response to the DB when it finishes streaming
                if (text) {
                    await prisma.chatMessage.create({
                        data: {
                            chatSessionId: currentChatId,
                            role: 'assistant',
                            content: text,
                        }
                    });
                }
            },
        });

        const response = result.toUIMessageStreamResponse({
            headers: {
                'X-Chat-Id': currentChatId,
            }
        });

        console.log("Successfully returning stream response");
        return response;

    } catch (error) {
        console.error("CRITICAL ERROR IN /api/chat:", error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Optional GET method to fetch chat history by ID
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');

    if (!chatId) {
        return Response.json({ messages: [] });
    }

    const dbMessages = await prisma.chatMessage.findMany({
        where: { chatSessionId: chatId },
        orderBy: { createdAt: 'asc' },
    });

    const formattedMessages = dbMessages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        parts: [{ type: 'text', text: msg.content }],
    }));

    return Response.json({ messages: formattedMessages });
}
