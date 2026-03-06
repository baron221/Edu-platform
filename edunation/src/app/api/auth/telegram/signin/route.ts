import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

/**
 * POST /api/auth/telegram/signin
 * Called by the login page after the Telegram widget fires.
 * Verifies the Telegram data, finds/creates the user,
 * then returns a short-lived token the client uses to
 * call NextAuth credentials sign-in.
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { id, first_name, last_name, username, photo_url, auth_date, hash } = body;

        const botToken = process.env.TELEGRAM_BOT_TOKEN;
        if (!botToken) {
            return NextResponse.json({ error: 'Bot not configured' }, { status: 500 });
        }

        // 1. Verify hash
        const params: Record<string, string> = { id, auth_date: String(auth_date) };
        if (first_name) params.first_name = first_name;
        if (last_name) params.last_name = last_name;
        if (username) params.username = username;
        if (photo_url) params.photo_url = photo_url;

        const checkString = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('\n');
        const secretKey = crypto.createHash('sha256').update(botToken).digest();
        const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');

        if (hmac !== hash) {
            return NextResponse.json({ error: 'Invalid hash' }, { status: 401 });
        }

        // 2. Freshness check (10 min)
        if (Math.floor(Date.now() / 1000) - Number(auth_date) > 600) {
            return NextResponse.json({ error: 'Auth expired' }, { status: 401 });
        }

        // 3. Find or create user
        const name = [first_name, last_name].filter(Boolean).join(' ') || 'Telegram User';
        const email = username
            ? `${username}@telegram.edunation.local`
            : `tg_${id}@telegram.edunation.local`;

        let user = await prisma.user.findUnique({ where: { telegramId: String(id) } });

        if (!user) {
            user = await prisma.user.create({
                data: { telegramId: String(id), name, image: photo_url ?? null, email, role: 'student' },
            });
            await prisma.subscription.create({
                data: { userId: user.id, plan: 'free', status: 'active' },
            });
        }

        // 4. Issue short-lived signed token (TTL 5 min)
        const expiry = Date.now() + 5 * 60 * 1000;
        const payload = `${user.id}:${expiry}`;
        const secret = process.env.NEXTAUTH_SECRET ?? 'fallback';
        const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const token = `${Buffer.from(payload).toString('base64url')}.${sig}`;

        return NextResponse.json({ token });
    } catch (err) {
        console.error('[TELEGRAM_SIGNIN_ERROR]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
