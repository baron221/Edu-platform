'use client';
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function QuickJoinPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [university, setUniversity] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await signIn('quick-access', {
                firstName,
                lastName,
                university,
                redirect: false,
            });

            if (result?.ok) {
                router.push('/courses');
            } else {
                alert('Something went wrong. Please try again.');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.logo}>🎓</div>
                        <h1 className={styles.title}>EduNationUz</h1>
                        <p className={styles.subtitle}>Welcome! Start your learning journey in seconds.</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label>Ism (First Name)</label>
                            <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Masalan: Nusratjon"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Familiya (Last Name)</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Masalan: Soliyev"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Universitet (University)</label>
                            <input
                                type="text"
                                value={university}
                                onChange={(e) => setUniversity(e.target.value)}
                                placeholder="Masalan: TATU"
                                required
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={loading}>
                            {loading ? 'Kirilmoqda...' : 'Darslarni ko\'rish'}
                        </button>
                    </form>

                    <p className={styles.footer}>
                        No password needed. Simple and fast access.
                    </p>
                </div>
            </div>
        </div>
    );
}
