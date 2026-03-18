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

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string, resourceId: string }> }) {
    const { id, resourceId } = await params;
    const access = await verifyAccess(id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    try {
        await prisma.resource.delete({
            where: { id: resourceId }
        });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting resource:', err);
        return NextResponse.json({ error: 'Failed to delete resource' }, { status: 500 });
    }
}
