'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

interface Course {
    id: string;
    title: string;
    category: string;
    level: string;
    isFree: boolean;
    published: boolean;
    _count: { enrollments: number; lessons: number };
}

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [subscription, setSubscription] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '', description: '', category: 'Web Development', level: 'Beginner', isFree: true, price: ''
    });
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiTopic, setAiTopic] = useState('');
    const [aiInstructions, setAiInstructions] = useState('');
    const [generating, setGenerating] = useState(false);
    const router = useRouter();

    const load = () =>
        fetch('/api/instructor/courses').then(r => r.json()).then(data => {
            if (data.courses) {
                setCourses(data.courses);
                setSubscription(data.subscription);
            } else if (Array.isArray(data)) {
                // Fallback if API hasn't updated yet
                setCourses(data);
                setSubscription(null);
            }
            setLoading(false);
        });

    useEffect(() => { load(); }, []);

    const requireSubscription = (e: React.MouseEvent) => {
        if (!subscription) {
            e.preventDefault();
            router.push('/instructor/subscribe');
            return true;
        }
        return false;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);

        let thumbnailUrl = null;
        if (thumbFile) {
            const formDataMedia = new FormData();
            formDataMedia.append('file', thumbFile);
            const uploadRes = await fetch('/api/upload', { method: 'POST', body: formDataMedia });
            if (uploadRes.ok) {
                const { url } = await uploadRes.json();
                thumbnailUrl = url;
            }
        }

        const res = await fetch('/api/instructor/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...formData,
                price: Number(formData.price) || 0,
                thumbnail: thumbnailUrl
            }),
        });
        const course = await res.json();
        setCreating(false);
        if (!res.ok || !course.id) {
            alert(course.error ?? 'Failed to create course. Please try again.');
            return;
        }
        setShowModal(false);
        setFormData({ title: '', description: '', category: 'Web Development', level: 'Beginner', isFree: true, price: '' });
        setThumbFile(null);
        router.push(`/instructor/courses/${course.id}`);
    };

    const handleAiGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiTopic.trim()) return;

        setGenerating(true);
        try {
            const res = await fetch('/api/admin/generate-course', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic: aiTopic, customInstructions: aiInstructions }),
            });
            const data = await res.json();

            if (!res.ok || data.error) {
                alert(data.error || 'Failed to generate course.');
            } else if (data.course?.id) {
                setShowAiModal(false);
                setAiTopic('');
                setAiInstructions('');
                router.push(`/instructor/courses/${data.course.id}`);
            }
        } catch (err: any) {
            alert(err.message || 'An error occurred.');
        } finally {
            setGenerating(false);
        }
    };

    const togglePublish = async (id: string, current: boolean) => {
        await fetch(`/api/instructor/courses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ published: !current }),
        });
        load();
    };

    const deleteCourse = async (id: string) => {
        if (!confirm('Delete this course? This cannot be undone.')) return;
        await fetch(`/api/instructor/courses/${id}`, { method: 'DELETE' });
        load();
    };

    return (
        <div className={styles.page}>
            {!loading && !subscription && (
                <div className={styles.subscriptionBanner}>
                    <div className={styles.bannerIcon}>⚠️</div>
                    <div className={styles.bannerText}>
                        <h3>No Active Instructor Plan</h3>
                        <p>You need an active subscription plan to create and publish courses on the platform.</p>
                    </div>
                    <Link href="/instructor/subscribe" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
                        View Plans
                    </Link>
                </div>
            )}

            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Courses</h1>
                    <p className={styles.subtitle}>{courses.length} total courses</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className={styles.aiBtn} onClick={(e) => { if (!requireSubscription(e)) setShowAiModal(true); }}>
                        ✨ Generate with AI
                    </button>
                    <button className={`btn btn-primary`} onClick={(e) => { if (!requireSubscription(e)) setShowModal(true); }}>
                        + New Course
                    </button>
                </div>
            </div>

            {loading ? <div className={styles.loading}>Loading courses...</div> : (
                <div className={styles.tableWrapper}>
                    <div className={styles.tableHead}>
                        <span>Title</span>
                        <span>Category</span>
                        <span>Lessons</span>
                        <span>Enrollments</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>
                    {courses.map(c => (
                        <div key={c.id} className={styles.tableRow}>
                            <span className={styles.tdTitle}>{c.title}</span>
                            <span className={styles.tdTag}>{c.category}</span>
                            <span className={styles.tdNum}>{c._count.lessons}</span>
                            <span className={styles.tdNum}>{c._count.enrollments}</span>
                            <span>
                                <button
                                    className={`${styles.statusBtn} ${c.published ? styles.published : styles.draft}`}
                                    onClick={() => togglePublish(c.id, c.published)}
                                >
                                    {c.published ? '● Published' : '○ Draft'}
                                </button>
                            </span>
                            <span className={styles.actions}>
                                <Link href={`/instructor/courses/${c.id}`} className={styles.editBtn}>Edit</Link>
                                <button className={styles.deleteBtn} onClick={() => deleteCourse(c.id)}>Delete</button>
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>Create New Course</h2>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleCreate} className={styles.modalForm}>
                            <div className={styles.field}>
                                <label>Course Title</label>
                                <input required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Advanced TypeScript" className="input" />
                            </div>
                            <div className={styles.field}>
                                <label>Description</label>
                                <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="What is this course about?" className="input" />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className={styles.field}>
                                    <label>Category</label>
                                    <input required value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input" />
                                </div>
                                <div className={styles.field}>
                                    <label>Level</label>
                                    <select value={formData.level} onChange={e => setFormData({ ...formData, level: e.target.value })} className="input">
                                        <option>Beginner</option>
                                        <option>Intermediate</option>
                                        <option>Advanced</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.field}>
                                <label className={styles.checkboxLabel}>
                                    <input type="checkbox" checked={formData.isFree} onChange={e => setFormData({ ...formData, isFree: e.target.checked })} />
                                    This course is free
                                </label>
                            </div>
                            {!formData.isFree && (
                                <div className={styles.field}>
                                    <label>Price (UZS)</label>
                                    <input type="number" required={!formData.isFree} value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="e.g. 500000" className="input" />
                                </div>
                            )}
                            <div className={styles.field}>
                                <label>Course Thumbnail Graphic</label>
                                <input type="file" accept="image/*" onChange={e => setThumbFile(e.target.files?.[0] || null)} className="input" style={{ padding: '0.5rem' }} />
                            </div>
                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create Course'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showAiModal && (
                <div className={styles.modalOverlay} onClick={() => !generating && setShowAiModal(false)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2>✨ AI Course Generator</h2>
                            <button className={styles.closeBtn} onClick={() => !generating && setShowAiModal(false)} disabled={generating}>✕</button>
                        </div>
                        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>
                            Describe the course you want to create. Our AI will automatically write a title, description, and generate a complete lesson modules outline for you in seconds.
                        </p>
                        <form onSubmit={handleAiGenerate} className={styles.modalForm}>
                            <div className={styles.field}>
                                <label>Course Topic</label>
                                <input
                                    required
                                    value={aiTopic}
                                    onChange={e => setAiTopic(e.target.value)}
                                    placeholder="e.g. Master React and Next.js for Beginners"
                                    className="input"
                                    disabled={generating}
                                />
                            </div>
                            <div className={styles.field}>
                                <label>Specific Instructions (Optional)</label>
                                <textarea
                                    rows={3}
                                    value={aiInstructions}
                                    onChange={e => setAiInstructions(e.target.value)}
                                    placeholder="e.g. Make sure it includes a chapter on authentication and deploying to Vercel."
                                    className="input"
                                    disabled={generating}
                                />
                            </div>

                            {generating && (
                                <div className={styles.aiLoadingStatus}>
                                    <div className={styles.spinner}></div>
                                    <span>AI is writing your curriculum... This takes about 5-10 seconds.</span>
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAiModal(false)} disabled={generating}>Cancel</button>
                                <button type="submit" className={`${styles.aiBtn} ${styles.aiBtnSubmit}`} disabled={generating || !aiTopic.trim()}>
                                    {generating ? 'Generating...' : '✨ Generate Course'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
