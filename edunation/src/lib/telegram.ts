/**
 * Telegram Admin Notification Utility
 * Sends messages to the admin's Telegram chat via Bot API.
 * Works on localhost — no domain/webhook setup needed.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT = process.env.TELEGRAM_ADMIN_CHAT_ID;

export async function notifyAdmin(message: string): Promise<void> {
    if (!BOT_TOKEN || !ADMIN_CHAT) return; // Silently skip if not configured

    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: ADMIN_CHAT,
                text: message,
                parse_mode: 'HTML',
            }),
        });
    } catch (err) {
        // Non-critical — never let notification failure break the main flow
        console.error('[TELEGRAM_NOTIFY_ERROR]', err);
    }
}

// ── Pre-built notification templates ────────────────────────────────────────

export function notifyNewUser(opts: {
    name: string | null;
    email: string | null;
    role: string;
    provider: 'email' | 'google' | 'github' | 'telegram';
}) {
    const icon = opts.provider === 'google' ? '🟢'
        : opts.provider === 'github' ? '⚫'
            : opts.provider === 'telegram' ? '🔵'
                : '📧';

    return notifyAdmin(
        `🎉 <b>New User Signup!</b>\n\n` +
        `${icon} <b>Provider:</b> ${opts.provider}\n` +
        `👤 <b>Name:</b> ${opts.name ?? '—'}\n` +
        `📩 <b>Email:</b> ${opts.email ?? '—'}\n` +
        `🎭 <b>Role:</b> ${opts.role}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`
    );
}

export function notifyNewPurchase(opts: {
    userName: string | null;
    userEmail: string | null;
    courseTitle?: string;
    amount: number;
    currency: string;
    provider: string;
}) {
    return notifyAdmin(
        `💰 <b>New Course Purchase!</b>\n\n` +
        `👤 <b>User:</b> ${opts.userName ?? '—'} (${opts.userEmail ?? '—'})\n` +
        `📚 <b>Course:</b> ${opts.courseTitle ?? '—'}\n` +
        `💵 <b>Amount:</b> ${opts.amount.toLocaleString()} ${opts.currency}\n` +
        `🏦 <b>Gateway:</b> ${opts.provider}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`
    );
}

export function notifyNewSubscription(opts: {
    userName: string | null;
    userEmail: string | null;
    plan: string;
    amount: number;
    currency: string;
    provider: string;
}) {
    return notifyAdmin(
        `⭐ <b>New Instructor Subscription!</b>\n\n` +
        `👤 <b>User:</b> ${opts.userName ?? '—'} (${opts.userEmail ?? '—'})\n` +
        `📋 <b>Plan:</b> ${opts.plan.toUpperCase()}\n` +
        `💵 <b>Amount:</b> ${opts.amount.toLocaleString()} ${opts.currency}\n` +
        `🏦 <b>Gateway:</b> ${opts.provider}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`
    );
}

export function notifySignIn(opts: {
    name: string | null;
    email: string | null;
    provider: string;
}) {
    const icon = opts.provider === 'google' ? '🟢'
        : opts.provider === 'github' ? '⚫'
            : opts.provider === 'telegram' ? '🔵'
                : '📧';

    return notifyAdmin(
        `🔐 <b>User Signed In</b>\n\n` +
        `${icon} <b>Provider:</b> ${opts.provider}\n` +
        `👤 <b>Name:</b> ${opts.name ?? '—'}\n` +
        `📩 <b>Email:</b> ${opts.email ?? '—'}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`
    );
}
