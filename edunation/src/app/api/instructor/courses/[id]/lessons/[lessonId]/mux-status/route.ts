import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import Mux from '@mux/mux-node';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { lessonId } = await params;
        const lesson = await prisma.lesson.findUnique({
            where: { id: lessonId },
        });

        if (!lesson) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 });

        let uploadId = '';
        if (lesson.videoUrl?.startsWith('mux-upload:')) {
            uploadId = lesson.videoUrl.split(':')[1];
        } else if (lesson.muxAssetId) {
            // Already have asset, check if playbackId is missing
            if (lesson.muxPlaybackId) return NextResponse.json({ status: 'ready', playbackId: lesson.muxPlaybackId });
        } else {
            return NextResponse.json({ status: 'no_mux_upload' });
        }

        if (uploadId) {
            const upload = await mux.video.uploads.retrieve(uploadId);

            if (upload.status === 'asset_created' && upload.asset_id) {
                const asset = await mux.video.assets.retrieve(upload.asset_id);
                const playbackId = asset.playback_ids?.[0]?.id;

                if (playbackId) {
                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: {
                            muxAssetId: asset.id,
                            muxPlaybackId: playbackId,
                            videoUrl: `mux:${playbackId}`
                        }
                    });
                    return NextResponse.json({ status: 'ready', playbackId });
                }
                return NextResponse.json({ status: 'processing', assetId: asset.id });
            }
            return NextResponse.json({ status: upload.status });
        }

        return NextResponse.json({ status: 'unknown' });

    } catch (error: any) {
        console.error('Mux Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
