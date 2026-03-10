import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { authOptions } from '../../auth/[...nextauth]/route';

// GET: Fetch user profile
export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            phone: true,
            telegramId: true,
            createdAt: true,
        }
    });

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
}

// PATCH: Update profile info (name, image, email)
export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, email, image } = body;

        // Basic validation
        if (email && email !== session?.user?.email) {
            // Check if email is already taken
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name ?? undefined,
                email: email ?? undefined,
                image: image ?? undefined,
            }
        });

        return NextResponse.json({
            message: 'Profile updated successfully',
            user: {
                name: updatedUser.name,
                email: updatedUser.email,
                image: updatedUser.image
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

// PUT: Change password
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { currentPassword, newPassword } = body;

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Missing passwords' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user || !user.password) {
            return NextResponse.json({ error: 'User cannot change password (likely OAuth)' }, { status: 400 });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        return NextResponse.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
    }
}
