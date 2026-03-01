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
    _count?: { lessons: number; enrollments: number };
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
            {/* Thumbnail */}
            <div className={styles.thumbnail}>
                {course.thumbnail && !imgError ? (
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

                {/* Badges */}
                <div className={styles.badges}>
                    {course.isNew && <span className="badge badge-new">{t.shared.new}</span>}
                    {course.isFree
                        ? <span className="badge badge-free">{t.shared.free}</span>
                        : <span className="badge badge-premium">{t.shared.premium}</span>
                    }
                </div>

                {/* Level */}
                <div className={styles.level}>{levelLabel}</div>
            </div>

            {/* Body */}
            <div className={styles.body}>
                <div className={styles.category}>{course.category}</div>
                <h3 className={styles.title}>{course.title}</h3>
                <p className={styles.instructor}>{t.shared.by} {course.instructor}</p>

                <div className={styles.info}>
                    <span>📹 {lessonCount} {t.courseDetail?.lessons || 'lessons'}</span>
                    <span>🎓 {enrollmentCount.toLocaleString()} {t.courseDetail?.students || 'students'}</span>
                </div>

                <div className={styles.footer}>
                    <div className={styles.price}>
                        {course.isFree
                            ? <span className={styles.freeLabel}>{t.shared.free}</span>
                            : <span className={styles.priceAmt}>{formatPrice(course.price, t.shared.currency)}</span>
                        }
                    </div>
                    <span className={`badge badge-${course.level.toLowerCase()}`}>{levelLabel}</span>
                </div>
            </div>
        </Link>
    );
}
