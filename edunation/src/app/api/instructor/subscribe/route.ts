import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

const PLANS = {
    starter: { maxCourses: 3, canAdvertise: false, priceUZS: 99000 },
    pro: { maxCourses: 20, canAdvertise: true, priceUZS: 249000 },
    studio: { maxCourses: -1, canAdvertise: true, priceUZS: 499000 }, // -1 = unlimited
};

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan } = await req.json();
    if (!PLANS[plan as keyof typeof PLANS]) {
        return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    try {
        const cfg = PLANS[plan as keyof typeof PLANS];
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        const { priceUZS, ...dbCfg } = cfg;

        // Upsert instructor subscription
        const sub = await prisma.instructorSubscription.upsert({
            where: { userId },
            update: { plan, status: 'active', startDate: new Date(), endDate, ...dbCfg },
            create: { userId, plan, status: 'active', startDate: new Date(), endDate, ...dbCfg },
        });

        // Promote user role to instructor
        await prisma.user.update({ where: { id: userId }, data: { role: 'instructor' } });

        // Create instructor profile if not exists
        const name = session?.user?.name || 'Instructor';
        const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + userId.slice(-4);
        await prisma.instructorProfile.upsert({
            where: { userId },
            update: {},
            create: { userId, slug, tagline: 'Passionate educator on EduNationUz' },
        });

        return NextResponse.json({ success: true, subscription: sub });
    } catch (error: any) {
        console.error('Subscription error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const sub = await prisma.instructorSubscription.findUnique({ where: { userId } });
    return NextResponse.json({ subscription: sub, plans: PLANS });
}
