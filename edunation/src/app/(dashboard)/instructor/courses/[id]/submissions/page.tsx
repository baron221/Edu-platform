'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
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
    const { t } = useLanguage();
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
                toast.error(t.ai.quiz.error || 'Failed to load');
            } finally {
                setLoading(false);
            }
        };

        if (session) fetchSubmissions();
    }, [session, courseId, t]);

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
                toast.success(t.settings.successProfile || 'Saved!');
                setSubmissions(prev => prev.map(s => 
                    s.id === selectedSubmission.id ? { ...s, ...gradeData } : s
                ));
                setSelectedSubmission(null);
            } else {
                toast.error(t.ai.quiz.error || 'Error');
            }
        } catch (err) {
            toast.error('An error occurred');
        } finally {
            setGrading(false);
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return t.shared.statusPending;
            case 'APPROVED': return t.shared.statusApproved;
            case 'REJECTED': return t.shared.statusRejected;
            default: return status;
        }
    };

    if (loading) return <div className={styles.loading}>{t.shared.loading}</div>;

    const pendingCount = submissions.filter(s => s.status === 'PENDING').length;

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <div>
                    <Link href={`/instructor/courses/${courseId}`} className={styles.backBtn}>
                        ← {t.instructor.backToCourses}
                    </Link>
                    <h1 className={styles.title}>{t.courseDetail.lessonAssignment}</h1>
                </div>
            </div>

            <div className={styles.stats}>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{t.instructor.enrollments}</div>
                    <div className={styles.statValue}>{submissions.length}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{t.shared.statusPending}</div>
                    <div className={styles.statValue} style={{ color: '#f59e0b' }}>{pendingCount}</div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statLabel}>{t.shared.statusApproved}</div>
                    <div className={styles.statValue} style={{ color: '#10b981' }}>{submissions.length - pendingCount}</div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th className={styles.th}>{t.auth.roleStudent}</th>
                            <th className={styles.th}>{t.courseDetail.lesson}</th>
                            <th className={styles.th}>{t.certificate.dateIssued}</th>
                            <th className={styles.th}>{t.instructor.colStatus}</th>
                            <th className={styles.th}>
                                {t.shared.loading === 'Yuklanmoqda...' ? 'Baho' : 
                                 t.shared.loading === 'Загрузка...' ? 'Оценка' : 'Grade'}
                            </th>
                            <th className={styles.th}>{t.instructor.edit}</th>
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
                                <td className={styles.td}>{s.lesson?.title || 'Unknown'}</td>
                                <td className={styles.td}>{new Date(s.updatedAt).toLocaleDateString()}</td>
                                <td className={styles.td}>
                                    <span className={`${styles.badge} ${styles[s.status.toLowerCase()]}`}>
                                        {getStatusText(s.status)}
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
                                        {t.instructor.edit}
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {submissions.length === 0 && (
                            <tr>
                                <td colSpan={6} className={styles.empty}>
                                    {t.dashboard.noCourses}
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
                        <h2 className={styles.modalTitle}>{t.instructor.edit}</h2>
                        
                        <div className={styles.field}>
                            <label className={styles.label}>{t.instructor.descLabel}</label>
                            <div className={styles.textarea} style={{ background: '#f1f5f9', color: '#1e293b', minHeight: '100px', border: '1px solid #e2e8f0' }}>
                                {selectedSubmission.content || 'No text provided.'}
                            </div>
                        </div>

                        {selectedSubmission.fileUrl && (
                            <div className={styles.field}>
                                <label className={styles.label}>{t.instructor.thumbnailLabel}</label>
                                <a href={selectedSubmission.fileUrl} target="_blank" rel="noreferrer" className={styles.fileLink}>
                                    📁 {t.shared.loading === 'Yuklanmoqda...' ? 'Faylni ko\'rish' : 
                                         t.shared.loading === 'Загрузка...' ? 'Посмотреть файл' : 'View File'}
                                </a>
                            </div>
                        )}

                        <form onSubmit={handleGrade}>
                            <div className={styles.field}>
                                <label className={styles.label}>{t.instructor.colStatus}</label>
                                <select 
                                    className={styles.select} 
                                    style={{ width: '100%', padding: '12px', background: '#fff', color: '#1e293b', borderRadius: '12px', border: '1px solid #cbd5e1' }}
                                    value={gradeData.status}
                                    onChange={e => setGradeData({ ...gradeData, status: e.target.value as any })}
                                >
                                    <option value="PENDING">{t.shared.statusPending}</option>
                                    <option value="APPROVED">{t.shared.statusApproved}</option>
                                    <option value="REJECTED">{t.shared.statusRejected}</option>
                                </select>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>
                                    {t.shared.loading === 'Yuklanmoqda...' ? 'Baho' : 
                                     t.shared.loading === 'Загрузка...' ? 'Оценка' : 'Grade'}
                                </label>
                                <input 
                                    className={styles.input}
                                    style={{ background: '#fff', color: '#1e293b', border: '1px solid #cbd5e1' }}
                                    value={gradeData.grade}
                                    onChange={e => setGradeData({ ...gradeData, grade: e.target.value })}
                                    placeholder="5"
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Feedback</label>
                                <textarea 
                                    className={styles.textarea}
                                    style={{ background: '#fff', color: '#1e293b', border: '1px solid #cbd5e1' }}
                                    rows={4}
                                    value={gradeData.feedback}
                                    onChange={e => setGradeData({ ...gradeData, feedback: e.target.value })}
                                    placeholder={t.reviews.placeholder}
                                />
                            </div>

                            <div className={styles.modalActions}>
                                <button type="button" className={styles.actionBtn} style={{ background: '#94a3b8' }} onClick={() => setSelectedSubmission(null)}>
                                    {t.instructor.cancel}
                                </button>
                                <button type="submit" className={styles.approveBtn} style={{ padding: '10px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: '#10b981', color: '#fff' }} disabled={grading}>
                                    {grading ? t.instructor.saving : t.instructor.saveChanges}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
