'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './NotificationBell.module.css';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const { t } = useLanguage();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const res = await fetch('/api/notifications');
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.notifications || []);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error('Failed to load notifications', error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 60 seconds
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const markAllRead = async () => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch('/api/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notificationId: id }),
            });
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark as read', error);
        }
    };

    const handleNotificationClick = (n: Notification) => {
        if (!n.read) {
            markAsRead(n.id);
        }
        setIsOpen(false);
    };

    const formatTime = (isoDate: string) => {
        const date = new Date(isoDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 60) return `${Math.max(1, diffMins)}m ago`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h ago`;
        return `${Math.floor(diffHrs / 24)}d ago`;
    };

    // Safely fallback to English texts if t.notifications is missing during dev
    const dict = (t as any).notifications || {
        title: 'Notifications',
        markAllRead: 'Mark all as read',
        empty: 'No notifications yet.',
        noNew: 'You \'re all caught up!',
    };

    return (
        <div className={styles.container} ref={dropdownRef}>
            <button 
                className={styles.bellButton} 
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                🔔
                {unreadCount > 0 && (
                    <span className={styles.badge}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.header}>
                        <h3 className={styles.title}>{dict.title}</h3>
                        {unreadCount > 0 && (
                            <button className={styles.markAllBtn} onClick={markAllRead}>
                                {dict.markAllRead}
                            </button>
                        )}
                    </div>
                    
                    <div className={styles.list}>
                        {notifications.length === 0 ? (
                            <div className={styles.emptyState}>
                                <span className={styles.emptyIcon}>📭</span>
                                <p>{dict.empty}</p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const NotificationContent = (
                                    <div className={`${styles.item} ${!n.read ? styles.unread : ''}`}>
                                        {!n.read && <div className={styles.unreadDot} />}
                                        <div className={styles.itemContent}>
                                            <div className={styles.itemHeader}>
                                                <span className={styles.itemTitle}>{n.title}</span>
                                                <span className={styles.itemTime}>{formatTime(n.createdAt)}</span>
                                            </div>
                                            <p className={styles.itemMessage}>{n.message}</p>
                                        </div>
                                    </div>
                                );

                                if (n.link) {
                                    return (
                                        <Link 
                                            key={n.id} 
                                            href={n.link} 
                                            onClick={() => handleNotificationClick(n)}
                                            className={styles.itemLink}
                                        >
                                            {NotificationContent}
                                        </Link>
                                    );
                                }

                                return (
                                    <div 
                                        key={n.id} 
                                        onClick={() => handleNotificationClick(n)}
                                        className={styles.itemWrapper}
                                    >
                                        {NotificationContent}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
