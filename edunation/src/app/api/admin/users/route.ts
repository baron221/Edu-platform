import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: { subscription: { select: { plan: true, status: true } } },
    });
    return NextResponse.json(users);
}

export async function PATCH(req: Request) {
    const body = await req.json(); // { id, role }
    const user = await prisma.user.update({
        where: { id: body.id },
        data: { role: body.role },
    });
    return NextResponse.json(user);
}
export async function DELETE(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        await prisma.user.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
