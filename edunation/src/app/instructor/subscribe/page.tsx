'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/context/LanguageContext';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
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
    const { data: session } = useSession();
    const { t } = useLanguage();
    const [current, setCurrent] = useState<CurrentSub | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [processingPayment, setProcessingPayment] = useState(false);
    const [uploadingReceipt, setUploadingReceipt] = useState(false);
    const [receiptSubmitted, setReceiptSubmitted] = useState(false);

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

    const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !session?.user || !selectedPlan) return;

        setUploadingReceipt(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const uploadData = await uploadRes.json();

            if (!uploadRes.ok || !uploadData.url) {
                toast.error(uploadData.error || t.manualPay.error);
                setUploadingReceipt(false);
                return;
            }

            const submitRes = await fetch('/api/manual-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: selectedPlan, receiptUrl: uploadData.url })
            });

            if (submitRes.ok) {
                toast.success(t.manualPay.success);
                setReceiptSubmitted(true);
            } else {
                const submitData = await submitRes.json();
                toast.error(submitData.error || t.manualPay.error);
            }
        } catch (err) {
            console.error(err);
            toast.error(t.manualPay.error);
        } finally {
            setUploadingReceipt(false);
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

            {showPaymentModal && (
                <div className={styles.modalOverlay} onClick={() => !processingPayment && setShowPaymentModal(false)}>
                    <div className={styles.paymentModal} onClick={e => e.stopPropagation()}>
                        <div className={styles.paymentHeader}>
                            <h2>{t.manualPay.title}</h2>
                            <p>{t.manualPay.instructions}</p>
                        </div>

                        <div className={styles.paymentOptions} style={{ flexDirection: 'column' }}>
                            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                                <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#0f172a' }}>{t.manualPay.title}</h3>
                                <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '16px' }}>
                                    {t.manualPay.instructions}
                                </p>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2563eb', padding: '16px', background: '#eff6ff', borderRadius: '8px', letterSpacing: '1px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                    9860 0104 0801 2010
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: 600, color: '#334155', marginTop: '16px' }}>
                                    Tulkinov Bakhromjon
                                </div>
                                
                                {receiptSubmitted ? (
                                    <div style={{ marginTop: '24px', padding: '16px', background: '#ecfdf5', borderRadius: '8px', color: '#059669', fontWeight: 500 }}>
                                        ✅ {t.manualPay.success}
                                    </div>
                                ) : (
                                    <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                                        <p style={{ fontSize: '14px', color: '#475569', marginBottom: '12px', fontWeight: 500 }}>
                                            {t.manualPay.alreadyTransferred}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleReceiptUpload}
                                                style={{ display: 'none' }}
                                                id="instructor-receipt-upload"
                                            />
                                            <label
                                                htmlFor="instructor-receipt-upload"
                                                className={styles.saveBtn}
                                                style={{ cursor: 'pointer', background: '#2563eb', color: 'white', border: 'none', opacity: uploadingReceipt ? 0.7 : 1, pointerEvents: uploadingReceipt ? 'none' : 'auto', width: '100%', textAlign: 'center' }}
                                            >
                                                {uploadingReceipt ? `⏳ ${t.manualPay.submitting}` : `📁 ${t.manualPay.uploadBtn}`}
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            className={styles.closeModalBtn}
                            onClick={() => setShowPaymentModal(false)}
                            disabled={processingPayment}
                            style={{ width: '100%', marginTop: '10px' }}
                        >
                            {t.manualPay.cancel}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
