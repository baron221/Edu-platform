import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Public endpoint — no auth required (certificates are public shareable links)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return new NextResponse('Missing id', { status: 400 });

    const cert = await prisma.certificate.findUnique({
        where: { id },
        include: {
            course: { select: { title: true, category: true, instructor: true } },
            user: { select: { name: true } }
        }
    });

    if (!cert) return new NextResponse('Not found', { status: 404 });

    return NextResponse.json(cert);
}
