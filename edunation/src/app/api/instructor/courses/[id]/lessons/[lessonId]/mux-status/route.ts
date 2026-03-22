import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Mux from '@mux/mux-node';

const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

function formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

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
                    const durationStr = asset.duration ? formatDuration(asset.duration) : '00:00';
                    await prisma.lesson.update({
                        where: { id: lessonId },
                        data: {
                            muxAssetId: asset.id,
                            muxPlaybackId: playbackId,
                            videoUrl: `mux:${playbackId}`,
                            duration: durationStr
                        }
                    });
                    return NextResponse.json({ status: 'ready', playbackId, duration: durationStr });
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

