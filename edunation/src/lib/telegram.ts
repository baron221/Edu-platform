/**
 * Telegram Admin Notification Utility
 * Sends messages to the admin's Telegram chat via Bot API.
 * Works on localhost — no domain/webhook setup needed.
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT = process.env.TELEGRAM_ADMIN_CHAT_ID;
const EXPERT_CHAT = process.env.TELEGRAM_EXPERT_CHAT_ID;

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

export async function sendTelegramDM(chatId: string, message: string): Promise<void> {
    if (!BOT_TOKEN || !chatId) return;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'HTML',
            }),
        });
    } catch (err) {
        console.error(`[TELEGRAM_DM_ERROR][${chatId}]`, err);
    }
}

// ── Pre-built notification templates ────────────────────────────────────────

export function notifyNewUser(opts: {
    name: string | null;
    email: string | null;
    role: string;
    provider: 'email' | 'google' | 'github' | 'telegram' | 'phone';
}) {
    const icon = opts.provider === 'google' ? '🟢'
        : opts.provider === 'github' ? '⚫'
            : opts.provider === 'telegram' ? '🔵'
                : opts.provider === 'phone' ? '📱'
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

// ── Expert Channel Notifications ────────────────────────────────────────────

export async function notifyExpertChannel(message: string): Promise<void> {
    if (!BOT_TOKEN || !EXPERT_CHAT) return;
    try {
        await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: EXPERT_CHAT,
                text: message,
                parse_mode: 'HTML',
            }),
        });
    } catch (err) {
        console.error('[TELEGRAM_EXPERT_NOTIFY_ERROR]', err);
    }
}

export function notifyExpertApplication(opts: {
    name: string | null;
    email: string | null;
    skills: string;
    motivation: string;
    hourlyRate: number;
    telegramUsername?: string | null;
}) {
    const msg = `🌟 <b>New Expert Application!</b>\n\n` +
        `👤 <b>Name:</b> ${opts.name ?? '—'}\n` +
        `📩 <b>Email:</b> ${opts.email ?? '—'}\n` +
        `🔧 <b>Skills:</b> ${opts.skills}\n` +
        `💰 <b>Hourly Rate:</b> ${opts.hourlyRate.toLocaleString()} UZS\n` +
        (opts.telegramUsername ? `📲 <b>Telegram:</b> @${opts.telegramUsername}\n` : '') +
        `📝 <b>Motivation:</b> ${opts.motivation}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

    return Promise.allSettled([
        notifyExpertChannel(msg),
        notifyAdmin(msg)
    ]);
}

export function notifyExpertApproved(opts: {
    name: string | null;
    email: string | null;
    telegramId?: string | null;
}) {
    const msg = `✅ <b>Expert Approved!</b>\n\n` +
        `👤 <b>Name:</b> ${opts.name ?? '—'}\n` +
        `📩 <b>Email:</b> ${opts.email ?? '—'}\n` +
        `🕐 <b>Time:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

    const promises = [notifyExpertChannel(msg)];
    if (opts.telegramId) promises.push(sendTelegramDM(opts.telegramId, msg));
    return Promise.allSettled(promises);
}

export function notifyExpertRejected(opts: {
    name: string | null;
    email: string | null;
    adminNote?: string | null;
    telegramId?: string | null;
}) {
    const msg = `❌ <b>Expert Application Rejected</b>\n\n` +
        `👤 <b>Name:</b> ${opts.name ?? '—'}\n` +
        `📩 <b>Email:</b> ${opts.email ?? '—'}\n` +
        (opts.adminNote ? `📋 <b>Reason:</b> ${opts.adminNote}\n` : '') +
        `🕐 <b>Time:</b> ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}`;

    const promises = [notifyExpertChannel(msg)];
    if (opts.telegramId) promises.push(sendTelegramDM(opts.telegramId, msg));
    return Promise.allSettled(promises);
}

export function notifyNewExpertSession(opts: {
    expertName: string | null;
    studentName: string | null;
    topic: string;
    scheduledAt: Date;
    totalPrice: number;
    expertTelegramId?: string | null;
}) {
    const msg = `📅 <b>New Session Booked!</b>\n\n` +
        `🎓 <b>Expert:</b> ${opts.expertName ?? '—'}\n` +
        `👤 <b>Student:</b> ${opts.studentName ?? '—'}\n` +
        `📖 <b>Topic:</b> ${opts.topic}\n` +
        `🕐 <b>Scheduled:</b> ${opts.scheduledAt.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n` +
        `💰 <b>Price:</b> ${opts.totalPrice.toLocaleString()} UZS`;

    const promises = [
        notifyExpertChannel(msg),
        notifyAdmin(msg)
    ];
    if (opts.expertTelegramId) promises.push(sendTelegramDM(opts.expertTelegramId, msg));
    return Promise.allSettled(promises);
}
