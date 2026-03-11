'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './CourseCard.module.css';

export interface CourseDB {
    id: string;
    title: string;
    instructor: string;
    category: string;
    level: string;
    price: number;
    isFree: boolean;
    isNew: boolean;
    description: string | null;
    slug: string;
    thumbnail?: string | null;
    _count?: { lessons: number; enrollments: number; reviews?: number };
    avgRating?: number;
}

interface Props {
    course: CourseDB;
}

const CATEGORY_GRADIENTS: Record<string, string> = {
    'Web Development': 'linear-gradient(135deg, #1e1b4b, #312e81)',
    'Design': 'linear-gradient(135deg, #1a0533, #4a044e)',
    'Data Science': 'linear-gradient(135deg, #0c1445, #1e3a5f)',
    'Mobile Development': 'linear-gradient(135deg, #0d2137, #0c4a6e)',
    'Business': 'linear-gradient(135deg, #1c1009, #78350f)',
    'Marketing': 'linear-gradient(135deg, #1a2e05, #365314)',
};

const CATEGORY_ICONS: Record<string, string> = {
    'Web Development': '💻',
    'Design': '🎨',
    'Data Science': '🤖',
    'Mobile Development': '📱',
    'Business': '💼',
    'Marketing': '📢',
};

function formatPrice(price: number, currLabel: string): string {
    if (price === 0) return '';
    return `${price.toLocaleString('ru-RU')} ${currLabel}`;
}

export default function CourseCard({ course }: Props) {
    const { t } = useLanguage();
    const [imgError, setImgError] = useState(false);

    const levelLabel =
        course.level === 'Beginner' ? t.shared.beginner :
            course.level === 'Intermediate' ? t.shared.intermediate :
                t.shared.advanced;

    const gradient = CATEGORY_GRADIENTS[course.category] ?? 'linear-gradient(135deg, #1e1b4b, #312e81)';
    const icon = CATEGORY_ICONS[course.category] ?? '📚';
    const lessonCount = course._count?.lessons ?? 0;
    const enrollmentCount = course._count?.enrollments ?? 0;

    return (
        <Link href={`/courses/${course.slug}`} className={styles.card}>
            {/* Shine effect overlay */}
            <div className={`${styles.shine} ${!course.isFree ? styles.shinePremium : ''}`} />
            
            {/* Thumbnail */}
            <div className={styles.thumbnail}>
                {course.thumbnail && !imgError && !course.thumbnail.includes('source.unsplash.com') ? (
                    <Image
                        src={course.thumbnail}
                        alt={course.title}
                        fill
                        className={styles.thumbImg}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className={styles.thumbBg} style={{ background: gradient }}>
                        <span className={styles.thumbIcon}>{icon}</span>
                    </div>
                )}

                {/* Badges Overlay */}
                <div className={styles.badges}>
                    {course.isNew && <span className={`${styles.badge} ${styles.badgeNew}`}>{t.shared.new}</span>}
                    {course.isFree
                        ? <span className={`${styles.badge} ${styles.badgeFree}`}>{t.shared.free}</span>
                        : <span className={`${styles.badge} ${styles.badgePremium}`}>{t.shared.premium}</span>
                    }
                </div>

                {/* Level Overlay */}
                <div className={styles.levelBadge}>{levelLabel}</div>
            </div>

            {/* Body */}
            <div className={styles.body}>
                <div className={styles.topRow}>
                    <span className={styles.category}>{course.category}</span>
                    <div className={styles.rating}>
                        <span className={styles.star}>⭐</span>
                        <span className={styles.ratingVal}>{course.avgRating && course.avgRating > 0 ? course.avgRating.toFixed(1) : '5.0'}</span>
                    </div>
                </div>

                <h3 className={styles.title}>{course.title}</h3>
                
                <div className={styles.instructorInfo}>
                    <div className={styles.instructorAvatar}>{course.instructor.charAt(0)}</div>
                    <span className={styles.instructorName}>{course.instructor}</span>
                </div>

                <div className={styles.metaInfo}>
                    <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>📹</span>
                        <span>{lessonCount} {t.courseDetail?.lessons || 'lessons'}</span>
                    </div>
                    <div className={styles.metaItem}>
                        <span className={styles.metaIcon}>🎓</span>
                        <span>{enrollmentCount.toLocaleString()} {t.courseDetail?.students || 'students'}</span>
                    </div>
                </div>

                <div className={styles.footer}>
                    <div className={styles.priceContainer}>
                        {course.isFree ? (
                            <span className={styles.freeText}>{t.shared.free}</span>
                        ) : (
                            <div className={styles.priceLayout}>
                                <span className={styles.priceValue}>{formatPrice(course.price, t.shared.currency)}</span>
                            </div>
                        )}
                    </div>
                    <div className={styles.actionIcon}>→</div>
                </div>
            </div>
        </Link>
    );
}
