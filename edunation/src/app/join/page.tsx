'use client';
import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function QuickJoinPage() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [university, setUniversity] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const saved = localStorage.getItem('quickAccessData');
        if (saved) {
            try {
                const { firstName, lastName, university } = JSON.parse(saved);
                if (firstName) setFirstName(firstName);
                if (lastName) setLastName(lastName);
                if (university) setUniversity(university);
            } catch (e) {}
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const uFirstName = firstName.toUpperCase();
        const uLastName = lastName.toUpperCase();
        const uUniversity = university.toUpperCase();

        try {
            localStorage.setItem('quickAccessData', JSON.stringify({
                firstName: uFirstName,
                lastName: uLastName,
                university: uUniversity
            }));

            const result = await signIn('quick-access', {
                firstName: uFirstName,
                lastName: uLastName,
                university: uUniversity,
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
                                onChange={(e) => setFirstName(e.target.value.toUpperCase())}
                                placeholder="Masalan: Nusratjon"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Familiya (Last Name)</label>
                            <input
                                type="text"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value.toUpperCase())}
                                placeholder="Masalan: Soliyev"
                                required
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Universitet (University)</label>
                            <input
                                type="text"
                                value={university}
                                onChange={(e) => setUniversity(e.target.value.toUpperCase())}
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
