'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

interface Instructor {
    id: string;
    name: string;
    image: string | null;
    courseCount: number;
    totalStudents: number;
    avgRating: number;
    instructorProfile: {
        slug: string;
        tagline: string | null;
        avatar: string | null;
        isVerified: boolean;
    } | null;
    instructorSubscription: { plan: string } | null;
}

export default function InstructorsPage() {
    const { t } = useLanguage();
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/instructors')
            .then(r => r.json())
            .then(d => { setInstructors(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const planBadge: Record<string, string> = {
        starter: '🟢 Starter',
        pro: '⭐ Pro',
        studio: '💎 Studio',
    };

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <div className="section-label" style={{ margin: '0 auto 16px' }}>{t.instructors.label}</div>
                    <h1 className={styles.heroTitle}>
                        {t.instructors.title1} <span className="gradient-text">{t.instructors.titleGrad}</span>
                    </h1>
                    <p className={styles.heroSub}>
                        {t.instructors.subtitle}
                    </p>
                </div>
            </section>

            {/* Grid */}
            <section className="section">
                <div className="container">
                    {loading ? (
                        <div className={styles.skeletonGrid}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className={styles.skeletonCard} />
                            ))}
                        </div>
                    ) : instructors.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '100px 0', background: 'white', border: '1px dashed #cbd5e1', borderRadius: '32px', marginBottom: '80px' }}>
                            <div style={{ fontSize: 72, marginBottom: 24 }}>👨‍🏫</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>{t.instructors.noInstructors}</h3>
                            <p style={{ color: '#64748b' }}>{t.instructors.noInstructorsDesc}</p>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {instructors.map(instructor => {
                                const profile = instructor.instructorProfile;
                                const isVirtual = !profile?.slug;
                                const avatar = profile?.avatar || instructor.image;
                                const initials = (instructor.name || 'IN').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
                                const href = profile?.slug
                                    ? `/instructors/${profile.slug}`
                                    : `/courses?instructor=${encodeURIComponent(instructor.name || '')}`;

                                return (
                                    <Link key={instructor.id} href={href} className={styles.card}>
                                        {/* Plan badge */}
                                        {instructor.instructorSubscription && (
                                            <div className={`${styles.planBadge} ${styles[instructor.instructorSubscription.plan]}`}>
                                                {planBadge[instructor.instructorSubscription.plan] || 'Starter'}
                                            </div>
                                        )}

                                        {/* Avatar */}
                                        <div className={styles.avatarWrap}>
                                            {avatar ? (
                                                <img src={avatar} alt={instructor.name || ''} className={styles.avatar} />
                                            ) : (
                                                <div className={styles.avatarFallback}>{initials}</div>
                                            )}
                                            {profile?.isVerified && (
                                                <span className={styles.verifiedBadge} title="Verified Instructor">✓</span>
                                            )}
                                        </div>

                                        <h3 className={styles.name}>{instructor.name}</h3>
                                        {profile?.tagline && (
                                            <p className={styles.tagline}>{profile.tagline}</p>
                                        )}

                                        <div className={styles.stats}>
                                            <div className={styles.stat}>
                                                <span className={styles.statNum}>{instructor.courseCount}</span>
                                                <span className={styles.statLabel}>{t.instructors.courses}</span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statNum}>{instructor.totalStudents.toLocaleString()}</span>
                                                <span className={styles.statLabel}>{t.instructors.students}</span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statNum}>{instructor.avgRating > 0 ? `${instructor.avgRating}★` : '—'}</span>
                                                <span className={styles.statLabel}>{t.instructors.rating}</span>
                                            </div>
                                        </div>

                                        <div className={styles.viewBtn}>{t.instructors.viewProfile}</div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Become instructor CTA */}
                    <div className={styles.becomeCta}>
                        <div className={styles.becomeInner}>
                            <h2>{t.instructors.ctaTitle}</h2>
                            <p>{t.instructors.ctaDesc}</p>
                            <Link href="/instructor/subscribe" className="btn btn-primary btn-lg">
                                {t.instructors.ctaBtn}
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
