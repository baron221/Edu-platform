import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'instructor' && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;

    const exams = await prisma.exam.findMany({
      where: { courseId },
      include: {
        _count: {
          select: { questions: true, attempts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(exams);
  } catch (error) {
    console.error('[INSTRUCTOR_EXAMS_GET]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== 'instructor' && (session.user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: courseId } = await params;
    const body = await request.json();

    const exam = await prisma.exam.create({
      data: {
        courseId,
        title: body.title,
        description: body.description,
        timeLimit: parseInt(body.timeLimit) || 60,
        type: body.type || 'MIDTERM',
        passingScore: parseInt(body.passingScore) || 60
      }
    });

    return NextResponse.json(exam);
  } catch (error) {
    console.error('[INSTRUCTOR_EXAMS_POST]', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}
