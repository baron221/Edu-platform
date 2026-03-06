import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/experts/sessions/[id]/set-meet — called by Make/n8n automation
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { meetLink, secret } = await req.json();
    console.log('[CALLBACK_POST] Received for ID:', id, 'Link:', meetLink, 'Secret valid:', secret === process.env.AUTOMATION_CALLBACK_SECRET);

    // Validate callback secret
    const expectedSecret = process.env.AUTOMATION_CALLBACK_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!meetLink) return NextResponse.json({ error: 'meetLink required' }, { status: 400 });

    const updated = await prisma.expertSession.update({
        where: { id },
        data: { meetLink, status: 'confirmed' },
    });

    return NextResponse.json({ ok: true, session: updated });
}
