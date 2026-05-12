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
        let assetId = lesson.muxAssetId;

        if (lesson.videoUrl?.startsWith('mux-upload:')) {
            uploadId = lesson.videoUrl.split(':')[1];
        } else if (lesson.muxAssetId) {
            assetId = lesson.muxAssetId;
            // If we already have duration and playbackId, we're done
            if (lesson.muxPlaybackId && lesson.duration && lesson.duration !== '00:00') {
                return NextResponse.json({ status: 'ready', playbackId: lesson.muxPlaybackId, duration: lesson.duration });
            }
        } else {
            return NextResponse.json({ status: 'no_mux_upload' });
        }

        // If we have an uploadId, check if asset was created
        if (uploadId && !assetId) {
            const upload = await mux.video.uploads.retrieve(uploadId);
            if (upload.status === 'asset_created' && upload.asset_id) {
                assetId = upload.asset_id;
            } else {
                return NextResponse.json({ status: upload.status });
            }
        }

        // Now fetch asset info to get duration and playbackId
        if (assetId) {
            const asset = await mux.video.assets.retrieve(assetId);
            const playbackId = asset.playback_ids?.[0]?.id;

            if (asset.status === 'ready' && playbackId) {
                const durationStr = asset.duration ? formatDuration(asset.duration) : '00:00';
                
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: {
                        muxAssetId: asset.id,
                        muxPlaybackId: playbackId,
                        videoUrl: `mux:${playbackId}`,
                        ...(durationStr !== '00:00' || !lesson.duration || lesson.duration === '00:00' ? { duration: durationStr } : {})
                    }
                });
                return NextResponse.json({ status: 'ready', playbackId, duration: durationStr });
            }
            return NextResponse.json({ status: 'processing', assetId: asset.id });
        }

        return NextResponse.json({ status: 'unknown' });

    } catch (error: any) {
        console.error('Mux Sync Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

