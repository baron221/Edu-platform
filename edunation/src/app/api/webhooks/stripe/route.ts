import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import Stripe from 'stripe';

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
            await prisma.purchase.update({
                where: { id: purchaseId },
                data: { status: 'completed' }
            });

            // 2. Grant access to the course
            await prisma.enrollment.upsert({
                where: {
                    userId_courseId: {
                        userId: userId,
                        courseId: courseId,
                    }
                },
                update: {},
                create: {
                    userId: userId,
                    courseId: courseId,
                    completed: false,
                }
            });

            console.log(`Successfully enrolled user ${userId} in course ${courseId} via Stripe`);
        }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
}
