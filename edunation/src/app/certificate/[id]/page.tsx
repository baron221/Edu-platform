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
                <button className={styles.printBtn} onClick={() => window.print()}>
                    <span>🖨️</span> {tr.print}
                </button>
            </div>

            <div className={styles.certFrame}>
                <div className={styles.cert} id="certificate">
                    <div className={styles.guilloche} />
                    
                    {/* Decorative Corner Ornaments - SVG for premium look */}
                    <svg className={`${styles.ornament} ${styles.topL}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10V40M10 10H40M10 10L30 30" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="10" cy="10" r="2" fill="#b8860b"/>
                    </svg>
                    <svg className={`${styles.ornament} ${styles.topR}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10V40M10 10H40M10 10L30 30" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="10" cy="10" r="2" fill="#b8860b"/>
                    </svg>
                    <svg className={`${styles.ornament} ${styles.botL}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10V40M10 10H40M10 10L30 30" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="10" cy="10" r="2" fill="#b8860b"/>
                    </svg>
                    <svg className={`${styles.ornament} ${styles.botR}`} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 10V40M10 10H40M10 10L30 30" stroke="#b8860b" strokeWidth="2" strokeLinecap="round"/>
                        <circle cx="10" cy="10" r="2" fill="#b8860b"/>
                    </svg>

                    <div className={styles.innerBorder}>
                        <div className={styles.platformRow}>
                            <img src="/images/logo.png" alt="NPUU Logo" className={styles.logoImg} />
                            <span className={styles.platformName}>EduNationUz</span>
                        </div>

                        <div className={styles.content}>
                            <div className={styles.label}>{tr.label}</div>
                            <h1 className={styles.mainTitle}>Completion</h1>
                            <p className={styles.thisIs}>{tr.thisIs}</p>
                            <h2 className={styles.studentName}>{cert.user.name || 'Dedicated Learner'}</h2>
                            <p className={styles.hasCompleted}>{tr.hasCompleted}</p>
                            <h3 className={styles.courseTitle}>{cert.course.title}</h3>
                            <div className={styles.categoryBadge}>{cert.course.category}</div>
                        </div>

                        <div className={styles.footer}>
                            <div className={styles.signatureRow}>
                                <div className={styles.signer}>
                                    <div className={styles.signatureSlot}>
                                        <div className={styles.signatureText}>{cert.course.instructor}</div>
                                    </div>
                                    <div className={styles.footerLabel}>{tr.instructor}</div>
                                </div>

                                <div className={styles.sealContainer}>
                                    <div className={styles.goldenSeal}>
                                        <div className={styles.sealInner}>
                                            <span className={styles.sealLogo}>🏅</span>
                                            <div className={styles.sealText}>Official<br/>Certified</div>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.signer}>
                                    <div className={styles.signatureSlot}>
                                        <div className={styles.verifDate}>{issuedDate}</div>
                                    </div>
                                    <div className={styles.footerLabel}>{tr.dateIssued}</div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.bottomMeta}>
                            <div className={styles.certId}>{tr.certId}: {cert.id}</div>
                            <div className={styles.verifyLink}>Verify authenticity at: <b>edunation.uz/verify</b></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
