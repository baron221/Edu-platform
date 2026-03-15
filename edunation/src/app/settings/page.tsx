'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
    const { data: session, update } = useSession();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Profile State
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        image: '',
        telegramId: ''
    });

    // Password State
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (session?.user) {
            setProfile({
                name: session.user.name || '',
                email: session.user.email || '',
                image: session.user.image || '',
                telegramId: (session.user as any).telegramId || ''
            });
        }
    }, [session]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB.');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setProfile(prev => ({ ...prev, image: data.url }));
            toast.success('Photo uploaded! Save changes to finalize.');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/user/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: profile.name,
                    email: profile.email,
                    image: profile.image
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Update failed');
            }

            toast.success(t.settings.successProfile);
            // Update session client-side
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: profile.name,
                    email: profile.email,
                    image: profile.image
                }
            });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectTelegram = () => {
        const botId = process.env.NEXT_PUBLIC_TELEGRAM_BOT_ID ?? '8663512128';
        const origin = window.location.origin;
        const returnTo = `${origin}/api/user/connect-telegram`;

        const popup = window.open(
            `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${encodeURIComponent(origin)}&return_to=${encodeURIComponent(returnTo)}&request_access=write`,
            'telegram_connect',
            'width=550,height=470,top=200,left=200'
        );

        const onMessage = async (event: MessageEvent) => {
            if (event.origin !== origin) return;
            if (event.data?.type !== 'telegram_connect') return;

            window.removeEventListener('message', onMessage);
            clearInterval(closedTimer);

            if (event.data.error) {
                toast.error(event.data.error === 'telegram_already_linked' ? 'This Telegram account is already linked to another user.' : 'Telegram connection failed.');
                return;
            }

            if (event.data.success) {
                setProfile(p => ({ ...p, telegramId: event.data.telegramId }));
                toast.success('Telegram connected successfully!');
                await update({ ...session, user: { ...session?.user, telegramId: event.data.telegramId } });
            }
        };

        window.addEventListener('message', onMessage);

        const closedTimer = setInterval(() => {
            if (popup?.closed) {
                clearInterval(closedTimer);
                window.removeEventListener('message', onMessage);
            }
        }, 500);
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error(t.settings.errorMatch);
            return;
        }

        if (passwords.newPassword.length < 8) {
            toast.error(t.settings.passNote);
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: passwords.currentPassword,
                    newPassword: passwords.newPassword
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Update failed');
            }

            toast.success(t.settings.successPass);
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!session) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>{t.shared.loading}</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t.settings.title}</h1>
                <p className={styles.subtitle}>{t.settings.subtitle}</p>
            </div>

            <div className={styles.content}>
                <div className={styles.sidebar}>
                    <button 
                        className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.active : ''}`}
                        onClick={() => setActiveTab('profile')}
                    >
                        <span style={{ fontSize: '1.2rem' }}>👤</span>
                        {t.settings.profile}
                    </button>
                    <button 
                        className={`${styles.tabBtn} ${activeTab === 'security' ? styles.active : ''}`}
                        onClick={() => setActiveTab('security')}
                    >
                        <span style={{ fontSize: '1.2rem' }}>🔒</span>
                        {t.settings.security}
                    </button>
                </div>

                <div className={styles.main}>
                    {activeTab === 'profile' && (
                        <form className={styles.form} onSubmit={handleProfileUpdate}>
                            <h2 className={styles.formTitle}>{t.settings.profile}</h2>
                            
                            <div className={styles.avatarSection}>
                                <div className={styles.avatarWrapper}>
                                    <img 
                                        src={profile.image || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'} 
                                        alt="Avatar" 
                                        className={styles.avatar}
                                    />
                                </div>
                                <div className={styles.avatarInfo}>
                                    <label className={styles.label}>{t.settings.avatarLabel}</label>
                                    <div className={styles.uploadControls}>
                                        <button 
                                            type="button" 
                                            className={styles.uploadBtn}
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? '⌛ Uploading...' : '📸 Change Photo'}
                                        </button>
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            style={{ display: 'none' }}
                                            accept="image/*"
                                        />
                                    </div>
                                    <p className={styles.hint}>Recommended: Square image, max 5MB.</p>
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>{t.settings.nameLabel}</label>
                                <input 
                                    type="text" 
                                    className={styles.input}
                                    value={profile.name}
                                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>{t.settings.emailLabel}</label>
                                <input 
                                    type="email" 
                                    className={styles.input}
                                    value={profile.email}
                                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                    required
                                    disabled // Recommended to disable email change unless verified
                                />
                                <p className={styles.hint}>Email cannot be changed directly for security.</p>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>Telegram Connection</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                    {profile.telegramId ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', fontWeight: 500 }}>
                                            ✅ Connected (ID: {profile.telegramId})
                                        </div>
                                    ) : (
                                        <button 
                                            type="button" 
                                            onClick={handleConnectTelegram}
                                            style={{
                                                backgroundColor: '#2AABEE',
                                                color: 'white',
                                                border: 'none',
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem'
                                            }}
                                        >
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                                <path fill="white" d="M17.76 7.28L15.4 17.6c-.17.76-.63.95-1.27.59l-3.5-2.58-1.69 1.63c-.19.18-.34.34-.7.34l.25-3.54 6.4-5.78c.28-.25-.06-.38-.43-.14L6.2 13.15 2.76 12.1c-.74-.23-.75-.74.15-1.1L16.71 6.18c.62-.23 1.16.14.96 1.1" />
                                            </svg>
                                            Connect Telegram
                                        </button>
                                    )}
                                </div>
                                <p className={styles.hint}>Receive instant notifications directly via @edunationbot</p>
                            </div>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? t.settings.saving : t.settings.saveBtn}
                            </button>
                        </form>
                    )}

                    {activeTab === 'security' && (
                        <form className={styles.form} onSubmit={handlePasswordUpdate}>
                            <h2 className={styles.formTitle}>{t.settings.passTitle}</h2>
                            
                            <div className={styles.field}>
                                <label className={styles.label}>{t.settings.currentPass}</label>
                                <input 
                                    type="password" 
                                    className={styles.input}
                                    value={passwords.currentPassword}
                                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>{t.settings.newPass}</label>
                                <input 
                                    type="password" 
                                    className={styles.input}
                                    value={passwords.newPassword}
                                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>{t.settings.confirmPass}</label>
                                <input 
                                    type="password" 
                                    className={styles.input}
                                    value={passwords.confirmPassword}
                                    onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                    required
                                />
                            </div>

                            <p className={styles.formNote}>{t.settings.passNote}</p>

                            <button type="submit" className={styles.submitBtn} disabled={loading}>
                                {loading ? t.settings.saving : t.settings.updatePassBtn}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
