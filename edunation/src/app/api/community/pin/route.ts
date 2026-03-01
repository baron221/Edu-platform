import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// PATCH /api/community/pin — toggle pin status of a post (instructor/admin only)
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'instructor' && user?.role !== 'admin') {
        return new NextResponse('Forbidden', { status: 403 });
    }

    const { postId } = await req.json();
    if (!postId) return new NextResponse('Missing postId', { status: 400 });

    const post = await prisma.communityPost.findUnique({ where: { id: postId } });
    if (!post) return new NextResponse('Not found', { status: 404 });

    const updated = await prisma.communityPost.update({
        where: { id: postId },
        data: { isPinned: !post.isPinned },
    });

    return NextResponse.json(updated);
}
