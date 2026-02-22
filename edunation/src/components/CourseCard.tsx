'use client';
import Link from 'next/link';
import { Course } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import styles from './CourseCard.module.css';

interface Props {
    course: Course;
}

function StarRating({ rating }: { rating: number }) {
    return (
        <span className={styles.stars}>
            {'★'.repeat(Math.floor(rating))}{'☆'.repeat(5 - Math.floor(rating))}
            <span className={styles.ratingNum}>{rating}</span>
        </span>
    );
}

function formatPrice(price: number, currLabel: string): string {
    if (price === 0) return '';
    // Display in thousands for readability e.g. 1 130 000 → "1 130 000"
    return `${price.toLocaleString('ru-RU')} ${currLabel}`;
}

export default function CourseCard({ course }: Props) {
    const { t } = useLanguage();

    const levelLabel =
        course.level === 'Beginner' ? t.shared.beginner :
            course.level === 'Intermediate' ? t.shared.intermediate :
                t.shared.advanced;

    return (
        <Link href={`/courses/${course.id}`} className={styles.card}>
            {/* Thumbnail */}
            <div className={styles.thumbnail}>
                <div className={styles.thumbBg} style={{
                    background: course.category === 'Web Development'
                        ? 'linear-gradient(135deg, #1e1b4b, #312e81)'
                        : course.category === 'Design'
                            ? 'linear-gradient(135deg, #1a0533, #4a044e)'
                            : course.category === 'Data Science'
                                ? 'linear-gradient(135deg, #0c1445, #1e3a5f)'
                                : 'linear-gradient(135deg, #1a2e05, #365314)'
                }}>
                    <span className={styles.thumbIcon}>
                        {course.category === 'Web Development' ? '💻'
                            : course.category === 'Design' ? '🎨'
                                : course.category === 'Data Science' ? '🤖'
                                    : '📢'}
                    </span>
                </div>

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

                <div className={styles.meta}>
                    <StarRating rating={course.rating} />
                    <span className={styles.reviews}>({course.reviews.toLocaleString()})</span>
                </div>

                <div className={styles.info}>
                    <span>📹 {course.lessons} {t.courseDetail?.lessons || 'lessons'}</span>
                    <span>⏱ {course.duration}</span>
                </div>

                <div className={styles.footer}>
                    <div className={styles.price}>
                        {course.isFree
                            ? <span className={styles.freeLabel}>{t.shared.free}</span>
                            : <>
                                <span className={styles.priceAmt}>
                                    {formatPrice(course.price, t.shared.currency)}
                                </span>
                            </>
                        }
                    </div>
                    <span className={styles.students}>{(course.students / 1000).toFixed(0)}K {t.courseDetail?.students || 'students'}</span>
                </div>
            </div>
        </Link>
    );
}
