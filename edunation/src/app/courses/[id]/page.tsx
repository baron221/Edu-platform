'use client';
import { useState, useEffect, use } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';
import AIAssistant from '@/components/AIAssistant';

function formatUZS(price: number, currLabel: string) {
    if (price === 0) return '';
    return `${price.toLocaleString('ru-RU')} ${currLabel}`;
}

export default function CourseDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { t } = useLanguage();
    const router = useRouter();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [activeLesson, setActiveLesson] = useState<any>(null);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [getsUniversityFreeAccess, setGetsUniversityFreeAccess] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [progress, setProgress] = useState<any[]>([]);
    const [error, setError] = useState(false);
    const [enrolling, setEnrolling] = useState(false);
    const [updatingProgress, setUpdatingProgress] = useState(false);

    useEffect(() => {
        setLoading(true);
        fetch(`/api/courses/${id}`)
            .then(r => {
                if (!r.ok) throw new Error('Not found');
                return r.json();
            })
            .then(data => {
                setCourse(data);
                setIsSubscribed(data.isSubscribed);
                setIsEnrolled(data.isEnrolled);
                setGetsUniversityFreeAccess(data.getsUniversityFreeAccess);
                setProgress(data.progress || []);
                if (data.lessons && data.lessons.length > 0) {
                    setActiveLesson(data.lessons[0]);
                }
                setLoading(false);
            })
            .catch(() => {
                setError(true);
                setLoading(false);
            });
    }, [id]);

    const handleEnroll = async () => {
        setEnrolling(true);
        try {
            const res = await fetch('/api/enroll', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: course.id })
            });
            if (res.ok) {
                setIsEnrolled(true);
                router.refresh();
            } else if (res.status === 401) {
                router.push('/login');
            } else {
                alert('Failed to enroll. Please try again.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setEnrolling(false);
        }
    };

    const handleMarkComplete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeLesson || !isEnrolled || updatingProgress) return;

        const isCurrentlyCompleted = isLessonCompleted(activeLesson.id);
        const newCompletedStatus = !isCurrentlyCompleted;

        setUpdatingProgress(true);
        try {
            const res = await fetch('/api/progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course.id,
                    lessonId: activeLesson.id,
                    completed: newCompletedStatus
                })
            });

            if (res.ok) {
                const updatedProgress = await res.json();
                setProgress(prev => {
                    const existing = prev.find(p => p.lessonId === activeLesson.id);
                    if (existing) {
                        return prev.map(p => p.lessonId === activeLesson.id ? updatedProgress : p);
                    }
                    return [...prev, updatedProgress];
                });
            }
        } catch (err) {
            console.error('Error updating progress:', err);
        } finally {
            setUpdatingProgress(false);
        }
    };

    if (error) return notFound();
    if (loading || !course) {
        return (
            <div className={styles.page}>
                <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    const canWatch = (lesson: typeof activeLesson) => lesson.isFree || isSubscribed || isEnrolled || getsUniversityFreeAccess;
    const isLessonCompleted = (lessonId: string) => progress.some(p => p.lessonId === lessonId && p.completed);

    // Calculate progress percentage
    const completedLessonsCount = course.lessons?.filter((l: any) => isLessonCompleted(l.id)).length || 0;
    const totalLessons = course.lessons?.length || 0;
    const progressPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    const students = course._count?.enrollments || 0;
    const reviewsCount = course._count?.reviews || 0;
    const rating = 4.8; // Placeholder
    const tags = ['Education', course.category];
    const durationStr = '12 hours'; // Placeholder for total duration
    const instructorAvatar = '👨‍🏫'; // Placeholder

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero} style={{
                background: course.category === 'Web Development'
                    ? 'linear-gradient(135deg, #0f0a2e 0%, #1e1b4b 100%)'
                    : course.category === 'Design'
                        ? 'linear-gradient(135deg, #180228 0%, #2d1345 100%)'
                        : 'linear-gradient(135deg, #071428 0%, #0f2445 100%)'
            }}>
                <div className="container">
                    <div className={styles.heroContent}>
                        <Link href="/courses" className={styles.back}>{t.courseDetail.back}</Link>
                        <div className={styles.heroCat}>{course.category}</div>
                        <h1 className={styles.heroTitle}>{course.title}</h1>
                        <p className={styles.heroDesc}>{course.description}</p>

                        <div className={styles.heroMeta}>
                            <div className={styles.metaItem}>
                                <span className={styles.stars}>{'★'.repeat(Math.floor(rating))}</span>
                                <span className={styles.ratingNum}>{rating}</span>
                                <span className={styles.ratingCount}>({reviewsCount.toLocaleString()} {t.courseDetail.reviews})</span>
                            </div>
                            <div className={styles.metaDivider} />
                            <span className={styles.metaItem}>👥 {students.toLocaleString()} {t.courseDetail.students}</span>
                            <div className={styles.metaDivider} />
                            <span className={styles.metaItem}>📹 {totalLessons} {t.courseDetail.lessons}</span>
                            <div className={styles.metaDivider} />
                            <span className={styles.metaItem}>⏱ {durationStr}</span>
                            <div className={styles.metaDivider} />
                            <span className={styles.metaItem}>
                                {course.isFree
                                    ? <span className="badge badge-free">{t.courseDetail.freeCourseLabel}</span>
                                    : <span className="badge badge-premium">{t.shared.premium}</span>
                                }
                            </span>
                        </div>

                        <div className={styles.instructor}>
                            <div className={styles.instructorAvatar}>{instructorAvatar}</div>
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
                                {activeLesson && canWatch(activeLesson) ? (
                                    activeLesson.videoUrl && activeLesson.videoUrl.trim() !== '' ? (
                                        <iframe
                                            className={styles.videoIframe}
                                            src={activeLesson.videoUrl}
                                            title={activeLesson.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className={styles.locked}>
                                            <div className={styles.lockedIcon}>⏳</div>
                                            <h3 className={styles.lockedTitle}>Video Processing</h3>
                                            <p className={styles.lockedDesc}>The video for this lesson is currently being processed or has not been uploaded yet.</p>
                                        </div>
                                    )
                                ) : activeLesson ? (
                                    <div className={styles.locked}>
                                        <div className={styles.lockedIcon}>🔒</div>
                                        <h3 className={styles.lockedTitle}>{t.courseDetail.premiumContent}</h3>
                                        <p className={styles.lockedDesc}>{t.courseDetail.premiumDesc}</p>
                                        <Link href="/pricing" className="btn btn-primary">
                                            {t.courseDetail.unlockPro}
                                        </Link>
                                    </div>
                                ) : (
                                    <div className={styles.locked}>
                                        <p>No lessons available</p>
                                    </div>
                                )}
                            </div>

                            {activeLesson && (
                                <div className={styles.videoInfo}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <h2 className={styles.videoTitle}>{activeLesson.title}</h2>
                                            <p className={styles.videoDesc}>{activeLesson.description}</p>
                                            <div className={styles.videoDuration}>⏱ {activeLesson.duration}</div>
                                        </div>
                                        {isEnrolled && canWatch(activeLesson) && (
                                            <button
                                                className={`btn ${isLessonCompleted(activeLesson.id) ? 'btn-secondary' : 'btn-primary'}`}
                                                onClick={handleMarkComplete}
                                                disabled={updatingProgress}
                                                style={{ marginLeft: '1rem', flexShrink: 0 }}
                                            >
                                                {isLessonCompleted(activeLesson.id) ? '✓ Completed' : 'Mark as Complete'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className={styles.tags}>
                            {tags.map((tag, idx) => (
                                <span key={idx} className={styles.tag}>#{tag}</span>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className={styles.sidebar}>
                        {getsUniversityFreeAccess && !isEnrolled && (
                            <div className={styles.enrollCard} style={{ border: '2px solid #10b981' }}>
                                <div className={styles.enrollFree}>University Free Access</div>
                                <p className={styles.enrollDesc}>As a student of National Pedagogical University, you have free access to this course.</p>
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', background: '#10b981', borderColor: '#10b981' }} onClick={handleEnroll} disabled={enrolling}>
                                    {enrolling ? 'Enrolling...' : 'Claim Free Access'}
                                </button>
                            </div>
                        )}

                        {!course.isFree && !isSubscribed && !isEnrolled && !getsUniversityFreeAccess && (
                            <div className={styles.enrollCard}>
                                <div className={styles.enrollPrice}>{formatUZS(course.price, t.shared.currency)}</div>
                                <p className={styles.enrollDesc}>{t.courseDetail.oneTimePurchase}</p>
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleEnroll} disabled={enrolling}>
                                    {enrolling ? 'Enrolling...' : t.courseDetail.enrollNow}
                                </button>
                                <Link href="/pricing" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}>
                                    {t.courseDetail.tryPro} – 370 000 {t.shared.currency}{t.shared.mo}
                                </Link>
                                <p className={styles.enrollNote}>{t.courseDetail.moneyBack}</p>
                            </div>
                        )}

                        {course.isFree && !isEnrolled && (
                            <div className={styles.enrollCard}>
                                <div className={styles.enrollFree}>{t.courseDetail.freeCourseLabel}</div>
                                <p className={styles.enrollDesc}>{t.courseDetail.freeCourseDesc}</p>
                                <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleEnroll} disabled={enrolling}>
                                    {enrolling ? 'Enrolling...' : t.courseDetail.getAccessFree}
                                </button>
                            </div>
                        )}

                        {isEnrolled && (
                            <div className={styles.enrollCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0 }}>Your Progress</h4>
                                    <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{progressPercentage}%</span>
                                </div>
                                <div style={{ background: 'var(--card-bg-hover)', height: '8px', borderRadius: '4px', overflow: 'hidden', marginTop: '10px' }}>
                                    <div style={{ background: 'var(--primary-color)', height: '100%', width: `${progressPercentage}%`, transition: 'width 0.3s' }}></div>
                                </div>
                                <p className={styles.enrollDesc} style={{ marginTop: '10px' }}>{completedLessonsCount} of {totalLessons} lessons completed</p>
                            </div>
                        )}

                        <div className={styles.lessonsList}>
                            <h3 className={styles.lessonsTitle}>
                                {t.courseDetail.courseContent}
                                <span className={styles.lessonsCount}>{totalLessons} {t.courseDetail.lessons}</span>
                            </h3>

                            <div className={styles.lessons}>
                                {course.lessons?.map((lesson: any, idx: number) => (
                                    <button
                                        key={lesson.id}
                                        className={`${styles.lessonItem} ${activeLesson?.id === lesson.id ? styles.lessonActive : ''} ${!canWatch(lesson) ? styles.lessonLocked : ''}`}
                                        onClick={() => setActiveLesson(lesson)}
                                    >
                                        <div className={styles.lessonNum}>{idx + 1}</div>
                                        <div className={styles.lessonInfo}>
                                            <div className={styles.lessonTitle}>{lesson.title}</div>
                                            <div className={styles.lessonDuration}>{lesson.duration}</div>
                                        </div>
                                        <div className={styles.lessonStatus}>
                                            {isLessonCompleted(lesson.id) ? (
                                                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>✓</span>
                                            ) : lesson.isFree ? (
                                                <span className={styles.freeTag}>{t.courseDetail.free}</span>
                                            ) : canWatch(lesson) ? (
                                                <span>▶</span>
                                            ) : (
                                                <span className={styles.lockIcon}>🔒</span>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating AI Tutor */}
            <AIAssistant
                context={`The student is currently viewing the course titled "${course.title}" (${course.category}). ${activeLesson ? `They are currently on the lesson: "${activeLesson.title}".` : ''}`}
                lessonId={activeLesson?.id}
            />
        </div>
    );
}
