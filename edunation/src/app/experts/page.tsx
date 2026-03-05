'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

interface Expert {
    id: string;
    name: string;
    image: string | null;
    skills: string;
    hourlyRate: number;
    motivation: string;
    enrolledCourses: number;
}

export default function ExpertsPage() {
    const { t } = useLanguage();
    const { data: session } = useSession();
    const [experts, setExperts] = useState<Expert[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetch('/api/experts')
            .then(r => r.json())
            .then(data => { setExperts(Array.isArray(data) ? data : []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = experts.filter(e =>
        e.name?.toLowerCase().includes(search.toLowerCase()) ||
        e.skills.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <div className={styles.heroBadge}>{t.experts.label}</div>
                    <h1 className={styles.heroTitle}>
                        {t.experts.title1} <span className="gradient-text">{t.experts.titleGrad}</span>
                    </h1>
                    <p className={styles.heroSub}>
                        {t.experts.subtitle}
                    </p>
                    <div className={styles.heroActions}>
                        {session ? (
                            <Link href="/experts/apply" className="btn btn-primary btn-lg">
                                {t.experts.becomeExpert}
                            </Link>
                        ) : (
                            <Link href="/login" className="btn btn-primary btn-lg">
                                {t.experts.signInToApply}
                            </Link>
                        )}
                        <a href="#experts-grid" className="btn btn-secondary btn-lg">
                            {t.experts.browseExperts}
                        </a>
                    </div>
                </div>
            </section>

            {/* Stats bar */}
            {!loading && experts.length > 0 && (
                <div className={styles.statsBar}>
                    <div className="container">
                        <div className={styles.statsBarInner}>
                            <div className={styles.statItem}>
                                <span className={styles.statNum}>{experts.length}</span>
                                <span className={styles.statLabel}>{t.experts.statVerified}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNum}>1-on-1</span>
                                <span className={styles.statLabel}>{t.experts.statSessions}</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNum}>📲</span>
                                <span className={styles.statLabel}>{t.experts.statTelegram}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Experts Grid */}
            <section className={styles.section} id="experts-grid">
                <div className="container">
                    <div className={styles.filterRow}>
                        <input
                            className={styles.search}
                            placeholder={t.experts.searchPlaceholder}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <span className={styles.count}>
                            {t.experts.expertCount(filtered.length)}
                        </span>
                    </div>

                    {loading ? (
                        <div className={styles.emptyState}>
                            <div className={styles.spinner} />
                            <p>{t.experts.loading}</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className={styles.emptyState}>
                            <div className={styles.emptyIcon}>🎓</div>
                            <h3>{t.experts.noExperts}</h3>
                            <p>{t.experts.noExpertsDesc}</p>
                            {session && (
                                <Link href="/experts/apply" className="btn btn-primary" style={{ marginTop: '20px' }}>
                                    {t.experts.applyNow}
                                </Link>
                            )}
                        </div>
                    ) : (
                        <div className={styles.grid}>
                            {filtered.map(expert => (
                                <div key={expert.id} className={styles.card}>
                                    <div className={styles.cardTop}>
                                        <div className={styles.avatar}>
                                            {expert.image ? (
                                                <Image
                                                    src={expert.image}
                                                    alt={expert.name ?? ''}
                                                    width={72}
                                                    height={72}
                                                    className={styles.avatarImg}
                                                />
                                            ) : (
                                                <div className={styles.avatarFallback}>
                                                    {expert.name?.charAt(0).toUpperCase() ?? '?'}
                                                </div>
                                            )}
                                            <div className={styles.expertBadge}>⭐</div>
                                        </div>
                                        <div className={styles.cardInfo}>
                                            <h3 className={styles.expertName}>{expert.name}</h3>
                                            <div className={styles.rate}>
                                                {expert.hourlyRate.toLocaleString()}
                                                <span> {t.experts.hourlyRate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.divider} />

                                    <div className={styles.skills}>
                                        {expert.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                                            <span key={skill} className={styles.skill}>{skill}</span>
                                        ))}
                                    </div>

                                    <p className={styles.motivation}>{expert.motivation}</p>

                                    <div className={styles.cardMeta}>
                                        📚 {expert.enrolledCourses} {t.experts.coursesEnrolled}
                                    </div>

                                    <Link
                                        href={`/experts/${expert.id}`}
                                        className={`btn btn-primary ${styles.bookBtn}`}
                                    >
                                        {t.experts.bookSession}
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* CTA Section */}
                    {!loading && (
                        <div className={styles.cta}>
                            <h2 className={styles.ctaTitle}>{t.experts.ctaTitle}</h2>
                            <p className={styles.ctaSub}>
                                {t.experts.ctaSub}
                            </p>
                            {session ? (
                                <Link href="/experts/apply" className={styles.ctaBtn}>
                                    {t.experts.becomeExpert}
                                </Link>
                            ) : (
                                <Link href="/signup" className={styles.ctaBtn}>
                                    {t.experts.startFree}
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
