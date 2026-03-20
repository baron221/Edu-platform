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
                        <div className={styles.certBorder}>
                            <div className={styles.certHeader}>
                                <h1>Certificate of Completion</h1>
                                <p>This certifies that</p>
                            </div>

                            <div className={styles.studentName}>
                                {studentName}
                            </div>

                            <div className={styles.certBody}>
                                <p>has successfully completed the course</p>
                                <h2>{courseName}</h2>
                            </div>

                            <div className={styles.certFooter}>
                                <div className={styles.signatureBlock}>
                                    <div className={styles.signatureLine}></div>
                                    <span>{instructorName}</span>
                                    <span className={styles.signatureTitle}>Instructor</span>
                                </div>
                                <div className={styles.logoBlock}>
                                    <span className={styles.logo}>🎓 EduNation</span>
                                    <span className={styles.dateText}>Issued on: {new Date(date).toLocaleDateString()}</span>
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
