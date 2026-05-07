'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '@/context/LanguageContext';
import styles from './AssignmentSection.module.css';

interface AssignmentSectionProps {
    lessonId: string;
    courseId: string;
}

interface Submission {
    id: string;
    status: string;
    fileUrl: string | null;
    content: string | null;
    grade: number | null;
    feedback: string | null;
    updatedAt: string;
}

export default function AssignmentSection({ lessonId, courseId }: AssignmentSectionProps) {
    const { t } = useLanguage();
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchSubmission();
    }, [lessonId]);

    const getStatusText = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return t.shared.statusPending;
            case 'APPROVED': return t.shared.statusApproved;
            case 'REJECTED': return t.shared.statusRejected;
            default: return status;
        }
    };

    const fetchSubmission = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/submissions?lessonId=${lessonId}`);
            if (res.ok) {
                const data = await res.json();
                setSubmission(data);
                if (data) {
                    setContent(data.content || '');
                }
            }
        } catch (error) {
            console.error('Fetch submission error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file && !content.trim()) {
            toast.error(t.auth.roleWarning || 'Please provide an answer'); // Fallback or add new key
            return;
        }

        setUploading(true);
        try {
            let fileUrl = submission?.fileUrl || null;

            if (file) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.error) throw new Error(uploadData.error);
                fileUrl = uploadData.url;
            }

            const res = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId,
                    fileUrl,
                    content
                })
            });

            if (res.ok) {
                const data = await res.json();
                setSubmission(data);
                toast.success(t.settings.successProfile || 'Submitted successfully!');
                setShowForm(false);
            } else {
                toast.error(t.ai.quiz.error || 'Failed to submit');
            }
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className={styles.loading}>{t.shared.loading}</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>📝 {t.courseDetail.lessonAssignment}</h3>
                {!submission && !showForm && (
                    <button className={styles.submitBtn} onClick={() => setShowForm(true)}>
                        {t.shared.loading === 'Yuklanmoqda...' ? 'Vazifani topshirish' : 
                         t.shared.loading === 'Загрузка...' ? 'Сдать задание' : 'Submit Homework'}
                    </button>
                )}
            </div>

            {submission && (
                <div className={`${styles.statusCard} ${styles[submission.status.toLowerCase()]}`}>
                    <div className={styles.statusInfo}>
                        <span className={styles.statusBadge}>{getStatusText(submission.status)}</span>
                        {submission.grade !== null && (
                            <span className={styles.grade}>
                                {t.shared.loading === 'Yuklanmoqda...' ? 'Baho' : 
                                 t.shared.loading === 'Загрузка...' ? 'Оценка' : 'Grade'}: <strong>{submission.grade}</strong>
                            </span>
                        )}
                    </div>
                    
                    {submission.feedback && (
                        <div className={styles.feedback}>
                            <strong>{t.courseDetail.instructor}:</strong>
                            <p>{submission.feedback}</p>
                        </div>
                    )}

                    <div className={styles.submissionDetails}>
                        <p>{t.certificate.dateIssued}: {new Date(submission.updatedAt).toLocaleDateString()}</p>
                        {submission.fileUrl && (
                            <a href={submission.fileUrl} target="_blank" rel="noreferrer" className={styles.fileLink}>
                                📁 {t.shared.loading === 'Yuklanmoqda...' ? 'Faylni ko\'rish' : 
                                     t.shared.loading === 'Загрузка...' ? 'Посмотреть файл' : 'View Submitted File'}
                            </a>
                        )}
                    </div>

                    {submission.status !== 'APPROVED' && !showForm && (
                        <button className={styles.editBtn} onClick={() => setShowForm(true)}>
                            {t.instructor.edit}
                        </button>
                    )}
                </div>
            )}

            {showForm && (
                <form className={styles.form} onSubmit={handleUpload}>
                    <div className={styles.field}>
                        <label>{t.instructor.descLabel}</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={t.reviews.placeholder}
                            rows={4}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>{t.instructor.thumbnailLabel}</label>
                        <input 
                            type="file" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className={styles.fileInput}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                            {t.instructor.cancel}
                        </button>
                        <button type="submit" className={styles.saveBtn} disabled={uploading}>
                            {uploading ? t.instructor.saving : t.reviews.submit}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
