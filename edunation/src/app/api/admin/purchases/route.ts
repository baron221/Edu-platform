import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import prisma from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const purchases = await prisma.purchase.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { email: true, name: true } },
                course: { select: { title: true, price: true } }
            }
        });

        const subscriptions = await prisma.subscriptionPayment.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { email: true, name: true } }
            }
        });

        return NextResponse.json({ purchases, subscriptions });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if ((session?.user as any)?.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const type = searchParams.get('type');

        if (!id || !type) return NextResponse.json({ error: 'ID and type required' }, { status: 400 });

        if (type === 'purchase') {
            await prisma.purchase.delete({ where: { id } });
            // Optionally: Delete corresponding Progress profiles if un-enrolling
        } else if (type === 'subscription') {
            await prisma.subscriptionPayment.delete({ where: { id } });
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
