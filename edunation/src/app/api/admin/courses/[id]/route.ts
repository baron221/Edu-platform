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
        include: { lessons: { orderBy: { order: 'asc' } } },
    });

    if (!course) return { error: 'Not found', status: 404 };

    if (role !== 'admin' && course.instructorId !== userId) {
        return { error: 'Forbidden: You do not own this course', status: 403 };
    }

    return { course };
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const access = await verifyAccess(id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    return NextResponse.json(access.course);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const access = await verifyAccess(id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await req.json();
    const updatedCourse = await prisma.course.update({ where: { id }, data: body });
    return NextResponse.json(updatedCourse);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const access = await verifyAccess(id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    await prisma.course.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
