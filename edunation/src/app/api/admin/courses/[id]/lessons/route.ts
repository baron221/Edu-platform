import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper to check ownership
async function verifyAccess(courseId: string) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as any)?.role;
    const userId = (session?.user as any)?.id;

    if (!userId) return { error: 'Unauthorized', status: 401 };

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true },
    });

    if (!course) return { error: 'Not found', status: 404 };
    if (role !== 'admin' && course.instructorId !== userId) {
        return { error: 'Forbidden', status: 403 };
    }
    return { ok: true };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const access = await verifyAccess(id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    const lessons = await prisma.lesson.findMany({
        where: { courseId: id },
        orderBy: { order: 'asc' },
    });
    return NextResponse.json(lessons);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const access = await verifyAccess(id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await req.json();
    const lastLesson = await prisma.lesson.findFirst({
        where: { courseId: id },
        orderBy: { order: 'desc' },
    });
    const lesson = await prisma.lesson.create({
        data: {
            courseId: id,
            title: body.title,
            description: body.description ?? '',
            videoUrl: body.videoUrl ?? '',
            duration: body.duration ?? '00:00',
            order: (lastLesson?.order ?? 0) + 1,
            isFree: body.isFree ?? false,
            videoQuality: body.videoQuality ?? 'auto',
            meetLink: body.meetLink ?? '',
            liveAt: body.liveAt ? new Date(body.liveAt) : null,
            isLiveEnabled: body.isLiveEnabled ?? false,
        },
    });
    return NextResponse.json(lesson, { status: 201 });
}
