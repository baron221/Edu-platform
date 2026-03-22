import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

export async function POST(req: Request, { params }: { params: Promise<{ id: string, lessonId: string }> }) {
    const { id, lessonId } = await params;
    const access = await verifyAccess(id);
    if (access.error) return NextResponse.json({ error: access.error }, { status: access.status });

    const body = await req.json();
    
    if (!body.title) {
        return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    try {
        const resource = await prisma.resource.create({
            data: {
                lessonId: lessonId,
                title: body.title,
                description: body.description || null,
                url: body.url || null,
                type: body.type || 'link',
            }
        });
        return NextResponse.json(resource, { status: 201 });
    } catch (err) {
        console.error('Error creating resource:', err);
        return NextResponse.json({ error: 'Failed to create resource' }, { status: 500 });
    }
}
