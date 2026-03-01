'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';

interface Author { id: string; name: string | null; image: string | null; role: string; }
interface Post {
    id: string; communityId: string; authorId: string;
    title: string; body: string; isPinned: boolean; isAnnouncement: boolean;
    createdAt: string; author: Author; _count: { replies: number };
}

function Avatar({ user }: { user: Author }) {
    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return user.image
        ? <img src={user.image} className={styles.avatar} alt={user.name || ''} />
        : <div className={styles.avatarFallback}>{initials}</div>;
}

export default function CommunityPage() {
    const { courseId } = useParams() as { courseId: string };
    const { data: session } = useSession();
    const router = useRouter();
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role || 'student';

    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [showing, setShowing] = useState(false);
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchPosts = () => {
        fetch(`/api/community/posts?courseId=${courseId}`)
            .then(r => r.json())
            .then(d => { setPosts(Array.isArray(d) ? d : []); setLoading(false); });
    };

    useEffect(() => { fetchPosts(); }, [courseId]);

    const submit = async () => {
        if (!title.trim() || !body.trim()) return;
        setSubmitting(true);
        await fetch('/api/community/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, title, body, isAnnouncement }),
        });
        setTitle(''); setBody(''); setShowing(false); setSubmitting(false);
        fetchPosts();
    };

    const togglePin = async (postId: string) => {
        await fetch('/api/community/pin', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId }),
        });
        fetchPosts();
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

    return (
        <div className={styles.page}>
            <section className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>💬 Course Community</h1>
                    <p className={styles.heroSub}>Ask questions, share ideas, and connect with fellow learners.</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className={styles.toolbar}>
                        <h2 className={styles.sectionTitle}>Discussions</h2>
                        {session && (
                            <button className="btn btn-primary" onClick={() => setShowing(!showing)}>
                                {showing ? '✕ Cancel' : '+ New Post'}
                            </button>
                        )}
                    </div>

                    {/* New post form */}
                    {showing && (
                        <div className={styles.newPostForm}>
                            <input
                                className={styles.input}
                                placeholder="Post title..."
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                            />
                            <textarea
                                className={styles.textarea}
                                placeholder="Write your question or discussion..."
                                rows={5}
                                value={body}
                                onChange={e => setBody(e.target.value)}
                            />
                            {(role === 'instructor' || role === 'admin') && (
                                <label className={styles.checkLabel}>
                                    <input type="checkbox" checked={isAnnouncement} onChange={e => setIsAnnouncement(e.target.checked)} />
                                    📢 Mark as Announcement
                                </label>
                            )}
                            <button className="btn btn-primary" onClick={submit} disabled={submitting || !title.trim() || !body.trim()}>
                                {submitting ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    )}

                    {loading ? (
                        <div className={styles.skeletonStack}>{[...Array(4)].map((_, i) => <div key={i} className={styles.skeletonRow} />)}</div>
                    ) : posts.length === 0 ? (
                        <div className={styles.empty}>
                            <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
                            <h3>No discussions yet</h3>
                            <p>Be the first to start a conversation!</p>
                        </div>
                    ) : (
                        <div className={styles.postList}>
                            {posts.map(post => (
                                <div key={post.id} className={`${styles.postCard} ${post.isPinned ? styles.pinned : ''} ${post.isAnnouncement ? styles.announcement : ''}`}>
                                    <div className={styles.postLeft}>
                                        <Avatar user={post.author} />
                                    </div>
                                    <div className={styles.postBody}>
                                        <div className={styles.postMeta}>
                                            <span className={styles.authorName}>{post.author.name}</span>
                                            {post.author.role === 'instructor' && <span className={styles.instructorBadge}>Instructor</span>}
                                            {post.isAnnouncement && <span className={styles.annBadge}>📢 Announcement</span>}
                                            {post.isPinned && <span className={styles.pinBadge}>📌 Pinned</span>}
                                            <span className={styles.timeAgo}>{timeAgo(post.createdAt)}</span>
                                        </div>
                                        <Link href={`/community/${courseId}/post/${post.id}`} className={styles.postTitle}>{post.title}</Link>
                                        <p className={styles.postExcerpt}>{post.body.slice(0, 140)}{post.body.length > 140 ? '...' : ''}</p>
                                        <div className={styles.postFooter}>
                                            <span className={styles.replyCount}>💬 {post._count.replies} {post._count.replies === 1 ? 'reply' : 'replies'}</span>
                                            {(role === 'instructor' || role === 'admin') && (
                                                <button className={styles.pinBtn} onClick={() => togglePin(post.id)}>
                                                    {post.isPinned ? '📌 Unpin' : '📌 Pin'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
