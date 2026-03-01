'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import MuxPlayer from '@mux/mux-player-react';
import styles from './page.module.css';

interface Lesson {
    id: string;
    title: string;
    duration: string;
    isFree: boolean;
    order: number;
    videoUrl: string | null;
    isLiveEnabled: boolean;
}

interface Course {
    id: string;
    title: string;
    description: string | null;
    instructor: string;
    category: string;
    level: string;
    price: number;
    isFree: boolean;
    published: boolean;
    lessons: Lesson[];
}

const CATEGORIES = ['Web Development', 'Data Science', 'Design', 'Marketing', 'Mobile Development', 'Business'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function CourseEditorPage() {
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [showLessonModal, setShowLessonModal] = useState(false);
    const [newLessonData, setNewLessonData] = useState({ title: '', description: '', isFree: false });
    const { data: session } = useSession({ required: true, onUnauthenticated() { router.push('/login'); } });
    const [creatingLesson, setCreatingLesson] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        fetch(`/api/instructor/courses/${id}`)
            .then(r => r.json())
            .then(data => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setCourse(data);
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load course');
                setLoading(false);
            });
    }, [id]);

    const handleChange = (field: keyof Course, value: unknown) => {
        if (!course) return;
        setCourse({ ...course, [field]: value });
        setSaved(false);
    };

    const handleSave = async () => {
        if (!course) return;
        setSaving(true);
        await fetch(`/api/instructor/courses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: course.title,
                description: course.description,
                instructor: course.instructor,
                category: course.category,
                level: course.level,
                price: Number(course.price),
                isFree: course.isFree,
                published: course.published,
            }),
        });
        setSaving(false);
        setSaved(true);
    };

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingLesson(true);

        let videoUrl = '';
        if (videoFile) {
            const formData = new FormData();
            formData.append('file', videoFile);

            try {
                const interval = setInterval(() => {
                    setUploadProgress(p => {
                        if (p >= 90) { clearInterval(interval); return p; }
                        return p + 10;
                    });
                }, 300);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                clearInterval(interval);
                setUploadProgress(100);

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    videoUrl = data.url;
                } else {
                    alert('Video upload failed');
                    setCreatingLesson(false);
                    return;
                }
            } catch (err) {
                console.error(err);
                alert('Video upload error');
                setCreatingLesson(false);
                return;
            }
        }

        const res = await fetch(`/api/instructor/courses/${id}/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newLessonData, videoUrl }),
        });

        const r = await fetch(`/api/instructor/courses/${id}`);
        const data = await r.json();
        setCourse(data);

        setShowLessonModal(false);
        setNewLessonData({ title: '', description: '', isFree: false });
        setVideoFile(null);
        setUploadProgress(0);
        setCreatingLesson(false);
    };

    const deleteLesson = async (lessonId: string) => {
        if (!confirm('Are you certain you want to delete this lesson? This action cannot be undone.')) return;
        await fetch(`/api/instructor/courses/${id}/lessons/${lessonId}`, { method: 'DELETE' });
        fetch(`/api/instructor/courses/${id}`).then(r => r.json()).then(setCourse);
    };

    if (loading) return <div className={styles.loading}>Loading course data...</div>;
    if (error) return <div className={styles.loading}>Error: {error}</div>;
    if (!course) return null;

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.breadcrumb}>
                    <Link href="/instructor/courses" className={styles.backBtn} title="Back to Courses">
                        ← Back to Courses
                    </Link>
                    <h1 className={styles.title}>Edit Course</h1>
                </div>
                <div className={styles.actions}>
                    {saved && <span className={styles.savedMsg}>✨ Saved successfully</span>}
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className={styles.mainContainer}>
                {/* Left Column - Main Details */}
                <div className={styles.leftCol}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📝 Course Information</h2>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Course Title</label>
                            <input className={styles.input} value={course.title} onChange={e => handleChange('title', e.target.value)} placeholder="e.g. Advanced TypeScript Patterns" />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Course Description</label>
                            <textarea className={styles.textarea} value={course.description ?? ''} onChange={e => handleChange('description', e.target.value)} rows={5} placeholder="Provide a detailed overview of what students will learn..." />
                        </div>
                    </div>

                    {/* Lessons Module */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📚 Course Curriculum ({course.lessons.length})</h2>
                            <button className={styles.addLessonBtn} onClick={() => setShowLessonModal(true)}>
                                + Add New Lesson
                            </button>
                        </div>

                        <div className={styles.lessonList}>
                            {course.lessons.map((lesson, i) => (
                                <div key={lesson.id} className={styles.lessonItem}>
                                    <div className={styles.lessonOrder}>{i + 1}</div>
                                    <div className={styles.lessonInfo}>
                                        <div className={styles.lessonTitle}>{lesson.title}</div>
                                        <div className={styles.lessonMeta}>
                                            <span>⏱️ {lesson.duration || '00:00'}</span>
                                            {lesson.isFree ? <span className={`${styles.badge} ${styles.badgeFree}`}>Free Preview</span> : <span className={`${styles.badge} ${styles.badgePremium}`}>Premium</span>}
                                            {lesson.isLiveEnabled && <span className={styles.badge}>📡 Live Session</span>}
                                            {lesson.videoUrl && <span className={styles.badge}>🎬 Video Included</span>}
                                        </div>
                                    </div>
                                    <div className={styles.lessonActions}>
                                        <Link href={`/admin/courses/${id}/lessons/${lesson.id}`} className={styles.lessonEditBtn}>
                                            Edit Lesson
                                        </Link>
                                        <button className={styles.lessonDeleteBtn} onClick={() => deleteLesson(lesson.id)} title="Delete Lesson">
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {course.lessons.length === 0 && (
                                <div className={styles.noLessons}>
                                    Your course has no material yet.<br />Click "+ Add New Lesson" to start building your curriculum.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Settings & Metadata */}
                <div className={styles.rightCol}>
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>⚙️ Configuration</h2>
                        </div>

                        <div className={styles.field}>
                            <div className={styles.toggleWrapper}>
                                <label className={styles.toggleLabel}>
                                    <input type="checkbox" checked={course.published} onChange={e => handleChange('published', e.target.checked)} />
                                    Publish Course (Visible to students)
                                </label>
                            </div>
                            <div className={styles.toggleWrapper} style={{ marginBottom: 0 }}>
                                <label className={styles.toggleLabel}>
                                    <input type="checkbox" checked={course.isFree} onChange={e => handleChange('isFree', e.target.checked)} />
                                    Set as a completely Free Course
                                </label>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Price (UZS)</label>
                            <input
                                className={styles.input}
                                type="number"
                                value={course.price}
                                onChange={e => handleChange('price', e.target.value)}
                                disabled={course.isFree}
                                placeholder="0"
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Instructor Name</label>
                            <input className={styles.input} value={course.instructor} onChange={e => handleChange('instructor', e.target.value)} />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Category</label>
                            <select className={styles.select} value={course.category} onChange={e => handleChange('category', e.target.value)}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Difficulty Level</label>
                            <select className={styles.select} value={course.level} onChange={e => handleChange('level', e.target.value)}>
                                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lesson Creation Modal */}
            {showLessonModal && (
                <div className={styles.modalOverlay} onClick={() => setShowLessonModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Create New Lesson</h2>
                            <button className={styles.closeBtn} onClick={() => setShowLessonModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreateLesson} className={styles.modalForm}>
                            <div className={styles.field}>
                                <label className={styles.label}>Lesson Title <span style={{ color: '#ef4444' }}>*</span></label>
                                <input required value={newLessonData.title} onChange={e => setNewLessonData({ ...newLessonData, title: e.target.value })} placeholder="e.g. Setting up your environment" className={styles.input} />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Short Description (Optional)</label>
                                <textarea rows={3} value={newLessonData.description} onChange={e => setNewLessonData({ ...newLessonData, description: e.target.value })} placeholder="Briefly describe what this lesson covers" className={styles.textarea} />
                            </div>

                            <div className={styles.field}>
                                <div className={styles.toggleWrapper} style={{ marginBottom: '8px' }}>
                                    <label className={styles.toggleLabel}>
                                        <input type="checkbox" checked={newLessonData.isFree} onChange={e => setNewLessonData({ ...newLessonData, isFree: e.target.checked })} />
                                        Offer this specific lesson as a Free Preview
                                    </label>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Upload Video File (Optional - can add later)</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={e => setVideoFile(e.target.files?.[0] || null)}
                                    className={styles.input}
                                />
                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className={styles.progressContainer}>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <div className={styles.progressText}>{Math.round(uploadProgress)}% Uploaded</div>
                                    </div>
                                )}
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.btnSecondary} onClick={() => setShowLessonModal(false)}>Cancel</button>
                                <button type="submit" className={styles.btnPrimary} disabled={creatingLesson}>
                                    {creatingLesson ? 'Creating Lesson...' : 'Create Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
