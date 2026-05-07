'use client';

import { useLanguage } from '@/context/LanguageContext';
import styles from './ResourceList.module.css';

interface Resource {
    id: string;
    title: string;
    description?: string;
    type: string;
    url?: string;
}

interface ResourceListProps {
    resources: Resource[] | null;
}

export default function ResourceList({ resources }: ResourceListProps) {
    const { t } = useLanguage();

    if (!resources || resources.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>📚 {t.courseDetail.additionalResources}</h3>
            {/* Using a generic subtitle if not in translations, or we can add one */}
            <p className={styles.subtitle}>
                {t.shared.loading === 'Yuklanmoqda...' ? 'Darsni o\'zlashtirishga yordam beruvchi materiallar.' : 
                 t.shared.loading === 'Загрузка...' ? 'Материалы, которые помогут вам освоить этот урок.' :
                 'Materials to help you master this lesson.'}
            </p>

            <div className={styles.list}>
                {resources.map((res) => (
                    <div key={res.id} className={styles.resourceCard}>
                        <div className={styles.iconWrapper}>
                            {res.type === 'link' ? '🔗' : 
                             res.url?.toLowerCase().endsWith('.pdf') ? '📄' :
                             res.url?.toLowerCase().endsWith('.zip') || res.url?.toLowerCase().endsWith('.rar') ? '📦' :
                             res.url?.toLowerCase().endsWith('.doc') || res.url?.toLowerCase().endsWith('.docx') ? '📝' :
                             res.url?.toLowerCase().includes('.ppt') || res.url?.toLowerCase().includes('.pptx') ? '📊' :
                             '📁'}
                        </div>
                        <div className={styles.info}>
                            <h4 className={styles.resourceTitle}>{res.title}</h4>
                            {res.description && <p className={styles.resourceDesc}>{res.description}</p>}
                        </div>
                        {res.url ? (
                            <a href={res.url} target="_blank" rel="noreferrer" className={styles.downloadBtn}>
                                Open
                            </a>
                        ) : (
                            <button className={styles.downloadBtn} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                                Not Uploaded
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
