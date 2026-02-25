'use client';
import { useState, useRef, useEffect } from 'react';
import { useChat, UIMessage } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import styles from './AIAssistant.module.css';

interface AIAssistantProps {
    context?: string;
    lessonId?: string;
}

export default function AIAssistant({ context, lessonId }: AIAssistantProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [chatId, setChatId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Vercel AI SDK handles the streaming state automatically
    const { messages, sendMessage, status, setMessages } = useChat({
        transport: new DefaultChatTransport({ api: '/api/chat' }),
    });

    const isLoading = status === 'submitted' || status === 'streaming';
    const [inputValue, setInputValue] = useState('');
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isListening, setIsListening] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Run once on mount to establish chat session
        const initChat = async () => {
            const storedChatId = localStorage.getItem('edunation_chatId');
            if (storedChatId) {
                setChatId(storedChatId);
                // Fetch existing messages
                try {
                    const res = await fetch(`/api/chat?chatId=${storedChatId}`);
                    const data = await res.json();
                    if (data.messages && data.messages.length > 0) {
                        setMessages(data.messages);
                    } else {
                        // Set default initial greeting if no history exists
                        setMessages([{ id: '1', role: 'assistant', parts: [{ type: 'text', text: 'Hi there! I am your EduNation AI assistant. What can I help you learn today?' }] } as UIMessage]);
                    }
                } catch (error) {
                    console.error("Failed to fetch chat history:", error);
                }
            } else {
                // Generate a new random Chat ID for this device session
                const newId = crypto.randomUUID();
                localStorage.setItem('edunation_chatId', newId);
                setChatId(newId);
                setMessages([{ id: '1', role: 'assistant', parts: [{ type: 'text', text: 'Hi there! I am your EduNation AI assistant. What can I help you learn today?' }] } as UIMessage]);
            }
        };

        initChat();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!inputValue.trim() && attachments.length === 0) || isLoading || !chatId) return;

        // Send the input and include our chat ID, context and images in the request body
        sendMessage(
            { text: inputValue || "Here is an image." },
            {
                body: { chatId, context, lessonId, images: attachments },
            }
        );
        setInputValue('');
        setAttachments([]);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) setAttachments(prev => [...prev, event.target!.result as string]);
            };
            reader.readAsDataURL(file);
        }
        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleVoiceClick = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support Speech Recognition.");
            return;
        }

        if (isListening) return;

        const recognition = new SpeechRecognition();
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInputValue(prev => prev ? prev + ' ' + transcript : transcript);
        };
        recognition.start();
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
                        {messages.map((m: UIMessage) => (
                            <div key={m.id} className={`${styles.message} ${m.role === 'user' ? styles.userMessage : styles.aiMessage}`}>
                                {m.role === 'assistant' ? (
                                    <ReactMarkdown>{m.parts.map(p => p.type === 'text' ? p.text : '').join('')}</ReactMarkdown>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {m.parts.map((p: any, idx) => {
                                            if (p.type === 'text') return <span key={idx}>{p.text}</span>;
                                            if (p.type === 'image') return <img key={idx} src={p.image as string} alt="Upload" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'contain' }} />;
                                            return null;
                                        })}
                                    </div>
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
                        {attachments.length > 0 && (
                            <div style={{ padding: '8px', display: 'flex', gap: '8px', overflowX: 'auto', borderBottom: '1px solid #333' }}>
                                {attachments.map((url, i) => (
                                    <div key={i} style={{ position: 'relative' }}>
                                        <img src={url} alt="Attachment" style={{ height: '50px', borderRadius: '4px' }} />
                                        <button type="button" onClick={() => removeAttachment(i)} style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', fontSize: '10px', cursor: 'pointer' }}>✕</button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '0 8px' }}>
                            <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '8px', fontSize: '18px' }}
                                title="Attach Image"
                            >
                                📎
                            </button>
                            <button
                                type="button"
                                onClick={handleVoiceClick}
                                style={{ background: 'none', border: 'none', color: isListening ? '#f43f5e' : '#888', cursor: 'pointer', padding: '8px', fontSize: '18px' }}
                                title="Use Microphone"
                            >
                                🎤
                            </button>
                            <textarea
                                className={styles.input}
                                value={inputValue}
                                placeholder="Ask a question..."
                                onChange={(e) => setInputValue(e.target.value)}
                                disabled={isLoading}
                                rows={1}
                                style={{ flex: 1, borderLeft: '1px solid #333', paddingLeft: '12px', marginLeft: '4px' }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if ((inputValue.trim() || attachments.length > 0) && !isLoading) {
                                            e.currentTarget.form?.requestSubmit();
                                        }
                                    }
                                }}
                            />
                            <button type="submit" className={styles.sendBtn} disabled={isLoading || !(inputValue.trim() || attachments.length > 0)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13"></line>
                                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
                            </button>
                        </div>
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
