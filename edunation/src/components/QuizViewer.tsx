'use client';

import { useState } from 'react';
import styles from './AIQuizPlayer.module.css'; // Reusing the same nice styles

interface Option {
    id: string;
    text: string;
    isCorrect: boolean;
}

interface Question {
    id: string;
    text: string;
    explanation?: string;
    options: Option[];
}

interface Quiz {
    id: string;
    title: string;
    questions: Question[];
}

interface QuizViewerProps {
    quiz: Quiz | null;
}

export default function QuizViewer({ quiz }: QuizViewerProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showExplanation, setShowExplanation] = useState(false);
    const [score, setScore] = useState(0);
    const [quizFinished, setQuizFinished] = useState(false);

    if (!quiz || quiz.questions.length === 0) {
        return null; // Return nothing if there's no quiz for this lesson
    }

    const { questions } = quiz;

    const resetQuiz = () => {
        setCurrentQuestionIndex(0);
        setSelectedOption(null);
        setShowExplanation(false);
        setScore(0);
        setQuizFinished(false);
    };

    const handleOptionSelect = (index: number) => {
        if (showExplanation) return; // Prevent changing answer after submission
        setSelectedOption(index);
    };

    const handleSubmit = () => {
        if (selectedOption === null) return;

        // Check answer
        const currentQ = questions[currentQuestionIndex];
        const selectedOpt = currentQ.options[selectedOption];
        if (selectedOpt.isCorrect) {
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
                    <button className={styles.startBtn} onClick={resetQuiz}>
                        🔄 Try Again
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestionIndex];
    // Find index of correct option
    const correctAnswerIndex = currentQ.options.findIndex(o => o.isCorrect);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <div className={styles.badge}>✨ Pre-Generated Lesson Quiz</div>
                <div className={styles.progressText}>Question {currentQuestionIndex + 1} of {questions.length}</div>
            </div>

            <div className={styles.progressBar}>
                <div
                    className={styles.progressFill}
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
            </div>

            <h3 className={styles.questionText}>{currentQ.text}</h3>

            <div className={styles.optionsList}>
                {currentQ.options.map((opt, idx) => {
                    let btnClass = styles.optionBtn;

                    if (showExplanation) {
                        if (opt.isCorrect) {
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
                            key={opt.id || idx}
                            className={btnClass}
                            onClick={() => handleOptionSelect(idx)}
                            disabled={showExplanation}
                        >
                            <div className={styles.optionLetter}>{String.fromCharCode(65 + idx)}</div>
                            <div className={styles.optionText}>{opt.text}</div>
                        </button>
                    );
                })}
            </div>

            {showExplanation && (
                <div className={selectedOption === correctAnswerIndex ? styles.explanationCorrect : styles.explanationWrong}>
                    <h4>
                        {selectedOption === correctAnswerIndex ? '✅ Correct!' : '❌ Incorrect'}
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
