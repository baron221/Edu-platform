import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // For security reasons, we do not reveal if a user exists or not.
        if (!user || !user.password) {
            return NextResponse.json({ ok: true });
        }

        // Generate a secure reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour expiration

        // Save token to DB (upsert so older tokens for this email are overwritten)
        await prisma.passwordResetToken.deleteMany({
            where: { email }
        });

        await prisma.passwordResetToken.create({
            data: {
                email,
                token,
                expiresAt,
            }
        });

        // Send Email
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        await sendPasswordResetEmail(user.email!, user.name || 'Student', resetLink);

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error('Error in forgot-password:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
