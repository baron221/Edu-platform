'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css';

interface Lesson {
    id: string;
    title: string;
    description: string | null;
    videoUrl: string | null;
    duration: string | null;
    content: string | null;
    isFree: boolean;
    videoQuality: string | null;
    meetLink: string | null;
    liveAt: string | null;
    isLiveEnabled: boolean;
}

const QUALITY_OPTIONS = ['auto', '1080p', '720p', '480p', '360p'];

export default function LessonEditorPage() {
    const params = useParams();
    const courseId = params.id as string;
    const lessonId = params.lessonId as string;

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [generatingContent, setGeneratingContent] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`/api/admin/courses/${courseId}/lessons`)
            .then(r => r.json())
            .then((lessons: Lesson[]) => {
                const found = lessons.find(l => l.id === lessonId);
                if (found) setLesson(found);
            });
    }, [courseId, lessonId]);

    const handleChange = (field: keyof Lesson, value: unknown) => {
        if (!lesson) return;
        setLesson({ ...lesson, [field]: value });
        setSaved(false);
    };

    const handleSave = async () => {
        if (!lesson) return;
        setSaving(true);
        await fetch(`/api/admin/courses/${courseId}/lessons/${lessonId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lesson),
        });
        setSaving(false);
        setSaved(true);
    };

    const handleGenerateContent = async () => {
        if (!lesson) return;
        setGeneratingContent(true);
        try {
            const res = await fetch('/api/admin/generate-lesson', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: lesson.id,
                    courseTitle: 'Course', // We could fetch actual course title, but 'Course' works as fallback
                    lessonTitle: lesson.title,
                    lessonDescription: lesson.description
                }),
            });
            const data = await res.json();
            if (res.ok && data.lesson) {
                setLesson(data.lesson);
                setSaved(false); // Enable save button to confirm
            } else {
                alert(data.error || 'Failed to generate content');
            }
        } catch (err) {
            alert('An error occurred during generation');
        } finally {
            setGeneratingContent(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);

        // Note: Real progressive upload tracking requires XMLHttpRequest or Axios,
        // but for fetch we can show a continuous fast indeterminate progress.
        const interval = setInterval(() => {
            setUploadProgress(p => {
                if (p >= 90) return p;
                return p + Math.random() * 10;
            });
        }, 300);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(interval);
            setUploadProgress(100);

            if (res.ok) {
                const data = await res.json();
                handleChange('videoUrl', data.url);
                handleChange('duration', '00:00'); // Note: actual duration extraction requires a hidden video element
            } else {
                alert('File upload failed. Please try again.');
            }
        } catch (err) {
            clearInterval(interval);
            alert('An error occurred during upload.');
        } finally {
            setUploading(false);
        }
    };

    if (!lesson) return <div className={styles.loading}>Loading lesson data...</div>;

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.breadcrumb}>
                    <Link href={`/admin/courses/${courseId}`} className={styles.backBtn} title="Back to Course">
                        ←
                    </Link>
                    <h1 className={styles.title}>Edit Lesson</h1>
                </div>
                <div className={styles.actions}>
                    {saved && <span className={styles.savedMsg}>✨ Saved successfully</span>}
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className={styles.mainContainer}>
                <div className={styles.leftCol}>
                    {/* Basic Info */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📝 Basic Information</h2>
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Lesson Title</label>
                            <input className={styles.input} value={lesson.title} onChange={e => handleChange('title', e.target.value)} placeholder="e.g. Introduction to React state" />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.label}>Short Description</label>
                            <textarea className={styles.textarea} value={lesson.description ?? ''} onChange={e => handleChange('description', e.target.value)} rows={2} placeholder="Brief summary of what this lesson covers..." />
                        </div>
                    </div>

                    {/* Text Content (RAG KB) */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📖 Lesson Content (Markdown)</h2>
                            <button
                                className={styles.aiBtn}
                                onClick={handleGenerateContent}
                                disabled={generatingContent}
                            >
                                {generatingContent ? '✨ Generating...' : '✨ Auto-Generate with AI'}
                            </button>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
                            This content is displayed below the video for students to read. It also serves as the knowledge base for the AI Tutor to answer questions specifically about this lesson.
                        </p>
                        <div className={styles.markdownContentArea}>
                            <textarea
                                className={styles.textarea}
                                value={lesson.content ?? ''}
                                onChange={e => handleChange('content', e.target.value)}
                                rows={16}
                                placeholder="# Welcome to this lesson!&#10;&#10;In this lesson we will cover..."
                                style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6' }}
                            />
                        </div>
                    </div>

                    {/* Video Upload */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📹 Video Content</h2>
                        </div>

                        <div className={styles.uploadZone} onClick={() => fileRef.current?.click()}>
                            {lesson.videoUrl ? (
                                <div className={styles.videoPreview}>
                                    <div className={styles.videoPreviewIcon}>🎬</div>
                                    <div className={styles.videoPreviewName}>{lesson.videoUrl}</div>
                                    <span className={styles.changeVideo}>Change Video File</span>
                                </div>
                            ) : (
                                <div>
                                    <div className={styles.uploadIcon}>⬆️</div>
                                    <div className={styles.uploadText}>Drop your video file here or click to browse</div>
                                    <div className={styles.uploadHint}>Supports MP4, MOV, WebM (Max 2GB)</div>
                                </div>
                            )}
                            <input
                                ref={fileRef}
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {uploading && (
                            <div className={styles.progressWrap}>
                                <div className={styles.progressBar}>
                                    <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }} />
                                </div>
                                <span className={styles.progressText}>{Math.round(uploadProgress)}%</span>
                            </div>
                        )}

                        <div className={styles.field} style={{ marginTop: '24px' }}>
                            <label className={styles.label}>Or embed from URL (YouTube/Vimeo)</label>
                            <input
                                className={styles.input}
                                value={lesson.videoUrl ?? ''}
                                onChange={e => handleChange('videoUrl', e.target.value)}
                                placeholder="https://youtube.com/embed/..."
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.rightCol}>
                    {/* Settings */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>⚙️ Settings</h2>
                        </div>

                        <div className={styles.field}>
                            <div className={styles.toggleWrapper}>
                                <label className={styles.toggleLabel}>
                                    <input type="checkbox" checked={lesson.isFree} onChange={e => handleChange('isFree', e.target.checked)} />
                                    Make this lesson a Free Preview 🎁
                                </label>
                            </div>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Estimated Duration</label>
                            <input className={styles.input} value={lesson.duration ?? ''} onChange={e => handleChange('duration', e.target.value)} placeholder="e.g. 12:30" />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Default Video Quality</label>
                            <div className={styles.qualityGrid}>
                                {QUALITY_OPTIONS.map(q => (
                                    <button
                                        key={q}
                                        className={`${styles.qualityBtn} ${lesson.videoQuality === q ? styles.qualityActive : ''}`}
                                        onClick={() => handleChange('videoQuality', q)}
                                        type="button"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Live Stream */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📡 Live Stream</h2>
                        </div>

                        <div className={styles.field}>
                            <div className={styles.toggleWrapper} style={{ marginBottom: '16px' }}>
                                <label className={styles.toggleLabel}>
                                    <input
                                        type="checkbox"
                                        checked={lesson.isLiveEnabled}
                                        onChange={e => handleChange('isLiveEnabled', e.target.checked)}
                                    />
                                    Enable Live Session
                                </label>
                            </div>
                        </div>

                        {lesson.isLiveEnabled ? (
                            <>
                                <div className={styles.liveAlert}>
                                    When enabled, students will see a <strong>"Join Live Class"</strong> button instead of the recorded video until the session ends.
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Google Meet / Zoom Link</label>
                                    <input
                                        className={styles.input}
                                        value={lesson.meetLink ?? ''}
                                        onChange={e => handleChange('meetLink', e.target.value)}
                                        placeholder="https://meet.google.com/..."
                                    />
                                </div>
                                <div className={styles.field}>
                                    <label className={styles.label}>Scheduled Date & Time</label>
                                    <input
                                        className={styles.input}
                                        type="datetime-local"
                                        value={lesson.liveAt ? lesson.liveAt.slice(0, 16) : ''}
                                        onChange={e => handleChange('liveAt', e.target.value)}
                                    />
                                </div>
                                {lesson.meetLink && (
                                    <a
                                        href={lesson.meetLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={styles.meetPreviewBtn}
                                    >
                                        🔗 Test Meeting Link
                                    </a>
                                )}
                            </>
                        ) : (
                            <div className={styles.liveDisabled}>
                                Enable true live streaming to schedule a real-time class for this lesson via Google Meet or Zoom.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
