'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import styles from './page.module.css';

interface LeaderboardUser {
    id: string;
    name: string | null;
    image: string | null;
    points: number;
    currentStreak: number;
    role: string;
}

export default function LeaderboardPage() {
    const { data: session } = useSession();
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/leaderboard`)
            .then(r => r.json())
            .then(data => {
                setUsers(data || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    if (loading) return <div className={styles.loading}>Loading Leaderboard...</div>;

    const top3 = users.slice(0, 3);
    const rest = users.slice(3);
    const currentUserId = (session?.user as any)?.id;

    // Podium ordering: 2nd, 1st, 3rd
    const podiumOrder = [
        top3[1] ? { ...top3[1], rank: 2 } : null,
        top3[0] ? { ...top3[0], rank: 1 } : null,
        top3[2] ? { ...top3[2], rank: 3 } : null,
    ];

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h1 className={styles.title}>🏆 Global <span className="gradient-text">Leaderboard</span></h1>
                    <p className={styles.subtitle}>Learn, participate, and rise to the top of EduNationUz.</p>
                </div>
            </div>

            <div className="container">
                {/* Podium */}
                <div className={styles.podiumContainer}>
                    {podiumOrder.map((u, i) => u ? (
                        <div key={u.id} className={`${styles.podiumItem} ${styles['rank' + u.rank]}`}>
                            <div className={styles.podiumAvatarWrapper}>
                                {u.image ? (
                                    <img src={u.image} alt={u.name || ''} className={styles.podiumAvatar} />
                                ) : (
                                    <div className={styles.podiumFallbackAvatar}>{(u.name || 'U')[0].toUpperCase()}</div>
                                )}
                                <div className={styles.podiumBadge}>
                                    {u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : '🥉'}
                                </div>
                            </div>
                            <div className={styles.podiumName}>{u.name || 'Anonymous'}</div>
                            <div className={styles.podiumPoints}>{u.points.toLocaleString()} pts</div>
                            {u.currentStreak > 0 && <div className={styles.podiumStreak}>🔥 {u.currentStreak} day streak</div>}
                        </div>
                    ) : (
                        <div key={i} className={styles.podiumItemEmpty} />
                    ))}
                </div>

                {/* List */}
                <div className={styles.listContainer}>
                    {rest.map((u, i) => {
                        const rank = i + 4;
                        const isMe = u.id === currentUserId;
                        return (
                            <div key={u.id} className={`${styles.listItem} ${isMe ? styles.isMe : ''}`}>
                                <div className={styles.listRank}>#{rank}</div>
                                <div className={styles.listAvatar}>
                                    {u.image ? <img src={u.image} alt="" /> : <div>{(u.name || 'U')[0].toUpperCase()}</div>}
                                </div>
                                <div className={styles.listInfo}>
                                    <div className={styles.listName}>{u.name || 'Anonymous'} {isMe && '(You)'}</div>
                                    <div className={styles.listRole}>{u.role === 'instructor' ? 'Instructor' : 'Student'}</div>
                                </div>
                                <div className={styles.listStats}>
                                    {u.currentStreak > 0 && <div className={styles.listStreak}>🔥 {u.currentStreak}</div>}
                                    <div className={styles.listPoints}>{u.points.toLocaleString()} pts</div>
                                </div>
                            </div>
                        );
                    })}

                    {users.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                            No one has earned points yet. Be the first! Start learning today!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
