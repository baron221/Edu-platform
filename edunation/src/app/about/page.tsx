'use client';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

const milestones = [
    { year: '2020', en: 'EduNationUz founded with 10 free courses', uz: "EduNationUz 10 ta bepul kurs bilan ta'sis etildi", ru: 'EduNationUz основана с 10 бесплатными курсами' },
    { year: '2021', en: 'Reached 10,000 active learners', uz: '10,000 faol o\'quvchiga erishildi', ru: 'Достигнуто 10,000 активных студентов' },
    { year: '2022', en: 'Launched Pro subscription and mobile app', uz: 'Pro obuna va mobil ilova ishga tushirildi', ru: 'Запущена подписка Pro и мобильное приложение' },
    { year: '2023', en: '100,000 students milestone. Launched Enterprise plan.', uz: '100 000 o\'quvchi milodiyasi. Korporativ reja ishga tushirildi.', ru: 'Рубеж 100 000 студентов. Запущен корпоративный план.' },
    { year: '2024', en: '150K+ learners in 120 countries', uz: '120 mamlakatda 150K+ o\'quvchi', ru: '150K+ студентов в 120 странах' },
];

const team = [
    { name: 'Bakhromjon Tulkinov', role: { en: 'CEO & Co-Founder', uz: 'Bosh direktor va hammuassis', ru: 'Генеральный директор и соучредитель' }, avatar: 'AO', bio: { en: 'Former Stanford CS professor with 15 years of ed-tech experience.', uz: '15 yillik ta\'lim texnologiyalari tajribasiga ega sobiq Stanford CS professori.', ru: 'Бывший профессор CS Стэнфорда с 15-летним опытом в edtech.' } },
    { name: 'Liam Chen', role: { en: 'CTO & Co-Founder', uz: 'Bosh texnologiya direktori va hammuassis', ru: 'Технический директор и соучредитель' }, avatar: 'LC', bio: { en: 'Previously at Google. Built scalable learning platforms serving millions.', uz: 'Avval Google-da ishlagan. Millionlar uchun kengaytiriladigan o\'quv platformalarini qurgan.', ru: 'Ранее в Google. Создал масштабируемые учебные платформы для миллионов.' } },
    { name: 'Isabella Russo', role: { en: 'Head of Content', uz: 'Kontent rahbari', ru: 'Руководитель контента' }, avatar: 'IR', bio: { en: 'Curriculum designer who has created 200+ online courses.', uz: '200+ onlayn kurs yaratgan o\'quv dasturi dizayneri.', ru: 'Разработчик учебных программ, создавший 200+ онлайн-курсов.' } },
    { name: 'Marcus Webb', role: { en: 'Lead Instructor', uz: 'Bosh o\'qituvchi', ru: 'Ведущий преподаватель' }, avatar: 'MW', bio: { en: 'Award-winning data scientist, AI researcher, and prolific educator.', uz: 'Mukofotlangan ma\'lumotlar olimi, sun\'iy intellekt tadqiqotchisi va samarali muallim.', ru: 'Отмеченный наградами учёный по данным, исследователь ИИ и плодовитый педагог.' } },
];

export default function AboutPage() {
    const { t, language } = useLanguage();

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.orb} />
                <div className="container">
                    <div className="section-label" style={{ margin: '0 auto 24px', width: 'fit-content' }}>
                        {t.about.label}
                    </div>
                    <h1 className={styles.title}>
                        <span className="gradient-text">{t.about.title}</span>
                    </h1>
                    <p className={styles.subtitle}>{t.about.subtitle}</p>
                </div>
            </section>

            {/* Mission */}
            <section className="section">
                <div className="container">
                    <div className={styles.missionGrid}>
                        <div className={styles.missionCard}>
                            <div className={styles.missionIcon}>🎯</div>
                            <h3>{t.about.missionTitle}</h3>
                            <p>{t.about.missionDesc}</p>
                        </div>
                        <div className={styles.missionCard}>
                            <div className={styles.missionIcon}>🚀</div>
                            <h3>{t.about.visionTitle}</h3>
                            <p>{t.about.visionDesc}</p>
                        </div>
                        <div className={styles.missionCard}>
                            <div className={styles.missionIcon}>💡</div>
                            <h3>{t.about.valuesTitle}</h3>
                            <p>{t.about.valuesDesc}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className={`section ${styles.timelineSection}`}>
                <div className="container">
                    <h2 className={styles.sectionTitle}>{t.about.journeyTitle}</h2>
                    <div className={styles.timeline}>
                        {milestones.map((m, i) => (
                            <div key={i} className={styles.milestone}>
                                <div className={styles.milestoneYear}>{m.year}</div>
                                <div className={styles.milestoneDot} />
                                <div className={styles.milestoneText}>{m[language as 'en' | 'uz' | 'ru']}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="section">
                <div className="container">
                    <h2 className={styles.sectionTitle}>{t.about.teamTitle}</h2>
                    <div className="grid-4">
                        {team.map((member, i) => (
                            <div key={i} className={styles.teamCard}>
                                <div className={styles.teamAvatar}>{member.avatar}</div>
                                <h3 className={styles.teamName}>{member.name}</h3>
                                <div className={styles.teamRole}>{member.role[language as 'en' | 'uz' | 'ru']}</div>
                                <p className={styles.teamBio}>{member.bio[language as 'en' | 'uz' | 'ru']}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.ctaSection}>
                <div className="container">
                    <div className={styles.ctaBox}>
                        <h2 className={styles.ctaTitle}>{t.about.ctaTitle}</h2>
                        <p className={styles.ctaDesc}>{t.about.ctaDesc}</p>
                        <div className={styles.ctaBtns}>
                            <Link href="/signup" className="btn btn-primary btn-lg">{t.about.getStarted}</Link>
                            <Link href="/courses" className="btn btn-secondary btn-lg">{t.about.browseCourses}</Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
