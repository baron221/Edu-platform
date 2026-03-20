'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminGlobalCoursesPage() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const load = () => {
        fetch('/api/admin/courses/all')
            .then(r => r.json())
            .then(data => { setCourses(data); setLoading(false); });
    };

    useEffect(() => { load(); }, []);

    const togglePublish = async (id: string, current: boolean) => {
        await fetch(`/api/admin/courses/all`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, published: !current }),
        });
        load();
    };

    const deleteCourse = async (id: string) => {
        if (!confirm('WARNING: Admin override. Delete this course globally? This cannot be undone.')) return;
        await fetch(`/api/admin/courses/all?id=${id}`, { method: 'DELETE' });
        load();
    };

    return (
        <div style={{ padding: '24px', animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px', fontFamily: '"Outfit", sans-serif' }}>Global Course Directory</h1>
                    <p style={{ color: '#94a3b8', margin: 0 }}>{courses.length} courses across the platform</p>
                </div>
            </div>

            {loading ? <div style={{ color: '#94a3b8' }}>Loading all courses...</div> : (
                <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr auto',
                        gap: '16px',
                        padding: '16px 24px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        borderBottom: '1px solid var(--border)',
                        color: '#94a3b8',
                        fontWeight: 600,
                        fontSize: '13px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                    }}>
                        <span>Course Info</span>
                        <span>Instructor ID</span>
                        <span>Price</span>
                        <span>Metrics</span>
                        <span>Status</span>
                        <span>Actions</span>
                    </div>

                    {courses.map(course => (
                        <div key={course.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr auto',
                            gap: '16px',
                            padding: '16px 24px',
                            borderBottom: '1px solid var(--border)',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: '4px' }}>{course.title}</div>
                                <div style={{ color: '#64748b', fontSize: '13px' }}>{course.category} · {course.level}</div>
                            </div>

                            <div style={{ color: '#a78bfa', fontSize: '13px', fontFamily: 'monospace' }}>
                                {course.instructorId?.slice(-6) || 'Unknown'}
                            </div>

                            <div style={{ color: '#10b981', fontWeight: 600 }}>
                                {course.isFree ? 'Free' : `${course.price.toLocaleString()} UZS`}
                            </div>

                            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
                                {course._count.enrollments} users · {course._count.lessons} lessons
                            </div>

                            <div>
                                <button
                                    onClick={() => togglePublish(course.id, course.published)}
                                    style={{
                                        background: course.published ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                        color: course.published ? '#10b981' : '#94a3b8',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        cursor: 'pointer'
                                    }}
                                >
                                    {course.published ? 'Published' : 'Draft'}
                                </button>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Link
                                    href={`/courses/${course.slug}`}
                                    target="_blank"
                                    style={{
                                        background: 'rgba(255,255,255,0.05)',
                                        color: '#f1f5f9',
                                        border: 'none',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        textDecoration: 'none',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="View Course Page"
                                >
                                    👁️
                                </Link>
                                <button
                                    onClick={() => deleteCourse(course.id)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: 'none',
                                        padding: '8px',
                                        borderRadius: '8px',
                                        cursor: 'pointer'
                                    }}
                                    title="Admin Override: Delete Course Globally"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))}

                    {courses.length === 0 && (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            No courses available on the platform yet.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
