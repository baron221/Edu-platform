import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/community/replies?postId=xxx
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    if (!postId) return new NextResponse('Missing postId', { status: 400 });

    const replies = await prisma.communityReply.findMany({
        where: { postId },
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, image: true, role: true } } },
    });

    return NextResponse.json(replies);
}

// POST /api/community/replies
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { postId, body } = await req.json();
    if (!postId || !body) return new NextResponse('Missing fields', { status: 400 });

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) return new NextResponse('Post not found', { status: 404 });

    const reply = await prisma.communityReply.create({
        data: { postId, authorId: userId, body },
        include: { author: { select: { id: true, name: true, image: true, role: true } } },
    });

    return NextResponse.json(reply, { status: 201 });
}
