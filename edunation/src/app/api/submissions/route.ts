import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST: Student submits an assignment
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lessonId, fileUrl, content } = await req.json();

        if (!lessonId) {
            return NextResponse.json({ error: 'Lesson ID is required' }, { status: 400 });
        }

        // Check if already submitted
        const existing = await prisma.submission.findFirst({
            where: {
                lessonId,
                userId: user.id
            }
        });

        if (existing) {
            // Update existing submission
            const updated = await prisma.submission.update({
                where: { id: existing.id },
                data: {
                    fileUrl: fileUrl || existing.fileUrl,
                    content: content || existing.content,
                    status: 'PENDING', // Reset status on resubmission
                    updatedAt: new Date()
                }
            });
            return NextResponse.json(updated);
        }

        const submission = await prisma.submission.create({
            data: {
                lessonId,
                userId: user.id,
                fileUrl,
                content,
                status: 'PENDING'
            }
        });

        return NextResponse.json(submission);
    } catch (error: any) {
        console.error('Submission POST Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// GET: Get submissions for a lesson or current user
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const lessonId = searchParams.get('lessonId');
        const userId = searchParams.get('userId'); // For instructors to see a specific student
        const all = searchParams.get('all') === 'true'; // For instructors to see all for a lesson

        // If 'all' is true, user must be instructor/admin
        if (all || userId) {
            if (user.role !== 'admin' && user.role !== 'instructor') {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const where: any = {};
            if (lessonId) where.lessonId = lessonId;
            if (userId) where.userId = userId;

            const submissions = await prisma.submission.findMany({
                where,
                include: {
                    user: {
                        select: { name: true, email: true, university: true }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });
            return NextResponse.json(submissions);
        }

        // Default: Get current user's submission for a lesson
        if (!lessonId) {
            return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 });
        }

        const submission = await prisma.submission.findFirst({
            where: {
                lessonId,
                userId: user.id
            }
        });

        return NextResponse.json(submission || null);
    } catch (error: any) {
        console.error('Submission GET Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH: Instructor grades a submission
export async function PATCH(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        const user = session?.user as any;
        if (!user?.id || (user.role !== 'admin' && user.role !== 'instructor')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, status, grade, feedback } = await req.json();

        if (!id) {
            return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
        }

        const updated = await prisma.submission.update({
            where: { id },
            data: {
                status,
                grade,
                feedback,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(updated);
    } catch (error: any) {
        console.error('Submission PATCH Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
