import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key_to_bypass_build_error');
const FROM = process.env.EMAIL_FROM || 'EduNationUz <noreply@edunationuz.com>';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://edunationuz.com';

// ── Welcome Email ──────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name: string) {
    if (!process.env.RESEND_API_KEY) return;
    try {
        await resend.emails.send({
            from: FROM,
            to,
            subject: `Welcome to EduNationUz, ${name}! 🎓`,
            html: `
<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f0c29;font-family:Inter,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1e1b4b;border-radius:16px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:4px 0;"></td></tr>
<tr><td align="center" style="padding:40px;">
<div style="font-size:40px;margin-bottom:16px;">🎓</div>
<h1 style="color:#fff;font-size:28px;font-weight:900;margin:0 0 8px;">Welcome, ${name}!</h1>
<p style="color:#94a3b8;font-size:16px;margin:0 0 32px;">You've just joined the brightest minds on EduNationUz.</p>
<a href="${BASE_URL}/courses" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#06b6d4);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:16px;">Browse Free Courses →</a>
<p style="color:#475569;font-size:13px;margin:32px 0 0;">Start free. Learn anything. Upgrade when ready.</p>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#7c3aed,#06b6d4);padding:3px 0;"></td></tr>
</table></td></tr></table>
</body></html>
            `,
        });
    } catch (err) {
        console.error('sendWelcomeEmail failed:', err);
    }
}

// ── Purchase Receipt Email ─────────────────────────────────
export async function sendPurchaseReceiptEmail(to: string, name: string, courseTitle: string, amount: number, currency: string) {
    if (!process.env.RESEND_API_KEY) return;
    try {
        await resend.emails.send({
            from: FROM,
            to,
            subject: `Your order confirmed – ${courseTitle} ✅`,
            html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0c29;font-family:Inter,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1e1b4b;border-radius:16px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#10b981,#06b6d4);padding:4px 0;"></td></tr>
<tr><td align="center" style="padding:40px;">
<div style="font-size:40px;margin-bottom:16px;">💳</div>
<h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 8px;">Payment Confirmed!</h1>
<p style="color:#94a3b8;font-size:16px;margin:0 0 24px;">Hi ${name}, your purchase is complete.</p>
<div style="background:#0f172a;border-radius:12px;padding:24px;text-align:left;margin-bottom:28px;">
<p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px;">Course</p>
<p style="color:#fff;font-size:18px;font-weight:700;margin:0 0 16px;">${courseTitle}</p>
<p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.1em;margin:0 0 4px;">Amount Paid</p>
<p style="color:#10b981;font-size:22px;font-weight:900;margin:0;">${amount.toLocaleString()} ${currency}</p>
</div>
<a href="${BASE_URL}/courses" style="display:inline-block;background:linear-gradient(135deg,#10b981,#06b6d4);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:16px;">Start Learning →</a>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#10b981,#06b6d4);padding:3px 0;"></td></tr>
</table></td></tr></table>
</body></html>
            `,
        });
    } catch (err) {
        console.error('sendPurchaseReceiptEmail failed:', err);
    }
}

// ── Course Completion Email ────────────────────────────────
export async function sendCourseCompletionEmail(to: string, name: string, courseTitle: string, certificateId: string) {
    if (!process.env.RESEND_API_KEY) return;
    try {
        await resend.emails.send({
            from: FROM,
            to,
            subject: `🎓 Congratulations! You completed "${courseTitle}"`,
            html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0c29;font-family:Inter,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1e1b4b;border-radius:16px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:4px 0;"></td></tr>
<tr><td align="center" style="padding:40px;">
<div style="font-size:56px;margin-bottom:16px;">🏆</div>
<h1 style="color:#fff;font-size:26px;font-weight:900;margin:0 0 8px;">You did it, ${name}!</h1>
<p style="color:#94a3b8;font-size:16px;margin:0 0 16px;">You successfully completed</p>
<h2 style="color:#fbbf24;font-size:20px;font-weight:700;margin:0 0 28px;">${courseTitle}</h2>
<p style="color:#94a3b8;font-size:15px;margin:0 0 24px;">Your certificate is ready. Share it with the world!</p>
<a href="${BASE_URL}/certificate/${certificateId}" style="display:inline-block;background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#1e293b;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:800;font-size:16px;">View My Certificate →</a>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#fbbf24,#f59e0b);padding:3px 0;"></td></tr>
</table></td></tr></table>
</body></html>
            `,
        });
    } catch (err) {
        console.error('sendCourseCompletionEmail failed:', err);
    }
}

// ── Password Reset Email ──────────────────────────────────
export async function sendPasswordResetEmail(to: string, name: string, resetLink: string) {
    if (!process.env.RESEND_API_KEY) return;
    try {
        await resend.emails.send({
            from: FROM,
            to,
            subject: `Reset your EduNationUz password 🔒`,
            html: `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f0c29;font-family:Inter,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#1e1b4b;border-radius:16px;overflow:hidden;max-width:600px;">
<tr><td style="background:linear-gradient(135deg,#ec4899,#8b5cf6);padding:4px 0;"></td></tr>
<tr><td align="center" style="padding:40px;">
<div style="font-size:40px;margin-bottom:16px;">🔐</div>
<h1 style="color:#fff;font-size:24px;font-weight:900;margin:0 0 8px;">Password Reset Request</h1>
<p style="color:#94a3b8;font-size:16px;margin:0 0 24px;">Hi ${name}, we received a request to reset your password.</p>
<p style="color:#64748b;font-size:15px;margin:0 0 32px;line-height:1.5;">Click the button below to securely set a new password. This link will expire in 1 hour.</p>
<a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#ec4899,#8b5cf6);color:#fff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:16px;">Reset Password →</a>
<p style="color:#475569;font-size:13px;margin:32px 0 0;">If you didn't request a password reset, you can safely ignore this email.</p>
</td></tr>
<tr><td style="background:linear-gradient(135deg,#ec4899,#8b5cf6);padding:3px 0;"></td></tr>
</table></td></tr></table>
</body></html>
            `,
        });
    } catch (err) {
        console.error('sendPasswordResetEmail failed:', err);
    }
}
