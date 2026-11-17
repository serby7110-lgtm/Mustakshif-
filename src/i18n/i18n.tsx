import React, { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { I18nextProvider, useTranslation as useReactI18next } from 'react-i18next';
import i18nInstance, {
  APP_LANGUAGES,
  AppLang,
  applyDocumentLanguage,
  changeAppLanguage,
  getLangDirection,
  normalizeLang,
} from '../i18n';
import { translations, TranslationKey } from './index';

export type Lang = AppLang;
export type Language = Lang;

export interface LanguageMeta {
  code: Lang;
  lang: Lang;
  label: string;
  nativeName: string;
  flag: string;
  dir: 'rtl' | 'ltr';
}

export const LANGS: LanguageMeta[] = APP_LANGUAGES;
export const LANGUAGES = LANGS;

export type AnyTranslationKey = TranslationKey | (string & {});

export interface I18nContextValue {
  lang: Lang;
  dir: 'rtl' | 'ltr';
  flag: string;
  setLang: (lang: Lang) => void;
  t: (key: AnyTranslationKey, options?: Record<string, unknown>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const I18nBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t: i18nextT, i18n } = useReactI18next();
  const lang = normalizeLang(i18n.resolvedLanguage || i18n.language);
  const meta = LANGS.find((l) => l.code === lang) ?? LANGS[0];
  const dir = getLangDirection(lang);

  useEffect(() => {
    applyDocumentLanguage(lang);
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    void changeAppLanguage(next);
  }, []);

  const t = useCallback(
    (key: AnyTranslationKey, options?: Record<string, unknown>): string => {
      if (i18n.exists(key)) {
        return String(i18nextT(key, options as Record<string, string | number>));
      }
      const legacyDict = translations[lang] as Record<string, string>;
      const arDict = translations.ar as Record<string, string>;
      if (legacyDict[key] !== undefined) return legacyDict[key];
      if (arDict[key] !== undefined) return arDict[key];
      return String(i18nextT(key, options as Record<string, string | number>));
    },
    [i18nextT, i18n, lang]
  );

  const value = useMemo(
    () => ({ lang, dir, flag: meta.flag, setLang, t }),
    [lang, dir, meta.flag, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18nInstance}>
      <I18nBridge>{children}</I18nBridge>
    </I18nextProvider>
  );
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>');
  return ctx;
};

export const useT = () => useI18n().t;
export const useTranslation = useI18n;
export default useI18n;
