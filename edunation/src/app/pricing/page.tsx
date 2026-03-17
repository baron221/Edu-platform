'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { plans } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

function formatUZS(price: number, currLabel: string) {
    if (price === 0) return '';
    return `${price.toLocaleString('ru-RU')} ${currLabel}`;
}

export default function PricingPage() {
    const { t } = useLanguage();
    const router = useRouter();
    const { data: session } = useSession();
    const [isYearly, setIsYearly] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [activating, setActivating] = useState<'student' | 'instructor' | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const handleTrial = async (type: 'student' | 'instructor') => {
        if (!session) {
            router.push('/signup');
            return;
        }

        setActivating(type);
        setFeedback(null);

        try {
            const endpoint = type === 'student' ? '/api/subscription/trial' : '/api/instructor/trial';
            const res = await fetch(endpoint, { method: 'POST' });
            const data = await res.json();

            if (res.ok) {
                setFeedback({ type: 'success', message: t.trial.success });
                setTimeout(() => router.push(type === 'student' ? '/courses' : '/sidebar/instructor'), 2000);
            } else {
                setFeedback({ 
                    type: 'error', 
                    message: data.error === 'Trial already used' ? t.trial.alreadyUsed : t.trial.error 
                });
            }
        } catch (err) {
            setFeedback({ type: 'error', message: t.trial.error });
        } finally {
            setActivating(null);
        }
    };

    return (
        <div className={styles.page}>
            {/* Header */}
            <section className={styles.header}>
                <div className={styles.headerOrb} />
                <div className="container">
                    <div className="section-label" style={{ margin: '0 auto 20px', width: 'fit-content' }}>
                        {t.pricing.label}
                    </div>
                    <h1 className={styles.title}>
                        {t.pricing.title1} <span className="gradient-text">{t.pricing.titleGrad}</span>
                    </h1>
                    <p className={styles.subtitle}>{t.pricing.subtitle}</p>

                    {/* Monthly/Yearly Toggle */}
                    <div className={styles.toggle}>
                        <span className={!isYearly ? styles.toggleActive : styles.toggleLabel}>{t.pricing.monthly}</span>
                        <button
                            className={`${styles.toggleSwitch} ${isYearly ? styles.toggleOn : ''}`}
                            onClick={() => setIsYearly(!isYearly)}
                            aria-label="Toggle yearly billing"
                        >
                            <div className={styles.toggleThumb} />
                        </button>
                        <span className={isYearly ? styles.toggleActive : styles.toggleLabel}>
                            {t.pricing.yearly}
                            <span className={styles.saveBadge}>{t.pricing.save}</span>
                        </span>
                    </div>
                </div>
            </section>

            {/* Free Trial Banner/Section */}
            <section className={styles.trialSection}>
                <div className="container">
                    <div className={styles.trialBox}>
                        <div className="section-label" style={{ margin: '0 auto 20px' }}>FREE TRIAL</div>
                        <h2 className={styles.title} style={{ fontSize: '32px' }}>
                            {t.trial.startStudent.split(' ').slice(0, 2).join(' ')} <span className="gradient-text">1-Month Free</span>
                        </h2>
                        <p className={styles.subtitle} style={{ marginBottom: '0' }}>
                           Try our premium features for 30 days. No credit card required.
                        </p>

                        <div className={styles.trialGrid}>
                            <div className={styles.trialCard}>
                                <div className={styles.trialBadge}>FOR STUDENTS</div>
                                <h3>Student Free Trial</h3>
                                <p>Get 30 days of "Pro" access. Watch all courses, download materials, and earn certificates.</p>
                                <button 
                                    className="btn btn-primary" 
                                    onClick={() => handleTrial('student')}
                                    disabled={!!activating}
                                >
                                    {activating === 'student' ? t.trial.activating : t.trial.startStudent}
                                </button>
                            </div>
                            <div className={styles.trialCard}>
                                <div className={styles.trialBadge}>FOR INSTRUCTORS</div>
                                <h3>Instructor Free Trial</h3>
                                <p>Become an instructor for 30 days. Create courses, manage students, and use AI features for free.</p>
                                <button 
                                    className="btn btn-secondary" 
                                    onClick={() => handleTrial('instructor')}
                                    disabled={!!activating}
                                >
                                    {activating === 'instructor' ? t.trial.activating : t.trial.startInstructor}
                                </button>
                            </div>
                        </div>

                        {feedback && (
                            <div className={`${styles.feedback} ${styles[feedback.type]}`}>
                                {feedback.message}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Plans */}
            <section className={styles.plansSection}>
                <div className="container">
                    <div className={styles.plans}>
                        {plans.map(plan => {
                            const price = isYearly ? plan.yearlyPrice : plan.price;
                            return (
                                <div
                                    key={plan.id}
                                    className={`${styles.planCard} ${plan.popular ? styles.planPopular : ''}`}
                                    style={{ '--plan-color': plan.color } as React.CSSProperties}
                                >
                                    {plan.popular && <div className={styles.popularBadge}>⭐ Most Popular</div>}

                                    <div className={styles.planHeader}>
                                        <div className={styles.planName}>{plan.name}</div>
                                        <div className={styles.planPrice}>
                                            {price === 0
                                                ? <span className={styles.planAmount}>{t.shared.free}</span>
                                                : <>
                                                    <span className={styles.planAmount}>{formatUZS(price, t.shared.currency)}</span>
                                                    <span className={styles.planPer}>{t.shared.mo}</span>
                                                </>
                                            }
                                        </div>
                                        {isYearly && price > 0 && (
                                            <div className={styles.planYearly}>
                                                {t.pricing.billedAs} {formatUZS(price * 12, t.shared.currency)}{t.pricing.perYear}
                                            </div>
                                        )}
                                        <p className={styles.planDesc}>{plan.description}</p>
                                    </div>

                                    <Link
                                        href={plan.id === 'enterprise' ? '/about' : '/signup'}
                                        className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                                        style={{ width: '100%', justifyContent: 'center', marginBottom: '28px' }}
                                    >
                                        {t.planCta[plan.ctaKey as 'free' | 'pro' | 'enterprise']}
                                    </Link>

                                    {/* Features */}
                                    <div className={styles.featureList}>
                                        <div className={styles.featureHead}>{t.pricing.whatsIncluded}</div>
                                        {(plan.features as string[]).map((f, i) => (
                                            <div key={i} className={styles.featureItem}>
                                                <span className={styles.checkIcon} style={{ color: plan.color }}>✓</span>
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                        {(plan.notIncluded as string[]).map((f, i) => (
                                            <div key={i} className={`${styles.featureItem} ${styles.featureNo}`}>
                                                <span className={styles.crossIcon}>✕</span>
                                                <span>{f}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Comparison Table */}
            <section className={styles.comparison}>
                <div className="container">
                    <h2 className={styles.compTitle}>
                        {t.pricing.comparisonTitle1} <span className="gradient-text">{t.pricing.comparisonTitleGrad}</span>
                    </h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    {(t.pricing.tableHeaders as string[]).map((h, i) => (
                                        <th key={i} className={i === 0 ? styles.thFeature : i === 2 ? styles.thPro : ''}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {(t.pricing.tableRows as string[][]).map((row, i) => (
                                    <tr key={i}>
                                        <td className={styles.tdFeature}>{row[0]}</td>
                                        <td className={styles.tdVal}>{row[1]}</td>
                                        <td className={`${styles.tdVal} ${styles.tdPro}`}>{row[2]}</td>
                                        <td className={styles.tdVal}>{row[3]}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className={styles.faq}>
                <div className="container">
                    <h2 className={styles.faqTitle}>
                        {t.pricing.faqTitle1} <span className="gradient-text">{t.pricing.faqTitleGrad}</span>
                    </h2>
                    <div className={styles.faqList}>
                        {(t.pricing.faqs as { q: string; a: string }[]).map((faq, i) => (
                            <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                                <button className={styles.faqQ} onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                                    {faq.q}
                                    <span className={styles.faqArrow}>{openFaq === i ? '▲' : '▼'}</span>
                                </button>
                                <div className={styles.faqA}>{faq.a}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.cta}>
                <div className="container">
                    <div className={styles.ctaBox}>
                        <div className={styles.ctaOrb} />
                        <h2 className={styles.ctaTitle}>
                            {t.pricing.ctaTitle} <span className="gradient-text">{t.pricing.ctaTitleGrad}</span>
                        </h2>
                        <p className={styles.ctaDesc}>{t.pricing.ctaDesc}</p>
                        <Link href="/signup" className="btn btn-primary btn-lg">{t.pricing.createAccount}</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
