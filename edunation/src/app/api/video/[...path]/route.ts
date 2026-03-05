import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';
import { Readable } from 'stream';

/**
 * Protected video streaming endpoint.
 * GET /api/video/[...path]
 *
 * Verifies:
 * 1. User is authenticated
 * 2. The lesson with this videoUrl exists
 * 3. The user is enrolled / subscribed / free-lesson / admin or instructor
 *
 * Only then streams the file with:
 * - Range request support (seek support in video players)
 * - Cache-Control: no-store (prevents caching/downloading)
 * - No Content-Disposition: attachment header (browser won't trigger download)
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;

    if (!userId) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const resolvedParams = await params;
    const filePath = resolvedParams.path.join('/');
    const videoUrl = `/uploads/${filePath}`;

    // Find the lesson with this videoUrl
    const lesson = await prisma.lesson.findFirst({
        where: { videoUrl },
        include: { course: { select: { id: true, isFree: true } } },
    });

    if (!lesson) {
        return new NextResponse('Video not found', { status: 404 });
    }

    const courseId = lesson.course.id;

    // Check access:
    // Admin and instructor always have access
    if (role !== 'admin' && role !== 'instructor') {
        if (lesson.isFree) {
            // Free lesson — anyone authenticated can watch
        } else {
            // Must be enrolled or subscribed
            const enrollment = await prisma.enrollment.findUnique({
                where: { userId_courseId: { userId, courseId } },
            });
            const subscription = await prisma.subscription.findUnique({
                where: { userId },
            });
            const isSubscribed = subscription?.status === 'active' && subscription.plan !== 'free';

            if (!enrollment && !isSubscribed) {
                return new NextResponse('Forbidden — enroll or subscribe to watch this video', { status: 403 });
            }
        }
    }

    // Stream the file
    const absolutePath = join(process.cwd(), 'public', 'uploads', filePath);
    let stat: ReturnType<typeof statSync>;
    try {
        stat = statSync(absolutePath);
    } catch {
        return new NextResponse('File not found on disk', { status: 404 });
    }

    const fileSize = stat.size;
    const rangeHeader = request.headers.get('range');

    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
        'mp4': 'video/mp4',
        'mov': 'video/mp4',
        'webm': 'video/webm',
        'mkv': 'video/x-matroska',
        'avi': 'video/x-msvideo',
        'm4v': 'video/mp4',
        '3gp': 'video/3gpp',
        'wmv': 'video/x-ms-wmv'
    };
    const contentType = mimeTypes[ext || ''] || 'video/mp4';

    const securityHeaders = {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
        'Content-Type': contentType,
    };

    // Stream the file using a manual ReadableStream for better error/cancel handling
    const getStream = (start?: number, end?: number) => {
        const fileStream = createReadStream(absolutePath, { start, end });

        return new ReadableStream({
            start(controller) {
                fileStream.on('data', (chunk) => {
                    try {
                        // Node.js Buffers are Uint8Arrays. Using Buffer.from ensures we have
                        // a valid input for the controller even if chunk is a string.
                        const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
                        controller.enqueue(new Uint8Array(data));
                    } catch (e) {
                        // Controller might be closed already if request was aborted
                        fileStream.destroy();
                    }
                });
                fileStream.on('end', () => {
                    try {
                        controller.close();
                    } catch (e) { }
                });
                fileStream.on('error', (err) => {
                    controller.error(err);
                    fileStream.destroy();
                });
            },
            cancel() {
                fileStream.destroy();
            },
        });
    };

    if (rangeHeader) {
        // Range request (seeking support)
        const parts = rangeHeader.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunkSize = end - start + 1;

        return new NextResponse(getStream(start, end), {
            status: 206,
            headers: {
                ...securityHeaders,
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': String(chunkSize),
            },
        });
    } else {
        // Full file
        return new NextResponse(getStream(), {
            status: 200,
            headers: {
                ...securityHeaders,
                'Accept-Ranges': 'bytes',
                'Content-Length': String(fileSize),
            },
        });
    }
}
