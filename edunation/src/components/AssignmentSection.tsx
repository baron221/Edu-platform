'use client';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
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
    const [submission, setSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [content, setContent] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchSubmission();
    }, [lessonId]);

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
            toast.error('Please provide a file or some text answer');
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
                toast.success('Assignment submitted successfully!');
                setShowForm(false);
            } else {
                toast.error('Failed to submit assignment');
            }
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong');
        } finally {
            setUploading(false);
        }
    };

    if (loading) return <div className={styles.loading}>Loading assignments...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3>📝 Lesson Assignment</h3>
                {!submission && !showForm && (
                    <button className={styles.submitBtn} onClick={() => setShowForm(true)}>
                        Submit Homework
                    </button>
                )}
            </div>

            {submission && (
                <div className={`${styles.statusCard} ${styles[submission.status.toLowerCase()]}`}>
                    <div className={styles.statusInfo}>
                        <span className={styles.statusBadge}>{submission.status}</span>
                        {submission.grade !== null && (
                            <span className={styles.grade}>Grade: <strong>{submission.grade}/100</strong></span>
                        )}
                    </div>
                    
                    {submission.feedback && (
                        <div className={styles.feedback}>
                            <strong>Instructor Feedback:</strong>
                            <p>{submission.feedback}</p>
                        </div>
                    )}

                    <div className={styles.submissionDetails}>
                        <p>Last update: {new Date(submission.updatedAt).toLocaleString()}</p>
                        {submission.fileUrl && (
                            <a href={submission.fileUrl} target="_blank" rel="noreferrer" className={styles.fileLink}>
                                📁 View Submitted File
                            </a>
                        )}
                    </div>

                    {submission.status !== 'APPROVED' && !showForm && (
                        <button className={styles.editBtn} onClick={() => setShowForm(true)}>
                            Edit Submission
                        </button>
                    )}
                </div>
            )}

            {showForm && (
                <form className={styles.form} onSubmit={handleUpload}>
                    <div className={styles.field}>
                        <label>Your Answer / Comments</label>
                        <textarea 
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Write your answer or notes here..."
                            rows={4}
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Upload File (Image, PDF, etc.)</label>
                        <input 
                            type="file" 
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            className={styles.fileInput}
                        />
                    </div>

                    <div className={styles.formActions}>
                        <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.saveBtn} disabled={uploading}>
                            {uploading ? 'Uploading...' : 'Submit Assignment'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
