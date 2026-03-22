import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST() {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user to check if trial was already used
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { studentTrialUsed: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.studentTrialUsed) {
            return NextResponse.json({ error: 'Free trial already used' }, { status: 400 });
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        // Start transaction: update user and create/update subscription
        await prisma.$transaction([
            prisma.subscription.upsert({
                where: { userId },
                create: {
                    userId,
                    plan: 'pro',
                    status: 'active',
                    startDate: new Date(),
                    endDate
                },
                update: {
                    plan: 'pro',
                    status: 'active',
                    startDate: new Date(),
                    endDate
                }
            }),
            prisma.user.update({
                where: { id: userId },
                data: { studentTrialUsed: true }
            })
        ]);

        return NextResponse.json({ 
            success: true, 
            message: '1 Month Free Trial activated!',
            expiresAt: endDate 
        });
    } catch (error: any) {
        console.error('Trial activation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
