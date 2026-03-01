import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        const role = (session?.user as any)?.role;
        const instructorId = (session?.user as any)?.id;

        if (!instructorId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const whereClause = role === 'admin' ? {} : { instructorId: instructorId };

        const [courses, subscription] = await Promise.all([
            prisma.course.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    _count: { select: { enrollments: true, lessons: true } },
                },
            }),
            prisma.instructorSubscription.findUnique({
                where: { userId: instructorId }
            })
        ]);

        return NextResponse.json({
            courses,
            subscription: subscription || null
        });
    } catch {
        return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const instructorId = (session?.user as any)?.id;
        const instructorName = (session?.user as any)?.name || 'Unknown Instructor';

        if (!instructorId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const course = await prisma.course.create({
            data: {
                slug: `${body.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`,
                title: body.title,
                description: body.description,
                instructor: instructorName,
                instructorId: instructorId,
                category: body.category,
                level: body.level ?? 'Beginner',
                price: body.price ?? 0,
                isFree: body.isFree ?? true,
            },
        });
        return NextResponse.json(course, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
    }
}
