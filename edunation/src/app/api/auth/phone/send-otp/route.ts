import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

// Eskiz.uz Token cache to avoid logging in on every request
let eskizToken: string | null = null;
let tokenExpiresAt = 0;

async function getEskizToken() {
    if (eskizToken && Date.now() < tokenExpiresAt) return eskizToken;

    const email = process.env.ESKIZ_EMAIL;
    const password = process.env.ESKIZ_PASSWORD;
    if (!email || !password) return null;

    try {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        const res = await fetch('https://notify.eskiz.uz/api/auth/login', {
            method: 'POST',
            body: formData,
        });

        const data = await res.json();
        if (data?.data?.token) {
            eskizToken = data.data.token;
            // Token usually valid for 30 days, we'll cache for 24 hours to be safe
            tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
            return eskizToken;
        }
    } catch (err) {
        console.error('[ESKIZ_LOGIN_ERROR]', err);
    }
    return null;
}

export async function POST(req: Request) {
    try {
        const { phone } = await req.json();

        // Expecting +998... format
        if (!phone || !/^\+998\d{9}$/.test(phone)) {
            return NextResponse.json({ error: 'Invalid phone number format. Must start with +998' }, { status: 400 });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Set expiry to 5 minutes from now
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        // Save OTP to DB
        await prisma.phoneOtp.create({
            data: {
                phone,
                code: otp,
                expiresAt,
            }
        });

        const message = `Your EduNationUz verification code is: ${otp}`;

        // Attempt to send via Eskiz
        const token = await getEskizToken();
        if (token) {
            const formData = new FormData();
            formData.append('mobile_phone', phone.replace('+', '')); // eskiz format: 998901234567
            formData.append('message', message);
            formData.append('from', '4546'); // Standard Eskiz sender

            await fetch('https://notify.eskiz.uz/api/message/sms/send', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            console.log(`[SMS_SENT] ${phone}`);
        } else {
            // Mock SMS if no Eskiz credentials
            console.warn(`[MOCK_SMS] To ${phone}: ${message}`);
        }

        return NextResponse.json({ success: true, mocked: !token });
    } catch (err) {
        console.error('[SEND_OTP_ERROR]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
