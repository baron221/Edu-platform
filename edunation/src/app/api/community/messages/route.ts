import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/community/messages?courseId=xxx&after=ISO_STRING
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    const after = searchParams.get('after'); // ISO timestamp for polling

    if (!courseId) return new NextResponse('Missing courseId', { status: 400 });

    const community = await prisma.community.findUnique({ where: { courseId } });
    if (!community) return NextResponse.json([]);

    const messages = await prisma.communityMessage.findMany({
        where: {
            communityId: community.id,
            ...(after ? { createdAt: { gt: new Date(after) } } : {}),
        },
        orderBy: { createdAt: 'asc' },
        take: 200,
        include: {
            author: { select: { id: true, name: true, image: true, role: true } },
            replyTo: {
                select: {
                    id: true,
                    text: true,
                    author: { select: { name: true } },
                },
            },
        },
    });

    return NextResponse.json(messages);
}

// POST /api/community/messages
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { courseId, text, replyToId } = await req.json();
    if (!courseId || !text?.trim()) return new NextResponse('Missing fields', { status: 400 });

    // Auto-create community if not yet exists
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
    if (!course) return new NextResponse('Course not found', { status: 404 });

    let community = await prisma.community.findUnique({ where: { courseId } });
    if (!community) {
        community = await prisma.community.create({
            data: { courseId, name: `${course.title} Community`, description: 'Course group chat.' },
        });
    }

    const message = await prisma.communityMessage.create({
        data: {
            communityId: community.id,
            authorId: userId,
            text: text.trim(),
            ...(replyToId ? { replyToId } : {}),
        },
        include: {
            author: { select: { id: true, name: true, image: true, role: true } },
            replyTo: {
                select: {
                    id: true,
                    text: true,
                    author: { select: { name: true } },
                },
            },
        },
    });

    return NextResponse.json(message, { status: 201 });
}

// DELETE /api/community/messages?id=xxx
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role;
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return new NextResponse('Missing id', { status: 400 });

    const message = await prisma.communityMessage.findUnique({ where: { id } });
    if (!message) return new NextResponse('Not found', { status: 404 });

    // Only the author, instructor, or admin can delete
    if (message.authorId !== userId && role !== 'admin' && role !== 'instructor') {
        return new NextResponse('Forbidden', { status: 403 });
    }

    await prisma.communityMessage.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
