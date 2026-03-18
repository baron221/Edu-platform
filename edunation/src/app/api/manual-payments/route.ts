import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { notifyAdmin } from '@/lib/telegram';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { courseId, planId, receiptUrl } = body;

        if (!receiptUrl) {
            return NextResponse.json({ error: 'Receipt URL is required' }, { status: 400 });
        }

        if (!courseId && !planId) {
            return NextResponse.json({ error: 'Either courseId or planId is required' }, { status: 400 });
        }

        // Create the manual payment entry
        const manualPayment = await prisma.manualPayment.create({
            data: {
                userId: session.user.id as string,
                courseId: courseId || null,
                planId: planId || null,
                receiptUrl,
                status: 'pending'
            },
            include: {
                user: true,
                course: true
            }
        });

        // Format message for Admin Bot
        const typeStr = courseId ? `Course: ${manualPayment.course?.title}` : `Subscription Plan: ${planId}`;
        const userName = manualPayment.user.name || manualPayment.user.email || 'Unknown User';
        const msg = `🧾 *New Manual Payment Receipt*\\n\\n` +
                    `👤 *User:* ${userName}\\n` +
                    `🛍 *Item:* ${typeStr}\\n` +
                    `🔗 *Receipt:* [View Receipt](${receiptUrl})\\n\\n` +
                    `Please check the Admin Dashboard to approve or reject this payment.`;

        await notifyAdmin(msg);

        return NextResponse.json({ success: true, payment: manualPayment });
    } catch (error) {
        console.error('[MANUAL_PAYMENT_POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
