import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// PATCH /api/admin/experts/sessions/[id] — confirm session + fire Make/n8n webhook
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { action } = await req.json(); // 'confirm' | 'cancel'
    console.log('[SESSION_PATCH] Action:', action, 'ID:', id);

    const expertSession = await prisma.expertSession.findUnique({
        where: { id },
        include: {
            expert: { select: { name: true, email: true, telegramId: true } },
            student: { select: { name: true, email: true, telegramId: true } },
        },
    });
    if (!expertSession) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (action === 'cancel') {
        await prisma.expertSession.update({
            where: { id },
            data: { status: 'cancelled' },
        });
        return NextResponse.json({ ok: true, status: 'cancelled' });
    }

    if (action === 'confirm') {
        // Update status to confirming (Meet link will be set by Make/n8n callback)
        await prisma.expertSession.update({
            where: { id },
            data: { status: 'confirmed' },
        });
        console.log('[SESSION_PATCH] Status updated to confirmed');

        // Fire Make/n8n webhook (blocking for debug)
        const webhookUrl = process.env.AUTOMATION_WEBHOOK_URL;
        console.log('[SESSION_PATCH] Webhook URL:', webhookUrl);
        let webhookStatus = 0;
        if (webhookUrl) {
            try {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: id,
                        expertName: expertSession.expert.name,
                        expertTelegramId: expertSession.expert.telegramId,
                        studentName: expertSession.student.name,
                        studentTelegramId: expertSession.student.telegramId,
                        topic: expertSession.topic,
                        scheduledAt: expertSession.scheduledAt.toISOString(),
                        durationHours: expertSession.durationHours,
                        totalPrice: expertSession.totalPrice,
                        callbackUrl: `${process.env.NEXTAUTH_URL}/api/experts/sessions/${id}/set-meet`,
                        callbackSecret: process.env.AUTOMATION_CALLBACK_SECRET,
                    }),
                });
                webhookStatus = response.status;
                console.log('[SESSION_PATCH] Webhook Response Status:', response.status);
            } catch (err) {
                console.error('[SESSION_PATCH] WEBHOOK_ERROR:', err);
            }
        }

        return NextResponse.json({ ok: true, status: 'confirmed', webhookFired: !!webhookUrl, webhookStatus });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
