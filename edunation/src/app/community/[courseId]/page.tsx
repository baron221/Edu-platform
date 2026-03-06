'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from './page.module.css';

interface Author {
    id: string;
    name: string | null;
    image: string | null;
    role: string;
}
interface ReplyTo {
    id: string;
    text: string;
    author: { name: string | null };
}
interface Message {
    id: string;
    text: string;
    createdAt: string;
    author: Author;
    replyTo: ReplyTo | null;
}

function Avatar({ user, size = 36 }: { user: Author; size?: number }) {
    const initials = (user.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    if (user.image) {
        return <img src={user.image} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt={user.name || ''} />;
    }
    const colors = ['#7c3aed', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
    const color = colors[user.name ? user.name.charCodeAt(0) % colors.length : 0];
    return (
        <div style={{ width: size, height: size, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {initials}
        </div>
    );
}

function timeStr(d: string) {
    const date = new Date(d);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function dateSep(d: string) {
    const date = new Date(d);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
}

export default function CommunityPage() {
    const { courseId } = useParams() as { courseId: string };
    const { data: session } = useSession();
    const userId = (session?.user as any)?.id;
    const role = (session?.user as any)?.role || 'student';

    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [replyTo, setReplyTo] = useState<Message | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [courseName, setCourseName] = useState('');

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const lastTimestampRef = useRef<string | null>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);

    // Initial load
    const loadMessages = useCallback(async () => {
        const res = await fetch(`/api/community/messages?courseId=${courseId}`);
        if (!res.ok) return;
        const data: Message[] = await res.json();
        setMessages(data);
        if (data.length > 0) lastTimestampRef.current = data[data.length - 1].createdAt;
        setLoading(false);
    }, [courseId]);

    // Poll for new messages
    const pollMessages = useCallback(async () => {
        if (!lastTimestampRef.current) return;
        const res = await fetch(`/api/community/messages?courseId=${courseId}&after=${encodeURIComponent(lastTimestampRef.current)}`);
        if (!res.ok) return;
        const newMsgs: Message[] = await res.json();
        if (newMsgs.length > 0) {
            setMessages(prev => [...prev, ...newMsgs]);
            lastTimestampRef.current = newMsgs[newMsgs.length - 1].createdAt;
        }
    }, [courseId]);

    useEffect(() => {
        // Fetch course name
        fetch(`/api/courses/${courseId}`).then(r => r.json()).then(d => setCourseName(d?.title || 'Course'));
        loadMessages();
    }, [courseId, loadMessages]);

    useEffect(() => {
        if (!loading) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [loading]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (messages.length > 0) {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);

    // Polling
    useEffect(() => {
        if (loading) return;
        pollingRef.current = setInterval(pollMessages, 3000);
        return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [loading, pollMessages]);

    const send = async () => {
        if (!text.trim() || sending || !session) return;
        setSending(true);
        const body = { courseId, text: text.trim(), replyToId: replyTo?.id };
        setText('');
        setReplyTo(null);

        const res = await fetch('/api/community/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (res.ok) {
            const msg: Message = await res.json();
            setMessages(prev => [...prev, msg]);
            lastTimestampRef.current = msg.createdAt;
        }
        setSending(false);
        inputRef.current?.focus();
    };

    const deleteMsg = async (id: string) => {
        await fetch(`/api/community/messages?id=${id}`, { method: 'DELETE' });
        setMessages(prev => prev.filter(m => m.id !== id));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    // Group messages by date
    const grouped: { date: string; msgs: Message[] }[] = [];
    messages.forEach(msg => {
        const day = new Date(msg.createdAt).toDateString();
        const last = grouped[grouped.length - 1];
        if (!last || last.date !== day) {
            grouped.push({ date: day, msgs: [msg] });
        } else {
            last.msgs.push(msg);
        }
    });

    return (
        <div className={styles.shell}>
            {/* Header */}
            <div className={styles.header}>
                <Link href={`/courses/${courseId}`} className={styles.backBtn}>←</Link>
                <div className={styles.headerInfo}>
                    <div className={styles.headerTitle}>💬 {courseName || 'Course Community'}</div>
                    <div className={styles.headerSub}>{messages.length} messages · polling every 3s</div>
                </div>
            </div>

            {/* Messages area */}
            <div className={styles.messages}>
                {loading ? (
                    <div className={styles.loadingWrap}>
                        <div className={styles.spinner} />
                        <span>Loading messages...</span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className={styles.empty}>
                        <div style={{ fontSize: 56, marginBottom: 12 }}>💬</div>
                        <h3>No messages yet</h3>
                        <p>Be the first to say something!</p>
                    </div>
                ) : (
                    grouped.map(group => (
                        <div key={group.date}>
                            <div className={styles.dateSep}>
                                <span>{dateSep(group.msgs[0].createdAt)}</span>
                            </div>
                            {group.msgs.map((msg, idx) => {
                                const isOwn = msg.author.id === userId;
                                const isInstructor = msg.author.role === 'instructor' || msg.author.role === 'admin';
                                const showAvatar = !isOwn && (idx === 0 || group.msgs[idx - 1]?.author.id !== msg.author.id);
                                const showName = !isOwn && (idx === 0 || group.msgs[idx - 1]?.author.id !== msg.author.id);

                                return (
                                    <div
                                        key={msg.id}
                                        className={`${styles.row} ${isOwn ? styles.rowOwn : styles.rowOther}`}
                                        onMouseEnter={() => setHoveredId(msg.id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                    >
                                        {/* Avatar placeholder for alignment */}
                                        {!isOwn && (
                                            <div style={{ width: 36, flexShrink: 0, alignSelf: 'flex-end' }}>
                                                {showAvatar && <Avatar user={msg.author} size={36} />}
                                            </div>
                                        )}

                                        <div className={styles.bubbleWrap}>
                                            {/* Action buttons (hover) */}
                                            {hoveredId === msg.id && (
                                                <div className={`${styles.actions} ${isOwn ? styles.actionsOwn : styles.actionsOther}`}>
                                                    <button className={styles.actionBtn} onClick={() => { setReplyTo(msg); inputRef.current?.focus(); }} title="Reply">↩</button>
                                                    {(isOwn || role === 'admin' || role === 'instructor') && (
                                                        <button className={`${styles.actionBtn} ${styles.actionDel}`} onClick={() => deleteMsg(msg.id)} title="Delete">🗑</button>
                                                    )}
                                                </div>
                                            )}

                                            <div className={`${styles.bubble} ${isOwn ? styles.bubbleOwn : styles.bubbleOther} ${isInstructor && !isOwn ? styles.bubbleInstructor : ''}`}>
                                                {/* Sender name */}
                                                {showName && (
                                                    <div className={styles.senderName}>
                                                        {msg.author.name}
                                                        {isInstructor && <span className={styles.instructorTag}>✦ Instructor</span>}
                                                    </div>
                                                )}

                                                {/* Reply-to preview */}
                                                {msg.replyTo && (
                                                    <div className={styles.replyPreview}>
                                                        <div className={styles.replyAuthor}>{msg.replyTo.author.name}</div>
                                                        <div className={styles.replyText}>{msg.replyTo.text.slice(0, 80)}{msg.replyTo.text.length > 80 ? '…' : ''}</div>
                                                    </div>
                                                )}

                                                {/* Message text */}
                                                <div className={styles.msgText}>{msg.text}</div>

                                                {/* Timestamp */}
                                                <div className={styles.msgTime}>{timeStr(msg.createdAt)}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div className={styles.inputBar}>
                {replyTo && (
                    <div className={styles.replyBanner}>
                        <div>
                            <div className={styles.replyBannerAuthor}>Replying to {replyTo.author.name}</div>
                            <div className={styles.replyBannerText}>{replyTo.text.slice(0, 60)}{replyTo.text.length > 60 ? '…' : ''}</div>
                        </div>
                        <button className={styles.replyClose} onClick={() => setReplyTo(null)}>✕</button>
                    </div>
                )}

                {session ? (
                    <div className={styles.inputRow}>
                        <textarea
                            ref={inputRef}
                            className={styles.input}
                            placeholder="Write a message..."
                            value={text}
                            onChange={e => setText(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button
                            className={styles.sendBtn}
                            onClick={send}
                            disabled={sending || !text.trim()}
                        >
                            ➤
                        </button>
                    </div>
                ) : (
                    <div className={styles.loginPrompt}>
                        <Link href="/login" className={styles.loginLink}>Sign in to send messages</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
