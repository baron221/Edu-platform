'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './Footer.module.css';

export default function Footer() {
    const { t } = useLanguage();
    const year = new Date().getFullYear();

    return (
        <footer className={styles.footer}>
            <div className={styles.glow} />
            <div className="container">
                <div className={styles.grid}>
                    {/* Brand */}
                    <div className={styles.brand}>
                        <Link href="/" className={styles.logo}>
                            <span>🎓</span>
                            <span>EduNation<span className="gradient-text">Uz</span></span>
                        </Link>
                        <p className={styles.tagline}>{t.footer.tagline}</p>
                        <div className={styles.social}>
                            {['𝕏', '📘', '💼', '▶'].map((icon, i) => (
                                <a key={i} href="#" className={styles.socialBtn}>{icon}</a>
                            ))}
                        </div>
                    </div>

                    {/* Courses */}
                    <div className={styles.col}>
                        <h4 className={styles.colTitle}>{t.footer.courses}</h4>
                        <nav>
                            <Link href="/courses" className={styles.colLink}>{t.footer.webDev}</Link>
                            <Link href="/courses" className={styles.colLink}>{t.footer.dataScience}</Link>
                            <Link href="/courses" className={styles.colLink}>{t.footer.uiux}</Link>
                            <Link href="/courses" className={styles.colLink}>{t.footer.marketing}</Link>
                            <Link href="/courses" className={styles.colLink}>{t.footer.mobileDev}</Link>
                        </nav>
                    </div>

                    {/* Platform */}
                    <div className={styles.col}>
                        <h4 className={styles.colTitle}>{t.footer.platform}</h4>
                        <nav>
                            <Link href="/pricing" className={styles.colLink}>{t.footer.pricingPlans}</Link>
                            <Link href="/about" className={styles.colLink}>{t.footer.aboutUs}</Link>
                            <Link href="/courses" className={styles.colLink}>{t.footer.freeCourses}</Link>
                            <Link href="/signup" className={styles.colLink}>{t.footer.becomeInstructor}</Link>
                            <Link href="/about" className={styles.colLink}>{t.footer.blog}</Link>
                        </nav>
                    </div>

                    {/* Newsletter */}
                    <div className={styles.col}>
                        <h4 className={styles.colTitle}>{t.footer.stayUpdated}</h4>
                        <p className={styles.newsletterText}>{t.footer.newsletterText}</p>
                        <div className={styles.newsletter}>
                            <input
                                type="email"
                                placeholder={t.footer.emailPlaceholder}
                                className={`input ${styles.emailInput}`}
                            />
                            <button className={`btn btn-primary btn-sm ${styles.subBtn}`}>{t.footer.subscribe}</button>
                        </div>
                    </div>
                </div>

                <div className={styles.bottom}>
                    <p className={styles.copy}>{t.footer.rights.replace('{year}', String(year))}</p>
                    <div className={styles.legal}>
                        <a href="#">{t.footer.privacy}</a>
                        <a href="#">{t.footer.terms}</a>
                        <a href="#">{t.footer.cookie}</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
