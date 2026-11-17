import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ar from './locales/ar.json';
import en from './locales/en.json';
import id from './locales/id.json';
import th from './locales/th.json';

export const SUPPORTED_LANGS = ['ar', 'en', 'id', 'th'] as const;
export type AppLang = (typeof SUPPORTED_LANGS)[number];
export const LANG_STORAGE_KEY = 'mustakshif:lang';

export interface AppLanguageOption {
  code: AppLang;
  lang: AppLang;
  label: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export const APP_LANGUAGES: AppLanguageOption[] = [
  { code: 'ar', lang: 'ar', label: 'العربية', nativeName: 'العربية', flag: '🇹🇳', dir: 'rtl' },
  { code: 'en', lang: 'en', label: 'English', nativeName: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'id', lang: 'id', label: 'Bahasa Indonesia', nativeName: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
  { code: 'th', lang: 'th', label: 'ไทย', nativeName: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
];

export function normalizeLang(raw?: string | null): AppLang {
  if (!raw || typeof raw !== 'string') return 'ar';
  const base = raw.toLowerCase().split(/[-_]/)[0];
  if (base === 'ar' || base === 'en' || base === 'id' || base === 'th') {
    return base;
  }
  return 'ar';
}

export function getLangDirection(lang: AppLang): 'rtl' | 'ltr' {
  return lang === 'ar' ? 'rtl' : 'ltr';
}

export function applyDocumentLanguage(lang: AppLang): void {
  if (typeof document === 'undefined') return;
  const dir = getLangDirection(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = dir;
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.setAttribute('dir', dir);
}

const isBrowser = typeof window !== 'undefined';
export const isDevMode = Boolean((import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV);

export function createMissingKeyHandler(devFlag: boolean) {
  return (lngs: readonly string[], ns: string, key: string, fallbackValue: string): void => {
    if (!devFlag) return;
    const langsText = Array.isArray(lngs) ? lngs.join(', ') : String(lngs ?? '');
    console.warn(
      `[i18n] Missing translation key: "${key}" (lng: ${langsText}, ns: ${ns})`,
      fallbackValue ? { fallbackValue } : ''
    );
  };
}

if (!i18n.isInitialized) {
  if (isBrowser) {
    i18n.use(LanguageDetector);
  }
  i18n.use(initReactI18next).init({
    resources: {
      ar: { translation: ar },
      en: { translation: en },
      id: { translation: id },
      th: { translation: th },
    },
    ...(isBrowser ? {} : { lng: 'ar' }),
    fallbackLng: 'ar',
    supportedLngs: [...SUPPORTED_LANGS],
    load: 'languageOnly',
    nonExplicitSupportedLngs: true,
    saveMissing: isDevMode,
    missingKeyHandler: createMissingKeyHandler(isDevMode),
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANG_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });
}

applyDocumentLanguage(normalizeLang(i18n.resolvedLanguage || i18n.language));

i18n.on('languageChanged', (lng) => {
  const normalized = normalizeLang(lng);
  applyDocumentLanguage(normalized);
  if (isBrowser) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, normalized);
    } catch (err) {
      console.warn('[i18n] Failed to persist language preference:', err);
    }
  }
});

export function changeAppLanguage(lang: AppLang): Promise<unknown> {
  const normalized = normalizeLang(lang);
  applyDocumentLanguage(normalized);
  if (isBrowser) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, normalized);
    } catch (err) {
      console.warn('[i18n] Failed to save language preference:', err);
    }
  }
  return i18n.changeLanguage(normalized);
}

export default i18n;
