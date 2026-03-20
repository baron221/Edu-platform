import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
    const { id, lessonId } = await params;
    const access = await verifyAccess(id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await req.json();
    const lesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: body,
    });
    return NextResponse.json(lesson);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; lessonId: string }> }) {
    const { id, lessonId } = await params;
    const access = await verifyAccess(id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    await prisma.lesson.delete({ where: { id: lessonId } });
    return NextResponse.json({ ok: true });
}
