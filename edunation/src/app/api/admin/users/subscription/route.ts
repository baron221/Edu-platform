import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { userId, plan, endDate, maxCourses } = body;

        if (!userId || !plan) {
            return NextResponse.json({ error: 'Missing required configuration' }, { status: 400 });
        }

        const PLANS = {
            starter: { canAdvertise: false },
            pro: { canAdvertise: true },
            studio: { canAdvertise: true },
        };
        const cfg = PLANS[plan as keyof typeof PLANS] || PLANS.starter;

        const updated = await prisma.instructorSubscription.upsert({
            where: { userId },
            update: { plan, status: 'active', endDate: endDate ? new Date(endDate) : null, maxCourses: parseInt(maxCourses), ...cfg },
            create: { userId, plan, status: 'active', startDate: new Date(), endDate: endDate ? new Date(endDate) : null, maxCourses: parseInt(maxCourses), ...cfg },
        });

        // Ensure the global user role is also set correctly
        await prisma.user.update({
            where: { id: userId },
            data: { role: 'instructor' }
        });

        // Ensure they have a profile
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const name = user?.name || 'Instructor';
        const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + userId.slice(-4);

        await prisma.instructorProfile.upsert({
            where: { userId: userId },
            update: {},
            create: { userId: userId, slug, tagline: 'Passionate educator on EduNationUz' },
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
