'use client';
import { useState, useRef, useEffect } from 'react';
import { useChat, Message } from '@ai-sdk/react';
import ReactMarkdown from 'react-markdown';
import styles from './AIAssistant.module.css';

export default function AIAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Vercel AI SDK handles the streaming state automatically
    const { messages, append, isLoading } = useChat({
        api: '/api/chat',
        initialMessages: [
            { id: '1', role: 'assistant', content: 'Hi there! I am your EduNation AI assistant. What can I help you learn today?' }
        ]
    });

    const [inputValue, setInputValue] = useState('');

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || isLoading) return;

        append({
            role: 'user',
            content: inputValue
        });
        setInputValue('');
    };

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className={styles.container}>
            {isOpen && (
                <div className={styles.chatWindow}>
                    <div className={styles.header}>
                        <span>🤖 EduNation AI Tutor</span>
                        <button className={styles.closeBtn} onClick={() => setIsOpen(false)}>
                            ✕
                        </button>
                    </div>

                    <div className={styles.messages}>
                        {messages.map((m: Message) => (
                            <div key={m.id} className={`${styles.message} ${m.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
                                {m.role === 'assistant' ? (
                                    <ReactMarkdown>{m.content}</ReactMarkdown>
                                ) : (
                                    m.content
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div className={`${styles.message} ${styles.aiMessage}`}>
                                <em>Thinking...</em>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className={styles.form} onSubmit={handleFormSubmit}>
                        <textarea
                            className={styles.input}
                            value={inputValue}
                            placeholder="Ask a question..."
                            onChange={(e) => setInputValue(e.target.value)}
                            disabled={isLoading}
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    if (inputValue.trim() && !isLoading) {
                                        // Trigger form submission
                                        e.currentTarget.form?.requestSubmit();
                                    }
                                }
                            }}
                        />
                        <button type="submit" className={styles.sendBtn} disabled={isLoading || !(inputValue || '').trim()}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                            </svg>
                        </button>
                    </form>
                </div>
            )}

            {!isOpen && (
                <button
                    className={styles.toggleBtn}
                    onClick={() => setIsOpen(true)}
                    title="Ask AI Tutor"
                >
                    🤖
                </button>
            )}
        </div>
    );
}
