'use client';
import { useState, useEffect, use } from 'react';
import { notFound, useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';
import AIAssistant from '@/components/AIAssistant';
import AIQuizPlayer from '@/components/AIQuizPlayer';
import ReactMarkdown from 'react-markdown';
import MuxPlayer from '@mux/mux-player-react';
import QuizViewer from '@/components/QuizViewer';
import ResourceList from '@/components/ResourceList';
import CertificateModal from '@/components/CertificateModal';
import { useSession } from 'next-auth/react';

function formatUZS(price: number, currLabel: string) {
    if (price === 0) return '';
    return `${price.toLocaleString('ru-RU')} ${currLabel}`;
}

export default function CourseDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const { t, language } = useLanguage();
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
    const [showCert, setShowCert] = useState(false);
    const { data: session } = useSession();

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

    // Parse multi-lingual description (Format assumption: "English text | Uzbek text" or separated by newlines)
    let localizedDescription = course.description || '';
    if (localizedDescription) {
        const parts = localizedDescription.includes('|')
            ? localizedDescription.split('|')
            : localizedDescription.split('\n').filter((p: string) => p.trim().length > 0);

        if (parts.length > 1) {
            // If language is Uzbek ('uz' or 'uz-UZ'), pick the second part, else the first part (English)
            if (language === 'uz') {
                localizedDescription = parts[1]?.trim() || parts[0]?.trim();
            } else if (language === 'ru') {
                localizedDescription = parts[2]?.trim() || parts[0]?.trim();
            } else {
                localizedDescription = parts[0]?.trim();
            }
        }
    }

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero}>
                <div className={styles.heroBg}>
                    <div className={styles.glowOrb1} />
                    <div className={styles.glowOrb2} />
                </div>
                <div className="container">
                    <div className={styles.heroContent}>
                        <Link href="/courses" className={styles.back}>{t.courseDetail.back}</Link>
                        <div className={styles.heroCat}>{course.category}</div>
                        <h1 className={styles.heroTitle}>{course.title}</h1>
                        <p className={styles.heroDesc}>{localizedDescription}</p>

                        <div className={styles.premiumInstructorPill}>
                            <div className={styles.instructorAvatar}>{instructorAvatar}</div>
                            <span className={styles.instructorName}>{course.instructor}</span>
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
                                    activeLesson.muxPlaybackId ? (
                                        <MuxPlayer
                                            playbackId={activeLesson.muxPlaybackId}
                                            metadata={{
                                                video_id: activeLesson.id,
                                                video_title: activeLesson.title,
                                            }}
                                            streamType="on-demand"
                                            style={{ width: '100%', aspectRatio: '16/9', borderRadius: '12px', background: '#000' }}
                                            onEnded={() => {
                                                if (!isLessonCompleted(activeLesson.id)) {
                                                    handleMarkComplete(activeLesson.id);
                                                }
                                            }}
                                        />
                                    ) : activeLesson.videoUrl && activeLesson.videoUrl.startsWith('mux-upload') ? (
                                        <div className={styles.locked} style={{ aspectRatio: '16/9' }}>
                                            <div className={styles.spinner}></div>
                                            <h3 className={styles.lockedTitle}>Video Processing</h3>
                                            <p className={styles.lockedDesc}>This video was just uploaded to Mux and is currently being encoded. Check back in a few minutes!</p>
                                        </div>
                                    ) : activeLesson.videoUrl && activeLesson.videoUrl.trim() !== '' ? (
                                        <iframe
                                            className={styles.videoIframe}
                                            src={activeLesson.videoUrl}
                                            title={activeLesson.title}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className={styles.locked} style={{ aspectRatio: '16/9' }}>
                                            <div className={styles.lockedIcon}>⏳</div>
                                            <h3 className={styles.lockedTitle}>Not Uploaded</h3>
                                            <p className={styles.lockedDesc}>The video for this lesson has not been uploaded yet.</p>
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

                                    {/* Render the AI-generated Lesson Text Content */}
                                    {activeLesson.content && (
                                        <div className={styles.lessonTextContent}>
                                            <ReactMarkdown>{activeLesson.content}</ReactMarkdown>
                                        </div>
                                    )}

                                    {/* AI-Generated Extra Resources */}
                                    {isEnrolled && canWatch(activeLesson) && activeLesson.resources && activeLesson.resources.length > 0 && (
                                        <div style={{ marginTop: '24px' }}>
                                            <ResourceList resources={activeLesson.resources} />
                                        </div>
                                    )}

                                    {/* Pre-Generated Lesson Quiz */}
                                    {isEnrolled && canWatch(activeLesson) && activeLesson.quizzes && activeLesson.quizzes.length > 0 && (
                                        <div style={{ marginTop: '24px' }}>
                                            <QuizViewer quiz={activeLesson.quizzes[0]} />
                                        </div>
                                    )}

                                    {/* Dynamic On-Demand AI Practice Space */}
                                    {isEnrolled && canWatch(activeLesson) && (!activeLesson.quizzes || activeLesson.quizzes.length === 0) && (
                                        <div className={styles.quizWrapper} style={{ marginTop: '24px' }}>
                                            <h3 className={styles.quizSectionTitle}>🤖 Dynamic AI Practice Space</h3>
                                            <AIQuizPlayer slug={course.slug} lessonId={activeLesson.id} />
                                        </div>
                                    )}
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
                        {/* Essential Stats Card */}
                        <div className={styles.statsCard}>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>⏱ Duration</span>
                                <span className={styles.statValue}>{durationStr}</span>
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>📚 Level</span>
                                <span className={styles.statValue}>{course.level}</span>
                            </div>
                            <div className={styles.statRow}>
                                <span className={styles.statLabel}>📹 Lessons</span>
                                <span className={styles.statValue}>{totalLessons} lessons</span>
                            </div>
                        </div>
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

                        {isEnrolled && (
                            <div className={styles.enrollCard}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{t.courseDetail.yourProgress}</h4>
                                    <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '16px' }}>{progressPercentage}%</span>
                                </div>
                                <div className={styles.premiumProgressTrack}>
                                    <div
                                        className={styles.premiumProgressFill}
                                        style={{ width: `${progressPercentage}%` }}
                                    />
                                </div>
                                <p className={styles.enrollDesc} style={{ margin: '14px 0 0', fontWeight: 500 }}>
                                    {t.courseDetail.lessonsCompleted(completedLessonsCount, totalLessons)}
                                </p>
                                {progressPercentage === 100 && (
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', justifyContent: 'center', marginTop: '1rem', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', border: 'none', color: '#1e293b', fontWeight: 'bold' }}
                                        onClick={async () => {
                                            // Call API to ensure certificate is recorded
                                            await fetch('/api/certificates', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ courseId: course.id })
                                            });
                                            setShowCert(true);
                                        }}
                                    >
                                        🏆 View Certificate
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Floating AI Tutor */}
            <AIAssistant
                context={`The student is currently viewing the course titled "${course.title}" (${course.category}). ${activeLesson ? `They are currently on the lesson: "${activeLesson.title}".` : ''}`}
                lessonId={activeLesson?.id}
            />

            {showCert && (
                <CertificateModal
                    courseName={course.title}
                    studentName={session?.user?.name || 'Dedicated Learner'}
                    instructorName={course.instructor}
                    date={new Date().toISOString()}
                    onClose={() => setShowCert(false)}
                />
            )}
        </div>
    );
}
