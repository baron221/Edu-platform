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
                    <div className={styles.certFrame}>
                        <div className={styles.certificate} ref={certRef}>
                            <div className={styles.watermark}>EduNation</div>
                            {/* Decorative Corners */}
                            <div className={`${styles.corner} ${styles.topL}`} />
                            <div className={`${styles.corner} ${styles.topR}`} />
                            <div className={`${styles.corner} ${styles.botL}`} />
                            <div className={`${styles.corner} ${styles.botR}`} />

                            <div className={styles.innerBorder}>
                                <div className={styles.certHeader}>
                                    <span className={styles.certLabel}>Certificate of Completion</span>
                                    <p className={styles.thisCertifies}>This certifies that</p>
                                </div>

                                <div className={styles.studentName}>
                                    {studentName}
                                </div>

                                <div className={styles.certBody}>
                                    <p className={styles.hasCompleted}>has successfully completed the course</p>
                                    <h2 className={styles.courseTitle}>{courseName}</h2>
                                </div>

                                <div className={styles.certFooter}>
                                    <div className={styles.signatureBlock}>
                                        <div className={styles.signatureText}>{instructorName}</div>
                                        <span className={styles.footerLabel}>Instructor</span>
                                    </div>

                                    <div className={styles.sealContainer}>
                                        <div className={styles.goldenSeal}>
                                            <div className={styles.sealInner}>
                                                <span className={styles.sealLogo}>🎓</span>
                                                <span className={styles.sealText}>Official Seal</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.signatureBlock}>
                                        <div className={styles.signatureText}>
                                            {new Date(date).toLocaleDateString()}
                                        </div>
                                        <span className={styles.footerLabel}>Date Issued</span>
                                    </div>
                                </div>

                                <div className={styles.bottomMeta}>
                                    <div className={styles.certId}>ID: EDU-{Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                                    <div className={styles.verifyText}>Verify at: edunation.uz/verify</div>
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
