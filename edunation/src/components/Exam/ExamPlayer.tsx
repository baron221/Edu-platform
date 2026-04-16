'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Timer from './Timer';
import MonacoEditor from '../MonacoEditor';
import styles from './ExamPlayer.module.css';

interface ExamPlayerProps {
  examId: string;
}

export default function ExamPlayer({ examId }: ExamPlayerProps) {
  const router = useRouter();
  const [exam, setExam] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [judgeResult, setJudgeResult] = useState<any>(null);
  const [judging, setJudging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [starting, setStarting] = useState(false);
  const [attempt, setAttempt] = useState<any>(null);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState(false);

  // 1. Load basic exam info
  useEffect(() => {
    const loadExam = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        if (!res.ok) throw new Error('Failed to load exam.');
        const data = await res.json();
        setExam(data);
        if (data.attempts?.[0]) {
          setAttempt(data.attempts[0]);
        }
      } catch (err: any) {
        setError(err.message);
      }
    };
    loadExam();
  }, [examId]);

  // 2. Start Exam Logic
  const startExam = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start exam.');
      setAttempt(data);
      // Re-fetch exam to get questions (if they were hidden before start)
      const examRes = await fetch(`/api/exams/${examId}`);
      setExam(await examRes.json());
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStarting(false);
    }
  };

  useEffect(() => {
    if (!attempt || attempt.status !== 'IN_PROGRESS') return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        setWarning(true);
        // Inform server
        await fetch(`/api/exams/${examId}/warning`, { method: 'POST' }).catch(() => {});
      }
    };

    const handleBlur = async () => {
      setWarning(true);
      await fetch(`/api/exams/${examId}/warning`, { method: 'POST' }).catch(() => {});
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attempt, examId]);

  const handleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const runCode = async (code: string) => {
    if (!code.trim()) return;
    setJudging(true);
    setJudgeResult(null);
    try {
      const res = await fetch('/api/exams/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_code: code })
      });
      const data = await res.json();
      setJudgeResult(data);
    } catch (err) {
      setJudgeResult({ error: 'Connection to judge failed.' });
    } finally {
      setJudging(false);
    }
  };

  const submitExam = async (automatic = false) => {
    if (!automatic && !confirm('Are you sure you want to submit?')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/exams/${examId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (res.ok) {
        window.location.href = `/exams/${examId}/result`;
      } else {
        const data = await res.json();
        alert(data.error || 'Submission failed.');
      }
    } catch (err) {
      alert('Network error during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <div className={styles.loading}>{error}</div>;
  if (!exam) return <div className={styles.loading}>Loading...</div>;

  // Render Start Screen
  if (!attempt || attempt.status === 'READY') {
    return (
      <div className={styles.viewer} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className={styles.questionCard} style={{ textAlign: 'center' }}>
          <h1 className={styles.title} style={{ fontSize: '32px', marginBottom: '16px' }}>{exam.title}</h1>
          <p style={{ color: '#64748b', marginBottom: '32px' }}>{exam.description || 'No description provided.'}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Duration</div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{exam.timeLimit} min</div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>Questions</div>
              <div style={{ fontSize: '24px', fontWeight: 800 }}>{exam.questions.length}</div>
            </div>
          </div>
          <button className={styles.submitBtn} onClick={startExam} disabled={starting}>
            {starting ? 'Initializing...' : '🚀 Start Exam Now'}
          </button>
          <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '16px', fontWeight: 500 }}>
            ⚠️ Once started, the timer cannot be paused.
          </p>
        </div>
      </div>
    );
  }

  // Render Result Screen if already submitted
  if (attempt.status === 'SUBMITTED' || attempt.status === 'GRADED') {
      return (
        <div className={styles.viewer} style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className={styles.questionCard} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h1 className={styles.title}>Exam Submitted</h1>
            <p style={{ color: '#64748b', margin: '16px 0 32px' }}>Your attempt has been recorded. Results will be available soon.</p>
            <button className={styles.navBtn} style={{ width: 'auto', padding: '0 24px' }} onClick={() => router.push('/courses')}>Back to Courses</button>
          </div>
        </div>
      );
  }

  const currentQ = exam.questions[currentIndex];
  const totalQuestions = exam.questions.length;
  
  // Calculate remaining time
  const startTime = new Date(attempt.startTime).getTime();
  const endTime = startTime + (exam.timeLimit * 60 * 1000);
  const secondsLeft = Math.max(0, Math.floor((endTime - Date.now()) / 1000));

  return (
    <div className={styles.viewer}>
      {submitting && <div className={styles.loadingOverlay}><div className="dots"><span/><span/><span/></div></div>}
      
      {warning && (
        <div className={styles.loadingOverlay} style={{ backgroundColor: 'rgba(185, 28, 28, 0.9)', color: '#fff', zIndex: 1001 }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚨</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '16px' }}>CHEATING DETECTED</h2>
            <p style={{ fontSize: '16px', lineHeight: 1.6, marginBottom: '24px' }}>
              You switched tabs or minimized the browser. This action has been recorded and your instructor has been notified.
            </p>
            <button 
                className={styles.submitBtn} 
                style={{ background: '#fff', color: '#b91c1c' }}
                onClick={() => setWarning(false)}
            >
              I understand, continue exam
            </button>
          </div>
        </div>
      )}

      <header className={styles.header}>
        <div className={styles.title}>{exam.title}</div>
        <Timer initialSeconds={secondsLeft} onTimeUp={() => submitExam(true)} />
        <button className={styles.submitBtn} onClick={() => submitExam()}>Finish & Submit</button>
      </header>

      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Navigation</div>
          <div className={styles.questionNav}>
            {exam.questions.map((q: any, idx: number) => (
              <button 
                key={q.id} 
                className={`${styles.navBtn} ${currentIndex === idx ? styles.active : ''} ${answers[q.id] ? styles.answered : ''}`}
                onClick={() => { setCurrentIndex(idx); setJudgeResult(null); }}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 'auto', padding: '16px', background: '#f8fafc', borderRadius: '12px', fontSize: '12px', color: '#64748b' }}>
            <strong>Support:</strong> If you face technical issues, take a screenshot and contact the administrator.
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.questionCard}>
            <div className={styles.questionText}>
                <span style={{ color: '#4f46e5', marginRight: '12px' }}>Q{currentIndex + 1}.</span>
                {currentQ.text}
            </div>

            {currentQ.type === 'MCQ' ? (
              <div className={styles.optionsList}>
                {currentQ.options.map((opt: any, idx: number) => (
                  <button 
                    key={opt.id} 
                    className={`${styles.optionBtn} ${answers[currentQ.id] === opt.id ? styles.selected : ''}`}
                    onClick={() => handleAnswer(currentQ.id, opt.id)}
                  >
                    <div className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</div>
                    <div className={styles.optionText}>{opt.text}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className={styles.codingArea}>
                <div className={styles.editorHeader}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Language: C++ (GCC 9.2.0)</div>
                  <button className={styles.runBtn} onClick={() => runCode(answers[currentQ.id] || currentQ.starterCode || '')} disabled={judging}>
                    {judging ? 'Running...' : '▶ Run Code & Check'}
                  </button>
                </div>
                
                <MonacoEditor 
                    value={answers[currentQ.id] || currentQ.starterCode || ''} 
                    onChange={(val) => handleAnswer(currentQ.id, val || '')}
                    height="400px"
                />

                {judgeResult && (
                  <div className={`${styles.judgeResult} ${judgeResult.status?.id === 3 ? styles.resultSuccess : styles.resultError}`}>
                    <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                        {judgeResult.status?.description || 'Verdict'}
                    </div>
                    {judgeResult.stdout && <pre>Output: {judgeResult.stdout}</pre>}
                    {judgeResult.compile_output && <pre>Compile: {judgeResult.compile_output}</pre>}
                    {judgeResult.stderr && <pre>Error: {judgeResult.stderr}</pre>}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>

      <footer className={styles.footer}>
        <button 
          className={styles.navBtn} 
          style={{ width: 'auto', padding: '0 20px' }}
          disabled={currentIndex === 0}
          onClick={() => { setCurrentIndex(i => i - 1); setJudgeResult(null); }}
        >
          ← Previous
        </button>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
            Question {currentIndex + 1} of {totalQuestions}
        </div>
        <button 
          className={styles.navBtn} 
          style={{ width: 'auto', padding: '0 20px' }}
          disabled={currentIndex === totalQuestions - 1}
          onClick={() => { setCurrentIndex(i => i + 1); setJudgeResult(null); }}
        >
          Next →
        </button>
      </footer>
    </div>
  );
}
