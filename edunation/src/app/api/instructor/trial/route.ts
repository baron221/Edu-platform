import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
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
            select: { instructorTrialUsed: true, name: true }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (user.instructorTrialUsed) {
            return NextResponse.json({ error: 'Instructor free trial already used' }, { status: 400 });
        }

        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30);

        // Instructor profile data
        const instructorName = user.name || 'Instructor';
        const slug = instructorName.toLowerCase().replace(/\s+/g, '-') + '-' + userId.slice(-4);

        // Start transaction
        await prisma.$transaction([
            // Create/Update instructor subscription (Starter/Pro level)
            prisma.instructorSubscription.upsert({
                where: { userId },
                create: {
                    userId,
                    plan: 'pro', // Give them Pro for the trial
                    status: 'active',
                    startDate: new Date(),
                    endDate,
                    maxCourses: 20,
                    canAdvertise: true
                },
                update: {
                    plan: 'pro',
                    status: 'active',
                    startDate: new Date(),
                    endDate,
                    maxCourses: 20,
                    canAdvertise: true
                }
            }),
            // Promote to instructor role
            prisma.user.update({
                where: { id: userId },
                data: { 
                    role: 'instructor',
                    instructorTrialUsed: true 
                }
            }),
            // Ensure instructor profile exists
            prisma.instructorProfile.upsert({
                where: { userId },
                update: {},
                create: { 
                    userId, 
                    slug, 
                    tagline: 'Passionate educator on EduNationUz' 
                }
            })
        ]);

        return NextResponse.json({ 
            success: true, 
            message: '1 Month Instructor Free Trial activated!',
            expiresAt: endDate 
        });
    } catch (error: any) {
        console.error('Instructor trial activation error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
