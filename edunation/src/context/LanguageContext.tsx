'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, translations } from '@/lib/translations';

// Use a looser type so all 3 language objects are compatible
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type T = any;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: T;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'en',
    setLanguage: () => { },
    t: translations.en,
});

export function LanguageProvider({ children, initialLanguage = 'en' }: { children: ReactNode; initialLanguage?: Language }) {
    const [language, setLanguageState] = useState<Language>(initialLanguage);

    useEffect(() => {
        // Synchronize state if the server-provided initialLanguage changed (rare)
        if (initialLanguage !== language) {
            setLanguageState(initialLanguage);
        }
    }, [initialLanguage]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('edunation-lang', lang);
        // Set cookie for server-side detection (1 year)
        document.cookie = `edunation-lang=${lang}; path=/; max-age=${60 * 60 * 24 * 365}`;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    return useContext(LanguageContext);
}
