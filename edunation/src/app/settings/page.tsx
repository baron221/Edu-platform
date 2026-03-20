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
        image: ''
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
                image: session.user.image || ''
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
