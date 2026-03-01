import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Mux sends POST requests to this endpoint when a video finishes processing
export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const muxSignature = req.headers.get('mux-signature');

        if (!muxSignature) {
            return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
        }

        // 1. Verify the Webhook Signature (Optional but highly recommended)
        // If the user adds MUX_WEBHOOK_SECRET later, this will securely validate the payload.
        const webhookSecret = process.env.MUX_WEBHOOK_SECRET;
        if (webhookSecret) {
            const elements = muxSignature.split(',').reduce((acc, el) => {
                const [key, value] = el.split('=');
                acc[key] = value;
                return acc;
            }, {} as Record<string, string>);

            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(`${elements.t}.${rawBody}`)
                .digest('hex');

            if (expectedSignature !== elements.v1) {
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
        }

        const payload = JSON.parse(rawBody);

        // 2. We only care when the video is ready to stream
        if (payload.type === 'video.asset.ready') {
            const asset = payload.data;
            const lessonId = asset.passthrough; // We sent the lessonId in the passthrough field during the upload ticket!
            const playbackId = asset.playback_ids?.find((pid: any) => pid.policy === 'public')?.id;

            if (lessonId && playbackId) {
                // 3. Update the database! The video is now fully processed and ready for students.
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: {
                        muxAssetId: asset.id,
                        muxPlaybackId: playbackId,
                        videoUrl: `mux:${playbackId}` // Clear out the temporary mux-upload:id status and mark it as active
                    },
                });

                console.log(`[MUX WEBHOOK] Successfully linked Asset ${asset.id} to Lesson ${lessonId}`);
            }
        }

        return NextResponse.json({ received: true }, { status: 200 });

    } catch (error) {
        console.error('[MUX_WEBHOOK_ERROR]', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
