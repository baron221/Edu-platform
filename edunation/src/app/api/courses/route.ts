import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const free = searchParams.get('free');

    const courses = await prisma.course.findMany({
        where: {
            published: true,
            ...(category && category !== 'All' ? { category } : {}),
            ...(search ? {
                OR: [
                    { title: { contains: search } },
                    { instructor: { contains: search } },
                    { category: { contains: search } },
                ],
            } : {}),
            ...(free === 'true' ? { isFree: true } : free === 'false' ? { isFree: false } : {}),
        },
        include: {
            _count: { select: { lessons: true, enrollments: true } },
        },
        orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(courses);
}
