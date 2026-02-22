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

    // Simulate video upload (in production, send to cloud storage)
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);

        // Simulate upload progress
        const interval = setInterval(() => {
            setUploadProgress(p => {
                if (p >= 95) { clearInterval(interval); return p; }
                return p + Math.random() * 15;
            });
        }, 200);

        // In a real app, upload to S3/R2 here. For local dev we use a public URL placeholder.
        const formData = new FormData();
        formData.append('file', file);

        // Mock: just store filename as URL for demo
        await new Promise(r => setTimeout(r, 1500));
        clearInterval(interval);
        setUploadProgress(100);

        const fakeUrl = `/videos/${file.name}`;
        handleChange('videoUrl', fakeUrl);
        handleChange('duration', '00:00'); // Would be parsed from file metadata
        setUploading(false);
    };

    if (!lesson) return <div className={styles.loading}>Loading lesson...</div>;

    return (
        <div className={styles.page}>
            <div className={styles.breadcrumb}>
                <Link href={`/admin/courses/${courseId}`} className={styles.backLink}>← Course Editor</Link>
            </div>

            <div className={styles.header}>
                <h1 className={styles.title}>Edit Lesson</h1>
                <div className={styles.headerActions}>
                    {saved && <span className={styles.savedMsg}>✓ Saved</span>}
                    <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Basic Info */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>Basic Info</h2>
                    <div className={styles.field}>
                        <label className={styles.label}>Title</label>
                        <input className={styles.input} value={lesson.title} onChange={e => handleChange('title', e.target.value)} />
                    </div>
                    <div className={styles.field}>
                        <label className={styles.label}>Description</label>
                        <textarea className={styles.textarea} value={lesson.description ?? ''} onChange={e => handleChange('description', e.target.value)} rows={3} />
                    </div>
                    <div className={styles.twoCol}>
                        <div className={styles.field}>
                            <label className={styles.label}>Duration</label>
                            <input className={styles.input} value={lesson.duration ?? ''} onChange={e => handleChange('duration', e.target.value)} placeholder="12:30" />
                        </div>
                        <div className={styles.field}>
                            <label className={styles.toggleLabel} style={{ marginTop: 24 }}>
                                <input type="checkbox" checked={lesson.isFree} onChange={e => handleChange('isFree', e.target.checked)} />
                                Free Preview
                            </label>
                        </div>
                    </div>
                </div>

                {/* Video Upload */}
                <div className={styles.card}>
                    <h2 className={styles.cardTitle}>📹 Video</h2>

                    <div className={styles.uploadZone} onClick={() => fileRef.current?.click()}>
                        {lesson.videoUrl ? (
                            <div className={styles.videoPreview}>
                                <div className={styles.videoPreviewIcon}>🎬</div>
                                <div className={styles.videoPreviewName}>{lesson.videoUrl}</div>
                                <span className={styles.changeVideo}>Click to change</span>
                            </div>
                        ) : (
                            <div className={styles.uploadPrompt}>
                                <div className={styles.uploadIcon}>⬆️</div>
                                <div className={styles.uploadText}>Click to upload video</div>
                                <div className={styles.uploadHint}>MP4, MOV, AVI · Max 2GB</div>
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

                    <div className={styles.field} style={{ marginTop: 16 }}>
                        <label className={styles.label}>Or paste video URL</label>
                        <input
                            className={styles.input}
                            value={lesson.videoUrl ?? ''}
                            onChange={e => handleChange('videoUrl', e.target.value)}
                            placeholder="https://youtube.com/embed/... or /videos/lesson.mp4"
                        />
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
                        <h2 className={styles.cardTitle}>📡 Live Stream (Google Meet)</h2>
                        <label className={styles.toggleLabel}>
                            <input
                                type="checkbox"
                                checked={lesson.isLiveEnabled}
                                onChange={e => handleChange('isLiveEnabled', e.target.checked)}
                            />
                            Enable Live
                        </label>
                    </div>

                    {lesson.isLiveEnabled ? (
                        <>
                            <div className={styles.liveAlert}>
                                Students will see a <strong>"Join Live Class"</strong> button when a meet link is set and live is enabled.
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>Google Meet Link</label>
                                <input
                                    className={styles.input}
                                    value={lesson.meetLink ?? ''}
                                    onChange={e => handleChange('meetLink', e.target.value)}
                                    placeholder="https://meet.google.com/abc-def-ghi"
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
                                    🔗 Preview Meet Link
                                </a>
                            )}
                        </>
                    ) : (
                        <div className={styles.liveDisabled}>
                            Enable live stream to add a Google Meet link for this lesson.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
