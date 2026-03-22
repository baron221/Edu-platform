import { prisma } from '@/lib/prisma';
import { sendTelegramDM } from '@/lib/telegram';

export async function createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    link?: string
) {
    try {
        // 1. Create in-app notification
        const notification = await prisma.notification.create({
            data: {
                userId,
                type,
                title,
                message,
                link,
            },
        });

        // 2. Lookup user's telegramId
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { telegramId: true }
        });

        // 3. Dispatch to edunationbot if linked
        if (user?.telegramId) {
            let tgMessage = `🔔 <b>${title}</b>\n\n${message}`;
            if (link) {
                // Ensure link is absolute if it's a relative path
                const baseUrl = process.env.NEXTAUTH_URL ?? 'https://edunation.uz';
                const absoluteLink = link.startsWith('http') ? link : `${baseUrl}${link}`;
                 tgMessage += `\n\n🔗 <a href="${absoluteLink}">View Details</a>`;
            }
            // Send asynchronously so we don't block
            sendTelegramDM(user.telegramId, tgMessage).catch(console.error);
        }

        return notification;
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
}
