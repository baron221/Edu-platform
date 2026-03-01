'use client';

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
    if (!resources || resources.length === 0) {
        return null;
    }

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>📚 Additional Resources</h3>
            <p className={styles.subtitle}>Materials to help you master this lesson.</p>

            <div className={styles.list}>
                {resources.map((res) => (
                    <div key={res.id} className={styles.resourceCard}>
                        <div className={styles.iconWrapper}>
                            {res.type === 'pdf' ? '📄' : res.type === 'assignment' ? '📝' : '🔗'}
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
