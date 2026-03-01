'use client';
import { useState, useEffect } from 'react';
import StarRating from './StarRating';
import styles from './ReviewsSection.module.css';
import { useLanguage } from '@/context/LanguageContext';

interface Review {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    user: { name?: string; image?: string };
}

interface Props {
    courseId: string;
    isEnrolled: boolean;
}

export default function ReviewsSection({ courseId, isEnrolled }: Props) {
    const { t } = useLanguage();
    const tr = t.reviews;

    const [reviews, setReviews] = useState<Review[]>([]);
    const [avgRating, setAvgRating] = useState(0);
    const [loading, setLoading] = useState(true);
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const fetchReviews = async () => {
        try {
            const res = await fetch(`/api/reviews?courseId=${courseId}`);
            const data = await res.json();
            setReviews(data.reviews || []);
            setAvgRating(data.avgRating || 0);
        } catch {
            // silent
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReviews(); }, [courseId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (myRating === 0) { setError(tr.selectRating); return; }
        setSubmitting(true);
        setError('');
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, rating: myRating, comment: myComment }),
            });
            if (!res.ok) {
                setError(await res.text() || 'Error');
            } else {
                setSubmitted(true);
                await fetchReviews();
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <section className={styles.section}>
            <div className={styles.header}>
                <h2 className={styles.title}>{tr.title}</h2>
                {reviews.length > 0 && (
                    <div className={styles.avgRow}>
                        <span className={styles.avgNum}>{avgRating.toFixed(1)}</span>
                        <StarRating value={avgRating} size="md" />
                        <span className={styles.count}>({tr.reviewCount(reviews.length)})</span>
                    </div>
                )}
            </div>

            {isEnrolled && !submitted && (
                <form className={styles.form} onSubmit={handleSubmit}>
                    <h3 className={styles.formTitle}>{tr.leaveReview}</h3>
                    <StarRating value={myRating} onChange={setMyRating} size="lg" />
                    <textarea
                        className={styles.textarea}
                        placeholder={tr.placeholder}
                        value={myComment}
                        onChange={e => setMyComment(e.target.value)}
                        rows={3}
                    />
                    {error && <p className={styles.error}>{error}</p>}
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? tr.submitting : tr.submit}
                    </button>
                </form>
            )}
            {submitted && <div className={styles.thankYou}>{tr.thankYou}</div>}

            {loading ? (
                <div className={styles.loading}>{t.shared.loading}</div>
            ) : reviews.length === 0 ? (
                <div className={styles.empty}>
                    <span>⭐</span>
                    <p>{tr.empty} {isEnrolled ? tr.beFirst : tr.enrollToReview}</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {reviews.map(r => (
                        <div key={r.id} className={styles.reviewCard}>
                            <div className={styles.reviewHeader}>
                                <div className={styles.avatar}>{r.user.name?.[0]?.toUpperCase() || '?'}</div>
                                <div>
                                    <div className={styles.reviewerName}>{r.user.name || 'Anonymous'}</div>
                                    <div className={styles.reviewDate}>
                                        {new Date(r.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className={styles.reviewRating}>
                                    <StarRating value={r.rating} size="sm" />
                                </div>
                            </div>
                            {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
