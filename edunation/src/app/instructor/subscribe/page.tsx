'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/context/LanguageContext';

interface CurrentSub { plan: string; status: string; endDate: string | null; }

export default function InstructorSubscribePage() {
    const { t } = useLanguage();
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role;
    const [current, setCurrent] = useState<CurrentSub | null>(null);
    const [pendingPayment, setPendingPayment] = useState<any>(null);
    const [rejectedPayment, setRejectedPayment] = useState<any>(null);
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

    const PLANS = [
        {
            id: 'starter',
            name: `🟢 ${t.instructorSub.starter}`,
            price: '99,000 UZS',
            priceNote: t.instructorSub.perMonth,
            color: '#10b981',
            maxCourses: 3,
            ads: false,
            features: t.instructorSub.features.starter,
        },
        {
            id: 'pro',
            name: `⭐ ${t.instructorSub.pro}`,
            price: '249,000 UZS',
            priceNote: t.instructorSub.perMonth,
            color: '#f59e0b',
            maxCourses: 20,
            ads: true,
            popular: true,
            features: t.instructorSub.features.pro,
        },
        {
            id: 'studio',
            name: `💎 ${t.instructorSub.studio}`,
            price: '499,000 UZS',
            priceNote: t.instructorSub.perMonth,
            color: '#a78bfa',
            maxCourses: 999,
            ads: true,
            features: t.instructorSub.features.studio,
        },
    ];

    useEffect(() => {
        fetch('/api/instructor/subscribe')
            .then(r => r.status === 401 ? null : r.json())
            .then(d => {
                if (d?.subscription) setCurrent(d.subscription);
                if (d?.pendingPayment) setPendingPayment(d.pendingPayment);
                if (d?.rejectedPayment) setRejectedPayment(d.rejectedPayment);
            })
            .catch(() => { });
    }, []);

    useEffect(() => {
        // Check for success or cancel in URL from Stripe checkout
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('success')) {
            setSuccess(t.manualPay.success);
            // Clear URL params
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        if (urlParams.get('canceled')) {
            setError(t.manualPay.error);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [t]);

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
                const data = await res.json();
                throw new Error(data.error || 'Checkout failed');
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
            // Convert file to Base64
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(receiptFile);
            });

            // Submit directly to manual-payments with Base64 as the URL
            const res = await fetch('/api/manual-payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPlan,
                    receiptUrl: base64
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || t.manualPay.error);
            }

            setManualSuccess(true);
            setShowManualForm(false);
            setShowPaymentModal(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    <div className="section-label" style={{ margin: '0 auto 16px' }}>{t.pricing.label}</div>
                    <h1 className={styles.title}>
                        {t.instructorSub.title} <span className="gradient-text">EduNationUz</span>
                    </h1>
                    <p className={styles.subtitle}>
                        {t.instructorSub.subtitle}
                    </p>
                </div>
            </section>

            {/* Current subscription notice */}
            {userRole === 'admin' ? (
                <div className="container" style={{ marginBottom: 24 }}>
                    <div className={styles.currentBanner} style={{ borderColor: '#7c3aed', background: '#f5f3ff' }}>
                        🛡️ <strong>Administrator Access</strong> · {t.instructorSub.unlimited}
                        <Link href="/instructor/courses" className={styles.dashLink}> → {t.instructorSub.goDash}</Link>
                    </div>
                </div>
            ) : current && current.status === 'active' && (
                <div className="container" style={{ marginBottom: 24 }}>
                    <div className={styles.currentBanner}>
                        ✅ {t.instructorSub.currentPlan} <strong>{current.plan.toUpperCase()}</strong> {t.instructorSub.planSuffix}
                        {current.endDate && ` · ${t.instructorSub.renews} ${new Date(current.endDate).toLocaleDateString()}`}
                        <Link href="/instructor/courses" className={styles.dashLink}> → {t.instructorSub.goDash}</Link>
                    </div>
                </div>
            )}

            {pendingPayment && (
                <div className="container" style={{ marginBottom: 24 }}>
                    <div className={styles.pendingBanner}>
                        <div className={styles.pendingIcon}>⏳</div>
                        <div>
                            <h4 style={{ margin: 0 }}>{t.instructorSub.pendingTitle}</h4>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
                                {t.instructorSub.pendingDesc}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {rejectedPayment && !pendingPayment && (
                <div className="container" style={{ marginBottom: 24 }}>
                    <div className={styles.errorBanner} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ fontSize: '24px' }}>❌</div>
                        <div>
                            <h4 style={{ margin: 0 }}>{t.instructorSub.rejectedTitle}</h4>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', opacity: 0.9 }}>
                                {t.instructorSub.rejectedDesc}
                            </p>
                        </div>
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
                        🎉 {t.manualPay.success}
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
                                className={`${styles.card} ${plan.popular ? styles.popular : ''} ${pendingPayment ? styles.disabledCard : ''}`}
                                style={{ '--plan-color': plan.color } as React.CSSProperties}
                            >
                                {plan.popular && <div className={styles.popularBadge}>{t.instructorSub.mostPopular}</div>}
                                <div className={styles.planName} style={{ color: plan.color }}>{plan.name}</div>
                                <div className={styles.planPrice}>
                                    <span className={styles.amount}>{plan.price}</span>
                                    <span className={styles.per}>{plan.priceNote}</span>
                                </div>
                                <div className={styles.planLimit}>
                                    {plan.maxCourses < 100 ? `${t.instructorSub.upTo} ${plan.maxCourses} ${t.instructorSub.courses}` : t.instructorSub.unlimited}
                                </div>

                                <ul className={styles.featureList}>
                                    {plan.features.map((f: string, i: number) => (
                                        <li key={i}><span className={styles.check}>✓</span>{f}</li>
                                    ))}
                                </ul>

                                <button
                                    className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                                    style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                                    onClick={() => !pendingPayment && subscribe(plan.id)}
                                    disabled={loading || !!pendingPayment}
                                >
                                    {loading ? t.shared.loading : 
                                     pendingPayment ? t.manualPay.submitting.replace('...', '') :
                                     current?.plan === plan.id ? t.instructorSub.renew : 
                                     current ? t.instructorSub.switch(plan.name.split(' ').pop() || '') : 
                                     t.instructorSub.start(plan.name.split(' ').pop() || '')}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* FAQ */}
                    <div className={styles.faq}>
                        <h2 style={{ textAlign: 'center', marginBottom: 40, color: '#0f172a' }}>{t.instructorSub.faqTitle}</h2>
                        <div className={styles.faqGrid}>
                            {t.instructorSub.faq.map((item: { q: string; a: string }, i: number) => (
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
                                    <h3>{t.manualPay.title}</h3>
                                    <p>{t.manualPay.instructions}</p>
                                    <div className={styles.bankDetails}>
                                        <strong>{t.manualPay.beneficiary}:</strong> 8600 0000 0000 0000<br/>
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
                                    {uploading ? t.manualPay.submitting : t.manualPay.uploadBtn}
                                </button>
                                
                                <button 
                                    type="button" 
                                    className={styles.backBtn}
                                    onClick={() => setShowManualForm(false)}
                                >
                                    ← {t.manualPay.cancel}
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
