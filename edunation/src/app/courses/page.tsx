'use client';
import { useState, useEffect, useCallback } from 'react';
import CourseCard from '@/components/CourseCard';
import { useLanguage } from '@/context/LanguageContext';
import styles from './page.module.css';

const CATEGORIES = [
    { name: 'All', icon: '🌟' },
    { name: 'Web Development', icon: '💻' },
    { name: 'Data Science', icon: '🤖' },
    { name: 'Design', icon: '🎨' },
    { name: 'Marketing', icon: '📢' },
    { name: 'Mobile Development', icon: '📱' },
    { name: 'Business', icon: '💼' },
];

export interface CourseDB {
    id: string;
    title: string;
    instructor: string;
    category: string;
    level: string;
    price: number;
    isFree: boolean;
    isNew: boolean;
    description: string | null;
    slug: string;
    _count: { lessons: number; enrollments: number };
}

export default function CoursesPage() {
    const { t } = useLanguage();
    const [courses, setCourses] = useState<CourseDB[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState('All');
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'free' | 'premium'>('all');

    const fetchCourses = useCallback(() => {
        setLoading(true);
        const params = new URLSearchParams();
        if (activeCategory !== 'All') params.set('category', activeCategory);
        if (search) params.set('search', search);
        if (filter === 'free') params.set('free', 'true');
        if (filter === 'premium') params.set('free', 'false');

        fetch(`/api/courses?${params}`)
            .then(r => r.json())
            .then(data => { setCourses(data); setLoading(false); });
    }, [activeCategory, search, filter]);

    useEffect(() => {
        const timer = setTimeout(fetchCourses, search ? 300 : 0);
        return () => clearTimeout(timer);
    }, [fetchCourses, search]);

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
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.name}
                                    className={`${styles.catBtn} ${activeCategory === cat.name ? styles.catActive : ''}`}
                                    onClick={() => setActiveCategory(cat.name)}
                                >
                                    <span>{cat.icon}</span> {cat.name}
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
                            {loading ? 'Loading...' : <>{t.courses.showing} <strong>{courses.length}</strong>{' '}
                                {courses.length === 1 ? t.courses.course : t.courses.courses}
                                {activeCategory !== 'All' ? ` ${t.courses.in} ${activeCategory}` : ''}</>}
                        </p>
                    </div>

                    {!loading && courses.length > 0 ? (
                        <div className="grid-3">
                            {courses.map(c => <CourseCard key={c.id} course={c} />)}
                        </div>
                    ) : !loading ? (
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
                    ) : (
                        <div className={styles.loadingGrid}>
                            {[...Array(6)].map((_, i) => <div key={i} className={styles.skeleton} />)}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
