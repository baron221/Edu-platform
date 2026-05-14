import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/notes?lessonId=xxx — fetch all notes for a lesson
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const lessonId = req.nextUrl.searchParams.get('lessonId');

    if (!lessonId) {
        return NextResponse.json({ error: 'lessonId is required' }, { status: 400 });
    }

    const notes = await prisma.lessonNote.findMany({
        where: { userId, lessonId },
        orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json(notes);
}

// POST /api/notes — create a new note
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { lessonId, courseId, content, timestamp } = body;

    if (!lessonId || !courseId || !content || timestamp === undefined) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const note = await prisma.lessonNote.create({
        data: {
            userId,
            lessonId,
            courseId,
            content: content.trim(),
            timestamp: parseFloat(timestamp),
        },
    });

    return NextResponse.json(note, { status: 201 });
}

// DELETE /api/notes?id=xxx — delete a note
export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const noteId = req.nextUrl.searchParams.get('id');

    if (!noteId) {
        return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
    }

    // Make sure user owns this note
    const note = await prisma.lessonNote.findUnique({ where: { id: noteId } });
    if (!note || note.userId !== userId) {
        return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    await prisma.lessonNote.delete({ where: { id: noteId } });
    return NextResponse.json({ success: true });
}

// PATCH /api/notes?id=xxx — update note content
export async function PATCH(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    const noteId = req.nextUrl.searchParams.get('id');

    if (!noteId) {
        return NextResponse.json({ error: 'Note id is required' }, { status: 400 });
    }

    const note = await prisma.lessonNote.findUnique({ where: { id: noteId } });
    if (!note || note.userId !== userId) {
        return NextResponse.json({ error: 'Not found or forbidden' }, { status: 403 });
    }

    const { content } = await req.json();
    const updated = await prisma.lessonNote.update({
        where: { id: noteId },
        data: { content: content.trim() },
    });

    return NextResponse.json(updated);
}
