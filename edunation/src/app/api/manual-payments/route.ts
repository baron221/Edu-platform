import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { notifyAdmin, notifyAdminWithPhoto } from '@/lib/telegram';

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
        const typeStr = courseId ? `📚 <b>Course:</b> ${manualPayment.course?.title}` : `⭐ <b>Plan:</b> ${planId}`;
        const userName = manualPayment.user.name || manualPayment.user.email || 'Unknown User';
        const msg = `🧾 <b>New Manual Payment Receipt</b>\n\n` +
                    `👤 <b>User:</b> ${userName}\n` +
                    `${typeStr}\n\n` +
                    `Please check the Admin Dashboard to approve or reject this payment.`;

        // If it's an image, send as photo, otherwise fallback to message
        const isImage = receiptUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) || receiptUrl.includes('image');
        
        // Telegram needs absolute URL
        if (isImage) {
            await notifyAdminWithPhoto(receiptUrl, msg);
        } else {
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const absoluteReceiptUrl = receiptUrl.startsWith('http') ? receiptUrl : `${baseUrl}${receiptUrl}`;
            await notifyAdmin(`${msg}\n\n🔗 <b>Receipt:</b> <a href="${absoluteReceiptUrl}">View File</a>`);
        }

        return NextResponse.json({ success: true, payment: manualPayment });
    } catch (error) {
        console.error('[MANUAL_PAYMENT_POST]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
