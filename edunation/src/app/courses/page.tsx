'use client';
import { useState } from 'react';
import CourseCard from '@/components/CourseCard';
import { courses, categories } from '@/lib/data';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

export default function CoursesPage() {
    const { t } = useLanguage();
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

    const filtered = courses.filter(c => {
        const matchCat = activeCategory === 'All' || c.category === activeCategory;
        const matchSearch =
            c.title.toLowerCase().includes(search.toLowerCase()) ||
            c.instructor.toLowerCase().includes(search.toLowerCase()) ||
            c.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));
        const matchFilter =
            filter === 'all' ? true :
                filter === 'free' ? c.isFree :
                    !c.isFree;
        return matchCat && matchSearch && matchFilter;
    });

    return (
        <div className={styles.page}>
            {/* Header */}
            <section className={styles.header}>
                <div className={styles.headerBg} />
                <div className="container">
                    <div className="section-label">{t.courses.label}</div>
                    <h1 className={styles.title}>
                        {t.courses.title1} <span className="gradient-text">{t.courses.titleGrad}</span> {t.courses.title2}
                    </h1>
                    <p className={styles.subtitle}>{t.courses.subtitle}</p>

                    <div className={styles.searchBar}>
                        <span className={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            className={`input ${styles.searchInput}`}
                            placeholder={t.courses.searchPlaceholder}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            {/* Filters */}
            <div className={styles.filtersBar}>
                <div className="container">
                    <div className={styles.filtersInner}>
                        <div className={styles.categories}>
                            {categories.map(cat => (
                                <button
                                    key={cat.name}
                                    className={`${styles.catBtn} ${activeCategory === cat.name ? styles.catActive : ''}`}
                                    onClick={() => setActiveCategory(cat.name)}
                                >
                                    <span>{cat.icon}</span> {cat.name}
                                    <span className={styles.catCount}>{cat.count}</span>
                                </button>
                            ))}
                        </div>

                        <div className={styles.typeFilter}>
                            {(['all', 'free', 'premium'] as const).map(f => (
                                <button
                                    key={f}
                                    className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                                    onClick={() => setFilter(f)}
                                >
                                    {f === 'all' ? t.courses.allFilter :
                                        f === 'free' ? t.courses.freeFilter :
                                            t.courses.premiumFilter}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Results */}
            <section className={styles.results}>
                <div className="container">
                    <div className={styles.resultsHeader}>
                        <p className={styles.resultCount}>
                            {t.courses.showing} <strong>{filtered.length}</strong>{' '}
                            {filtered.length === 1 ? t.courses.course : t.courses.courses}
                            {activeCategory !== 'All' ? ` ${t.courses.in} ${activeCategory}` : ''}
                        </p>
                    </div>

                    {filtered.length > 0 ? (
                        <div className="grid-3">
                            {filtered.map(c => <CourseCard key={c.id} course={c} />)}
                        </div>
                    ) : (
                        <div className={styles.empty}>
                            <div className={styles.emptyIcon}>🔍</div>
                            <h3>{t.courses.noCoursesTitle}</h3>
                            <p>{t.courses.noCoursesDesc}</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => { setSearch(''); setActiveCategory('All'); setFilter('all'); }}
                            >
                                {t.courses.clearFilters}
                            </button>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
