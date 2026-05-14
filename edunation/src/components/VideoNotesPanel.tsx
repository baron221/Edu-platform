'use client';
import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import styles from './VideoNotesPanel.module.css';

interface Note {
    id: string;
    content: string;
    timestamp: number;
    createdAt: string;
}

interface VideoNotesPanelProps {
    lessonId: string;
    courseId: string;
    getCurrentTime: () => number;
    seekTo: (time: number) => void;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
        return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }
    return `${m}:${String(s).padStart(2, '0')}`;
}

export default function VideoNotesPanel({ lessonId, courseId, getCurrentTime, seekTo }: VideoNotesPanelProps) {
    const { data: session } = useSession();
    const [notes, setNotes] = useState<Note[]>([]);
    const [content, setContent] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isOpen, setIsOpen] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!session?.user || !lessonId) return;
        fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lessonId, session]);

    const fetchNotes = async () => {
        const res = await fetch(`/api/notes?lessonId=${lessonId}`);
        if (res.ok) {
            const data = await res.json();
            setNotes(data);
        }
    };

    const handleAddNote = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || saving) return;

        const currentTime = getCurrentTime();
        setSaving(true);
        try {
            const res = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lessonId, courseId, content, timestamp: currentTime }),
            });
            if (res.ok) {
                const newNote = await res.json();
                setNotes(prev => [...prev, newNote].sort((a, b) => a.timestamp - b.timestamp));
                setContent('');
                textareaRef.current?.focus();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const res = await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
        if (res.ok) {
            setNotes(prev => prev.filter(n => n.id !== id));
        }
    };

    const handleEditSave = async (id: string) => {
        if (!editContent.trim()) return;
        const res = await fetch(`/api/notes?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: editContent }),
        });
        if (res.ok) {
            const updated = await res.json();
            setNotes(prev => prev.map(n => n.id === id ? updated : n));
            setEditingId(null);
            setEditContent('');
        }
    };

    const handleTimestampClick = (timestamp: number) => {
        seekTo(timestamp);
    };

    if (!session?.user) return null;

    return (
        <div className={styles.panel}>
            {/* Panel Header */}
            <button className={styles.header} onClick={() => setIsOpen(v => !v)}>
                <div className={styles.headerLeft}>
                    <span className={styles.headerIcon}>📝</span>
                    <span className={styles.headerTitle}>My Notes</span>
                    {notes.length > 0 && (
                        <span className={styles.badge}>{notes.length}</span>
                    )}
                </div>
                <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}>
                    ›
                </span>
            </button>

            {isOpen && (
                <div className={styles.body}>
                    {/* Add Note Form */}
                    <form onSubmit={handleAddNote} className={styles.addForm}>
                        <div className={styles.inputWrapper}>
                            <span className={styles.timestampBadge}>
                                ⏱ {formatTime(getCurrentTime())}
                            </span>
                            <textarea
                                ref={textareaRef}
                                className={styles.textarea}
                                placeholder="Write a note at the current timestamp..."
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                        e.preventDefault();
                                        handleAddNote(e as any);
                                    }
                                }}
                                rows={2}
                            />
                        </div>
                        <button
                            type="submit"
                            className={styles.saveBtn}
                            disabled={saving || !content.trim()}
                        >
                            {saving ? (
                                <span className={styles.savingDot} />
                            ) : (
                                '+ Add Note'
                            )}
                        </button>
                    </form>

                    {/* Notes List */}
                    {notes.length === 0 ? (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>📋</div>
                            <p>No notes yet. Start taking notes while watching!</p>
                        </div>
                    ) : (
                        <div className={styles.notesList}>
                            {notes.map(note => (
                                <div key={note.id} className={styles.noteCard}>
                                    {/* Timestamp pill — clicking seeks the video */}
                                    <button
                                        className={styles.timestampPill}
                                        onClick={() => handleTimestampClick(note.timestamp)}
                                        title={`Jump to ${formatTime(note.timestamp)}`}
                                    >
                                        ▶ {formatTime(note.timestamp)}
                                    </button>

                                    {/* Note Content */}
                                    {editingId === note.id ? (
                                        <div className={styles.editWrapper}>
                                            <textarea
                                                className={styles.editTextarea}
                                                value={editContent}
                                                onChange={e => setEditContent(e.target.value)}
                                                autoFocus
                                                rows={3}
                                            />
                                            <div className={styles.editActions}>
                                                <button
                                                    className={styles.editSaveBtn}
                                                    onClick={() => handleEditSave(note.id)}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className={styles.editCancelBtn}
                                                    onClick={() => { setEditingId(null); setEditContent(''); }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className={styles.noteContent}>{note.content}</p>
                                    )}

                                    {/* Actions */}
                                    {editingId !== note.id && (
                                        <div className={styles.noteActions}>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => { setEditingId(note.id); setEditContent(note.content); }}
                                                title="Edit note"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className={styles.actionBtn}
                                                onClick={() => handleDelete(note.id)}
                                                title="Delete note"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {notes.length > 0 && (
                        <p className={styles.hint}>💡 Click on a timestamp to jump to that moment in the video</p>
                    )}
                </div>
            )}
        </div>
    );
}
