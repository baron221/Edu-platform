'use client';
import { useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { courses } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

function formatUZS(price: number, currLabel: string) {
    if (price === 0) return '';
    return `${price.toLocaleString('ru-RU')} ${currLabel}`;
}

export default function CourseDetailPage({ params }: { params: { id: string } }) {
    const { t } = useLanguage();
    const course = courses.find(c => c.id === params.id);
    if (!course) return notFound();

    const [activeLesson, setActiveLesson] = useState(course.lessons_list[0]);
    const [isSubscribed] = useState(false);

    const canWatch = (lesson: typeof activeLesson) => lesson.isFree || isSubscribed;

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero}>
                <div className={styles.heroBg} style={{
                    background: course.category === 'Web Development'
                        ? 'linear-gradient(135deg, #0f0a2e 0%, #1e1b4b 100%)'
                        : course.category === 'Design'
                            ? 'linear-gradient(135deg, #180228 0%, #2d1345 100%)'
                            : 'linear-gradient(135deg, #071428 0%, #0f2445 100%)'
                }} />
                <div className="container">
                    <div className={styles.heroContent}>
                        <Link href="/courses" className={styles.back}>{t.courseDetail.back}</Link>
                        <div className={styles.heroCat}>{course.category}</div>
                        <h1 className={styles.heroTitle}>{course.title}</h1>
                        <p className={styles.heroDesc}>{course.description}</p>

                        <div className={styles.heroMeta}>
                            <div className={styles.metaItem}>
                                <span className={styles.stars}>{'★'.repeat(Math.floor(course.rating))}</span>
                                <span className={styles.ratingNum}>{course.rating}</span>
                                <span className={styles.ratingCount}>({course.reviews.toLocaleString()} {t.courseDetail.reviews})</span>
                            </div>
                            <div className={styles.metaDivider} />
                            <span className={styles.metaItem}>👥 {course.students.toLocaleString()} {t.courseDetail.students}</span>
                            <div className={styles.metaDivider} />
                            <span className={styles.metaItem}>📹 {course.lessons} {t.courseDetail.lessons}</span>
                            <div className={styles.metaDivider} />
                            <span className={styles.metaItem}>⏱ {course.duration}</span>
                            <div className={styles.metaDivider} />
                            <span className={styles.metaItem}>
                                {course.isFree
                                    ? <span className="badge badge-free">{t.courseDetail.freeCourseLabel}</span>
                                    : <span className="badge badge-premium">{t.shared.premium}</span>
                                }
                            </span>
                        </div>

                        <div className={styles.instructor}>
                            <div className={styles.instructorAvatar}>{course.instructorAvatar}</div>
                            <div>
                                <div className={styles.instructorLabel}>{t.courseDetail.instructor}</div>
                                <div className={styles.instructorName}>{course.instructor}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container">
                <div className={styles.layout}>
                    {/* Left: Video Player + Lessons */}
                    <div className={styles.main}>
                        <div className={styles.videoSection}>
                            <div className={styles.videoWrapper}>
                                {canWatch(activeLesson) ? (
                                    <iframe
                                        className={styles.videoIframe}
                                        src={activeLesson.videoUrl}
                                        title={activeLesson.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                ) : (
                                    <div className={styles.locked}>
                                        <div className={styles.lockedIcon}>🔒</div>
                                        <h3 className={styles.lockedTitle}>{t.courseDetail.premiumContent}</h3>
                                        <p className={styles.lockedDesc}>{t.courseDetail.premiumDesc}</p>
                                        <Link href="/pricing" className="btn btn-primary">
                                            {t.courseDetail.unlockPro}
                                        </Link>
                                    </div>
                                )}
                            </div>

                            <div className={styles.videoInfo}>
                                <h2 className={styles.videoTitle}>{activeLesson.title}</h2>
                                <p className={styles.videoDesc}>{activeLesson.description}</p>
                                <div className={styles.videoDuration}>⏱ {activeLesson.duration}</div>
                            </div>
                        </div>

                        <div className={styles.tags}>
                            {course.tags.map(tag => (
                                <span key={tag} className={styles.tag}>#{tag}</span>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className={styles.sidebar}>
                        {!course.isFree && !isSubscribed && (
                            <div className={styles.enrollCard}>
                                <div className={styles.enrollPrice}>{formatUZS(course.price, t.shared.currency)}</div>
                                <p className={styles.enrollDesc}>{t.courseDetail.oneTimePurchase}</p>
                                <Link href="/pricing" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    {t.courseDetail.enrollNow}
                                </Link>
                                <Link href="/pricing" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                                    {t.courseDetail.tryPro} – 370 000 {t.shared.currency}{t.shared.mo}
                                </Link>
                                <p className={styles.enrollNote}>{t.courseDetail.moneyBack}</p>
                            </div>
                        )}

                        {course.isFree && (
                            <div className={styles.enrollCard}>
                                <div className={styles.enrollFree}>{t.courseDetail.freeCourseLabel}</div>
                                <p className={styles.enrollDesc}>{t.courseDetail.freeCourseDesc}</p>
                                <Link href="/signup" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                                    {t.courseDetail.getAccessFree}
                                </Link>
                            </div>
                        )}

                        <div className={styles.lessonsList}>
                            <h3 className={styles.lessonsTitle}>
                                {t.courseDetail.courseContent}
                                <span className={styles.lessonsCount}>{course.lessons_list.length} {t.courseDetail.lessons}</span>
                            </h3>

                            <div className={styles.lessons}>
                                {course.lessons_list.map((lesson, idx) => (
                                    <button
                                        key={lesson.id}
                                        className={`${styles.lessonItem} ${activeLesson.id === lesson.id ? styles.lessonActive : ''} ${!canWatch(lesson) ? styles.lessonLocked : ''}`}
                                        onClick={() => setActiveLesson(lesson)}
                                    >
                                        <div className={styles.lessonNum}>{idx + 1}</div>
                                        <div className={styles.lessonInfo}>
                                            <div className={styles.lessonTitle}>{lesson.title}</div>
                                            <div className={styles.lessonDuration}>{lesson.duration}</div>
                                        </div>
                                        <div className={styles.lessonStatus}>
                                            {lesson.isFree
                                                ? <span className={styles.freeTag}>{t.courseDetail.free}</span>
                                                : canWatch(lesson)
                                                    ? <span>▶</span>
                                                    : <span className={styles.lockIcon}>🔒</span>
                                            }
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
