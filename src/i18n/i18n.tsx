import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations, TranslationKey } from './index';

export type Lang = keyof typeof translations;

export const LANGS: { code: Lang; label: string; flag: string; dir: 'rtl' | 'ltr' }[] = [
  { code: 'ar', label: 'العربية', flag: '🇹🇳', dir: 'rtl' },
  { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'th', label: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
];

const STORAGE_KEY = 'mustakshif:lang';

const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(translations, value);

const readStoredLang = (): Lang => {
  try {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (isLang(stored)) return stored;
  } catch {
    // localStorage unavailable (private mode, etc.)
  }
  return 'ar';
};

interface I18nContextValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  flag: string;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(readStoredLang);
  const meta = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore persistence failures
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('lang', lang);
    root.setAttribute('dir', meta.dir);
  }, [lang, meta.dir]);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = translations[lang] as Record<string, string>;
      return dict[key] ?? translations.ar[key] ?? key;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, dir: meta.dir, flag: meta.flag, setLang, t }),
    [lang, meta.dir, meta.flag, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
};

export const useT = () => useI18n().t;
