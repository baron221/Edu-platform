'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

interface CertData {
    course: { title: string; category: string; instructor: string };
    user: { name: string };
    issuedAt: string;
    id: string;
}

export default function CertificatePage() {
    const { id } = useParams() as { id: string };
    const { t } = useLanguage();
    const tr = t.certificate;
    const [cert, setCert] = useState<CertData | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        fetch(`/api/certificates/public?id=${id}`)
            .then(r => { if (!r.ok) { setNotFound(true); return null; } return r.json(); })
            .then(d => d && setCert(d));
    }, [id]);

    if (notFound) return (
        <div className={styles.page} style={{ justifyContent: 'center', alignItems: 'center', display: 'flex' }}>
            <div style={{ color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 60 }}>🔍</div>
                <h2>Certificate not found</h2>
            </div>
        </div>
    );

    if (!cert) return (
        <div className={styles.page} style={{ justifyContent: 'center', display: 'flex' }}>
            <div style={{ color: 'white', marginTop: 100 }}>{t.shared.loading}</div>
        </div>
    );

    const issuedDate = new Date(cert.issuedAt).toLocaleDateString(
        t.shared.currency === 'UZS' ? 'uz-UZ' : t.shared.currency === 'сум' ? 'uz-UZ' : 'ru-RU',
        { year: 'numeric', month: 'long', day: 'numeric' }
    );

    return (
        <div className={styles.page}>
            <div className={styles.actions}>
                <Link href="/dashboard" className={styles.backLink}>{tr.back}</Link>
                <button className={styles.printBtn} onClick={() => window.print()}>{tr.print}</button>
            </div>

            <div className={styles.cert} id="certificate">
                <div className={styles.topAccent} />

                <div className={styles.platformRow}>
                    <span className={styles.platformLogo}>🎓</span>
                    <span className={styles.platformName}>EduNationUz</span>
                </div>

                <div className={styles.label}>{tr.label}</div>
                <p className={styles.thisIs}>{tr.thisIs}</p>
                <h1 className={styles.studentName}>{cert.user.name || 'Dedicated Learner'}</h1>
                <p className={styles.hasCompleted}>{tr.hasCompleted}</p>
                <h2 className={styles.courseTitle}>{cert.course.title}</h2>

                <div className={styles.courseMeta}>
                    <span className={styles.category}>{cert.course.category}</span>
                </div>

                <div className={styles.divider} />

                <div className={styles.footer}>
                    <div className={styles.footerCol}>
                        <div className={styles.footerValue}>{issuedDate}</div>
                        <div className={styles.footerLabel}>{tr.dateIssued}</div>
                    </div>
                    <div className={styles.seal}>
                        <span className={styles.sealEmoji}>🏅</span>
                    </div>
                    <div className={styles.footerCol}>
                        <div className={styles.footerValue}>{cert.course.instructor}</div>
                        <div className={styles.footerLabel}>{tr.instructor}</div>
                    </div>
                </div>

                <div className={styles.certId}>{tr.certId}: {cert.id}</div>
                <div className={styles.bottomAccent} />
            </div>
        </div>
    );
}
