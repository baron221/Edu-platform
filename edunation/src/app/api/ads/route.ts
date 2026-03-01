import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/ads?placement=homepage
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const placement = searchParams.get('placement') || 'homepage';
    const now = new Date();

    const ads = await prisma.courseAd.findMany({
        where: { placement, status: 'active', startDate: { lte: now }, endDate: { gte: now } },
        include: {
            course: {
                include: { _count: { select: { enrollments: true, lessons: true } } }
            }
        },
        take: 6,
    });

    return NextResponse.json(ads);
}
