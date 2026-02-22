import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const { name, email, password, role } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
        }

        // Only allow safe roles — no one can self-assign admin
        const allowedRoles = ['student', 'instructor'];
        const assignedRole = allowedRoles.includes(role) ? role : 'student';

        // Check if email already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: assignedRole,
            },
        });

        // Create free subscription
        await prisma.subscription.create({
            data: {
                userId: user.id,
                plan: 'free',
                status: 'active',
            },
        });

        return NextResponse.json({ ok: true, userId: user.id }, { status: 201 });
    } catch (err) {
        console.error('[REGISTER]', err);
        return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }
}
