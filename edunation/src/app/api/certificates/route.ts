import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { courseId } = body;

        if (!courseId) {
            return new NextResponse('Missing courseId', { status: 400 });
        }

        // Verify the user actually completed the course
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: { userId, courseId }
            }
        });

        if (!enrollment || !enrollment.completed) {
            return new NextResponse('Course not completed', { status: 400 });
        }

        // Check if certificate already exists
        const existingCert = await prisma.certificate.findUnique({
            where: {
                userId_courseId: { userId, courseId }
            },
            include: {
                course: true,
                user: true
            }
        });

        if (existingCert) {
            return NextResponse.json(existingCert);
        }

        // If not, generate a new record for it
        const newCert = await prisma.certificate.create({
            data: {
                userId,
                courseId,
            },
            include: {
                course: true,
                user: true
            }
        });

        return NextResponse.json(newCert);
    } catch (error) {
        console.error('Error generating certificate:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;

        if (!userId) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');

        if (!courseId) {
            return new NextResponse('Missing courseId', { status: 400 });
        }

        const cert = await prisma.certificate.findUnique({
            where: {
                userId_courseId: { userId, courseId }
            },
            include: {
                course: true,
                user: true
            }
        });

        if (!cert) {
            return new NextResponse('Not found', { status: 404 });
        }

        return NextResponse.json(cert);
    } catch (error) {
        console.error('Error fetching certificate:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
