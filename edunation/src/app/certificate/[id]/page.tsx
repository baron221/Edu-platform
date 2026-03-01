import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import styles from './page.module.css';
import type { Metadata } from 'next';
import Link from 'next/link';

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const cert = await prisma.certificate.findUnique({
        where: { id },
        include: { course: true, user: { select: { name: true } } }
    });
    if (!cert) return { title: 'Certificate Not Found' };
    return {
        title: `Certificate of Completion – ${cert.course.title}`,
        description: `${cert.user.name} has successfully completed ${cert.course.title} on EduNationUz.`,
    };
}

export default async function CertificatePage({ params }: Props) {
    const { id } = await params;

    const cert = await prisma.certificate.findUnique({
        where: { id },
        include: {
            course: { select: { title: true, category: true, instructor: true } },
            user: { select: { name: true } }
        }
    });

    if (!cert) return notFound();

    const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    return (
        <div className={styles.page}>
            <div className={styles.actions}>
                <Link href="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>
                <button className={styles.printBtn} onClick={() => { }} id="print-cert-btn">
                    🖨️ Print / Save as PDF
                </button>
            </div>

            <div className={styles.cert} id="certificate">
                {/* Top border accent */}
                <div className={styles.topAccent} />

                {/* Logo / Platform name */}
                <div className={styles.platformRow}>
                    <span className={styles.platformLogo}>🎓</span>
                    <span className={styles.platformName}>EduNationUz</span>
                </div>

                <div className={styles.label}>Certificate of Completion</div>

                <p className={styles.thisIs}>This is to certify that</p>

                <h1 className={styles.studentName}>{cert.user.name || 'Dedicated Learner'}</h1>

                <p className={styles.hasCompleted}>has successfully completed the course</p>

                <h2 className={styles.courseTitle}>{cert.course.title}</h2>

                <div className={styles.courseMeta}>
                    <span className={styles.category}>{cert.course.category}</span>
                </div>

                <div className={styles.divider} />

                <div className={styles.footer}>
                    <div className={styles.footerCol}>
                        <div className={styles.footerValue}>{issuedDate}</div>
                        <div className={styles.footerLabel}>Date Issued</div>
                    </div>
                    <div className={styles.seal}>
                        <span className={styles.sealEmoji}>🏅</span>
                    </div>
                    <div className={styles.footerCol}>
                        <div className={styles.footerValue}>{cert.course.instructor}</div>
                        <div className={styles.footerLabel}>Instructor</div>
                    </div>
                </div>

                <div className={styles.certId}>Certificate ID: {cert.id}</div>

                <div className={styles.bottomAccent} />
            </div>

            {/* Print script */}
            <script dangerouslySetInnerHTML={{
                __html: `
                document.getElementById('print-cert-btn').addEventListener('click', function() {
                    window.print();
                });
            `}} />
        </div>
    );
}
