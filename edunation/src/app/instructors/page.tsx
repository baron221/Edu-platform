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
                    <div className="section-label" style={{ margin: '0 auto 16px' }}>Our Experts</div>
                    <h1 className={styles.heroTitle}>
                        Meet Our <span className="gradient-text">Instructors</span>
                    </h1>
                    <p className={styles.heroSub}>
                        Learn from industry professionals with real-world experience.
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
                        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: 60, marginBottom: 16 }}>👨‍🏫</div>
                            <h3>No instructors yet</h3>
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {instructors.map(instructor => {
                                const profile = instructor.instructorProfile;
                                const slug = profile?.slug || instructor.id;
                                const avatar = profile?.avatar || instructor.image;
                                const initials = (instructor.name || 'IN').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

                                return (
                                    <Link key={instructor.id} href={`/instructors/${slug}`} className={styles.card}>
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
                                                <span className={styles.statLabel}>Courses</span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statNum}>{instructor.totalStudents.toLocaleString()}</span>
                                                <span className={styles.statLabel}>Students</span>
                                            </div>
                                            <div className={styles.stat}>
                                                <span className={styles.statNum}>{instructor.avgRating > 0 ? `${instructor.avgRating}★` : '—'}</span>
                                                <span className={styles.statLabel}>Rating</span>
                                            </div>
                                        </div>

                                        <div className={styles.viewBtn}>View Profile →</div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Become instructor CTA */}
                    <div className={styles.becomeCta}>
                        <div className={styles.becomeInner}>
                            <h2>Share your expertise with the world</h2>
                            <p>Join our instructor community and start earning from your knowledge today.</p>
                            <Link href="/instructor/subscribe" className="btn btn-primary btn-lg">
                                Become an Instructor →
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
