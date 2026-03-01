import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const PLANS = {
    starter: { priceUZS: 99000, name: 'Starter Plan' },
    pro: { priceUZS: 249000, name: 'Pro Plan' },
    studio: { priceUZS: 499000, name: 'Studio Plan' },
};

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        const userId = (session?.user as any)?.id;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { plan, provider } = await req.json();

        if (!plan || !provider) {
            return NextResponse.json({ error: 'Missing plan or provider' }, { status: 400 });
        }

        const planConfig = PLANS[plan as keyof typeof PLANS];
        if (!planConfig) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

        // 1. Create a "Pending" Subscription Payment record
        const payment = await prisma.subscriptionPayment.create({
            data: {
                userId,
                plan,
                provider,
                transactionId: `temp_sub_${Date.now()}_${Math.random().toString(36).substring(7)}`,
                amount: planConfig.priceUZS,
                currency: provider === 'stripe' ? 'USD' : 'UZS',
                status: 'pending',
            }
        });

        // 2. Handle provider-specific checkout routing
        switch (provider) {
            case 'stripe': {
                // Approximate conversion UZS -> USD since Stripe expects USD for international typically
                // ~ 12500 UZS = 1 USD
                const stripePriceInCents = Math.round(planConfig.priceUZS / 12500 * 100);

                const stripeSession = await stripe.checkout.sessions.create({
                    payment_method_types: ['card'],
                    line_items: [
                        {
                            price_data: {
                                currency: 'usd',
                                product_data: {
                                    name: `EduNationUz Instructor - ${planConfig.name}`,
                                    description: `Monthly subscription for instructor tools.`,
                                },
                                unit_amount: stripePriceInCents,
                            },
                            quantity: 1,
                        }
                    ],
                    mode: 'payment',
                    success_url: `${baseUrl}/instructor/subscribe?success=1`,
                    cancel_url: `${baseUrl}/instructor/subscribe?canceled=1`,
                    allow_promotion_codes: true,
                    metadata: {
                        subscriptionPaymentId: payment.id,
                        plan: plan,
                        userId: userId,
                    }
                });

                await prisma.subscriptionPayment.update({
                    where: { id: payment.id },
                    data: { transactionId: stripeSession.id }
                });

                return NextResponse.json({ url: stripeSession.url });
            }

            case 'payme': {
                const amountInTiyin = planConfig.priceUZS * 100;
                const paymeMerchantId = process.env.PAYME_MERCHANT_ID || 'dummy_merchant_id';
                const paymeString = `m=${paymeMerchantId};ac.subscription_payment_id=${payment.id};a=${amountInTiyin}`;
                const base64Encoded = Buffer.from(paymeString).toString('base64');
                const paymeCheckoutUrl = `https://checkout.paycom.uz/${base64Encoded}`;

                return NextResponse.json({ url: paymeCheckoutUrl });
            }

            case 'click': {
                const clickMerchantId = process.env.CLICK_MERCHANT_ID || 'dummy_merchant';
                const clickServiceId = process.env.CLICK_SERVICE_ID || 'dummy_service';
                const clickReturnUrl = `${baseUrl}/instructor/subscribe`;

                const clickUrl = `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${planConfig.priceUZS}&transaction_param=${payment.id}&return_url=${encodeURIComponent(clickReturnUrl)}`;

                return NextResponse.json({ url: clickUrl });
            }

            default:
                return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 });
        }

    } catch (error) {
        console.error('[SUB_CHECKOUT_ERROR]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
