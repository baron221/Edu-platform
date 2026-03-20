import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const code = searchParams.get('code');

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        const promo = await prisma.promoCode.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!promo || !promo.isActive) {
            return NextResponse.json({ error: 'Invalid or inactive promo code' }, { status: 404 });
        }

        // Check expiration
        if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
            return NextResponse.json({ error: 'Promo code has expired' }, { status: 400 });
        }

        // Check usage limit
        if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
            return NextResponse.json({ error: 'Promo code usage limit reached' }, { status: 400 });
        }

        return NextResponse.json({
            id: promo.id,
            code: promo.code,
            discountType: promo.discountType,
            discountValue: promo.discountValue
        });

    } catch (error) {
        console.error('Promo validation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
