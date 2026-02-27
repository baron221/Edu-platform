import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // Fetch top 20 users by points
        // Exclude admins/instructors if we only want students, but for now we take everyone
        const topUsers = await prisma.user.findMany({
            where: {
                points: {
                    gt: 0 // Only users who have earned points
                }
            },
            take: 20,
            orderBy: {
                points: 'desc'
            },
            select: {
                id: true,
                name: true,
                image: true,
                points: true,
                role: true
            }
        });

        return NextResponse.json(topUsers);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
