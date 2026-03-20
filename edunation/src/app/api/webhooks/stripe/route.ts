import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';
import { sendPurchaseReceiptEmail } from '@/lib/email';

export async function POST(req: Request) {
    const body = await req.text();
    const resolvedHeaders = await headers();
    const signature = resolvedHeaders.get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: any) {
        console.error('[STRIPE_WEBHOOK_ERROR]', error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === 'checkout.session.completed') {
        const purchaseId = session.metadata?.purchaseId;
        const courseId = session.metadata?.courseId;
        const userId = session.metadata?.userId;

        if (purchaseId && courseId && userId) {
            // 1. Mark purchase as completed
            const purchase = await prisma.purchase.update({
                where: { id: purchaseId },
                data: { status: 'completed' },
                include: {
                    user: { select: { email: true, name: true } },
                    course: { select: { title: true } }
                }
            });

            // 2. Grant access to the course
            await prisma.enrollment.upsert({
                where: { userId_courseId: { userId, courseId } },
                update: {},
                create: { userId, courseId, completed: false }
            });

            // 3. Send receipt email
            if (purchase.user?.email) {
                await sendPurchaseReceiptEmail(
                    purchase.user.email,
                    purchase.user.name || 'Student',
                    purchase.course.title,
                    purchase.amount,
                    purchase.currency
                );
            }

            console.log(`Successfully enrolled user ${userId} in course ${courseId} via Stripe`);
        } else if (session.metadata?.subscriptionPaymentId && session.metadata?.plan && session.metadata?.userId) {
            const subId = session.metadata.subscriptionPaymentId;
            const plan = session.metadata.plan;
            const subUserId = session.metadata.userId;

            // 1. Mark subscription payment as completed
            await prisma.subscriptionPayment.update({
                where: { id: subId },
                data: { status: 'completed' }
            });

            // 2. Upgrade the user to instructor
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 30);

            const PLANS = {
                starter: { maxCourses: 3, canAdvertise: false },
                pro: { maxCourses: 20, canAdvertise: true },
                studio: { maxCourses: -1, canAdvertise: true },
            };
            const cfg = PLANS[plan as keyof typeof PLANS] || PLANS.starter;

            await prisma.instructorSubscription.upsert({
                where: { userId: subUserId },
                update: { plan: plan, status: 'active', startDate: new Date(), endDate, ...cfg },
                create: { userId: subUserId, plan: plan, status: 'active', startDate: new Date(), endDate, ...cfg },
            });
            await prisma.user.update({ where: { id: subUserId }, data: { role: 'instructor' } });

            const user = await prisma.user.findUnique({ where: { id: subUserId } });
            const name = user?.name || 'Instructor';
            const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + subUserId.slice(-4);

            await prisma.instructorProfile.upsert({
                where: { userId: subUserId },
                update: {},
                create: { userId: subUserId, slug, tagline: 'Passionate educator on EduNationUz' },
            });

            console.log(`Successfully upgraded user ${subUserId} to instructor plan ${plan} via Stripe`);
        }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
}
