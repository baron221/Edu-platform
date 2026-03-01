'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

interface CurrentSub { plan: string; status: string; endDate: string | null; }

const PLANS = [
    {
        id: 'starter',
        name: '🟢 Starter',
        price: '99,000 UZS',
        priceNote: '/month',
        color: '#10b981',
        maxCourses: 3,
        ads: false,
        features: ['Up to 3 published courses', 'Full course community access', 'Student analytics', 'AI quiz for your courses', 'Standard support'],
    },
    {
        id: 'pro',
        name: '⭐ Pro',
        price: '249,000 UZS',
        priceNote: '/month',
        color: '#f59e0b',
        maxCourses: 20,
        ads: true,
        popular: true,
        features: ['Up to 20 published courses', 'Full course community access', '1 advertisement slot (homepage)', 'Priority student analytics', 'Priority support', 'Pro badge on profile'],
    },
    {
        id: 'studio',
        name: '💎 Studio',
        price: '499,000 UZS',
        priceNote: '/month',
        color: '#a78bfa',
        maxCourses: 999,
        ads: true,
        features: ['Unlimited published courses', 'Full course community access', '3 advertisement slots (all placements)', 'Advanced analytics & revenue reports', 'Dedicated account manager', 'Studio badge on profile', 'Early access to new features'],
    },
];

export default function InstructorSubscribePage() {
    const [current, setCurrent] = useState<CurrentSub | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/instructor/subscribe')
            .then(r => r.status === 401 ? null : r.json())
            .then(d => d?.subscription && setCurrent(d.subscription))
            .catch(() => { });
    }, []);

    const subscribe = async (planId: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/instructor/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planId }),
            });
            if (!res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.error || 'Failed');
                } catch {
                    throw new Error(text || 'Failed');
                }
            }
            const data = await res.json();
            setCurrent(data.subscription);
            setSuccess(`🎉 You're now a ${planId.charAt(0).toUpperCase() + planId.slice(1)} instructor! Reload to see your dashboard.`);
        } catch (e: any) {
            console.error("Subscription flow error:", e);
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <div className="section-label" style={{ margin: '0 auto 16px' }}>For Educators</div>
                    <h1 className={styles.title}>
                        Teach on <span className="gradient-text">EduNationUz</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Choose your plan and start publishing courses today. All plans include full community access.
                    </p>
                </div>
            </section>

            {/* Current subscription notice */}
            {current && (
                <div className="container" style={{ marginBottom: 24 }}>
                    <div className={styles.currentBanner}>
                        ✅ You are currently on the <strong>{current.plan.toUpperCase()}</strong> plan
                        {current.endDate && ` · Renews ${new Date(current.endDate).toLocaleDateString()}`}
                        <Link href="/instructor/courses" className={styles.dashLink}> → Go to Dashboard</Link>
                    </div>
                </div>
            )}

            {success && (
                <div className="container" style={{ marginBottom: 24 }}>
                    <div className={styles.successBanner}>{success}</div>
                </div>
            )}
            {error && (
                <div className="container" style={{ marginBottom: 24 }}>
                    <div className={styles.errorBanner}>{error}</div>
                </div>
            )}

            {/* Pricing cards */}
            <section className="section" style={{ paddingTop: 0 }}>
                <div className="container">
                    <div className={styles.grid}>
                        {PLANS.map(plan => (
                            <div
                                key={plan.id}
                                className={`${styles.card} ${plan.popular ? styles.popular : ''}`}
                                style={{ '--plan-color': plan.color } as React.CSSProperties}
                            >
                                {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
                                <div className={styles.planName} style={{ color: plan.color }}>{plan.name}</div>
                                <div className={styles.planPrice}>
                                    <span className={styles.amount}>{plan.price}</span>
                                    <span className={styles.per}>{plan.priceNote}</span>
                                </div>
                                <div className={styles.planLimit}>
                                    {plan.maxCourses < 100 ? `Up to ${plan.maxCourses} courses` : 'Unlimited courses'}
                                </div>

                                <ul className={styles.featureList}>
                                    {plan.features.map((f, i) => (
                                        <li key={i}><span className={styles.check}>✓</span>{f}</li>
                                    ))}
                                </ul>

                                <button
                                    className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                                    onClick={() => subscribe(plan.id)}
                                    disabled={loading || current?.plan === plan.id}
                                >
                                    {current?.plan === plan.id ? '✓ Current Plan' : loading ? 'Processing...' : `Start ${plan.name}`}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* FAQ */}
                    <div className={styles.faq}>
                        <h2 style={{ textAlign: 'center', marginBottom: 40, color: '#f1f5f9' }}>Common Questions</h2>
                        <div className={styles.faqGrid}>
                            {[
                                { q: 'Can I switch plans?', a: 'Yes, you can upgrade or downgrade at any time. Changes take effect immediately.' },
                                { q: 'How do advertisements work?', a: 'You can feature your course on the homepage or category pages. Ads run for 30-day slots.' },
                                { q: 'What is a Course Community?', a: 'Each course gets its own forum where enrolled students can ask questions and you can post announcements.' },
                                { q: 'Do I keep revenue from courses?', a: 'Platform takes a 15% cut. You receive 85% of all course purchase revenue.' },
                            ].map((item, i) => (
                                <div key={i} className={styles.faqItem}>
                                    <h4>{item.q}</h4>
                                    <p>{item.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
