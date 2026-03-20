import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();

        const click_trans_id = formData.get('click_trans_id') as string;
        const service_id = formData.get('service_id') as string;
        const click_paydoc_id = formData.get('click_paydoc_id') as string;
        const merchant_trans_id = formData.get('merchant_trans_id') as string; // This is our Purchase ID
        const merchant_prepare_id = formData.get('merchant_prepare_id') as string;
        const amount = formData.get('amount') as string;
        const action = formData.get('action') as string;
        const error = formData.get('error') as string;
        const error_note = formData.get('error_note') as string;
        const sign_time = formData.get('sign_time') as string;
        const sign_string = formData.get('sign_string') as string;

        const clickSecretKey = process.env.CLICK_SECRET_KEY || 'dummy_secret';

        // 1. Verify Signature
        // md5(click_trans_id + service_id + secret_key + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
        const checkString = `${click_trans_id}${service_id}${clickSecretKey}${merchant_trans_id}${merchant_prepare_id || ''}${amount}${action}${sign_time}`;
        const generatedSign = crypto.createHash('md5').update(checkString).digest('hex');

        if (generatedSign !== sign_string) {
            return NextResponse.json({
                error: -1,
                error_note: 'SIGN CHECK FAILED'
            });
        }

        let isSubscription = false;
        let order: any = await prisma.purchase.findUnique({
            where: { id: merchant_trans_id }
        });

        if (!order) {
            order = await prisma.subscriptionPayment.findUnique({
                where: { id: merchant_trans_id }
            });
            if (order) isSubscription = true;
        }

        if (!order) {
            return NextResponse.json({
                error: -5,
                error_note: 'Order not found'
            });
        }

        if (Number(amount) !== order.amount) {
            return NextResponse.json({
                error: -2,
                error_note: 'Incorrect parameter amount'
            });
        }

        // Action 0: Prepare (Check if payment is possible)
        if (action === '0') {
            if (order.status !== 'pending') {
                return NextResponse.json({
                    error: -4,
                    error_note: 'Already paid or cancelled'
                });
            }

            return NextResponse.json({
                click_trans_id: click_trans_id,
                merchant_trans_id: merchant_trans_id,
                merchant_prepare_id: order.id,
                error: 0,
                error_note: 'Success'
            });
        }

        // Action 1: Complete (Confirm the payment)
        if (action === '1') {
            if (order.status !== 'pending') {
                return NextResponse.json({
                    click_trans_id: click_trans_id,
                    merchant_trans_id: merchant_trans_id,
                    merchant_confirm_id: order.id,
                    error: -4,
                    error_note: 'Already paid'
                });
            }

            if (isSubscription) {
                // Mark subscription payment as completed
                await prisma.subscriptionPayment.update({
                    where: { id: order.id },
                    data: {
                        status: 'completed',
                        transactionId: click_trans_id
                    }
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
            } else {
                // Mark purchase as completed
                await prisma.purchase.update({
                    where: { id: order.id },
                    data: {
                        status: 'completed',
                        transactionId: click_trans_id
                    }
                });

                // Grant course access
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
            }

            return NextResponse.json({
                click_trans_id: click_trans_id,
                merchant_trans_id: merchant_trans_id,
                merchant_confirm_id: order.id,
                error: 0,
                error_note: 'Success'
            });
        }

        return NextResponse.json({ error: -3, error_note: 'Action not found' });

    } catch (error) {
        console.error('[CLICK_WEBHOOK_ERROR]', error);
        return NextResponse.json({ error: -8, error_note: 'Internal server error' });
    }
}
