'use client';

import { useState } from 'react';
import styles from './AIQuizPlayer.module.css';

interface Question {
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
    explanation: string;
}

interface AIQuizPlayerProps {
    slug: string;
    lessonId: string;
}

export default function AIQuizPlayer({ slug, lessonId }: AIQuizPlayerProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    const startQuiz = async () => {
        setLoading(true);
        setError(null);
        setQuestions([]);
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setScore(0);
        setQuizFinished(false);

        try {
            const res = await fetch(`/api/courses/${slug}/lessons/${lessonId}/quiz`, {
                method: 'POST',
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate quiz');
            }

            setQuestions(data.quiz);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (index: number) => {
        if (showExplanation) return; // Prevent changing answer after submission
        setSelectedOption(index);
    };

    const handleSubmit = () => {
        if (selectedOption === null) return;

        // Check answer
        const currentQ = questions[currentQuestionIndex];
        if (selectedOption === currentQ.correctAnswerIndex) {
            setScore(s => s + 1);
        }

        setShowExplanation(true);
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(i => i + 1);
            setSelectedOption(null);
            setShowExplanation(false);
        } else {
            setQuizFinished(true);
        }
    };

    if (questions.length === 0) {
        return (
            <div className={styles.container}>
                <div className={styles.introState}>
                    <div className={styles.icon}>🧠</div>
                    <h3>Test Your Knowledge!</h3>
                    <p>Have our AI generate a custom 5-question quiz based on this lesson to reinforce what you learned.</p>

                    {error && <div className={styles.errorBanner}>{error}</div>}

                    <button
                        className={styles.startBtn}
                        onClick={startQuiz}
                        disabled={loading}
                    >
                        {loading ? '✨ Generating Quiz...' : '✨ Generate AI Quiz'}
                    </button>
                </div>
            </div>
        );
    }

    if (quizFinished) {
        return (
            <div className={styles.container}>
                <div className={styles.resultState}>
                    <div className={styles.scoreTrophy}>🏆</div>
                    <h3>Quiz Complete!</h3>
                    <div className={styles.scoreDisplay}>
                        You scored <strong>{score}</strong> out of {questions.length}
                    </div>
                    <p className={styles.scoreMessage}>
                        {score === questions.length ? "Perfect score! You truly mastered this lesson." :
                            score >= questions.length / 2 ? "Great job! Keep reviewing to get a perfect score next time." :
                                "Good effort! You might want to review the lesson material and try again."}
                    </p>
                    <button className={styles.startBtn} onClick={startQuiz}>
                        🔄 Generate a New Quiz
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIndex];

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.badge}>✨ AI Generated Quiz</div>
                <div className={styles.progressText}>Question {currentQuestionIndex + 1} of {questions.length}</div>
            </div>

            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            <h3 className={styles.questionText}>{currentQ.questionText}</h3>

            <div className={styles.optionsList}>
                {currentQ.options.map((opt, idx) => {
                    let btnClass = styles.optionBtn;

                    if (showExplanation) {
                        if (idx === currentQ.correctAnswerIndex) {
                            btnClass = `${styles.optionBtn} ${styles.correctOption}`;
                        } else if (idx === selectedOption) {
                            btnClass = `${styles.optionBtn} ${styles.wrongOption}`;
                        } else {
                            btnClass = `${styles.optionBtn} ${styles.disabledOption}`;
                        }
                    } else if (selectedOption === idx) {
                        btnClass = `${styles.optionBtn} ${styles.selectedOption}`;
                    }

                    return (
                        <button
                            key={idx}
                            className={btnClass}
                            onClick={() => handleOptionSelect(idx)}
                            disabled={showExplanation}
                        >
                            <div className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</div>
                            <div className={styles.optionText}>{opt}</div>
                        </button>
                    );
                })}
            </div>

            {showExplanation && (
                <div className={selectedOption === currentQ.correctAnswerIndex ? styles.explanationCorrect : styles.explanationWrong}>
                    <h4>
                        {selectedOption === currentQ.correctAnswerIndex ? '✅ Correct!' : '❌ Incorrect'}
                    </h4>
                    <p>{currentQ.explanation}</p>
                </div>
            )}

            <div className={styles.actions}>
                {!showExplanation ? (
                    <button
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={selectedOption === null}
                    >
                        Submit Answer
                    </button>
                ) : (
                    <button className={styles.nextBtn} onClick={handleNext}>
                        {currentQuestionIndex < questions.length - 1 ? 'Next Question ➡️' : 'See Results 🏆'}
                    </button>
                )}
            </div>
        </div>
    );
}
