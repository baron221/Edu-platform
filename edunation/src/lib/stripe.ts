import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("⚠️ STRIPE_SECRET_KEY is missing from environment variables.");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    // @ts-ignore - Stripe API version might differ based on installed package version
    apiVersion: '2023-10-16',
    appInfo: {
        name: 'EduNationUz',
        version: '1.0.0',
    },
});
