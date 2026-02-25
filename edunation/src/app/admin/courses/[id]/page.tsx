'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
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
    const [creatingLesson, setCreatingLesson] = useState(false);

    useEffect(() => {
        fetch(`/api/admin/courses/${id}`)
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
        await fetch(`/api/admin/courses/${id}`, {
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

    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleCreateLesson = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingLesson(true);

        let videoUrl = '';
        if (videoFile) {
            const formData = new FormData();
            formData.append('file', videoFile);

            try {
                // We'll simulate progress like the other page, but do real fetch
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

        await fetch(`/api/admin/courses/${id}/lessons`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...newLessonData, videoUrl }),
        });

        const r = await fetch(`/api/admin/courses/${id}`);
        const data = await r.json();
        setCourse(data);

        setShowLessonModal(false);
        setNewLessonData({ title: '', description: '', isFree: false });
        setVideoFile(null);
        setUploadProgress(0);
        setCreatingLesson(false);
    };

    const deleteLesson = async (lessonId: string) => {
        if (!confirm('Delete this lesson?')) return;
        await fetch(`/api/admin/courses/${id}/lessons/${lessonId}`, { method: 'DELETE' });
        fetch(`/api/admin/courses/${id}`).then(r => r.json()).then(setCourse);
    };

    if (loading) return <div className={styles.loading}>Loading course...</div>;
    if (error) return <div className={styles.loading}>Error: {error}</div>;
    if (!course) return null;

    const CATEGORIES = ['Web Development', 'Data Science', 'Design', 'Marketing', 'Mobile Development', 'Business'];
    const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

    return (
        <div className={styles.page}>
            <div className={styles.breadcrumb}>
                <Link href="/admin/courses" className={styles.backLink}>← Courses</Link>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>Edit Course</h1>
                <div className={styles.headerActions}>
                    {saved && <span className={styles.savedMsg}>✓ Saved</span>}
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Course Details */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Course Details</h2>

                    <div className={styles.field}>
                        <label className={styles.label}>Title</label>
                        <input className={styles.input} value={course.title} onChange={e => handleChange('title', e.target.value)} />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>Description</label>
                        <textarea className={styles.textarea} value={course.description ?? ''} onChange={e => handleChange('description', e.target.value)} rows={4} />
                    </div>

                    <div className={styles.twoCol}>
                        <div className={styles.field}>
                            <label className={styles.label}>Instructor</label>
                            <input className={styles.input} value={course.instructor} onChange={e => handleChange('instructor', e.target.value)} />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Category</label>
                            <select className={styles.select} value={course.category} onChange={e => handleChange('category', e.target.value)}>
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className={styles.twoCol}>
                        <div className={styles.field}>
                            <label className={styles.label}>Level</label>
                            <select className={styles.select} value={course.level} onChange={e => handleChange('level', e.target.value)}>
                                {LEVELS.map(l => <option key={l}>{l}</option>)}
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Price (UZS)</label>
                            <input className={styles.input} type="number" value={course.price} onChange={e => handleChange('price', e.target.value)} disabled={course.isFree} />
                        </div>
                    </div>

                    <div className={styles.toggleRow}>
                        <label className={styles.toggleLabel}>
                            <input type="checkbox" checked={course.isFree} onChange={e => handleChange('isFree', e.target.checked)} />
                            Free Course
                        </label>
                        <label className={styles.toggleLabel}>
                            <input type="checkbox" checked={course.published} onChange={e => handleChange('published', e.target.checked)} />
                            Published
                        </label>
                    </div>
                </div>

                {/* Lessons */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Lessons ({course.lessons.length})</h2>
                        <button className={styles.addLessonBtn} onClick={() => setShowLessonModal(true)}>+ Add Lesson</button>
                    </div>
                    <div className={styles.lessonList}>
                        {course.lessons.map((lesson, i) => (
                            <div key={lesson.id} className={styles.lessonItem}>
                                <span className={styles.lessonOrder}>{i + 1}</span>
                                <div className={styles.lessonInfo}>
                                    <div className={styles.lessonTitle}>{lesson.title}</div>
                                    <div className={styles.lessonMeta}>
                                        {lesson.duration} · {lesson.isFree ? '🆓 Free' : '🔒 Premium'}
                                        {lesson.isLiveEnabled && ' · 📹 Live'}
                                        {lesson.videoUrl && ' · 🎬 Video'}
                                    </div>
                                </div>
                                <div className={styles.lessonActions}>
                                    <Link href={`/admin/courses/${id}/lessons/${lesson.id}`} className={styles.lessonEditBtn}>Edit</Link>
                                    <button className={styles.lessonDeleteBtn} onClick={() => deleteLesson(lesson.id)}>✕</button>
                                </div>
                            </div>
                        ))}
                        {course.lessons.length === 0 && (
                            <div className={styles.noLessons}>No lessons yet. Click "+ Add Lesson" to get started.</div>
                        )}
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
                                <label>Lesson Title</label>
                                <input required value={newLessonData.title} onChange={e => setNewLessonData({ ...newLessonData, title: e.target.value })} placeholder="e.g. Introduction to React" className="input" />
                            </div>
                            <div className={styles.field}>
                                <label>Short Description (Optional)</label>
                                <textarea rows={3} value={newLessonData.description} onChange={e => setNewLessonData({ ...newLessonData, description: e.target.value })} placeholder="What will students learn?" className="input" />
                            </div>
                            <div className={styles.field}>
                                <label>Video File (Optional)</label>
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={e => setVideoFile(e.target.files?.[0] || null)}
                                    className="input"
                                />
                                {uploadProgress > 0 && uploadProgress < 100 && (
                                    <div className={styles.progressContainer} style={{ marginTop: '8px' }}>
                                        <div className={styles.progressBar}>
                                            <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                                        </div>
                                        <div className={styles.progressText}>{Math.round(uploadProgress)}% Uploaded</div>
                                    </div>
                                )}
                            </div>
                            <div className={styles.field}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={newLessonData.isFree} onChange={e => setNewLessonData({ ...newLessonData, isFree: e.target.checked })} />
                                    Offer as a Free Preview
                                </label>
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowLessonModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creatingLesson}>
                                    {creatingLesson ? 'Creating...' : 'Create Lesson'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
