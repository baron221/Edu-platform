'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../page.module.css'; // Reusing dashboard styles

export default function ExamQuestionManager() {
  const params = useParams();
  const courseId = params.id as string;
  const examId = params.examId as string;
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [newQ, setNewQ] = useState({
    type: 'MCQ',
    text: '',
    points: 1,
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    starterCode: '#include <iostream>\n\nint main() {\n    // Write your code here\n    return 0;\n}',
    testCases: '[{"input": "", "output": ""}]'
  });

  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/instructor/courses/${courseId}/exams/${examId}/questions`);
      if (res.ok) setQuestions(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [examId]);

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload = { ...newQ };
      if (newQ.type === 'CODING') {
         try {
             payload.testCases = JSON.parse(newQ.testCases);
         } catch(e) { 
             alert('Invalid JSON in test cases'); 
             setSaving(false);
             return; 
         }
      }
      
      const res = await fetch(`/api/instructor/courses/${courseId}/exams/${examId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewQ({
          type: 'MCQ',
          text: '',
          points: 1,
          options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }],
          starterCode: '#include <iostream>\n\nint main() {\n    return 0;\n}',
          testCases: '[{"input": "", "output": ""}]'
        });
        fetchQuestions();
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.page}>Loading questions...</div>;

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <Link href={`/instructor/courses/${courseId}/exams`} className="text-secondary mb-2 block" style={{ fontSize: '13px', textDecoration: 'none' }}>← Back to Exams</Link>
          <h1 className={styles.title}>Manage Questions</h1>
        </div>
        <button className={styles.createBtn} onClick={() => setShowAddModal(true)}>
          <span>+</span> Add Question
        </button>
      </div>

      <div className={styles.grid} style={{ display: 'flex', flexDirection: 'column' }}>
        {questions.map((q, idx) => (
          <div key={q.id} className={styles.card} style={{ maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className={`${styles.typeBadge} ${q.type === 'CODING' ? styles.finalBadge : ''}`}>
                  {q.type} • {q.points} Point{q.points !== 1 ? 's' : ''}
                </div>
                <h3 className={styles.examTitle}>{idx + 1}. {q.text}</h3>
                {q.type === 'MCQ' ? (
                  <div style={{ marginTop: '12px' }}>
                    {q.options.map((opt: any) => (
                      <div key={opt.id} style={{ fontSize: '14px', color: opt.isCorrect ? '#10b981' : '#64748b', marginBottom: '4px', fontWeight: opt.isCorrect ? 700 : 400 }}>
                        {opt.isCorrect ? '✅' : '○'} {opt.text}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
                    Starter Code: {q.starterCode?.substring(0, 50)}...
                  </div>
                )}
              </div>
              <button 
                className={styles.actionBtn} 
                onClick={async () => {
                  if (!confirm('Delete this question?')) return;
                  await fetch(`/api/instructor/courses/${courseId}/exams/${examId}/questions/${q.id}`, { method: 'DELETE' });
                  fetchQuestions();
                }}
              >
                🗑 Delete
              </button>
            </div>
          </div>
        ))}
        {questions.length === 0 && <div className={styles.empty}>No questions added yet.</div>}
      </div>

      {showAddModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div className={styles.modal} style={{ maxWidth: '700px' }} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add New Question</h2>
            </div>
            
            <form onSubmit={handleAddQuestion}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Question Type</label>
                  <select 
                    className={styles.select}
                    value={newQ.type}
                    onChange={e => setNewQ({...newQ, type: e.target.value})}
                  >
                    <option value="MCQ">Multiple Choice</option>
                    <option value="CODING">C++ Coding Problem</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Points</label>
                  <input 
                    type="number" 
                    className={styles.input} 
                    value={newQ.points}
                    onChange={e => setNewQ({...newQ, points: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Question Prompt</label>
                <textarea 
                  className={styles.textarea} 
                  rows={3} 
                  required
                  value={newQ.text}
                  onChange={e => setNewQ({...newQ, text: e.target.value})}
                />
              </div>

              {newQ.type === 'MCQ' ? (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Options (Select a Correct One)</label>
                  {newQ.options.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                      <input 
                        type="radio" 
                        name="correct" 
                        checked={opt.isCorrect} 
                        onChange={() => setNewQ({
                          ...newQ, 
                          options: newQ.options.map((o, i) => ({...o, isCorrect: i === idx}))
                        })}
                      />
                      <input 
                        className={styles.input} 
                        placeholder={`Option ${idx + 1}`}
                        value={opt.text}
                        onChange={e => {
                          const newer = [...newQ.options];
                          newer[idx].text = e.target.value;
                          setNewQ({...newQ, options: newer});
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.codingArea}>
                   <div className={styles.formGroup}>
                    <label className={styles.label}>Starter Code (C++)</label>
                    <textarea 
                      className={styles.textarea} 
                      style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      rows={6} 
                      value={newQ.starterCode}
                      onChange={e => setNewQ({...newQ, starterCode: e.target.value})}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Test Cases (JSON Format)</label>
                    <textarea 
                      className={styles.textarea} 
                      style={{ fontFamily: 'monospace', fontSize: '13px' }}
                      rows={4} 
                      placeholder='[{"input": "1 2", "output": "3"}]'
                      value={newQ.testCases}
                      onChange={e => setNewQ({...newQ, testCases: e.target.value})}
                    />
                  </div>
                </div>
              )}

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px' }}>
                <button type="button" className={styles.actionBtn} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className={styles.createBtn} disabled={saving}>
                  {saving ? 'Adding...' : 'Add to Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
