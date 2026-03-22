import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET latest 20 notifications for the current user
export async function GET() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });

        const unreadCount = await prisma.notification.count({
            where: { userId: session.user.id, read: false },
        });

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH to mark notifications as read
export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { notificationId } = body;

        if (notificationId) {
            // Mark single notification as read
            await prisma.notification.updateMany({
                where: {
                    id: notificationId,
                    userId: session.user.id,
                },
                data: { read: true },
            });
        } else {
            // Mark ALL notifications as read
            await prisma.notification.updateMany({
                where: {
                    userId: session.user.id,
                    read: false,
                },
                data: { read: true },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to update notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
