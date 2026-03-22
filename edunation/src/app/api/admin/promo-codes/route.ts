import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const promoCodes = await (prisma as any).promoCode.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(promoCodes);
    } catch (error) {
        console.error('Fetch promo codes error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { code, discountType, discountValue, expiresAt, usageLimit } = body;

        if (!code || !discountType || !discountValue) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const promo = await (prisma as any).promoCode.create({
            data: {
                code: code.toUpperCase(),
                discountType,
                discountValue,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                usageLimit: usageLimit ? parseInt(usageLimit) : null,
                isActive: true
            }
        });

        return NextResponse.json(promo);
    } catch (error) {
        console.error('Create promo code error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
