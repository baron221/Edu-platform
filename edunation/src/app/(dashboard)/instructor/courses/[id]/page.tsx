'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import styles from './page.module.css';

interface Lesson {
    id: string;
    title: string;
    order: number;
}

interface Student {
    id: string;
    name: string;
    email: string;
    university: string;
    completedLessons: number;
    totalWatchedSec: number;
    lastActive: string | null;
    progress: any[];
}

export default function CourseStudentsDashboard() {
    const params = useParams();
    const id = params.id as string;

    const [students, setStudents] = useState<Student[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [unlocking, setUnlocking] = useState<string | null>(null); // student id being unlocked
    const [selectedLessons, setSelectedLessons] = useState<Record<string, string>>({}); // studentId -> lessonId

    const fetchStudents = async () => {
        try {
            const res = await fetch(`/api/instructor/courses/${id}/students`);
            if (res.ok) {
                const data = await res.json();
                setStudents(data.students);
                setLessons(data.lessons);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [id]);

    const handleUnlock = async (userId: string) => {
        const lessonId = selectedLessons[userId];
        if (!lessonId) return;

        setUnlocking(userId);
        try {
            const res = await fetch(`/api/instructor/courses/${id}/unlock-lesson`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, lessonId })
            });

            if (res.ok) {
                toast.success('Lesson unlocked successfully!');
                // Reset select and refresh data to show updated progress/state if needed
                setSelectedLessons(prev => ({ ...prev, [userId]: '' }));
                fetchStudents();
            } else {
                toast.error('Failed to unlock lesson');
            }
        } catch (err) {
            toast.error('An error occurred');
        } finally {
            setUnlocking(null);
        }
    };

    const formatTime = (seconds: number) => {
        if (!seconds) return '0 min';
        if (seconds > 0 && seconds < 60) return '< 1 min';
        const mins = Math.floor(seconds / 60);
        const hrs = Math.floor(mins / 60);
        if (hrs > 0) {
            return `${hrs}h ${mins % 60}m`;
        }
        return `${mins} min`;
    };

    if (loading) return <div className={styles.loading}>Loading student progress...</div>;

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <div className={styles.breadcrumb}>
                    <Link href="/instructor/courses" className={styles.backBtn}>
                        ← Back to Courses
                    </Link>
                    <h1 className={styles.title}>Course Dashboard</h1>
                </div>
            </div>

            <div className={styles.navTabs}>
                <Link href={`/instructor/courses/${id}`} className={`${styles.tab} ${styles.active}`}>
                    Students & Progress
                </Link>
                <Link href={`/instructor/courses/${id}/edit`} className={styles.tab}>
                    Edit Course Content
                </Link>
                <Link href={`/instructor/courses/${id}/submissions`} className={styles.tab}>
                    Manage Submissions
                </Link>
            </div>

            <div className={styles.card}>
                <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Progress</th>
                                <th>Watch Time</th>
                                <th>Last Active</th>
                                <th>Unlock Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        No students have enrolled or started this course yet.
                                    </td>
                                </tr>
                            ) : students.map(student => (
                                <tr key={student.id}>
                                    <td>
                                        <div className={styles.studentInfo}>
                                            <span className={styles.studentName}>{student.name || 'Unknown'}</span>
                                            <span className={styles.studentUni}>{student.university || student.email || 'No Email/Uni'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>
                                            {student.completedLessons} / {lessons.length}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>lessons completed</div>
                                    </td>
                                    <td>
                                        {formatTime(student.totalWatchedSec)}
                                    </td>
                                    <td>
                                        {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
                                    </td>
                                    <td>
                                        <div className={styles.unlockAction}>
                                            <select 
                                                className={styles.select}
                                                value={selectedLessons[student.id] || ''}
                                                onChange={e => setSelectedLessons(prev => ({ ...prev, [student.id]: e.target.value }))}
                                            >
                                                <option value="">Select Lesson...</option>
                                                {lessons.map(l => (
                                                    <option key={l.id} value={l.id}>
                                                        {l.order}. {l.title}
                                                    </option>
                                                ))}
                                            </select>
                                            <button 
                                                className={styles.unlockBtn}
                                                disabled={!selectedLessons[student.id] || unlocking === student.id}
                                                onClick={() => handleUnlock(student.id)}
                                            >
                                                {unlocking === student.id ? '...' : 'Unlock'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
