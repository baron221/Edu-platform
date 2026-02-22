'use client';
import Link from 'next/link';
import CourseCard from '@/components/CourseCard';
import { courses, plans } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

function formatUZS(price: number, currLabel: string) {
  if (price === 0) return '';
  return `${price.toLocaleString('ru-RU')} ${currLabel}`;
}

export default function HomePage() {
  const { t } = useLanguage();
  const featuredCourses = courses.slice(0, 3);
  const freeCourses = courses.filter(c => c.isFree);

  return (
    <div className={styles.page}>
      {/* ========== HERO ========== */}
      <section className={styles.hero}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
        <div className={styles.grid} />

        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span>🚀</span> {t.home.heroBadge}
            </div>

            <h1 className={styles.heroTitle}>
              {t.home.heroTitle1}{' '}
              <span className="gradient-text">{t.home.heroTitleGrad}</span>
            </h1>

            <p className={styles.heroSubtitle}>{t.home.heroSubtitle}</p>

            <div className={styles.heroCta}>
              <Link href="/courses" className="btn btn-primary btn-lg">
                {t.home.browseCourses}
              </Link>
              <Link href="/pricing" className="btn btn-secondary btn-lg">
                {t.home.viewPlans}
              </Link>
            </div>

            <div className={styles.socialProof}>
              <div className={styles.avatarStack}>
                {['AJ', 'SC', 'MW', 'JR'].map((a, i) => (
                  <div key={i} className={styles.avatar} style={{ zIndex: 4 - i }}>{a}</div>
                ))}
              </div>
              <p><strong>4.9/5</strong> {t.home.ratingText}</p>
            </div>
          </div>

          {/* Hero Visual */}
          <div className={styles.heroVisual}>
            <div className={styles.floatingCard1}>
              <div className={styles.fcIcon}>🎯</div>
              <div>
                <div className={styles.fcLabel}>{t.home.todayGoal}</div>
                <div className={styles.fcValue}>React Hooks</div>
                <div className="progress-bar" style={{ marginTop: '8px' }}>
                  <div className="progress-fill" style={{ width: '68%' }} />
                </div>
                <div className={styles.fcSub}>{t.home.goalProgress}</div>
              </div>
            </div>

            <div className={styles.floatingCard2}>
              <div className={styles.fcIcon2}>🏆</div>
              <div>
                <div className={styles.fcLabel}>{t.home.congrats}</div>
                <div className={styles.fcValue}>{t.home.courseCompleted}</div>
                <div className={styles.fcSub}>UI/UX Design Masterclass</div>
              </div>
            </div>

            <div className={styles.floatingCard3}>
              <div className={styles.fcBig}>500+</div>
              <div className={styles.fcLabel}>{t.home.videoCourses}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <section className={styles.statsSection}>
        <div className="container">
          <div className={styles.statsGrid}>
            {(t.stats as { value: string; label: string }[]).map((stat, i) => (
              <div key={i} className={styles.statItem}>
                <div className={styles.statValue}>{stat.value}</div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FREE COURSES ========== */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <div className="section-label">{t.home.freeSection}</div>
              <h2 className="section-title">
                {t.home.freeSectionTitle1} <span className="gradient-text">{t.home.freeSectionTitleGrad}</span>
              </h2>
              <p className="section-subtitle">{t.home.freeSectionSubtitle}</p>
            </div>
            <Link href="/courses" className="btn btn-outline">{t.home.viewAllFree}</Link>
          </div>

          <div className="grid-3">
            {freeCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* ========== FEATURES ========== */}
      <section className={`section ${styles.featuresSection}`}>
        <div className={styles.featuresBg} />
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="section-label" style={{ margin: '0 auto 20px' }}>{t.home.whyLabel}</div>
            <h2 className="section-title">
              {t.home.whyTitle1} <span className="gradient-text">{t.home.whyTitleGrad}</span>
            </h2>
          </div>

          <div className="grid-3">
            {(t.home.features as { icon: string; title: string; desc: string }[]).map((f, i) => (
              <div key={i} className={styles.featureCard}>
                <div className={styles.featureIcon}>{f.icon}</div>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== POPULAR COURSES ========== */}
      <section className="section">
        <div className="container">
          <div className={styles.sectionHead}>
            <div>
              <div className="section-label">{t.home.popularLabel}</div>
              <h2 className="section-title">
                {t.home.popularTitle1} <span className="gradient-text">{t.home.popularTitleGrad}</span>
              </h2>
            </div>
            <Link href="/courses" className="btn btn-outline">{t.home.seeAll}</Link>
          </div>

          <div className="grid-3">
            {featuredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING PREVIEW ========== */}
      <section className={`section ${styles.pricingSection}`}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="section-label" style={{ margin: '0 auto 20px' }}>{t.home.pricingLabel}</div>
            <h2 className="section-title">
              {t.home.pricingTitle1} <span className="gradient-text">{t.home.pricingTitleGrad}</span>
            </h2>
            <p className="section-subtitle" style={{ margin: '0 auto' }}>{t.home.pricingSubtitle}</p>
          </div>

          <div className={styles.pricingCards}>
            {plans.map(plan => (
              <div
                key={plan.id}
                className={`${styles.pricingCard} ${plan.popular ? styles.pricingPopular : ''}`}
                style={{ '--plan-color': plan.color } as React.CSSProperties}
              >
                {plan.popular && <div className={styles.popularBadge}>Most Popular</div>}
                <div className={styles.planName}>{plan.name}</div>
                <div className={styles.planPrice}>
                  {plan.price === 0
                    ? <span className={styles.planAmount}>{t.shared.free}</span>
                    : <><span className={styles.planAmount}>{formatUZS(plan.price, t.shared.currency)}</span><span className={styles.planPer}>{t.shared.mo}</span></>
                  }
                </div>
                <ul className={styles.planFeatures}>
                  {(plan.features as string[]).slice(0, 4).map((f, i) => (
                    <li key={i}><span className={styles.checkIcon}>✓</span>{f}</li>
                  ))}
                </ul>
                <Link
                  href={plan.id === 'enterprise' ? '/about' : '/signup'}
                  className={`btn ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '24px' }}
                >
                  {t.planCta[plan.ctaKey as 'free' | 'pro' | 'enterprise']}
                </Link>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <Link href="/pricing" className="btn btn-outline">{t.home.compareFeatures}</Link>
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <div className="section-label" style={{ margin: '0 auto 20px' }}>{t.home.testimonialLabel}</div>
            <h2 className="section-title">
              {t.home.testimonialTitle1} <span className="gradient-text">{t.home.testimonialTitleGrad}</span>
            </h2>
          </div>

          <div className="grid-4">
            {[
              { id: 1, name: 'Ryan Mitchell', role: 'Frontend Developer at Google', avatar: 'RM', rating: 5, text: t.language === 'uz' ? "EduNation mening kareramni to'liq o'zgartirdi. React kursi juda chuqur bo'lib, 3 oyda Google'da orzuimdagi ishga kirdim!" : t.language === 'ru' ? 'EduNation полностью изменил мою карьеру. Курс React был невероятно глубоким, и через 3 месяца я получил работу мечты в Google!' : 'EduNation completely transformed my career. The React course was incredibly in-depth, and within 3 months I landed my dream job at Google!', course: 'React 18 Mastery' },
              { id: 2, name: 'Fatima Al-Hassan', role: 'UX Designer at Apple', avatar: 'FA', rating: 5, text: t.language === 'uz' ? "UI/UX dizayn kursi ajoyib. Sarah's ta'lim uslubi juda aniq va qiziqarli. Noldan to'liq portfolio qurishgacha yetdim." : t.language === 'ru' ? 'Курс UI/UX дизайна феноменален. Стиль преподавания Сары такой ясный и увлекательный. Я прошла путь от нуля до полного портфолио.' : "The UI/UX design course is phenomenal. Sarah's teaching style is so clear and engaging. I went from zero to building a full portfolio.", course: 'UI/UX Design Masterclass' },
              { id: 3, name: 'Carlos Mendez', role: 'Data Scientist at Netflix', avatar: 'CM', rating: 5, text: t.language === 'uz' ? "Python AI bootcamp hech shubhasiz eng yaxshi ML kursi. Dr. Webb murakkab tushunchalarni juda aniq tushuntiradi. Maoshim ikki barobarga o'sdi!" : t.language === 'ru' ? 'Буткемп Python AI — бесспорно лучший курс по ML. Доктор Вебб объясняет сложные концепции с такой ясностью. Моя зарплата удвоилась!' : 'The Python AI bootcamp is hands-down the best ML course available. My salary doubled after completing it.', course: 'Python & AI Bootcamp' },
              { id: 4, name: 'Yuki Tanaka', role: 'Full-Stack Engineer at Stripe', avatar: 'YT', rating: 5, text: t.language === 'uz' ? "Pro rejaga obuna bo'ldim va bu ajoyib narx! Netflix obunasidan ham arzonroq narxda barcha kurslarga kirish. 3 ta to'liq loyiha qurib, ishga oldim!" : t.language === 'ru' ? 'Подписался на план Pro — это невероятная ценность. Доступ ко всем курсам дешевле подписки на Netflix. Построил 3 проекта и устроился!' : 'Subscribed to the Pro plan and it\'s insane value. Access to all courses for less than a Netflix subscription. Built 3 projects and got hired!', course: 'Next.js Full-Stack' },
            ].map(testimonial => (
              <div key={testimonial.id} className={styles.testimonialCard}>
                <div className={styles.testimonialQuote}>"</div>
                <p className={styles.testimonialText}>{testimonial.text}</p>
                <div className={styles.testimonialMeta}>
                  <div className={styles.testimonialAvatar}>{testimonial.avatar}</div>
                  <div>
                    <div className={styles.testimonialName}>{testimonial.name}</div>
                    <div className={styles.testimonialRole}>{testimonial.role}</div>
                  </div>
                </div>
                <div className={styles.testimonialStars}>{'★'.repeat(testimonial.rating)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA BANNER ========== */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaOrb} />
        <div className="container">
          <div className={styles.ctaContent}>
            <h2 className={styles.ctaTitle}>
              {t.home.ctaTitle1} <span className="gradient-text">{t.home.ctaTitleGrad}</span>
            </h2>
            <p className={styles.ctaSubtitle}>{t.home.ctaSubtitle}</p>
            <div className={styles.ctaButtons}>
              <Link href="/signup" className="btn btn-primary btn-lg">{t.home.startLearning}</Link>
              <Link href="/courses" className="btn btn-secondary btn-lg">{t.home.browseCoursesCta}</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
