'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css';
import * as Upchunk from '@mux/upchunk';

interface Resource {
    id: string;
    title: string;
    description: string | null;
    url: string | null;
    type: string;
}

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
    subtitleUrl: string | null;
    resources?: Resource[];
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
    const [generatingQuiz, setGeneratingQuiz] = useState(false);
    const [generatingSummary, setGeneratingSummary] = useState(false);
    const [uploadingResource, setUploadingResource] = useState(false);
    const [newResource, setNewResource] = useState({ title: '', url: '' });
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetch(`/api/instructor/courses/${courseId}/lessons`)
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
        await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}`, {
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

    const handleAddResource = async (type: string, url: string, title: string) => {
        if (!lesson) return;
        try {
            const res = await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}/resources`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, url, type })
            });
            const newRes = await res.json();
            if (res.ok) {
                setLesson({ ...lesson, resources: [...(lesson.resources || []), newRes] });
                setNewResource({ title: '', url: '' });
            } else {
                alert(newRes.error || 'Failed to add resource');
            }
        } catch (err) {
            alert('Error adding resource');
        }
    };

    const handleDeleteResource = async (resourceId: string) => {
        if (!lesson) return;
        if (!confirm('Are you sure you want to delete this resource?')) return;
        try {
            const res = await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}/resources/${resourceId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setLesson({ ...lesson, resources: (lesson.resources || []).filter(r => r.id !== resourceId) });
            } else {
                alert('Failed to delete resource');
            }
        } catch (err) {
            alert('Error deleting resource');
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !lesson) return;
        
        // Ensure they typed a title first if we want, or just use filename
        const title = newResource.title || file.name;

        setUploadingResource(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await res.json();
            if (res.ok && data.url) {
                await handleAddResource(file.name.endsWith('.pdf') ? 'pdf' : 'document', data.url, title);
            } else {
                alert(data.error || 'Upload failed');
            }
        } catch (err) {
            alert('An error occurred during upload');
        } finally {
            setUploadingResource(false);
        }
    };

    const handleGenerateQuiz = async () => {
        if (!lesson) return;
        setGeneratingQuiz(true);
        try {
            const res = await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}/generate-quiz`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                alert('Quiz generated successfully! Check the course preview to see it in action.');
            } else {
                alert(data.error || 'Failed to generate Quiz');
            }
        } catch (err) {
            alert('An error occurred during generation');
        } finally {
            setGeneratingQuiz(false);
        }
    };

    const handleGenerateSummary = async () => {
        if (!lesson) return;
        setGeneratingSummary(true);
        try {
            const res = await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}/generate-summary`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (res.ok) {
                alert('Summary generated successfully! It has been attached as a new Resource.');
            } else {
                alert(data.error || 'Failed to generate Summary');
            }
        } catch (err) {
            alert('An error occurred during generation');
        } finally {
            setGeneratingSummary(false);
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        setUploadProgress(0);

        try {
            // 1. Get a direct upload ticket from our new Mux API
            const ticketRes = await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}/mux-upload`, {
                method: 'POST',
            });
            const ticketData = await ticketRes.json();

            if (!ticketRes.ok) {
                throw new Error(ticketData.error || 'Failed to get upload ticket');
            }

            // 2. Use @mux/upchunk to stream the file directly from the browser to Mux
            // This safely bypasses Vercel's 4.5MB payload limit!
            const upload = Upchunk.createUpload({
                endpoint: ticketData.url, // The Mux Google Cloud Storage URL
                file: file,
                chunkSize: 5120, // 5MB chunks
            });

            upload.on('progress', progress => {
                setUploadProgress(progress.detail);
            });

            upload.on('success', () => {
                setUploadProgress(100);
                setTimeout(() => setUploading(false), 1000);
                // We clear the old videoUrl if it existed and let the Webhook handle the rest
                handleChange('videoUrl', `mux-upload:${ticketData.uploadId}`);
                alert('Success! Mux is now encoding your video. It will appear here shortly.');
            });

            upload.on('error', err => {
                console.error('Mux Upchunk Error:', err);
                alert('An error occurred during upload to Mux.');
                setUploading(false);
            });

        } catch (err) {
            console.error('Upload init error:', err);
            alert('An error occurred starting the upload.');
            setUploading(false);
        }
    };

    if (!lesson) return <div className={styles.loading}>Loading lesson data...</div>;

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.breadcrumb}>
                    <Link href={`/instructor/courses/${courseId}`} className={styles.backBtn} title="Back to Course">
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

                    {/* AI Assessments Generator */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>🤖 AI Assessments</h2>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
                            Automatically generate a structured Quiz or Markdown Cheat-Sheet Summary based on the Lesson Content above. 
                            These will be permanently saved to the database.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button
                                className={styles.aiBtn}
                                onClick={handleGenerateQuiz}
                                disabled={generatingQuiz}
                                style={{ flex: 1, minWidth: '200px', justifyContent: 'center' }}
                            >
                                {generatingQuiz ? '✨ Generating Quiz...' : '✨ Generate AI Quiz'}
                            </button>
                            <button
                                className={styles.aiBtn}
                                onClick={handleGenerateSummary}
                                disabled={generatingSummary}
                                style={{ flex: 1, minWidth: '200px', justifyContent: 'center', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', border: '1px solid rgba(37, 99, 235, 0.2)' }}
                            >
                                {generatingSummary ? '✨ Generating Summary...' : '✨ Generate AI Summary'}
                            </button>
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

                    {/* Subtitles / Captions */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>💬 Subtitles / Captions</h2>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
                            Upload a <strong>.vtt</strong> or <strong>.srt</strong> file to add closed captions to your video. This is great for accessibility and "YouTube-like" features.
                        </p>

                        <div className={styles.field}>
                            <label className={styles.label}>Subtitle File URL</label>
                            <input
                                className={styles.input}
                                value={lesson.subtitleUrl ?? ''}
                                onChange={e => handleChange('subtitleUrl', e.target.value)}
                                placeholder="https://.../captions.vtt or /uploads/..."
                            />
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>Upload Subtitle File (.vtt)</label>
                            <input
                                type="file"
                                accept=".vtt,.srt"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    const formData = new FormData();
                                    formData.append('file', file);

                                    try {
                                        const res = await fetch('/api/upload', {
                                            method: 'POST',
                                            body: formData,
                                        });
                                        const data = await res.json();
                                        if (res.ok && data.url) {
                                            handleChange('subtitleUrl', data.url);
                                            alert('Subtitle file uploaded successfully!');
                                        } else {
                                            alert(data.error || 'Upload failed');
                                        }
                                    } catch (err) {
                                        alert('An error occurred during upload');
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* Attachable Materials */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📎 Attachable Materials</h2>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
                            Upload PDFs, Word documents, or provide external links for students to download or read.
                        </p>

                        <div className={styles.fieldRow} style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap' }}>
                            <div className={styles.field} style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
                                <label className={styles.label}>Material Title</label>
                                <input
                                    className={styles.input}
                                    value={newResource.title}
                                    onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                                    placeholder="e.g. Chapter 1 Slides (PDF)"
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {/* File Upload Button */}
                                <div style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        className={styles.saveBtn}
                                        style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}
                                        disabled={uploadingResource || !newResource.title}
                                        onClick={() => document.getElementById('resourceUpload')?.click()}
                                    >
                                        {uploadingResource ? 'Uploading...' : '📁 Upload File'}
                                    </button>
                                    <input
                                        id="resourceUpload"
                                        type="file"
                                        onChange={handleFileUpload}
                                        style={{ display: 'none' }}
                                    />
                                </div>

                                {/* Add Link Button */}
                                <button
                                    type="button"
                                    className={styles.saveBtn}
                                    style={{ background: '#f1f5f9', color: '#0f172a', border: '1px solid #cbd5e1' }}
                                    disabled={!newResource.title || uploadingResource}
                                    onClick={() => {
                                        const url = prompt('Enter the link URL (e.g. Google Drive link):');
                                        if (url) {
                                            handleAddResource('link', url, newResource.title);
                                        }
                                    }}
                                >
                                    🔗 Add Link
                                </button>
                            </div>
                        </div>

                        {/* Resource List */}
                        {lesson.resources && lesson.resources.length > 0 && (
                            <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#334155', marginBottom: '12px' }}>Attached Files & Links</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {lesson.resources.map(res => (
                                        <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                                                <div style={{ fontSize: '20px' }}>
                                                    {res.type === 'pdf' ? '📄' : res.type === 'summary' ? '📋' : res.type === 'link' ? '🔗' : '📁'}
                                                </div>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ fontWeight: 500, color: '#0f172a', fontSize: '14px' }}>{res.title}</div>
                                                    {res.url && <div style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>{res.url}</div>}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteResource(res.id)}
                                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 500 }}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
