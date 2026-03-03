import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { notifyNewUser } from '@/lib/telegram';

export async function POST(req: Request) {
    try {
        const { phone, code, name, role } = await req.json();

        if (!phone || !code) {
            return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
        }

        // Find the latest active OTP for this phone
        const otpRecord = await prisma.phoneOtp.findFirst({
            where: {
                phone,
                code,
                used: false,
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' },
        });

        if (!otpRecord) {
            return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
        }

        // Mark OTP as used
        await prisma.phoneOtp.update({
            where: { id: otpRecord.id },
            data: { used: true },
        });

        // Find or create user
        let user = await prisma.user.findUnique({ where: { phone } });

        if (!user) {
            // New user registration flow
            const allowedRoles = ['student', 'instructor'];
            const assignedRole = allowedRoles.includes(role) ? role : 'student';

            const userEmail = `${phone.replace('+', '')}@phone.edunation.local`;

            user = await prisma.user.create({
                data: {
                    phone,
                    name: name || 'User',
                    email: userEmail,
                    role: assignedRole,
                },
            });

            // Create free subscription for new user
            await prisma.subscription.create({
                data: {
                    userId: user.id,
                    plan: 'free',
                    status: 'active',
                },
            });

            // Notify Admin
            notifyNewUser({ name: user.name, email: userEmail, role: assignedRole, provider: 'phone' });
        }

        // Issue short-lived signed token (5 min TTL) for NextAuth credentials provider
        const expiry = Date.now() + 5 * 60 * 1000;
        const payload = `${user.id}:${expiry}:${phone}`;
        const secret = process.env.NEXTAUTH_SECRET ?? 'fallback';
        const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        const token = `${Buffer.from(payload).toString('base64url')}.${sig}`;

        return NextResponse.json({ success: true, token });

    } catch (err) {
        console.error('[VERIFY_OTP_ERROR]', err);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
