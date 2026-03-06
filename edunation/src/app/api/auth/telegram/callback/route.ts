import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

function verifyTelegramHash(data: Record<string, string>, botToken: string): boolean {
    const { hash, ...rest } = data;
    const checkString = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('\n');
    const secretKey = crypto.createHash('sha256').update(botToken).digest();
    const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
    return hmac === hash;
}

export async function GET(req: Request) {
    const { searchParams, origin } = new URL(req.url);

    const params: Record<string, string> = {};
    searchParams.forEach((v, k) => { params[k] = v; });

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const appOrigin = process.env.NEXTAUTH_URL ?? origin;

    const sendError = (msg: string) => new Response(
        `<script>window.opener?.postMessage({type:'telegram_auth',error:'${msg}'},'${appOrigin}');window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
    );

    if (!botToken) return sendError('server_error');
    if (!params.hash || !verifyTelegramHash(params, botToken)) return sendError('invalid_hash');

    const authDate = parseInt(params.auth_date ?? '0', 10);
    if (Math.floor(Date.now() / 1000) - authDate > 600) return sendError('expired');

    try {
        const telegramId = params.id;
        const name = [params.first_name, params.last_name].filter(Boolean).join(' ') || 'Telegram User';
        const email = params.username
            ? `${params.username}@telegram.edunation.local`
            : `tg_${telegramId}@telegram.edunation.local`;

        let user = await prisma.user.findUnique({ where: { telegramId } });
        if (!user) {
            user = await prisma.user.create({
                data: { telegramId, name, image: params.photo_url ?? null, email, role: 'student' },
            });
            await prisma.subscription.create({
                data: { userId: user.id, plan: 'free', status: 'active' },
            });
        }

        // Issue short-lived signed token (5 min TTL)
        const expiry = Date.now() + 5 * 60 * 1000;
        const payload = `${user.id}:${expiry}`;
        const secret = process.env.NEXTAUTH_SECRET ?? 'fallback';
        const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const token = `${Buffer.from(payload).toString('base64url')}.${sig}`;

        // Send token back to the opener window via postMessage, then close popup
        const html = `<!DOCTYPE html><html><body><script>
window.opener?.postMessage({ type: 'telegram_auth', token: '${token}' }, '${appOrigin}');
window.close();
<\/script><p>Signing in…</p></body></html>`;

        return new Response(html, { headers: { 'Content-Type': 'text/html' } });
    } catch {
        return sendError('server_error');
    }
}
