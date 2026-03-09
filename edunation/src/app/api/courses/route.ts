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
            _count: { select: { lessons: true, enrollments: true, reviews: true } },
            reviews: { select: { rating: true } }
        },
        orderBy: { createdAt: 'desc' },
    });

    const formattedCourses = courses.map(c => {
        const avg = c.reviews.length > 0 ? c.reviews.reduce((sum, r) => sum + r.rating, 0) / c.reviews.length : 0;
        const { reviews, ...rest } = c;
        return {
            ...rest,
            avgRating: Math.round(avg * 10) / 10
        };
    });

    return NextResponse.json(formattedCourses);
}
