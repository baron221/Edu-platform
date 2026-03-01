'use client';
import { useState } from 'react';
import styles from './StarRating.module.css';

interface Props {
    value: number;           // current rating (0–5)
    onChange?: (val: number) => void;  // if provided, interactive
    size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ value, onChange, size = 'md' }: Props) {
    const [hovered, setHovered] = useState(0);
    const interactive = !!onChange;
    const display = hovered || value;

    return (
        <div
            className={`${styles.stars} ${styles[size]} ${interactive ? styles.interactive : ''}`}
            role={interactive ? 'group' : undefined}
            aria-label={`Rating: ${value} out of 5`}
        >
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    type="button"
                    className={`${styles.star} ${display >= star ? styles.filled : styles.empty}`}
                    onClick={() => onChange?.(star)}
                    onMouseEnter={() => interactive && setHovered(star)}
                    onMouseLeave={() => interactive && setHovered(0)}
                    disabled={!interactive}
                    aria-label={`Rate ${star} out of 5`}
                >
                    ★
                </button>
            ))}
        </div>
    );
}
