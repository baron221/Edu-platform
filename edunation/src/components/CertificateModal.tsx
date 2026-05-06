import { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import styles from './CertificateModal.module.css';

interface CertificateProps {
    courseName: string;
    studentName: string;
    instructorName: string;
    date: string;
    onClose: () => void;
}

export default function CertificateModal({ courseName, studentName, instructorName, date, onClose }: CertificateProps) {
    const [downloading, setDownloading] = useState(false);
    const certRef = useRef<HTMLDivElement>(null);

    const handleDownload = async () => {
        if (!certRef.current) return;
        setDownloading(true);
        try {
            const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true });
            const imgData = canvas.toDataURL('image/png');

            // A4 landscape dimensions
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`${courseName.replace(/\s+/g, '_')}_Certificate.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>✕</button>

                <h2 className={styles.modalTitle}>Congratulations! 🎉</h2>
                <p className={styles.modalText}>You have successfully completed <strong>{courseName}</strong>. Here is your official certificate!</p>

                {/* The Certificate Preview that will be screenshotted */}
                <div className={styles.certWrapper}>
                    <div className={styles.certificate} ref={certRef}>
                        <div className={styles.guilloche} />
                        
                        {/* Decorative Corner Ornaments */}
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
                                <img src="/images/logo.png" alt="Logo" className={styles.logoImg} />
                                <span className={styles.platformName}>EduNationUz</span>
                            </div>

                            <div className={styles.content}>
                                <div className={styles.label}>Certificate of Completion</div>
                                <h1 className={styles.mainTitle}>Completion</h1>
                                <p className={styles.thisIs}>This is to certify that</p>
                                <h2 className={styles.studentName}>{studentName}</h2>
                                <p className={styles.hasCompleted}>has successfully completed the course</p>
                                <h3 className={styles.courseTitle}>{courseName}</h3>
                            </div>

                            <div className={styles.footer}>
                                <div className={styles.signatureRow}>
                                    <div className={styles.signer}>
                                        <div className={styles.signatureSlot}>
                                            <div className={styles.signatureText}>{instructorName}</div>
                                        </div>
                                        <div className={styles.footerLabel}>Instructor</div>
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
                                            <div className={styles.verifDate}>{new Date(date).toLocaleDateString()}</div>
                                        </div>
                                        <div className={styles.footerLabel}>Date Issued</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.actions}>
                    <button className={styles.downloadBtn} onClick={handleDownload} disabled={downloading}>
                        {downloading ? 'Generating PDF...' : '⬇️ Download as PDF'}
                    </button>
                </div>
            </div>
        </div>
    );
}
