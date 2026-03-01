import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper to send Payme JSON-RPC responses
const respond = (result: any = null, error: any = null, id: string | number | null = null) => {
    return NextResponse.json({
        jsonrpc: '2.0',
        id,
        ...(error ? { error } : { result })
    });
};

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');

        // 1. Basic Auth Verification
        if (!authHeader || !authHeader.startsWith('Basic ')) {
            return respond(null, { code: -32504, message: 'Insufficient privilege' });
        }

        const encodedCreds = authHeader.split(' ')[1];
        const decodedCreds = Buffer.from(encodedCreds, 'base64').toString('ascii');
        // Payme sends "Paycom:KEY"
        const [, receivedKey] = decodedCreds.split(':');
        const merchantKey = process.env.PAYME_MERCHANT_KEY || 'dummy_payme_key';

        if (receivedKey !== merchantKey) {
            return respond(null, { code: -32504, message: 'Insufficient privilege' });
        }

        const body = await req.json();
        const { method, params, id } = body;

        // Ensure params exists
        if (!params) return respond(null, { code: -32600, message: 'Invalid Request' }, id);

        // 2. Identify the Purchase (Internal Order)
        const account = params.account;
        const purchaseId = account?.purchase_id || account?.order_id;
        const subPaymentId = account?.subscription_payment_id;

        if (!purchaseId && !subPaymentId && method === 'CheckPerformTransaction') {
            return respond(null, { code: -31050, message: 'Account not found' }, id);
        }

        let isSubscription = false;
        let order: any = null;

        if (purchaseId) {
            order = await prisma.purchase.findUnique({
                where: { id: purchaseId }
            });
        } else if (subPaymentId) {
            order = await prisma.subscriptionPayment.findUnique({
                where: { id: subPaymentId }
            });
            if (order) isSubscription = true;
        }

        if (!order) {
            return respond(null, { code: -31050, message: 'Order not found' }, id);
        }

        // 3. Handle specific JSON-RPC Method
        switch (method) {
            case 'CheckPerformTransaction': {
                // Check if payment is possible (amount must match in tiyin)
                const amountInTiyin = order.amount * 100;
                if (params.amount !== amountInTiyin) {
                    return respond(null, { code: -31001, message: 'Incorrect amount' }, id);
                }
                if (order.status !== 'pending') {
                    return respond(null, { code: -31050, message: 'Order already completed or cancelled' }, id);
                }

                return respond({
                    allow: true,
                    detail: { receipt_type: 0, items: [{ title: isSubscription ? 'Instructor Subscription' : 'Course Enrollment', price: amountInTiyin, count: 1, package_code: '12345', vat_percent: 0 }] }
                }, null, id);
            }

            case 'CreateTransaction': {
                // If the transaction is already "completed", we shouldn't recreate
                if (order.status === 'completed') {
                    return respond(null, { code: -31050, message: 'Order already completed' }, id);
                }

                // Assuming Payme generates a unique transaction_id for their side (params.id)
                // Update our transactionId to match theirs for future reference
                if (isSubscription) {
                    await prisma.subscriptionPayment.update({
                        where: { id: order.id },
                        data: { transactionId: params.id }
                    });
                } else {
                    await prisma.purchase.update({
                        where: { id: order.id },
                        data: { transactionId: params.id }
                    });
                }

                return respond({
                    create_time: Date.now(),
                    transaction: order.id,
                    state: 1, // 1 = created
                }, null, id);
            }

            case 'PerformTransaction': {
                // The actual money deduction phase!

                // If it was already completed, just return the saved timestamp to be idempotent
                if (order.status === 'completed') {
                    return respond({
                        transaction: order.id,
                        perform_time: order.updatedAt.getTime(),
                        state: 2, // 2 = completed
                    }, null, id);
                }

                if (isSubscription) {
                    // Mark SubscriptionPayment as completed
                    const updatedOrder = await prisma.subscriptionPayment.update({
                        where: { id: order.id },
                        data: { status: 'completed' }
                    });

                    // Upgrade the user to instructor
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + 30);

                    const PLANS = {
                        starter: { maxCourses: 3, canAdvertise: false },
                        pro: { maxCourses: 20, canAdvertise: true },
                        studio: { maxCourses: -1, canAdvertise: true },
                    };
                    const cfg = PLANS[order.plan as keyof typeof PLANS] || PLANS.starter;

                    await prisma.instructorSubscription.upsert({
                        where: { userId: order.userId },
                        update: { plan: order.plan, status: 'active', startDate: new Date(), endDate, ...cfg },
                        create: { userId: order.userId, plan: order.plan, status: 'active', startDate: new Date(), endDate, ...cfg },
                    });
                    await prisma.user.update({ where: { id: order.userId }, data: { role: 'instructor' } });

                    const user = await prisma.user.findUnique({ where: { id: order.userId } });
                    const name = user?.name || 'Instructor';
                    const slug = name.toLowerCase().replace(/\s+/g, '-') + '-' + order.userId.slice(-4);

                    await prisma.instructorProfile.upsert({
                        where: { userId: order.userId },
                        update: {},
                        create: { userId: order.userId, slug, tagline: 'Passionate educator on EduNationUz' },
                    });

                    return respond({
                        transaction: order.id,
                        perform_time: updatedOrder.updatedAt.getTime(),
                        state: 2, // 2 = completed
                    }, null, id);
                } else {
                    // Mark Purchase as completed
                    const updatedOrder = await prisma.purchase.update({
                        where: { id: order.id },
                        data: { status: 'completed' }
                    });

                    // Grant access to the course via Enrollment
                    await prisma.enrollment.upsert({
                        where: {
                            userId_courseId: {
                                userId: order.userId,
                                courseId: order.courseId,
                            }
                        },
                        update: {},
                        create: {
                            userId: order.userId,
                            courseId: order.courseId,
                            completed: false,
                        }
                    });

                    return respond({
                        transaction: order.id,
                        perform_time: updatedOrder.updatedAt.getTime(),
                        state: 2, // 2 = completed
                    }, null, id);
                }
            }

            case 'CancelTransaction': {
                if (order.status === 'completed') {
                    return respond(null, { code: -31007, message: 'Cannot cancel completed transaction' }, id);
                }

                let updatedOrder;
                if (isSubscription) {
                    updatedOrder = await prisma.subscriptionPayment.update({
                        where: { id: order.id },
                        data: { status: 'failed' }
                    });
                } else {
                    updatedOrder = await prisma.purchase.update({
                        where: { id: order.id },
                        data: { status: 'failed' }
                    });
                }

                return respond({
                    transaction: order.id,
                    cancel_time: updatedOrder.updatedAt.getTime(),
                    state: -1, // -1 = cancelled
                }, null, id);
            }

            case 'CheckTransaction': {
                // Simple status map
                let state = 1;
                if (order.status === 'completed') state = 2;
                if (order.status === 'failed') state = -1;

                return respond({
                    create_time: order.createdAt.getTime(),
                    perform_time: order.status === 'completed' ? order.updatedAt.getTime() : 0,
                    cancel_time: order.status === 'failed' ? order.updatedAt.getTime() : 0,
                    transaction: order.id,
                    state,
                    reason: null,
                }, null, id);
            }

            default:
                return respond(null, { code: -32601, message: 'Method not found' }, id);
        }

    } catch (error) {
        console.error('[PAYME_WEBHOOK_ERROR]', error);
        return respond(null, { code: -32400, message: 'Internal Server Error' }, null);
    }
}
