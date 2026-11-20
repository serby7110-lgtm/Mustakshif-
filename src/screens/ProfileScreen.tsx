/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Profile & Settings Screen v2 (حسابي)
 * Upgraded with:
 * - Stats Card: أساطير منتهية، فصول مقروءة، محفوظات، دقائق القراءة التقديرية (all computed from local storage)
 * - Six Badges with locked/unlocked states and Arabic names:
 *   1. "مستكشف الصحراء" (read 5 creature myths)
 *   2. "حارس المعبد" (read all gods)
 *   3. "رحّالة الخرائط" (open 10 map sheets)
 *   4. "جامع الحكايات" (10 bookmarks)
 *   5. "صائد الأفكار" (star 10 hooks)
 *   6. "قارئ الليل" (read 30 min in dark mode)
 * - Themed settings list including "الوضع الليلي" toggle switch
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Moon,
  Sun,
  Type,
  Globe,
  Info,
  Mail,
  ChevronLeft,
  Sparkles,
  Bookmark,
  Compass,
  Check,
  X,
  HelpCircle,
  Award,
  Lock,
  Unlock,
  CheckCircle2,
  BookOpen,
  Clock,
  Shield,
  Map,
  Wand2,
  Quote,
  Download,
  Smartphone,
  Crown,
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { ThemeMode, FontSize, ArabicFontId, EnglishFontId, storage } from '../data/storage';
import {
  ARABIC_FONT_OPTIONS,
  ENGLISH_FONT_OPTIONS,
  FONT_SIZE_META,
  FONT_SIZE_ORDER,
  FONT_SETTINGS_EVENT,
} from '../utils/typography';
import { useTheme } from '../theme/ThemeContext';
import { MythEntry, myths as unifiedMyths } from '../data/types';
import {
  computeProfileStats,
  computeBadges,
  BadgeItem,
} from '../utils/libraryAndProfile';
import { MethodologyScreen } from './MethodologyScreen';
import { ContactScreen } from './ContactScreen';
import { LANGUAGES, Language, useI18n } from '../i18n/i18n';

export interface ProfileScreenProps {
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
  fontSize?: FontSize;
  onChangeFontSize?: (size: FontSize) => void;
  savedCount?: number;
  historyCount?: number;
  totalMythCount?: number;
  onReplayOnboarding?: () => void;
  onOpenMethodology?: () => void;
  isPremiumActive?: boolean;
  onOpenSubscription?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  themeMode: propThemeMode,
  onToggleTheme: propOnToggleTheme,
  fontSize = 'md',
  onChangeFontSize,
  savedCount,
  historyCount,
  onReplayOnboarding,
  onOpenMethodology,
  isPremiumActive,
  onOpenSubscription,
}) => {
  const effectivePremium = isPremiumActive ?? storage.hasPremiumMonthly();
  const { tokens, isDark, toggleTheme, isAutoDark, toggleAutoDark, autoDarkDescription } = useTheme();
  const { t, lang, setLang, dir } = useI18n();

  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isContactScreenOpen, setIsContactScreenOpen] = useState(false);
  const [sentMessagesCount, setSentMessagesCount] = useState<number>(() => storage.getSentMessagesCount());
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [arabicFont, setArabicFont] = useState<ArabicFontId>(() => storage.getArabicFont());
  const [englishFont, setEnglishFont] = useState<EnglishFontId>(() => storage.getEnglishFont());
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isLangSheetOpen, setIsLangSheetOpen] = useState(false);

  useEffect(() => {
    const syncFonts = () => {
      setArabicFont(storage.getArabicFont());
      setEnglishFont(storage.getEnglishFont());
    };
    window.addEventListener(FONT_SETTINGS_EVENT, syncFonts);
    return () => window.removeEventListener(FONT_SETTINGS_EVENT, syncFonts);
  }, []);

  const CURRENT_LANG_BADGES: Record<string, { flag: string; label: string; text: string }> = {
    ar: { flag: 'AR', label: 'عربي', text: 'العربية الفصحى (واجهة كاملة RTL)' },
    en: { flag: 'EN', label: 'English', text: 'English (LTR Interface)' },
    id: { flag: 'ID', label: 'Indonesia', text: 'Bahasa Indonesia (LTR)' },
    th: { flag: 'TH', label: 'ไทย', text: 'ไทย (LTR)' },
  };

  const LANG_SHEET_OPTIONS: { lang: Language; label: string; flag: string; dir: 'rtl' | 'ltr' }[] = [
    { lang: 'ar', label: 'العربية', flag: 'AR', dir: 'rtl' },
    { lang: 'en', label: 'English', flag: 'EN', dir: 'ltr' },
    { lang: 'id', label: 'Bahasa Indonesia', flag: 'ID', dir: 'ltr' },
    { lang: 'th', label: 'ไทย', flag: 'TH', dir: 'ltr' },
  ];

  const LANG_CHANGE_TOAST: Record<Language, string> = {
    ar: 'تم تغيير اللغة',
    en: 'Language changed',
    id: 'Bahasa diubah',
    th: 'เปลี่ยนภาษาแล้ว',
  };

  const activeLanguage = useMemo(
    () => LANGUAGES.find((l) => l.lang === lang) || LANGUAGES[0],
    [lang]
  );

  const handleToggle = propOnToggleTheme || toggleTheme;

  // Retrieve and keep storage state in sync
  const allMyths = useMemo(() => unifiedMyths ?? [], []);
  const [progressMap, setProgressMap] = useState<Record<string, number>>(
    () => storage.getAllMythProgress() ?? {}
  );
  const [readChapters, setReadChapters] = useState<string[]>(() => storage.getReadChapters() ?? []);
  const [bookmarks, setBookmarks] = useState<string[]>(() => storage.getBookmarks() ?? []);
  const [starredHooks, setStarredHooks] = useState<string[]>(() => storage.getFavoriteHooks() ?? []);
  const [mapSheetsCount, setMapSheetsCount] = useState<number>(() => storage.getMapSheetsCount() ?? 0);
  const [darkMinutes, setDarkMinutes] = useState<number>(() => storage.getDarkReadingMinutes() ?? 0);
  const [favoriteQuotes, setFavoriteQuotes] = useState<string[]>(
    () => storage.getFavoriteQuotes() ?? []
  );

  useEffect(() => {
    const syncStorageStats = () => {
      setProgressMap(storage.getAllMythProgress() ?? {});
      setReadChapters(storage.getReadChapters() ?? []);
      setBookmarks(storage.getBookmarks() ?? []);
      setStarredHooks(storage.getFavoriteHooks() ?? []);
      setMapSheetsCount(storage.getMapSheetsCount() ?? 0);
      setDarkMinutes(storage.getDarkReadingMinutes() ?? 0);
      setFavoriteQuotes(storage.getFavoriteQuotes() ?? []);
    };
    syncStorageStats();
    window.addEventListener('focus', syncStorageStats);
    window.addEventListener('storage', syncStorageStats);
    return () => {
      window.removeEventListener('focus', syncStorageStats);
      window.removeEventListener('storage', syncStorageStats);
    };
  }, [savedCount, historyCount]);

  // Compute stats for Stats card
  const stats = useMemo(
    () => computeProfileStats(allMyths, progressMap, readChapters, bookmarks, (favoriteQuotes ?? []).length),
    [allMyths, progressMap, readChapters, bookmarks, favoriteQuotes]
  );

  // Compute 6 badges
  const badges = useMemo(
    () =>
      computeBadges(
        allMyths,
        progressMap,
        bookmarks,
        starredHooks,
        mapSheetsCount,
        darkMinutes
      ),
    [allMyths, progressMap, bookmarks, starredHooks, mapSheetsCount, darkMinutes]
  );

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // PWA Install state using beforeinstallprompt
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  }

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setToastMessage(t('profile.installSuccessToast'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [t]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setToastMessage(t('profile.installStartedToast'));
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error during PWA installation:', err);
      }
    } else {
      setToastMessage(t('profile.installManualHint'));
    }
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleExportBookmarks = () => {
    try {
      const bookmarkedEntries = allMyths.filter((m) => bookmarks.includes(m.id));
      if (bookmarkedEntries.length === 0) {
        setToastMessage(t('profile.exportEmpty'));
        return;
      }

      const jsonStr = JSON.stringify(bookmarkedEntries, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `mustakshif-bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } finally {
        URL.revokeObjectURL(url);
      }

      setToastMessage(t('profile.exportSuccess'));
    } catch (err) {
      console.warn('[ProfileScreen] Failed to export bookmarks:', err);
      setToastMessage(t('profile.exportError'));
    }
  };

  const fontSizeLabels: Record<FontSize, string> = {
    xs: t('profile.fontXs'),
    sm: t('profile.fontSm'),
    md: t('profile.fontMd'),
    lg: t('profile.fontLg'),
    xl: t('profile.fontXl'),
  };

  const activeFontSummary =
    lang === 'ar'
      ? `${fontSizeLabels[fontSize] ?? fontSizeLabels.md} • ${t(`profile.arabicFonts.${arabicFont}.name`)}`
      : `${fontSizeLabels[fontSize] ?? fontSizeLabels.md} • ${t(`profile.englishFonts.${englishFont}.name`)}`;

  // Helper to render badge icon
  const renderBadgeIcon = (badge: BadgeItem) => {
    const size = 18;
    switch (badge.iconType) {
      case 'desert':
        return <Compass size={size} />;
      case 'temple':
        return <Shield size={size} />;
      case 'map':
        return <Map size={size} />;
      case 'stories':
        return <Bookmark size={size} />;
      case 'ideas':
        return <Wand2 size={size} />;
      case 'night':
        return <Moon size={size} />;
      default:
        return <Award size={size} />;
    }
  };

  if (isContactScreenOpen) {
    return (
      <ContactScreen
        onBack={() => {
          setIsContactScreenOpen(false);
          setSentMessagesCount(storage.getSentMessagesCount());
        }}
        onMessageSent={() => {
          setSentMessagesCount(storage.getSentMessagesCount());
        }}
      />
    );
  }

  if (isMethodologyOpen) {
    return <MethodologyScreen onBack={() => setIsMethodologyOpen(false)} />;
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200" dir={dir}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
            color: tokens.textPrimary,
          }}
          className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl border shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-in slide-in-from-top-2"
        >
          <div
            style={{ backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.3)' }}
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          >
            <Check size={14} style={{ color: tokens.deepAccent }} />
          </div>
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* 1. Local Profile Header (Offline-First, Zero Account Requirement) */}
      <Card variant="white" className="p-5 shadow-xs">
        <div className="flex items-center gap-4">
          {/* Avatar with Arabesque geometric pattern */}
          <div
            style={{
              background: `linear-gradient(135deg, ${isDark ? tokens.deepAccent : '#0E5C4D'}, ${tokens.primaryMint})`,
              color: isDark ? tokens.background : '#FFFFFF',
            }}
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center font-['Aref_Ruqaa',serif] text-3xl font-bold shadow-md shrink-0"
          >
            <span>{t('profile.appInitial') || (lang === 'ar' ? 'م' : 'M')}</span>
            <span
              style={{
                backgroundColor: tokens.primaryMint,
                borderColor: tokens.card,
              }}
              className="absolute -bottom-1 -start-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
            >
              <Sparkles size={8} style={{ color: isDark ? tokens.background : '#0E5C4D' }} />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-2xl font-bold leading-tight truncate"
            >
              {t('profile.userName')}
            </h2>
            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs font-['Cairo',sans-serif] mt-0.5 truncate"
            >
              {t('profile.userRole')}
            </p>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              {/* Language flag in header */}
              <span
                style={{
                  color: tokens.deepAccent,
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                  borderColor: tokens.border,
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border shadow-2xs"
                title={activeLanguage.label}
              >
                <span className="text-[10px] font-mono font-bold leading-none">{activeLanguage.flag}</span>
                <span>{activeLanguage.label}</span>
              </span>

              <span
                style={{
                  color: tokens.deepAccent,
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                }}
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('app.offlineBadge')}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Stats Card: أساطير منتهية، فصول مقروءة، محفوظات، دقائق القراءة التقديرية */}
      <div
        style={{
          backgroundColor: tokens.card,
          borderColor: tokens.border,
        }}
        className="rounded-3xl p-5 border shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <div
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.1)',
                color: tokens.deepAccent,
              }}
              className="w-7 h-7 rounded-xl flex items-center justify-center"
            >
              <Award size={16} />
            </div>
            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold"
            >
              {t('profile.readingStats')}
            </h3>
          </div>
          <span style={{ color: tokens.textSecondary }} className="text-[11px] font-medium">
            {t('profile.liveUpdate')}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          {/* أساطير منتهية */}
          <div
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.borderSubtle,
            }}
            className="p-3.5 rounded-2xl border text-center space-y-1"
          >
            <div
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                color: tokens.deepAccent,
              }}
              className="w-8 h-8 mx-auto rounded-xl flex items-center justify-center mb-1"
            >
              <CheckCircle2 size={16} />
            </div>
            <span
              style={{ color: tokens.deepAccent }}
              className="text-2xl font-bold font-mono block leading-none"
            >
              {stats.completedCount}
            </span>
            <span
              style={{ color: tokens.textSecondary }}
              className="text-xs font-bold leading-tight block"
            >
              {t('profile.completed')}
            </span>
          </div>

          {/* فصول مقروءة */}
          <div
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.borderSubtle,
            }}
            className="p-3.5 rounded-2xl border text-center space-y-1"
          >
            <div
              style={{
                backgroundColor: tokens.coolBlueTint,
                color: tokens.coolBlueAccent,
              }}
              className="w-8 h-8 mx-auto rounded-xl flex items-center justify-center mb-1"
            >
              <BookOpen size={16} />
            </div>
            <span
              style={{ color: tokens.deepAccent }}
              className="text-2xl font-bold font-mono block leading-none"
            >
              {stats.readChaptersCount}
            </span>
            <span
              style={{ color: tokens.textSecondary }}
              className="text-xs font-bold leading-tight block"
            >
              {t('profile.chaptersRead')}
            </span>
          </div>

          {/* محفوظات */}
          <div
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.borderSubtle,
            }}
            className="p-3.5 rounded-2xl border text-center space-y-1"
          >
            <div
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                color: tokens.deepAccent,
              }}
              className="w-8 h-8 mx-auto rounded-xl flex items-center justify-center mb-1"
            >
              <Bookmark size={16} />
            </div>
            <span
              style={{ color: tokens.deepAccent }}
              className="text-2xl font-bold font-mono block leading-none"
            >
              {stats.bookmarksCount}
            </span>
            <span
              style={{ color: tokens.textSecondary }}
              className="text-xs font-bold leading-tight block"
            >
              {t('profile.saved')}
            </span>
          </div>

          {/* دقائق القراءة التقديرية */}
          <div
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.borderSubtle,
            }}
            className="p-3.5 rounded-2xl border text-center space-y-1"
          >
            <div
              style={{
                backgroundColor: isDark ? 'rgba(127, 178, 232, 0.2)' : 'rgba(127, 178, 232, 0.2)',
                color: tokens.coolBlueAccent,
              }}
              className="w-8 h-8 mx-auto rounded-xl flex items-center justify-center mb-1"
            >
              <Clock size={16} />
            </div>
            <span
              style={{ color: tokens.deepAccent }}
              className="text-2xl font-bold font-mono block leading-none"
            >
              {stats.estimatedReadingMinutes}
            </span>
            <span
              style={{ color: tokens.textSecondary }}
              className="text-xs font-bold leading-tight block"
            >
              {t('profile.readingMinutes')}
            </span>
          </div>

          {/* اقتباسات محفوظة */}
          <div
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.borderSubtle,
            }}
            className="p-3.5 rounded-2xl border text-center space-y-1 col-span-2 sm:col-span-1"
          >
            <div
              style={{
                backgroundColor: isDark ? 'rgba(159, 232, 204, 0.2)' : 'rgba(14, 92, 70, 0.1)',
                color: tokens.deepAccent,
              }}
              className="w-8 h-8 mx-auto rounded-xl flex items-center justify-center mb-1"
            >
              <Quote size={16} />
            </div>
            <span
              style={{ color: tokens.deepAccent }}
              className="text-2xl font-bold font-mono block leading-none"
            >
              {stats.favoriteQuotesCount}
            </span>
            <span
              style={{ color: tokens.textSecondary }}
              className="text-xs font-bold leading-tight block"
            >
              {t('studio.quotesTab')}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Six Badges with locked/unlocked states */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold"
            >
              {t('profile.badges')}
            </h3>
          </div>
          <span
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
          >
            {t('profile.badgesUnlocked', {
              unlocked: badges.filter((b) => b.unlocked).length,
              total: badges.length,
            })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((badge) => {
            const safeTarget = Number.isFinite(badge?.target) && badge.target > 0 ? badge.target : 1;
            const safeCurrent = Number.isFinite(badge?.current) ? Math.max(0, badge.current) : 0;
            const percent = Math.min(100, Math.max(0, Math.round((safeCurrent / safeTarget) * 100)));
            const localizedName = t(`profile.badgesMap.${badge.id}.name`) || badge.name;
            const localizedDesc = t(`profile.badgesMap.${badge.id}.desc`) || badge.description;
            const localizedUnit = t(`profile.badgesMap.${badge.id}.unit`) ?? badge.unit ?? '';

            return (
              <div
                key={badge.id}
                style={{
                  backgroundColor: tokens.card,
                  borderColor: badge.unlocked ? tokens.deepAccent : tokens.border,
                }}
                className={`p-4 rounded-2xl border transition-all shadow-xs space-y-2.5 ${
                  badge.unlocked ? 'ring-1 ring-[#7FD1AE]/40' : 'opacity-85'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        backgroundColor: badge.unlocked
                          ? (isDark ? 'rgba(127, 209, 174, 0.25)' : 'rgba(13, 92, 70, 0.15)')
                          : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
                        color: badge.unlocked ? tokens.deepAccent : tokens.textSecondary,
                      }}
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs"
                    >
                      {renderBadgeIcon(badge)}
                    </div>
                    <div>
                      <h4
                        style={{ color: tokens.textPrimary }}
                        className="font-['Aref_Ruqaa',serif] text-base font-bold leading-tight"
                      >
                        {localizedName}
                      </h4>
                      <p
                        style={{ color: tokens.textSecondary }}
                        className="text-[11px] leading-tight mt-0.5"
                      >
                        {localizedDesc}
                      </p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <span
                    style={{
                      backgroundColor: badge.unlocked
                        ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.1)')
                        : tokens.surface,
                      color: badge.unlocked ? tokens.deepAccent : tokens.textSecondary,
                      borderColor: badge.unlocked ? tokens.deepAccent : tokens.borderSubtle,
                    }}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 flex items-center gap-1"
                  >
                    {badge.unlocked ? (
                      <>
                        <Unlock size={10} />
                        <span>{t('profile.unlockedBadge')}</span>
                      </>
                    ) : (
                      <>
                        <Lock size={10} />
                        <span>{t('profile.lockedBadge')}</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-end text-[10px] font-mono">
                    <span style={{ color: badge.unlocked ? tokens.deepAccent : tokens.textSecondary }} className="font-bold">
                      {safeCurrent} / {safeTarget} {localizedUnit} ({percent}%)
                    </span>
                  </div>
                  <div
                    style={{ backgroundColor: tokens.surface }}
                    className="w-full h-1.5 rounded-full overflow-hidden"
                  >
                    <div
                      style={{
                        width: `${percent}%`,
                        backgroundColor: badge.unlocked ? tokens.deepAccent : tokens.primaryMint,
                      }}
                      className="h-full rounded-full transition-all duration-300"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Settings Rows List */}
      <div className="space-y-3">
        <h3
          style={{ color: tokens.textPrimary }}
          className="font-['Aref_Ruqaa',serif] text-lg font-bold ps-1"
        >
          {t('profile.settingsTitle')}
        </h3>

        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="rounded-[22px] border shadow-xs divide-y overflow-hidden transition-colors"
        >
          {/* Row 0: الاشتراك (Subscription Screen) */}
          <button
            type="button"
            onClick={() => onOpenSubscription?.()}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-start cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: effectivePremium ? 'rgba(61, 220, 151, 0.2)' : tokens.coolBlueTint,
                  color: effectivePremium ? '#0E5C4D' : tokens.coolBlueAccent,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <Crown size={20} />
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {/* الاشتراك */}
                  {t('profile.subscription') || 'الاشتراك'}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {effectivePremium
                    ? t('profile.subscriptionActive')
                    : t('profile.subscriptionInactive')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span
                style={{
                  backgroundColor: effectivePremium ? '#3DDC97' : tokens.surface,
                  color: effectivePremium ? '#0E5C4D' : tokens.textSecondary,
                  borderColor: effectivePremium ? '#3DDC97' : tokens.borderSubtle,
                }}
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
              >
                {effectivePremium ? t('subscription.active') : t('subscription.inactive')}
              </span>
              <ChevronLeft size={16} style={{ color: tokens.textSecondary }} className={dir === 'ltr' ? 'rotate-180' : ''} />
            </div>
          </button>

          {/* Row 1: Dark Mode Toggle */}
          <div
            style={{ borderColor: tokens.borderSubtle }}
            className="p-4 flex items-center justify-between gap-3 min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(14, 92, 70, 0.1)',
                  color: tokens.deepAccent,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                {isDark ? <Moon size={20} className="fill-current" /> : <Sun size={20} />}
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {t('profile.darkMode')}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {t('profile.darkModeSub')}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-label={t('profile.darkMode')}
              onClick={handleToggle}
              style={{
                backgroundColor: isDark ? tokens.primaryMint : tokens.coolBlueTint,
                borderColor: tokens.border,
              }}
              className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none min-h-[44px] min-w-[44px] items-center"
            >
              <span
                style={{
                  backgroundColor: isDark ? tokens.background : '#FFFFFF',
                  insetInlineStart: isDark ? '24px' : '3px',
                }}
                className="pointer-events-none absolute h-6 w-6 rounded-full shadow-md transition-all duration-200 ease-in-out"
              />
            </button>
          </div>

          {/* Row 1.5: Auto Dark Mode */}
          <div
            style={{ borderColor: tokens.borderSubtle }}
            className="p-4 flex items-center justify-between gap-3 min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: isAutoDark
                    ? (isDark ? 'rgba(127, 209, 174, 0.25)' : 'rgba(14, 92, 70, 0.15)')
                    : tokens.coolBlueTint,
                  color: isAutoDark ? tokens.deepAccent : tokens.coolBlueAccent,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <Sparkles size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4
                    style={{ color: tokens.textPrimary }}
                    className="font-bold text-sm font-['Cairo',sans-serif]"
                  >
                    {t('profile.autoDarkMode') || 'الوضع الليلي التلقائي'}
                  </h4>
                </div>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {isAutoDark ? autoDarkDescription : t('profile.autoDarkSub')}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={isAutoDark}
              aria-label={t('profile.autoDarkMode')}
              onClick={toggleAutoDark}
              style={{
                backgroundColor: isAutoDark ? tokens.primaryMint : tokens.coolBlueTint,
                borderColor: tokens.border,
              }}
              className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none min-h-[44px] min-w-[44px] items-center"
            >
              <span
                style={{
                  backgroundColor: isAutoDark ? (isDark ? tokens.background : '#0E5C4D') : '#FFFFFF',
                  insetInlineStart: isAutoDark ? '24px' : '3px',
                }}
                className="pointer-events-none absolute h-6 w-6 rounded-full shadow-md transition-all duration-200 ease-in-out"
              />
            </button>
          </div>

          {/* Row 2: Font Size */}
          <button
            type="button"
            onClick={() => setIsFontModalOpen(true)}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-start cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: tokens.coolBlueTint,
                  color: tokens.coolBlueAccent,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <Type size={20} />
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {t('profile.fontSize')}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5 truncate max-w-[230px]"
                >
                  {activeFontSummary}
                </p>
              </div>
            </div>
            <div
              style={{ color: tokens.deepAccent }}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <ChevronLeft size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
            </div>
          </button>

          {/* Row 3: لغة التطبيق (Tappable Language Selector Row) */}
          <button
            type="button"
            onClick={() => setIsLangSheetOpen(true)}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-start cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.2)',
                  color: tokens.deepAccent,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <Globe size={20} />
              </div>
              <div className="text-start">
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {t('profile.language') || 'لغة التطبيق'}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {t('profile.languageSub')}
                </p>
              </div>
            </div>

            <div
              style={{ color: tokens.deepAccent }}
              className="flex items-center gap-2 text-xs font-bold"
            >
              <span
                style={{
                  color: tokens.deepAccent,
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                  borderColor: tokens.borderSubtle,
                }}
                className="text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border shadow-2xs"
              >
                <span className="font-mono text-[10px] font-bold">{CURRENT_LANG_BADGES[lang]?.flag || 'AR'}</span>
                <span>{t('profile.langBadgeLabel') || CURRENT_LANG_BADGES[lang]?.label || 'عربي'}</span>
              </span>
              <ChevronLeft size={16} style={{ color: tokens.textSecondary }} className={dir === 'ltr' ? 'rotate-180' : ''} />
            </div>
          </button>

          {/* Row 4: Onboarding Replay */}
          <button
            type="button"
            onClick={onReplayOnboarding}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-start cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.2)',
                  color: tokens.deepAccent,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <HelpCircle size={20} />
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {t('profile.onboarding')}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {t('profile.onboardingSub')}
                </p>
              </div>
            </div>
            <ChevronLeft size={16} style={{ color: tokens.textSecondary }} className={dir === 'ltr' ? 'rotate-180' : ''} />
          </button>

          {/* Row: عن المنهج */}
          <button
            type="button"
            onClick={() => {
              if (onOpenMethodology) {
                onOpenMethodology();
              } else {
                setIsMethodologyOpen(true);
              }
            }}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-start cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: tokens.surface,
                  color: tokens.deepAccent,
                  borderColor: tokens.border,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
              >
                <Info size={20} />
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {/* عن المنهج */}
                  {t('profile.aboutMethod')}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {t('profile.aboutMethodSub')}
                </p>
              </div>
            </div>
            <ChevronLeft size={16} style={{ color: tokens.textSecondary }} className={dir === 'ltr' ? 'rotate-180' : ''} />
          </button>

          {/* Row 5: About App */}
          <button
            type="button"
            onClick={() => setIsAboutModalOpen(true)}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-start cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: tokens.surface,
                  color: tokens.deepAccent,
                  borderColor: tokens.border,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
              >
                <Info size={20} />
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {t('profile.aboutApp')}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {t('profile.aboutAppSub')}
                </p>
              </div>
            </div>
            <ChevronLeft size={16} style={{ color: tokens.textSecondary }} className={dir === 'ltr' ? 'rotate-180' : ''} />
          </button>

          {/* Row 6: Contact Us */}
          <button
            type="button"
            onClick={() => setIsContactScreenOpen(true)}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-start cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: tokens.coolBlueTint,
                  color: tokens.coolBlueAccent,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <Mail size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4
                    style={{ color: tokens.textPrimary }}
                    className="font-bold text-sm font-['Cairo',sans-serif]"
                  >
                    {t('profile.contact')}
                  </h4>
                  <span
                    style={{
                      backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : 'rgba(74, 144, 217, 0.12)',
                      color: isDark ? '#7EB5F0' : '#2A70B8',
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    {sentMessagesCount}
                  </span>
                </div>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {t('profile.contactSub')}
                </p>
                <p
                  style={{ color: isDark ? '#7EB5F0' : '#2A70B8' }}
                  className="text-[11px] font-medium mt-1"
                >
                  {/* عدد الرسائل المرسلة من هذا الجهاز */}
                  {t('profile.sentCount', { count: sentMessagesCount })}
                </p>
              </div>
            </div>
            <ChevronLeft size={16} style={{ color: tokens.textSecondary }} className={dir === 'ltr' ? 'rotate-180' : ''} />
          </button>

          {/* Row 7: Export Bookmarks */}
          <button
            type="button"
            onClick={handleExportBookmarks}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-start cursor-pointer min-h-[56px]"
          >
            <div className="flex items-center gap-3">
              <div
                style={{
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                  color: tokens.deepAccent,
                }}
                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
              >
                <Download size={20} />
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {t('profile.export')}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {t('profile.exportSub')} ({(bookmarks ?? []).length})
                </p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: tokens.deepAccent,
                color: isDark ? '#0B2420' : '#FFFFFF',
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-opacity shrink-0"
            >
              <Download size={13} />
              <span>JSON</span>
            </div>
          </button>

          {/* Row 8: Install App */}
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              style={{ borderColor: tokens.borderSubtle }}
              className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-start cursor-pointer min-h-[56px]"
            >
              <div className="flex items-center gap-3">
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(127, 209, 174, 0.25)' : 'rgba(14, 92, 70, 0.12)',
                    color: tokens.deepAccent,
                  }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                >
                  <Smartphone size={20} />
                </div>
                <div>
                  <h4
                    style={{ color: tokens.textPrimary }}
                    className="font-bold text-sm font-['Cairo',sans-serif]"
                  >
                    {t('profile.install') || 'تثبيت التطبيق'}
                  </h4>
                  <p
                    style={{ color: tokens.textSecondary }}
                    className="text-xs mt-0.5"
                  >
                    {t('profile.installSub')}
                  </p>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: tokens.deepAccent,
                  color: isDark ? '#0B2420' : '#FFFFFF',
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-opacity shrink-0"
              >
                <Download size={13} />
                <span>{t('profile.install')}</span>
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Footer Branding Note */}
      <div className="text-center pt-2 space-y-1">
        <p
          style={{ color: tokens.deepAccent }}
          className="font-['Aref_Ruqaa',serif] text-sm font-bold"
        >
          {t('app.title')} • {t('app.version')}
        </p>
        <p
          style={{ color: tokens.textSecondary }}
          className="text-[11px]"
        >
          {t('profile.footerNote')}
        </p>
      </div>

      {/* Modal: About App */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir={dir}>
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-full max-w-md rounded-[26px] p-6 shadow-2xl border space-y-4 animate-in zoom-in-95 text-start"
          >
            <div
              style={{ borderColor: tokens.borderSubtle }}
              className="flex items-center justify-between pb-3 border-b"
            >
              <h3
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold"
              >
                {t('profile.aboutApp')}
              </h3>
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                style={{ color: tokens.textSecondary }}
                aria-label={t('common.close')}
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{ color: tokens.textPrimary }}
              className="space-y-3 text-xs sm:text-sm leading-relaxed font-['Cairo',sans-serif]"
            >
              <p>{t('app.aboutDesc1')}</p>
              <p>{t('app.aboutDesc2')}</p>
              <p
                style={{ color: tokens.textSecondary }}
                className="text-xs pt-1"
              >
                {t('app.aboutFooter')}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAboutModalOpen(false)}
              style={{
                backgroundColor: tokens.deepAccent,
                color: isDark ? tokens.background : '#FFFFFF',
              }}
              className="w-full py-3 rounded-2xl text-xs font-bold shadow-md cursor-pointer min-h-[44px]"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Modal: Font Size & Typeface */}
      {isFontModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          dir={dir}
          onClick={() => setIsFontModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-full max-w-md max-h-[88vh] overflow-y-auto rounded-[26px] p-6 shadow-2xl border space-y-5 animate-in zoom-in-95 text-start"
          >
            <div
              style={{ borderColor: tokens.borderSubtle }}
              className="flex items-center justify-between pb-3 border-b"
            >
              <h3
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold"
              >
                {t('profile.fontSize')}
              </h3>
              <button
                type="button"
                onClick={() => setIsFontModalOpen(false)}
                style={{ color: tokens.textSecondary }}
                aria-label={t('common.close')}
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* Section 1: 5 Font Sizes */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span style={{ color: tokens.deepAccent }} className="text-xs font-bold">
                  {t('article.fontSizeBadge')}
                </span>
                <span style={{ color: tokens.textSecondary }} className="text-xs font-mono">
                  {FONT_SIZE_META[fontSize]?.mobilePx ?? 17}px
                </span>
              </div>
              <div className="space-y-2">
                {FONT_SIZE_ORDER.map((sizeId) => (
                  <button
                    key={sizeId}
                    type="button"
                    data-testid={`profile-font-size-${sizeId}`}
                    onClick={() => {
                      storage.setFontSize(sizeId);
                      onChangeFontSize?.(sizeId);
                    }}
                    style={{
                      backgroundColor: fontSize === sizeId ? tokens.surface : tokens.card,
                      borderColor: fontSize === sizeId ? tokens.deepAccent : tokens.borderSubtle,
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl border text-start transition-all flex items-center justify-between cursor-pointer min-h-[48px]"
                  >
                    <span
                      style={{
                        color: tokens.textPrimary,
                        fontSize: `${FONT_SIZE_META[sizeId].mobilePx}px`,
                      }}
                      className="font-bold leading-snug"
                    >
                      {fontSizeLabels[sizeId]}
                    </span>
                    {fontSize === sizeId && (
                      <Check size={18} style={{ color: tokens.deepAccent }} className="shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Arabic Fonts (Cairo + 2 Added Heritage Fonts) */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: tokens.borderSubtle }}>
              <h4 style={{ color: tokens.deepAccent }} className="text-xs font-bold">
                {t('profile.arabicFontTitle')}
              </h4>
              <div className="space-y-2">
                {ARABIC_FONT_OPTIONS.map((opt) => {
                  const selected = arabicFont === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`profile-ar-font-${opt.id}`}
                      onClick={() => {
                        setArabicFont(opt.id);
                        storage.setArabicFont(opt.id);
                      }}
                      style={{
                        backgroundColor: selected ? tokens.surface : tokens.card,
                        borderColor: selected ? tokens.deepAccent : tokens.borderSubtle,
                      }}
                      className="w-full p-3.5 rounded-2xl border text-start transition-all flex items-center justify-between gap-3 cursor-pointer min-h-[56px]"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-xs font-bold" style={{ color: tokens.textPrimary }}>
                          {t(`profile.arabicFonts.${opt.id}.name`)}
                        </div>
                        <div
                          dir="rtl"
                          style={{
                            color: tokens.textSecondary,
                            fontFamily: opt.cssFamily,
                          }}
                          className="text-sm leading-relaxed text-right"
                        >
                          {opt.sampleText}
                        </div>
                      </div>
                      {selected && <Check size={18} style={{ color: tokens.deepAccent }} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 3: 3 English Fonts */}
            <div className="space-y-2 pt-2 border-t" style={{ borderColor: tokens.borderSubtle }}>
              <h4 style={{ color: tokens.deepAccent }} className="text-xs font-bold">
                {t('profile.englishFontTitle')}
              </h4>
              <div className="space-y-2">
                {ENGLISH_FONT_OPTIONS.map((opt) => {
                  const selected = englishFont === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      data-testid={`profile-en-font-${opt.id}`}
                      onClick={() => {
                        setEnglishFont(opt.id);
                        storage.setEnglishFont(opt.id);
                      }}
                      style={{
                        backgroundColor: selected ? tokens.surface : tokens.card,
                        borderColor: selected ? tokens.deepAccent : tokens.borderSubtle,
                      }}
                      className="w-full p-3.5 rounded-2xl border text-start transition-all flex items-center justify-between gap-3 cursor-pointer min-h-[56px]"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="text-xs font-bold" style={{ color: tokens.textPrimary }}>
                          {t(`profile.englishFonts.${opt.id}.name`)}
                        </div>
                        <div
                          dir="ltr"
                          style={{
                            color: tokens.textSecondary,
                            fontFamily: opt.cssFamily,
                          }}
                          className="text-xs leading-relaxed text-left"
                        >
                          {opt.sampleText}
                        </div>
                      </div>
                      {selected && <Check size={18} style={{ color: tokens.deepAccent }} className="shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFontModalOpen(false)}
              style={{
                backgroundColor: tokens.deepAccent,
                color: isDark ? tokens.background : '#FFFFFF',
              }}
              className="w-full py-3 rounded-2xl text-xs font-bold shadow-md cursor-pointer min-h-[44px]"
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet: Language Selection */}
      {isLangSheetOpen && (
        <div
          dir={dir}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end items-center p-0 sm:p-4"
          onClick={() => setIsLangSheetOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl border space-y-4 animate-in slide-in-from-bottom duration-200 text-start"
          >
            {/* Sheet Handle */}
            <div
              className="w-12 h-1.5 rounded-full mx-auto opacity-30 -mt-2 mb-1"
              style={{ backgroundColor: tokens.textSecondary }}
            />

            <div
              style={{ borderColor: tokens.borderSubtle }}
              className="flex items-center justify-between pb-3 border-b"
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.2)',
                    color: tokens.deepAccent,
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Globe size={18} />
                </div>
                <h3
                  style={{ color: tokens.deepAccent }}
                  className="font-['Aref_Ruqaa',serif] text-xl font-bold"
                >
                  {t('profile.chooseLanguage')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLangSheetOpen(false)}
                style={{ color: tokens.textSecondary }}
                aria-label={t('common.close')}
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2.5" role="radiogroup" aria-label={t('profile.chooseLanguage')}>
              {LANG_SHEET_OPTIONS.map((item) => {
                const isSelected = lang === item.lang;
                return (
                  <button
                    key={item.lang}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => {
                      setLang(item.lang);
                      try {
                        if (typeof window !== 'undefined' && window.localStorage) {
                          window.localStorage.setItem('mustakshif:lang', item.lang);
                        }
                        if (typeof document !== 'undefined') {
                          document.documentElement.setAttribute('dir', item.dir);
                        }
                      } catch (err) {
                        console.warn('[ProfileScreen] Failed to persist language preference:', err);
                      }
                      setIsLangSheetOpen(false);
                      setToastMessage(t('profile.langChangedToast', { lng: item.lang }) || LANG_CHANGE_TOAST[item.lang]);
                    }}
                    style={{
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)')
                        : tokens.surface,
                      borderColor: isSelected ? tokens.primaryMint : tokens.borderSubtle,
                    }}
                    className={`w-full p-4 rounded-2xl border text-start transition-all flex items-center justify-between cursor-pointer min-h-[56px] ${
                      isSelected ? 'ring-1 ring-[#7FD1AE]/50 shadow-xs' : 'hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span
                        style={{
                          backgroundColor: tokens.card,
                          borderColor: tokens.border,
                          color: tokens.deepAccent,
                        }}
                        className="w-10 h-10 rounded-xl border font-mono text-xs font-bold flex items-center justify-center shrink-0"
                      >
                        {item.flag}
                      </span>
                      <div className="text-start">
                        <h4
                          style={{
                            color: isSelected ? tokens.deepAccent : tokens.textPrimary,
                          }}
                          className="font-bold text-base font-['Cairo',sans-serif] leading-tight"
                        >
                          {item.label}
                        </h4>
                        <span
                          style={{ color: tokens.textSecondary }}
                          className="text-[11px]"
                        >
                          {item.dir === 'rtl' ? t('profile.rtlDesc') : t('profile.ltrDesc')}
                        </span>
                      </div>
                    </div>

                    {/* Filled radio indicator for active language with mint highlight */}
                    <div
                      style={{
                        borderColor: isSelected ? tokens.primaryMint : tokens.border,
                        backgroundColor: isSelected ? tokens.primaryMint : 'transparent',
                      }}
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                    >
                      {isSelected && (
                        <div
                          style={{
                            backgroundColor: isDark ? tokens.background : '#0E5C4D',
                          }}
                          className="w-2 h-2 rounded-full"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProfileScreen;
