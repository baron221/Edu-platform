import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession(authOptions) as any;
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payments = await (prisma as any).manualPayment.findMany({
            include: {
                user: true,
                course: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(payments);
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions) as any;
        if (session?.user?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { id, status } = body; // 'approved' | 'rejected'

        if (!['approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const payment = await (prisma as any).manualPayment.update({
            where: { id },
            data: { status },
            include: { user: true, course: true }
        });

        if (status === 'approved') {
            if (payment.courseId) {
                // Course purchase — create enrollment
                await prisma.enrollment.upsert({
                    where: {
                        userId_courseId: {
                            userId: payment.userId,
                            courseId: payment.courseId
                        }
                    },
                    create: {
                        userId: payment.userId,
                        courseId: payment.courseId
                    },
                    update: {} // already enrolled
                });

                // Record purchase
                await prisma.purchase.create({
                    data: {
                        userId: payment.userId,
                        courseId: payment.courseId,
                        provider: 'manual',
                        transactionId: `manual_${payment.id}`,
                        amount: payment.course?.price || 0,
                        status: 'completed'
                    }
                });
            } else if (payment.planId) {
                // Subscription purchase
                const durationDays = payment.planId === 'pro_annual' ? 365 : 30;
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + durationDays);

                await prisma.instructorSubscription.upsert({
                    where: { userId: payment.userId },
                    create: {
                        userId: payment.userId,
                        plan: payment.planId.includes('pro') ? 'pro' : 'starter',
                        status: 'active',
                        endDate
                    },
                    update: {
                        plan: payment.planId.includes('pro') ? 'pro' : 'starter',
                        status: 'active',
                        endDate
                    }
                });
            }
        }

        return NextResponse.json(payment);
    } catch (error) {
        console.error('[ADMIN_MANUAL_PAYMENT_PATCH]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
