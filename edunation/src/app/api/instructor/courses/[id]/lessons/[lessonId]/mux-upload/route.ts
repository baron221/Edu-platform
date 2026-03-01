import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import Mux from '@mux/mux-node';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as any)?.role;

        // Must be admin or instructor to upload a video
        if (!session || (role !== 'admin' && role !== 'instructor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;

        // Verify the lesson exists
        const lesson = await prisma.lesson.findUnique({
            where: { id: resolvedParams.lessonId },
        });

        if (!lesson || lesson.courseId !== resolvedParams.id) {
            return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });
        }

        // Create a Direct Upload Ticket in Mux
        // This allows the browser to send the video bytes directly to Mux,
        // bypassing Vercel's strict 4.5MB payload limit.
        const upload = await mux.video.uploads.create({
            new_asset_settings: {
                playback_policy: ['public'],
                // passthrough is useful for webhooks to identify which db row to update later
                passthrough: resolvedParams.lessonId,
            },
            cors_origin: '*', // We allow all origins right now so localhost works seamlessly
        });

        return NextResponse.json({
            uploadId: upload.id,
            url: upload.url, // This is the Google Cloud Storage URL the browser will use for the TUS upload
        });
    } catch (error) {
        console.error('[MUX_UPLOAD_TICKET_ERROR]', error);
        return NextResponse.json({ error: 'Failed to create Mux upload ticket' }, { status: 500 });
    }
}
