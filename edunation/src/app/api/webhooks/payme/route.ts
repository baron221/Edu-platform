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

        if (!purchaseId && method === 'CheckPerformTransaction') {
            return respond(null, { code: -31050, message: 'Account not found' }, id);
        }

        let purchase: any = null;
        if (purchaseId) {
            purchase = await prisma.purchase.findUnique({
                where: { id: purchaseId }
            });

            if (!purchase) {
                return respond(null, { code: -31050, message: 'Order not found' }, id);
            }
        }

        // 3. Handle specific JSON-RPC Method
        switch (method) {
            case 'CheckPerformTransaction': {
                // Check if payment is possible (amount must match in tiyin)
                const amountInTiyin = purchase.amount * 100;
                if (params.amount !== amountInTiyin) {
                    return respond(null, { code: -31001, message: 'Incorrect amount' }, id);
                }
                if (purchase.status !== 'pending') {
                    return respond(null, { code: -31050, message: 'Order already completed or cancelled' }, id);
                }

                return respond({
                    allow: true,
                    detail: { receipt_type: 0, items: [{ title: 'Course Enrollment', price: amountInTiyin, count: 1, package_code: '12345', vat_percent: 0 }] }
                }, null, id);
            }

            case 'CreateTransaction': {
                // If the transaction is already "completed", we shouldn't recreate
                if (purchase.status === 'completed') {
                    return respond(null, { code: -31050, message: 'Order already completed' }, id);
                }

                // Assuming Payme generates a unique transaction_id for their side (params.id)
                // Update our transactionId to match theirs for future reference
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: { transactionId: params.id }
                });

                return respond({
                    create_time: Date.now(),
                    transaction: purchase.id,
                    state: 1, // 1 = created
                }, null, id);
            }

            case 'PerformTransaction': {
                // The actual money deduction phase!

                // If it was already completed, just return the saved timestamp to be idempotent
                if (purchase.status === 'completed') {
                    return respond({
                        transaction: purchase.id,
                        perform_time: purchase.updatedAt.getTime(),
                        state: 2, // 2 = completed
                    }, null, id);
                }

                // 1. Mark Purchase as completed
                const updatedPurchase = await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: { status: 'completed' }
                });

                // 2. Grant access to the course via Enrollment
                await prisma.enrollment.upsert({
                    where: {
                        userId_courseId: {
                            userId: purchase.userId,
                            courseId: purchase.courseId,
                        }
                    },
                    update: {},
                    create: {
                        userId: purchase.userId,
                        courseId: purchase.courseId,
                        completed: false,
                    }
                });

                return respond({
                    transaction: purchase.id,
                    perform_time: updatedPurchase.updatedAt.getTime(),
                    state: 2, // 2 = completed
                }, null, id);
            }

            case 'CancelTransaction': {
                if (purchase.status === 'completed') {
                    // Usually you cannot cancel a completed transaction directly without refund logic
                    // Payme uses state -2 for cancelled after complete, -1 for cancelled before complete
                    return respond(null, { code: -31007, message: 'Cannot cancel completed transaction' }, id);
                }

                const updatedPurchase = await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: { status: 'failed' }
                });

                return respond({
                    transaction: purchase.id,
                    cancel_time: updatedPurchase.updatedAt.getTime(),
                    state: -1, // -1 = cancelled
                }, null, id);
            }

            case 'CheckTransaction': {
                // Simple status map
                let state = 1;
                if (purchase.status === 'completed') state = 2;
                if (purchase.status === 'failed') state = -1;

                return respond({
                    create_time: purchase.createdAt.getTime(),
                    perform_time: purchase.status === 'completed' ? purchase.updatedAt.getTime() : 0,
                    cancel_time: purchase.status === 'failed' ? purchase.updatedAt.getTime() : 0,
                    transaction: purchase.id,
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
