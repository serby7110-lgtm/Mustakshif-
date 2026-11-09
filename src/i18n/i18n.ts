import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './index';

export type Language = 'ar' | 'id' | 'th';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('lang');
    return (saved === 'ar' || saved === 'id' || saved === 'th') ? saved : 'ar';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setLang = (newLang: Language) => setLangState(newLang);

  const t = (key: string): string => {
    const dict = translations[lang] || translations.ar;
    return (dict as any)[key] || (translations.ar as any)[key] || key;
  };

  /*
  <I18nContext.Provider value={{ lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' }}>
    {children}
  </I18nContext.Provider>
  */
  return React.createElement(
    I18nContext.Provider,
    { value: { lang, setLang, t, dir: lang === 'ar' ? 'rtl' : 'ltr' } },
    children
  );
};

export const useTranslation = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
};

export interface LanguageMeta {
  dir: 'rtl' | 'ltr';
  lang: Language;
  label: string;
  flag: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { dir: 'rtl', lang: 'ar', label: 'العربية', flag: '🇹🇳' },
  { dir: 'ltr', lang: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { dir: 'ltr', lang: 'th', label: 'ไทย', flag: '🇹🇭' },
];
