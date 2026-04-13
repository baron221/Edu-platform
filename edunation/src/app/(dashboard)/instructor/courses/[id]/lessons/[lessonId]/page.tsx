'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from './page.module.css';
import * as Upchunk from '@mux/upchunk';

interface Resource {
    id: string;
    title: string;
    url: string;
    type: string;
    description: string | null;
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
    const [uploadingMaterial, setUploadingMaterial] = useState(false);
    const [newMaterial, setNewMaterial] = useState({ title: '', url: '' });
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchLesson = async () => {
            const res = await fetch(`/api/instructor/courses/${courseId}/lessons`);
            const lessons: Lesson[] = await res.json();
            const found = lessons.find((l: any) => l.id === lessonId);
            if (found) setLesson(found);
        };
        fetchLesson();
    }, [courseId, lessonId]);

    // --- MUX POLLING LOGIC (For Duration & Status) ---
    useEffect(() => {
        if (!lesson?.videoUrl?.startsWith('mux-upload:')) return;

        const interval = setInterval(async () => {
            try {
                const res = await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}/mux-status`);
                const data = await res.json();
                
                if (data.status === 'ready') {
                    setLesson(prev => prev ? ({ 
                        ...prev, 
                        muxPlaybackId: data.playbackId, 
                        videoUrl: `mux:${data.playbackId}`,
                        duration: data.duration || prev.duration 
                    }) : null);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [courseId, lessonId, lesson?.videoUrl]);

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

                    {/* Materials & Resources Section */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>
                            <h2 className={styles.cardTitle}>📚 Materials & Resources</h2>
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', lineHeight: '1.5' }}>
                            Upload documents, source code, or extra links for your students. These will appear in the "Resources" tab of the course page.
                        </p>

                        <div className={styles.resourceList}>
                            {lesson.resources?.map(resource => (
                                <div key={resource.id} className={styles.resourceItem}>
                                     <div className={styles.resourceIcon}>
                                         {resource.type === 'link' ? '🔗' : 
                                          resource.url?.toLowerCase().endsWith('.pdf') ? '📄' :
                                          resource.url?.toLowerCase().endsWith('.zip') || resource.url?.toLowerCase().endsWith('.rar') ? '📦' :
                                          resource.url?.toLowerCase().endsWith('.doc') || resource.url?.toLowerCase().endsWith('.docx') ? '📝' :
                                          resource.url?.toLowerCase().includes('.ppt') || resource.url?.toLowerCase().includes('.pptx') ? '📊' :
                                          '📁'}
                                     </div>
                                    <div className={styles.resourceInfo}>
                                        <div className={styles.resourceTitle}>{resource.title}</div>
                                        <div className={styles.resourceUrl} style={{ opacity: 0.5, fontSize: '11px' }}>
                                            {resource.type === 'file' ? 'Uploaded File' : resource.url}
                                        </div>
                                    </div>
                                    <button 
                                        className={styles.resourceDelete}
                                        onClick={async () => {
                                            if (!confirm('Are you sure you want to remove this resource?')) return;
                                            await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}/resources/${resource.id}`, { method: 'DELETE' });
                                            // Refresh lesson
                                            const res = await fetch(`/api/instructor/courses/${courseId}/lessons`);
                                            const lessons = await res.json();
                                            const found = lessons.find((l: any) => l.id === lessonId);
                                            if (found) setLesson(found);
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                            {(!lesson.resources || lesson.resources.length === 0) && (
                                <div className={styles.emptyResources}>No materials uploaded yet.</div>
                            )}
                        </div>

                        <div className={styles.addResourceZone}>
                            <h4 style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 600 }}>Add New Material</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px' }}>
                                <input 
                                    className={styles.input} 
                                    placeholder="Title (e.g. Lesson Handbook)" 
                                    value={newMaterial.title}
                                    onChange={e => setNewMaterial(prev => ({ ...prev, title: e.target.value }))}
                                />
                                <input 
                                    className={styles.input} 
                                    placeholder="URL or select file →" 
                                    value={newMaterial.url}
                                    onChange={e => setNewMaterial(prev => ({ ...prev, url: e.target.value }))}
                                />
                                <button 
                                    className={styles.saveBtn} 
                                    style={{ padding: '8px 16px', fontSize: '12px' }}
                                    onClick={async () => {
                                        if (!newMaterial.title || !newMaterial.url) { alert('Please provide title and URL'); return; }
                                        
                                        await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}/resources`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ 
                                                title: newMaterial.title, 
                                                url: newMaterial.url, 
                                                type: newMaterial.url.startsWith('http') ? 'link' : 'file' 
                                            })
                                        });

                                        // Refresh
                                        const res = await fetch(`/api/instructor/courses/${courseId}/lessons`);
                                        const lessons = await res.json();
                                        const found = lessons.find((l: any) => l.id === lessonId);
                                        if (found) setLesson(found);
                                        
                                        setNewMaterial({ title: '', url: '' });
                                    }}
                                >
                                    Save
                                </button>
                            </div>
                            <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <label className={styles.fileUploadBtn}>
                                    {uploadingMaterial ? '⏳ Uploading...' : '📁 Upload File'}
                                    <input 
                                        type="file" 
                                        disabled={uploadingMaterial}
                                        style={{ display: 'none' }} 
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            
                                            // Vercel Serverless Function limit
                                            if (file.size > 4.5 * 1024 * 1024) {
                                                alert('File size exceeds the 4.5MB limit. Please upload a smaller file or host it externally (like Google Drive) and provide a link.');
                                                return;
                                            }
                                            
                                            setUploadingMaterial(true);
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            
                                            try {
                                                const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                                                const data = await uploadRes.json();
                                                
                                                if (!uploadRes.ok) throw new Error(data.error || 'Upload failed');

                                                if (data.url) {
                                                    // Auto-save the resource record
                                                    const saveRes = await fetch(`/api/instructor/courses/${courseId}/lessons/${lessonId}/resources`, {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ 
                                                            title: newMaterial.title || file.name, 
                                                            url: data.url, 
                                                            type: 'file' 
                                                        })
                                                    });

                                                    if (saveRes.ok) {
                                                        // Refresh lesson
                                                        const res = await fetch(`/api/instructor/courses/${courseId}/lessons`);
                                                        const lessons = await res.json();
                                                        const found = lessons.find((l: any) => l.id === lessonId);
                                                        if (found) setLesson(found);
                                                        toast.success('Material uploaded and saved!');
                                                    }
                                                }
                                            } catch (err: any) {
                                                console.error('Material upload error:', err);
                                                alert(`Failed to upload: ${err.message}`);
                                            } finally {
                                                setUploadingMaterial(false);
                                                setNewMaterial({ title: '', url: '' });
                                            }
                                        }}
                                    />
                                </label>
                                {uploadingMaterial && <span style={{ fontSize: '13px', color: '#64748b' }}>Processing your file...</span>}
                            </div>
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
                            <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                                {lesson.videoUrl?.startsWith('mux:') ? '✅ Synced from Mux' : 'Will auto-calculate after upload'}
                            </p>
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
