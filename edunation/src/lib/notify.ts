import { prisma } from '@/lib/prisma';

export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
            },
        });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}
