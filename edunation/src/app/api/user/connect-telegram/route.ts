import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

function verifyTelegramHash(data: Record<string, string>, botToken: string): boolean {
    const { hash, ...rest } = data;
    const checkString = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('\n');
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return hmac === hash;
}

export async function GET(req: Request) {
    const { searchParams, origin } = new URL(req.url);

    // Ensure user is logged in
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => { params[k] = v; });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const appOrigin = process.env.NEXTAUTH_URL ?? origin;

    const sendError = (msg: string) => new Response(
        `<script>window.opener?.postMessage({type:'telegram_connect',error:'${msg}'},'${appOrigin}');window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
    );

    if (!userId) return sendError('unauthorized');
    if (!botToken) return sendError('server_error');
    if (!params.hash || !verifyTelegramHash(params, botToken)) return sendError('invalid_hash');

    const authDate = parseInt(params.auth_date ?? '0', 10);
    if (Math.floor(Date.now() / 1000) - authDate > 600) return sendError('expired');

    try {
        const telegramId = params.id;
        
        // Ensure this telegram ID isn't already used by another account
        const existing = await prisma.user.findUnique({ where: { telegramId } });
        if (existing && existing.id !== userId) {
            return sendError('telegram_already_linked');
        }

        // Link to current user
        await prisma.user.update({
            where: { id: userId },
            data: { telegramId }
        });

        // Send success back to the opener window via postMessage, then close popup
        const html = `<!DOCTYPE html><html><body><script>
window.opener?.postMessage({ type: 'telegram_connect', success: true, telegramId: '${telegramId}' }, '${appOrigin}');
window.close();
</script><p>Linking successful. You can close this window.</p></body></html>`;

        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    } catch (err) {
        console.error('Failed to link Telegram:', err);
        return sendError('server_error');
    }
}
