import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!(session?.user as any)?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { courseId, provider } = await req.json();

        if (!courseId || !provider) {
            return NextResponse.json({ error: 'Missing courseId or provider' }, { status: 400 });
        }

        const course = await prisma.course.findUnique({
            where: { id: courseId },
        });

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 });
        }

        if (course.isFree || course.price === 0) {
            return NextResponse.json({ error: 'Course is free, no payment needed' }, { status: 400 });
        }

        // Check if the user is already enrolled
        const existingEnrollment = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId: (session!.user as any).id,
                    courseId: courseId,
                }
            }
        });

        if (existingEnrollment) {
            return NextResponse.json({ error: 'Already enrolled' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // 1. Create a "Pending" Purchase record in our database
        // This Purchase ID acts as the unique reference for our local payment gateways
        const purchase = await prisma.purchase.create({
            data: {
                userId: (session!.user as any).id,
                courseId: course.id,
                provider: provider,
                transactionId: `temp_${Date.now()}_${Math.random().toString(36).substring(7)}`, // Temporary, will be updated by webhook
                amount: course.price,
                currency: provider === 'stripe' ? 'USD' : 'UZS',
                status: 'pending',
            }
        });

        // 2. Handle provider-specific checkout routing
        switch (provider) {
            case 'stripe': {
                // For Stripe, we will assume the price is in USD for international users.
                // Normally you'd convert UZS -> USD, or just set it statically for simplicity here 
                // We'll set a basic $19.99 for all paid courses via Stripe if not defined otherwise, 
                // or safely divide UZS by 12000 roughly as an example fallback
                const stripePriceInCents = course.price > 1000 ? Math.round(course.price / 12500 * 100) : course.price * 100;

                const stripeSession = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: course.title,
                                    description: course.description?.substring(0, 255) || 'Premium Course',
                                    images: course.thumbnail ? [course.thumbnail] : [],
                                },
                                unit_amount: stripePriceInCents,
                            },
                            quantity: 1,
                        }
                    ],
                    mode: 'payment',
                    success_url: `${baseUrl}/courses/${course.slug}?success=1`,
                    cancel_url: `${baseUrl}/courses/${course.slug}?canceled=1`,
                    allow_promotion_codes: true, // Allow native Stripe promo codes
                    metadata: {
                        purchaseId: purchase.id,
                        courseId: course.id,
                        userId: (session!.user as any).id,
                    }
                });

                // Update the purchase with the Stripe session ID
                await prisma.purchase.update({
                    where: { id: purchase.id },
                    data: { transactionId: stripeSession.id }
                });

                return NextResponse.json({ url: stripeSession.url });
            }

            case 'payme': {
                // Payme accepts amount in Tiyin (UZS * 100)
                const amountInTiyin = course.price * 100;
                const paymeMerchantId = process.env.PAYME_MERCHANT_ID || 'dummy_merchant_id';

                // Format: m=MERCHANT_ID;ac.purchase_id=PURCHASE_ID;a=AMOUNT
                const paymeString = `m=${paymeMerchantId};ac.purchase_id=${purchase.id};a=${amountInTiyin}`;
                const base64Encoded = Buffer.from(paymeString).toString('base64');

                const paymeCheckoutUrl = `https://checkout.paycom.uz/${base64Encoded}`;

                return NextResponse.json({ url: paymeCheckoutUrl });
            }

            case 'click': {
                const clickMerchantId = process.env.CLICK_MERCHANT_ID || 'dummy_merchant';
                const clickServiceId = process.env.CLICK_SERVICE_ID || 'dummy_service';
                const clickReturnUrl = `${baseUrl}/courses/${course.slug}`;

                // Click Evolution format
                const clickUrl = `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${course.price}&transaction_param=${purchase.id}&return_url=${encodeURIComponent(clickReturnUrl)}`;

                return NextResponse.json({ url: clickUrl });
            }

            default:
                return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 });
        }

    } catch (error) {
        console.error('[CHECKOUT_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
