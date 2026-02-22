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
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const router = useRouter();

    const load = () =>
        fetch('/api/admin/courses').then(r => r.json()).then(data => {
            setCourses(Array.isArray(data) ? data : []);
            setLoading(false);
        });

    useEffect(() => { load(); }, []);

    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setCreating(true);
        const res = await fetch('/api/admin/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: newTitle, instructor: 'Admin', category: 'Web Development', level: 'Beginner', isFree: true, price: 0 }),
        });
        const course = await res.json();
        setCreating(false);
        if (!res.ok || !course.id) {
            alert(course.error ?? 'Failed to create course. Please try again.');
            return;
        }
        setNewTitle('');
        router.push(`/admin/courses/${course.id}`);
    };

    const togglePublish = async (id: string, current: boolean) => {
        await fetch(`/api/admin/courses/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ published: !current }),
        });
        load();
    };

    const deleteCourse = async (id: string) => {
        if (!confirm('Delete this course? This cannot be undone.')) return;
        await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
        load();
    };

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <h1 className={styles.title}>Courses</h1>
                    <p className={styles.subtitle}>{courses.length} total courses</p>
                </div>
                <div className={styles.createRow}>
                    <input
                        className={styles.createInput}
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        placeholder="New course title..."
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    />
                    <button className={styles.createBtn} onClick={handleCreate} disabled={creating}>
                        {creating ? '...' : 'START'}
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
                                <Link href={`/admin/courses/${c.id}`} className={styles.editBtn}>Edit</Link>
                                <button className={styles.deleteBtn} onClick={() => deleteCourse(c.id)}>Delete</button>
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
