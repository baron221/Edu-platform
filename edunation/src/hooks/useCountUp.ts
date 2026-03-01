'use client';
import { useState, useEffect, useRef } from 'react';

export function useCountUp(target: number, duration = 1800, start = false) {
    const [value, setValue] = useState(0);
    const raf = useRef<number | null>(null);

    useEffect(() => {
        if (!start || target === 0) return;
        const startTime = performance.now();
        const startVal = 0;

        const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        function tick(now: number) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            setValue(Math.round(startVal + (target - startVal) * ease(progress)));
            if (progress < 1) raf.current = requestAnimationFrame(tick);
        }

        raf.current = requestAnimationFrame(tick);
        return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    }, [target, duration, start]);

    return value;
}

export function useInView(ref: React.RefObject<HTMLElement | null>) {
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setInView(true); },
            { threshold: 0.2 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref]);

    return inView;
}
