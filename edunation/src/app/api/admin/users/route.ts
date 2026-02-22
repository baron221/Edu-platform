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
