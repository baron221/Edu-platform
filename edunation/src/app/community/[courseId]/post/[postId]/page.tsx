'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';

interface Author { id: string; name: string | null; image: string | null; role: string; }
interface Post { id: string; title: string; body: string; isPinned: boolean; isAnnouncement: boolean; createdAt: string; author: Author; }
interface Reply { id: string; body: string; createdAt: string; author: Author; }

function Avatar({ user }: { user: Author }) {
    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return user.image
        ? <img src={user.image} className={styles.avatar} alt={user.name || ''} />
        : <div className={styles.avatarFallback}>{initials}</div>;
}

export default function CommunityPostPage() {
    const { courseId, postId } = useParams() as { courseId: string; postId: string };
    const { data: session } = useSession();
    const [post, setPost] = useState<Post | null>(null);
    const [replies, setReplies] = useState<Reply[]>([]);
    const [body, setBody] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchData = async () => {
        const [pr, rr] = await Promise.all([
            fetch(`/api/community/posts?courseId=${courseId}`),
            fetch(`/api/community/replies?postId=${postId}`),
        ]);
        const posts: Post[] = await pr.json();
        setPost(posts.find(p => p.id === postId) || null);
        setReplies(await rr.json());
    };

    useEffect(() => { fetchData(); }, [postId]);

    const submitReply = async () => {
        if (!body.trim() || submitting) return;
        setSubmitting(true);
        await fetch('/api/community/replies', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId, body }),
        });
        setBody(''); setSubmitting(false); fetchData();
    };

    const timeAgo = (d: string) => {
        const diff = Date.now() - new Date(d).getTime();
        const min = Math.floor(diff / 60000);
        if (min < 1) return 'just now';
        if (min < 60) return `${min}m ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr}h ago`;
        return `${Math.floor(hr / 24)}d ago`;
    };

    if (!post) return (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: '#94a3b8' }}>Loading...</div>
    );

    return (
        <div className={styles.page}>
            {/* Back link */}
            <div className="container" style={{ paddingTop: 32 }}>
                <Link href={`/community/${courseId}`} className={styles.backLink}>← Back to Community</Link>
            </div>

            <section className="section">
                <div className="container">
                    <div className={styles.layout}>
                        {/* Post */}
                        <article className={styles.postCard}>
                            {post.isAnnouncement && <div className={styles.annBanner}>📢 Announcement</div>}
                            {post.isPinned && <div className={styles.pinBanner}>📌 Pinned Post</div>}
                            <div className={styles.postHeader}>
                                <Avatar user={post.author} />
                                <div>
                                    <div className={styles.authorName}>{post.author.name}</div>
                                    {post.author.role === 'instructor' && <span className={styles.instructorBadge}>Instructor</span>}
                                    <div className={styles.timeAgo}>{timeAgo(post.createdAt)}</div>
                                </div>
                            </div>
                            <h1 className={styles.postTitle}>{post.title}</h1>
                            <div className={styles.postBody}>{post.body}</div>
                        </article>

                        {/* Replies */}
                        <div className={styles.repliesSection}>
                            <h2 className={styles.repliesTitle}>
                                💬 {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
                            </h2>

                            {replies.map(reply => (
                                <div key={reply.id} className={styles.replyCard}>
                                    <div className={styles.postHeader}>
                                        <Avatar user={reply.author} />
                                        <div>
                                            <div className={styles.authorName}>{reply.author.name}</div>
                                            {reply.author.role === 'instructor' && <span className={styles.instructorBadge}>Instructor</span>}
                                            <div className={styles.timeAgo}>{timeAgo(reply.createdAt)}</div>
                                        </div>
                                    </div>
                                    <p className={styles.replyBody}>{reply.body}</p>
                                </div>
                            ))}

                            {/* Reply box */}
                            {session ? (
                                <div className={styles.replyBox}>
                                    <textarea
                                        className={styles.textarea}
                                        placeholder="Write your reply..."
                                        rows={4}
                                        value={body}
                                        onChange={e => setBody(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) submitReply(); }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                        <span style={{ fontSize: 12, color: '#475569', alignSelf: 'center' }}>Ctrl+Enter to send</span>
                                        <button className="btn btn-primary" onClick={submitReply} disabled={submitting || !body.trim()}>
                                            {submitting ? 'Posting...' : 'Reply'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.loginPrompt}>
                                    <Link href="/login">Sign in</Link> to reply to this discussion.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
