import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

// GET /api/community/posts?courseId=xxx
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) return new NextResponse('Missing courseId', { status: 400 });

    // Ensure community exists for this course
    const community = await prisma.community.findUnique({ where: { courseId } });
    if (!community) return NextResponse.json([]);

    const posts = await prisma.communityPost.findMany({
        where: { communityId: community.id },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
            author: { select: { id: true, name: true, image: true, role: true } },
            _count: { select: { replies: true } },
        },
    });

    return NextResponse.json(posts);
}

// POST /api/community/posts
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const { courseId, title, body, isAnnouncement } = await req.json();
    if (!courseId || !title || !body) return new NextResponse('Missing fields', { status: 400 });

    // Auto-create community if not yet exists
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { title: true } });
    if (!course) return new NextResponse('Course not found', { status: 404 });

    let community = await prisma.community.findUnique({ where: { courseId } });
    if (!community) {
        community = await prisma.community.create({
            data: { courseId, name: `${course.title} Community`, description: 'Discuss this course with fellow learners.' }
        });
    }

    // Only instructor can post announcements
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const canAnnounce = user?.role === 'instructor' || user?.role === 'admin';

    const post = await prisma.communityPost.create({
        data: {
            communityId: community.id,
            authorId: userId,
            title,
            body,
            isAnnouncement: canAnnounce ? (isAnnouncement ?? false) : false,
        },
        include: {
            author: { select: { id: true, name: true, image: true, role: true } },
            _count: { select: { replies: true } },
        },
    });

    return NextResponse.json(post, { status: 201 });
}
