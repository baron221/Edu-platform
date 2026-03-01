'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './page.module.css';

interface LeaderboardUser {
    id: string;
    name: string | null;
    image: string | null;
    points: number;
    role: string;
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/leaderboard')
            .then(res => res.json())
            .then(data => {
                setUsers(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.spinner}></div>
                <p>Loading Leaderboard...</p>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>
                    <span className={styles.trophy}>🏆</span> Top Learners
                </h1>
                <p className={styles.subtitle}>Climb the ranks by completing lessons, quizzes, and assignments!</p>
            </div>

            <div className={styles.leaderboardContainer}>
                {users.length === 0 ? (
                    <div className={styles.emptyState}>No points have been earned yet. Be the first!</div>
                ) : (
                    <div className={styles.list}>
                        {users.map((user, index) => {
                            const isTop3 = index < 3;
                            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : null;

                            return (
                                <div key={user.id} className={`${styles.row} ${isTop3 ? styles.topRow : ''}`}>
                                    <div className={styles.rank}>
                                        {medal ? <span className={styles.medal}>{medal}</span> : `#${index + 1}`}
                                    </div>

                                    <div className={styles.userInfo}>
                                        <div className={styles.avatar}>
                                            {user.image ? (
                                                <Image src={user.image} alt={user.name || 'User'} fill className={styles.avatarImg} />
                                            ) : (
                                                <div className={styles.avatarInitials}>
                                                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.userDetails}>
                                            <span className={styles.userName}>{user.name || 'Anonymous Learner'}</span>
                                            {user.role === 'admin' || user.role === 'instructor' ? (
                                                <span className={styles.badge}>{user.role}</span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className={styles.points}>
                                        <span className={styles.star}>★</span>
                                        <strong>{user.points}</strong> pts
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
