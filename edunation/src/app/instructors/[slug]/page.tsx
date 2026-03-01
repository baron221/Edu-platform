'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import CourseCard, { CourseDB } from '@/components/CourseCard';
import styles from './page.module.css';

interface InstructorData {
    profile: {
        slug: string;
        bio: string | null;
        tagline: string | null;
        avatar: string | null;
        isVerified: boolean;
        website: string | null;
        twitter: string | null;
        linkedin: string | null;
        youtube: string | null;
        user: { name: string | null; image: string | null };
    };
    courses: (CourseDB & { _count: { enrollments: number; reviews: number }; reviews: { rating: number }[] })[];
    stats: { totalStudents: number; avgRating: number; totalReviews: number; courseCount: number };
    subscription: { plan: string } | null;
}

const planLabel: Record<string, { label: string; color: string }> = {
    starter: { label: '🟢 Starter Instructor', color: '#10b981' },
    pro: { label: '⭐ Pro Instructor', color: '#f59e0b' },
    studio: { label: '💎 Studio Instructor', color: '#a78bfa' },
};

export default function InstructorProfilePage() {
    const { slug } = useParams() as { slug: string };
    const { t } = useLanguage();
    const [data, setData] = useState<InstructorData | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetch(`/api/instructors/${slug}`)
            .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
            .then(d => d && setData(d));
    }, [slug]);

    if (notFound) return (
        <div style={{ textAlign: 'center', padding: '120px 24px', color: '#94a3b8' }}>
            <div style={{ fontSize: 60 }}>🔍</div>
            <h2>{t.instructorProfile.notFound}</h2>
            <Link href="/instructors" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>{t.instructorProfile.browse}</Link>
        </div>
    );

    if (!data) return (
        <div className={styles.page}>
            <div className={styles.heroSkeleton} />
        </div>
    );

    const { profile, courses, stats, subscription } = data;
    const name = profile.user.name || 'Instructor';
    const avatar = profile.avatar || profile.user.image;
    const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const plan = subscription ? planLabel[subscription.plan] : null;

    return (
        <div className={styles.page}>
            {/* ===== HERO ===== */}
            <section className={styles.hero}>
                <div className={styles.heroBg} />
                <div className="container">
                    <div className={styles.heroContent}>
                        <div className={styles.avatarWrap}>
                            {avatar ? (
                                <img src={avatar} className={styles.avatar} alt={name} />
                            ) : (
                                <div className={styles.avatarFallback}>{initials}</div>
                            )}
                            {profile.isVerified && <span className={styles.verifiedBadge}>✓</span>}
                        </div>

                        <div className={styles.heroInfo}>
                            <div className={styles.nameLine}>
                                <h1 className={styles.name}>{name}</h1>
                                {plan && (
                                    <span className={styles.planChip} style={{ color: plan.color, borderColor: plan.color + '50' }}>
                                        {plan.label}
                                    </span>
                                )}
                            </div>
                            {profile.tagline && <p className={styles.tagline}>{profile.tagline}</p>}

                            {/* Social links */}
                            <div className={styles.socialLinks}>
                                {profile.website && <a href={profile.website} target="_blank" rel="noopener" className={styles.socialLink}>🌐 {t.instructorProfile.website}</a>}
                                {profile.twitter && <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener" className={styles.socialLink}>🐦 {t.instructorProfile.twitter}</a>}
                                {profile.linkedin && <a href={profile.linkedin} target="_blank" rel="noopener" className={styles.socialLink}>💼 {t.instructorProfile.linkedin}</a>}
                                {profile.youtube && <a href={profile.youtube} target="_blank" rel="noopener" className={styles.socialLink}>▶️ {t.instructorProfile.youtube}</a>}
                            </div>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className={styles.statsRow}>
                        <div className={styles.statBox}>
                            <div className={styles.statNum}>{stats.courseCount}</div>
                            <div className={styles.statLabel}>{t.instructorProfile.courses}</div>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statBox}>
                            <div className={styles.statNum}>{stats.totalStudents.toLocaleString()}</div>
                            <div className={styles.statLabel}>{t.instructorProfile.students}</div>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statBox}>
                            <div className={styles.statNum}>{stats.avgRating > 0 ? `${stats.avgRating} ★` : '—'}</div>
                            <div className={styles.statLabel}>{t.instructorProfile.avgRating}</div>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statBox}>
                            <div className={styles.statNum}>{stats.totalReviews.toLocaleString()}</div>
                            <div className={styles.statLabel}>{t.instructorProfile.reviews}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CONTENT ===== */}
            <section className="section">
                <div className="container">
                    <div className={styles.layout}>
                        {/* Left: Bio */}
                        <aside className={styles.sidebar}>
                            {profile.bio && (
                                <div className={styles.bioCard}>
                                    <h3 className={styles.sectionTitle}>{t.instructorProfile.about}</h3>
                                    <p className={styles.bio}>{profile.bio}</p>
                                </div>
                            )}
                        </aside>

                        {/* Right: Courses */}
                        <main className={styles.main}>
                            <h2 className={styles.sectionTitle}>
                                {t.instructorProfile.coursesBy} {name} <span style={{ color: '#7c3aed', fontSize: '1rem', fontWeight: 600 }}>({courses.length})</span>
                            </h2>
                            {courses.length === 0 ? (
                                <div style={{ color: '#64748b', textAlign: 'center', padding: '64px 0', background: 'white', borderRadius: '24px', border: '1px dashed #cbd5e1' }}>
                                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
                                    <h3>{t.instructorProfile.noCourses}</h3>
                                    <p>{t.instructorProfile.noCoursesDesc}</p>
                                </div>
                            ) : (
                                <div className="grid-3">
                                    {courses.map(c => <CourseCard key={c.id} course={c} />)}
                                </div>
                            )}
                        </main>
                    </div>
                </div>
            </section>
        </div>
    );
}
