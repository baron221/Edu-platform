'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';

export default function InstructorExamsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    timeLimit: 60,
    passingScore: 60,
    type: 'MIDTERM'
  });

  const fetchExams = async () => {
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/exams`);
      if (res.ok) {
        setExams(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, [courseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/exams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ title: '', description: '', timeLimit: 60, passingScore: 60, type: 'MIDTERM' });
        fetchExams();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.page}>Loading exams...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href={`/instructor/courses/${courseId}`} className="text-secondary mb-2 block" style={{ fontSize: '13px', textDecoration: 'none' }}>← Back to Course</Link>
          <h1 className={styles.title}>Midterms & Finals</h1>
        </div>
        <button className={styles.createBtn} onClick={() => setShowModal(true)}>
          <span>+</span> Create New Exam
        </button>
      </div>

      {exams.length === 0 ? (
        <div className={styles.empty}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📝</div>
          <h3>No exams created yet</h3>
          <p>Start by creating your first Midterm or Final exam for this course.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {exams.map(exam => (
            <div key={exam.id} className={styles.card}>
              <div className={`${styles.typeBadge} ${exam.type === 'FINAL' ? styles.finalBadge : ''}`}>
                {exam.type}
              </div>
              <h3 className={styles.examTitle}>{exam.title}</h3>
              <p style={{ fontSize: '14px', color: '#64748b', lineClamp: 2, overflow: 'hidden', display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, height: '40px' }}>
                {exam.description || 'No description provided.'}
              </p>
              
              <div className={styles.stats}>
                <div className={styles.stat}>⏱ {exam.timeLimit}m</div>
                <div className={styles.stat}>❓ {exam._count.questions} questions</div>
                <div className={styles.stat}>👥 {exam._count.attempts} attempts</div>
              </div>

              <div className={styles.actions}>
                <button className={styles.actionBtn}>View Submissions</button>
                <button 
                  className={styles.actionBtn} 
                  style={{ background: '#4f46e5', color: '#fff', border: 'none' }}
                  onClick={() => router.push(`/instructor/courses/${courseId}/exams/${exam.id}`)}
                >
                  Manage Questions →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Exam</h2>
              <p style={{ color: '#64748b', fontSize: '14px' }}>Configure the basic settings for your midterm or final.</p>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Exam Title</label>
                <input 
                  className={styles.input} 
                  placeholder="e.g. CS101 Midterm - Data Structures" 
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Description</label>
                <textarea 
                  className={styles.textarea} 
                  rows={3} 
                  placeholder="Covering loops, arrays, and basic functions..."
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Time Limit (Minutes)</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={formData.timeLimit}
                    onChange={e => setFormData({...formData, timeLimit: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Exam Type</label>
                  <select 
                    className={styles.select}
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="MIDTERM">Midterm</option>
                    <option value="FINAL">Final</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
                <button 
                  type="button" 
                  className={styles.actionBtn} 
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={styles.createBtn} 
                  style={{ flex: 2, justifyContent: 'center' }}
                  disabled={saving}
                >
                  {saving ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
