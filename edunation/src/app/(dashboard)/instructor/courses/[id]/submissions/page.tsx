'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import styles from './page.module.css';

interface Submission {
    id: string;
    lessonId: string;
    userId: string;
    fileUrl: string | null;
    content: string | null;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    grade: string | null;
    feedback: string | null;
    updatedAt: string;
    user: {
        name: string | null;
        email: string | null;
        university: string | null;
    };
    lesson?: {
        title: string;
    };
}

export default function InstructorSubmissionsPage() {
    const params = useParams();
    const courseId = params.id as string;
    const router = useRouter();
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() { router.push('/login'); }
    });

    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [grading, setGrading] = useState(false);
    const [gradeData, setGradeData] = useState({ status: 'APPROVED' as any, grade: '', feedback: '' });

    useEffect(() => {
        const fetchSubmissions = async () => {
            try {
                const res = await fetch(`/api/submissions?all=true&courseId=${courseId}`); 
                const data = await res.json();
                if (res.ok) {
                    setSubmissions(data);
                }
            } catch (err) {
                console.error(err);
                toast.error('Failed to load submissions');
            } finally {
                setLoading(false);
            }
        };

        if (session) fetchSubmissions();
    }, [session, courseId]);

    const handleGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubmission) return;
        setGrading(true);

        try {
            const res = await fetch('/api/submissions', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: selectedSubmission.id,
                    ...gradeData
                }),
            });

            if (res.ok) {
                toast.success('Submission graded!');
                // Update local state
                setSubmissions(prev => prev.map(s => 
                    s.id === selectedSubmission.id ? { ...s, ...gradeData } : s
                ));
                setSelectedSubmission(null);
            } else {
                toast.error('Failed to save grade');
            }
        } catch (err) {
            toast.error('An error occurred');
        } finally {
            setGrading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading submissions...</div>;

    const pendingCount = submissions.filter(s => s.status === 'PENDING').length;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <Link href={`/instructor/courses/${courseId}`} className={styles.backBtn}>
                        ← Back to Course
                    </Link>
                    <h1 className={styles.title}>Assignment Submissions</h1>
                </div>
            </div>

            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Total Submissions</div>
                    <div className={styles.statValue}>{submissions.length}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Pending Review</div>
                    <div className={styles.statValue} style={{ color: '#f59e0b' }}>{pendingCount}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>Completed</div>
                    <div className={styles.statValue} style={{ color: '#10b981' }}>{submissions.length - pendingCount}</div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Student</th>
                            <th className={styles.th}>Lesson</th>
                            <th className={styles.th}>Submitted At</th>
                            <th className={styles.th}>Status</th>
                            <th className={styles.th}>Grade</th>
                            <th className={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {submissions.map((s) => (
                            <tr key={s.id} className={styles.tr}>
                                <td className={styles.td}>
                                    <div className={styles.studentInfo}>
                                        <span className={styles.studentName}>{s.user.name || 'Anonymous'}</span>
                                        <span className={styles.studentEmail}>{s.user.email}</span>
                                    </div>
                                </td>
                                <td className={styles.td}>{s.lesson?.title || 'Unknown Lesson'}</td>
                                <td className={styles.td}>{new Date(s.updatedAt).toLocaleDateString()}</td>
                                <td className={styles.td}>
                                    <span className={`${styles.badge} ${styles[s.status.toLowerCase()]}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td className={styles.td}>{s.grade || '-'}</td>
                                <td className={styles.td}>
                                    <button 
                                        className={styles.actionBtn}
                                        onClick={() => {
                                            setSelectedSubmission(s);
                                            setGradeData({
                                                status: s.status,
                                                grade: s.grade || '',
                                                feedback: s.feedback || ''
                                            });
                                        }}
                                    >
                                        Review
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {submissions.length === 0 && (
                            <tr>
                                <td colSpan={6} className={styles.empty}>
                                    No submissions found for this course.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Review Modal */}
            {selectedSubmission && (
                <div className={styles.modalOverlay} onClick={() => setSelectedSubmission(null)}>
                    <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                        <h2 className={styles.modalTitle}>Review Submission</h2>
                        
                        <div className={styles.field}>
                            <label className={styles.label}>Student Note / Content</label>
                            <div className={styles.textarea} style={{ background: '#0f172a', minHeight: '100px' }}>
                                {selectedSubmission.content || 'No text provided.'}
                            </div>
                        </div>

                        {selectedSubmission.fileUrl && (
                            <div className={styles.field}>
                                <label className={styles.label}>Attached File</label>
                                <a href={selectedSubmission.fileUrl} target="_blank" rel="noreferrer" className={styles.fileLink}>
                                    📄 Download Submission File
                                </a>
                            </div>
                        )}

                        <form onSubmit={handleGrade}>
                            <div className={styles.field}>
                                <label className={styles.label}>Status</label>
                                <select 
                                    className={styles.select} 
                                    style={{ width: '100%', padding: '12px', background: '#1e293b', color: '#fff', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                    value={gradeData.status}
                                    onChange={e => setGradeData({ ...gradeData, status: e.target.value })}
                                >
                                    <option value="PENDING">Pending</option>
                                    <option value="APPROVED">Approve</option>
                                    <option value="REJECTED">Reject</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Grade (e.g. 5, 85/100, A+)</label>
                                <input 
                                    className={styles.input}
                                    value={gradeData.grade}
                                    onChange={e => setGradeData({ ...gradeData, grade: e.target.value })}
                                    placeholder="Enter grade..."
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Feedback to Student</label>
                                <textarea 
                                    className={styles.textarea}
                                    rows={4}
                                    value={gradeData.feedback}
                                    onChange={e => setGradeData({ ...gradeData, feedback: e.target.value })}
                                    placeholder="Great job! One small thing..."
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.actionBtn} onClick={() => setSelectedSubmission(null)}>
                                    Cancel
                                </button>
                                <button type="submit" className={styles.approveBtn} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer' }} disabled={grading}>
                                    {grading ? 'Saving...' : 'Save Review'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
