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
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [showManualForm, setShowManualForm] = useState(false);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [manualSuccess, setManualSuccess] = useState(false);

    useEffect(() => {
        fetch('/api/instructor/subscribe')
            .then(r => r.status === 401 ? null : r.json())
            .then(d => d?.subscription && setCurrent(d.subscription))
            .catch(() => { });
    }, []);

    useEffect(() => {
        // Check for success or cancel in URL from Stripe checkout
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success')) {
            setSuccess('Payment successful! Your instructor subscription will be activated momentarily. Please reload the page if it doesn’t update immediately.');
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (urlParams.get('canceled')) {
            setError('Payment was canceled.');
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    const subscribe = (planId: string) => {
        setSelectedPlan(planId);
        setShowPaymentModal(true);
    };

    const handlePaymentClick = async (provider: string) => {
        if (!selectedPlan) return;
        setProcessingPayment(true);
        setError('');

        try {
            const res = await fetch('/api/instructor/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: selectedPlan, provider }),
            });

            if (!res.ok) {
                const text = await res.text();
                try {
                    const json = JSON.parse(text);
                    throw new Error(json.error || 'Checkout failed');
                } catch {
                    throw new Error(text || 'Checkout failed');
                }
            }

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (e: any) {
            console.error("Payment flow error:", e);
            setError(e.message);
            setShowPaymentModal(false);
        } finally {
            setProcessingPayment(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!receiptFile || !selectedPlan) return;

        setUploading(true);
        setError('');

        try {
            // 1. Upload to a temp or permanent store (using a simple form data for the API)
            // For now, let's assume we use a base64 or a direct upload if you have an upload route.
            // If there's no dedicated upload route, we'll use a placeholder or check if there's one.
            // Looking at the codebase, there's usually an /api/upload.
            
            const formData = new FormData();
            formData.append('file', receiptFile);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Failed to upload receipt');
            const { url } = await uploadRes.json();

            // 2. Create manual payment entry
            const res = await fetch('/api/manual-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPlan,
                    receiptUrl: url
                })
            });

            if (!res.ok) throw new Error('Failed to submit manual payment');

            setManualSuccess(true);
            setShowManualForm(false);
            setShowPaymentModal(false);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setUploading(false);
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
            {manualSuccess && (
                <div className="container" style={{ marginBottom: 24 }}>
                    <div className={styles.successBanner}>
                        🎉 Receipt submitted successfully! Our admin team will verify your payment within 24 hours.
                    </div>
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
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : current?.plan === plan.id ? 'Renew Plan' : current ? `Switch to ${plan.name}` : `Start ${plan.name}`}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* FAQ */}
                    <div className={styles.faq}>
                        <h2 style={{ textAlign: 'center', marginBottom: 40, color: '#0f172a' }}>Common Questions</h2>
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

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className={styles.modalOverlay} onClick={() => !processingPayment && setShowPaymentModal(false)}>
                    <div className={styles.paymentModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.paymentHeader}>
                            <h2>Select Payment Method</h2>
                            <p>Choose how you would like to pay for the <strong>{PLANS.find(p => p.id === selectedPlan)?.name}</strong> plan.</p>
                        </div>

                        <div className={styles.paymentOptions}>
                            <button
                                className={`${styles.payBtn} ${styles.paymeBtn}`}
                                onClick={() => handlePaymentClick('payme')}
                                disabled={processingPayment}
                            >
                                <div className={styles.payIcon}>Payme</div>
                                <span>Pay with Payme</span>
                            </button>

                            <button
                                className={`${styles.payBtn} ${styles.clickBtn}`}
                                onClick={() => handlePaymentClick('click')}
                                disabled={processingPayment}
                            >
                                <div className={styles.payIcon}>CLICK</div>
                                <span>Pay with Click</span>
                            </button>

                            <button
                                className={`${styles.payBtn} ${styles.stripeBtn}`}
                                onClick={() => handlePaymentClick('stripe')}
                                disabled={processingPayment}
                            >
                                <div className={styles.payIcon} style={{ fontSize: '14px', color: '#6366f1' }}>Stripe</div>
                                <span>Pay with Stripe (Card)</span>
                            </button>

                            <button
                                className={`${styles.payBtn} ${styles.manualBtn}`}
                                onClick={() => setShowManualForm(true)}
                                disabled={processingPayment}
                            >
                                <div className={styles.payIcon} style={{ color: '#10b981' }}>💳</div>
                                <span>Uzcard / Humo / Transfer</span>
                            </button>
                        </div>

                        {showManualForm && (
                            <form className={styles.manualForm} onSubmit={handleManualSubmit}>
                                <div className={styles.manualFormHeader}>
                                    <h3>Upload Payment Receipt</h3>
                                    <p>Please transfer the amount to our card/bank and upload the screenshot here.</p>
                                    <div className={styles.bankDetails}>
                                        <strong>Card:</strong> 8600 0000 0000 0000<br/>
                                        <strong>Name:</strong> EduNationUz LLC
                                    </div>
                                </div>
                                
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={e => setReceiptFile(e.target.files?.[0] || null)}
                                    required
                                    className={styles.fileInput}
                                />
                                
                                <button 
                                    type="submit" 
                                    className="btn btn-primary" 
                                    style={{ width: '100%', justifyContent: 'center' }}
                                    disabled={uploading || !receiptFile}
                                >
                                    {uploading ? 'Uploading...' : 'Submit Receipt'}
                                </button>
                                
                                <button 
                                    type="button" 
                                    className={styles.backBtn}
                                    onClick={() => setShowManualForm(false)}
                                >
                                    ← Back to methods
                                </button>
                            </form>
                        )}

                        <button
                            className={styles.closeModalBtn}
                            onClick={() => setShowPaymentModal(false)}
                            disabled={processingPayment}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
