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
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { ThemeMode, FontSize, storage } from '../data/storage';
import { useTheme } from '../theme/ThemeContext';
import { legacyAr as ar } from '../i18n/legacyAr';
import mythsData from '../data/myths.json';
import { MythEntry } from '../data/types';
import {
  computeProfileStats,
  computeBadges,
  BadgeItem,
} from '../utils/libraryAndProfile';
import { MethodologyScreen } from './MethodologyScreen';

import { useI18n } from '../i18n/i18n';
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
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  themeMode: propThemeMode,
  onToggleTheme: propOnToggleTheme,
  fontSize = 'md',
  onChangeFontSize,
  onReplayOnboarding,
  onOpenMethodology,
}) => {
  const { t } = useI18n();
  const { tokens, isDark, toggleTheme } = useTheme();

  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');

  const handleToggle = propOnToggleTheme || toggleTheme;

  // Retrieve storage state
  const allMyths = useMemo(() => mythsData as unknown as MythEntry[], []);
  const progressMap = useMemo(() => storage.getAllMythProgress(), []);
  const readChapters = useMemo(() => storage.getReadChapters(), []);
  const bookmarks = useMemo(() => storage.getBookmarks(), []);
  const starredHooks = useMemo(() => storage.getFavoriteHooks(), []);
  const mapSheetsCount = useMemo(() => storage.getMapSheetsCount(), []);
  const darkMinutes = useMemo(() => storage.getDarkReadingMinutes(), []);
  const favoriteQuotes = useMemo(() => storage.getFavoriteQuotes(), []);

  // Compute stats for Stats card
  const stats = useMemo(
    () => computeProfileStats(allMyths, progressMap, readChapters, bookmarks, favoriteQuotes.length),
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

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackText('');
      setIsContactModalOpen(false);
    }, 1800);
  };

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
      setToastMessage('تم تثبيت تطبيق مستكشف بنجاح على جهازك 🎉');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          setIsInstalled(true);
          setToastMessage('تم بدء تثبيت التطبيق بنجاح 🎉');
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Error during PWA installation:', err);
      }
    } else {
      setToastMessage('لتثبيت التطبيق: اختر "إضافة إلى الشاشة الرئيسية" من قائمة المتصفح 📲');
    }
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const handleExportBookmarks = () => {
    try {
      const bookmarkedEntries = allMyths.filter((m) => bookmarks.includes(m.id));
      if (bookmarkedEntries.length === 0) {
        setToastMessage('لا توجد أساطير محفوظة في المفضلة للتصدير');
        return;
      }

      const jsonStr = JSON.stringify(bookmarkedEntries, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mustakshif-bookmarks-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToastMessage('تم تصدير المفضلة بنجاح 💾');
    } catch {
      setToastMessage('تعذر تصدير المفضلة، يرجى المحاولة لاحقاً');
    }
  };

  const fontSizeLabels: Record<FontSize, string> = {
    sm: 'صغير',
    md: 'متوسط (افتراضي)',
    lg: 'كبير ومريح',
  };

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

  if (isMethodologyOpen) {
    return <MethodologyScreen onBack={() => setIsMethodologyOpen(false)} />;
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-200" dir="rtl">
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

      {/* 1. Header with Avatar + Name */}
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
            <span>م</span>
            <span
              style={{
                backgroundColor: tokens.primaryMint,
                borderColor: tokens.card,
              }}
              className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full border-2 flex items-center justify-center"
            >
              <Sparkles size={8} style={{ color: isDark ? tokens.background : '#0E5C4D' }} />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h2
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-2xl font-bold leading-tight"
            >
              {ar.profile.userName}
            </h2>
            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs font-['Cairo',sans-serif] mt-0.5"
            >
              {ar.profile.userRole}
            </p>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span
                style={{
                  color: tokens.deepAccent,
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                }}
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                {ar.app.offlineBadge}
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
              إحصاءات القراءة
            </h3>
          </div>
          <span style={{ color: tokens.textSecondary }} className="text-[11px] font-medium">
            تحديث مباشر
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
              أساطير منتهية
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
              فصول مقروءة
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
              محفوظات
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
              دقائق القراءة التقديرية
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
              اقتباسات محفوظة
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
              أوسمة المستكشف
            </h3>
            <p style={{ color: tokens.textSecondary }} className="text-xs">
              افتح أوسمة المعرفة التراثية عبر استكشاف الموسوعة
            </p>
          </div>
          <span
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="px-2.5 py-0.5 rounded-full text-xs font-bold border"
          >
            {badges.filter((b) => b.unlocked).length} من ٦ مفتوحة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {badges.map((badge) => {
            const percent = Math.min(100, Math.round((badge.current / badge.target) * 100));

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
                        {badge.name}
                      </h4>
                      <p
                        style={{ color: tokens.textSecondary }}
                        className="text-[11px] leading-tight mt-0.5"
                      >
                        {badge.description}
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
                        <span>مفتوح</span>
                      </>
                    ) : (
                      <>
                        <Lock size={10} />
                        <span>مقفل</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span style={{ color: tokens.textSecondary }}>التقدم:</span>
                    <span style={{ color: badge.unlocked ? tokens.deepAccent : tokens.textSecondary }} className="font-bold">
                      {badge.current} / {badge.target} {badge.unit || ''} ({percent}%)
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

      {/* 4. Settings Rows List in Arabic */}
      <div className="space-y-3">
        <h3
          style={{ color: tokens.textPrimary }}
          className="font-['Aref_Ruqaa',serif] text-lg font-bold pr-1"
        >
          {ar.profile.settingsTitle}
        </h3>

        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="rounded-[22px] border shadow-xs divide-y overflow-hidden transition-colors"
        >
          {/* Row 1: الوضع الليلي (Dark Mode Toggle) */}
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
                  {ar.profile.darkModeSub}
                </p>
              </div>
            </div>

            {/* Toggle switch for الوضع الليلي */}
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
                }}
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                  isDark ? 'translate-x-[-24px]' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Row 2: حجم الخط */}
          <button
            type="button"
            onClick={() => setIsFontModalOpen(true)}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-right cursor-pointer min-h-[56px]"
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
                  {ar.profile.fontSize}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  الحالي: {fontSizeLabels[fontSize]}
                </p>
              </div>
            </div>
            <div
              style={{ color: tokens.deepAccent }}
              className="flex items-center gap-1.5 text-xs font-bold"
            >
              <span>تعديل</span>
              <ChevronLeft size={16} />
            </div>
          </button>

          {/* Row 3: لغة التطبيق */}
          <div
            style={{ borderColor: tokens.borderSubtle }}
            className="p-4 flex items-center justify-between gap-3 text-right min-h-[56px]"
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
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {t('profile.language')}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {ar.profile.languageSub}
                </p>
              </div>
            </div>
            <span
              style={{
                color: tokens.deepAccent,
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
              }}
              className="text-xs font-bold px-2.5 py-1 rounded-lg"
            >
              {ar.profile.languageBadge}
            </span>
          </div>

          {/* Row 4: جولة تعريفية بالتطبيق (Onboarding Replay) */}
          <button
            type="button"
            onClick={onReplayOnboarding}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-right cursor-pointer min-h-[56px]"
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
                  {ar.profile.onboarding}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {ar.profile.onboardingSub}
                </p>
              </div>
            </div>
            <ChevronLeft size={16} style={{ color: tokens.textSecondary }} />
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
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-right cursor-pointer min-h-[56px]"
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
                  {t('profile.aboutMethod')}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  شارات التوثيق والتفريق بين المروي والموثق
                </p>
              </div>
            </div>
            <ChevronLeft size={16} style={{ color: tokens.textSecondary }} />
          </button>

          {/* Row 5: عن التطبيق */}
          <button
            type="button"
            onClick={() => setIsAboutModalOpen(true)}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-right cursor-pointer min-h-[56px]"
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
                  {ar.profile.about}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {ar.profile.aboutSub}
                </p>
              </div>
            </div>
            <ChevronLeft size={16} style={{ color: tokens.textSecondary }} />
          </button>

          {/* Row 6: تواصل معنا */}
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-right cursor-pointer min-h-[56px]"
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
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  {t('profile.contact')}
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {ar.profile.contactSub}
                </p>
              </div>
            </div>
            <ChevronLeft size={16} style={{ color: tokens.textSecondary }} />
          </button>

          {/* Row 7: تصدير المفضلة (Download Bookmarks JSON) */}
          <button
            type="button"
            onClick={handleExportBookmarks}
            style={{ borderColor: tokens.borderSubtle }}
            className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-right cursor-pointer min-h-[56px]"
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
                  تنزيل الأساطير المحفوظة ({bookmarks.length}) كملف JSON
                </p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: tokens.deepAccent,
                color: isDark ? '#0B2420' : '#FFFFFF',
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-opacity"
            >
              <Download size={13} />
              <span>تصدير JSON</span>
            </div>
          </button>

          {/* Row 8: تثبيت التطبيق (PWA Install Button - shows only if not installed) */}
          {!isInstalled && (
            <button
              type="button"
              onClick={handleInstallClick}
              style={{ borderColor: tokens.borderSubtle }}
              className="w-full p-4 flex items-center justify-between gap-3 hover:opacity-90 transition-colors text-right cursor-pointer min-h-[56px]"
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
                    {t('profile.install')}
                  </h4>
                  <p
                    style={{ color: tokens.textSecondary }}
                    className="text-xs mt-0.5"
                  >
                    تثبيت مستكشف على جهازك للاستخدام السريع ودون اتصال
                  </p>
                </div>
              </div>
              <div
                style={{
                  backgroundColor: tokens.deepAccent,
                  color: isDark ? '#0B2420' : '#FFFFFF',
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-opacity"
              >
                <Download size={13} />
                <span>تثبيت</span>
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
          {ar.app.title} • {ar.app.version}
        </p>
        <p
          style={{ color: tokens.textSecondary }}
          className="text-[11px]"
        >
          {ar.profile.footerNote}
        </p>
      </div>

      {/* Modal: عن التطبيق */}
      {isAboutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-full max-w-md rounded-[26px] p-6 shadow-2xl border space-y-4 animate-in zoom-in-95 text-right"
          >
            <div
              style={{ borderColor: tokens.borderSubtle }}
              className="flex items-center justify-between pb-3 border-b"
            >
              <h3
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold"
              >
                عن موسوعة مستكشف
              </h3>
              <button
                type="button"
                onClick={() => setIsAboutModalOpen(false)}
                style={{ color: tokens.textSecondary }}
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div
              style={{ color: tokens.textPrimary }}
              className="space-y-3 text-xs sm:text-sm leading-relaxed font-['Cairo',sans-serif]"
            >
              <p>
                <strong>مستكشف (Mustakshif)</strong> هو تطبيق عربي تفاعلي يهدف إلى إحياء التراث الميثولوجي والفولكلوري الغني لشبه الجزيرة العربية وبلاد العرب قبل الإسلام وفي العصور الكلاسيكية.
              </p>
              <p>
                تعتمد الموسوعة على نصوص ومصنفات كبار مؤرخي وأدباء التراث العربي الأصيل:
              </p>
              <ul
                style={{ color: tokens.deepAccent }}
                className="list-disc list-inside space-y-1 font-semibold pr-1"
              >
                <li>كتاب الحيوان للجاحظ (٢٥٥ هـ)</li>
                <li>مروج الذهب ومعادن الجوهر للمسعودي (٣٤٦ هـ)</li>
                <li>كتاب الأصنام لهشام بن الكلبي (٢٠٤ هـ)</li>
                <li>معجم البلدان لياقوت الحموي والإكليل للهمداني</li>
              </ul>
              <p
                style={{ color: tokens.textSecondary }}
                className="text-xs pt-1"
              >
                التطبيق مصمم بهوية عربية هادئة مريحة للعين، ويعمل بالكامل دون اتصال بالإنترنت للحفاظ على استمرارية القراءة والبحث.
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
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}

      {/* Modal: حجم الخط */}
      {isFontModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-full max-w-md rounded-[26px] p-6 shadow-2xl border space-y-4 animate-in zoom-in-95 text-right"
          >
            <div
              style={{ borderColor: tokens.borderSubtle }}
              className="flex items-center justify-between pb-3 border-b"
            >
              <h3
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold"
              >
                تحديد حجم خط القراءة
              </h3>
              <button
                type="button"
                onClick={() => setIsFontModalOpen(false)}
                style={{ color: tokens.textSecondary }}
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {(
                [
                  { id: 'sm', label: 'خط صغير', sample: 'نص الأسطورة بحجم مدمج ومكثف.' },
                  { id: 'md', label: 'خط متوسط (الافتراضي)', sample: 'نص الأسطورة متوازن ومريح للقراءة اليومية.' },
                  { id: 'lg', label: 'خط كبير ومريح', sample: 'نص الأسطورة واسع وكبير ومريح للعينين.' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChangeFontSize?.(option.id);
                    setIsFontModalOpen(false);
                  }}
                  style={{
                    backgroundColor: fontSize === option.id ? tokens.surface : tokens.card,
                    borderColor: fontSize === option.id ? tokens.deepAccent : tokens.borderSubtle,
                  }}
                  className="w-full p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer min-h-[52px]"
                >
                  <div>
                    <h4
                      style={{ color: tokens.textPrimary }}
                      className="font-bold text-sm font-['Cairo',sans-serif]"
                    >
                      {option.label}
                    </h4>
                    <p
                      style={{ color: tokens.textSecondary }}
                      className="text-xs mt-0.5"
                    >
                      {option.sample}
                    </p>
                  </div>
                  {fontSize === option.id && (
                    <Check size={18} style={{ color: tokens.deepAccent }} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal: تواصل معنا */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-full max-w-md rounded-[26px] p-6 shadow-2xl border space-y-4 animate-in zoom-in-95 text-right"
          >
            <div
              style={{ borderColor: tokens.borderSubtle }}
              className="flex items-center justify-between pb-3 border-b"
            >
              <h3
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold"
              >
                تواصل مع فريق مستكشف
              </h3>
              <button
                type="button"
                onClick={() => setIsContactModalOpen(false)}
                style={{ color: tokens.textSecondary }}
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {feedbackSent ? (
              <div className="p-6 text-center space-y-2">
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                    color: tokens.deepAccent,
                  }}
                  className="w-12 h-12 mx-auto rounded-full flex items-center justify-center"
                >
                  <Check size={24} />
                </div>
                <h4
                  style={{ color: tokens.deepAccent }}
                  className="font-bold text-base"
                >
                  شكراً لمشاركتك!
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs"
                >
                  تم استلام مقترحك وسيقوم الباحثون بمراجعته وإضافته للموسوعة.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendFeedback} className="space-y-3">
                <div>
                  <label
                    style={{ color: tokens.textPrimary }}
                    className="block text-xs font-bold mb-1"
                  >
                    اسم الأسطورة أو الكائن المقترح
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أسطورة جبل ثهلان أو كائن السعلاة..."
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.textPrimary,
                    }}
                    className="w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#7FD1AE] min-h-[44px]"
                  />
                </div>

                <div>
                  <label
                    style={{ color: tokens.textPrimary }}
                    className="block text-xs font-bold mb-1"
                  >
                    الملاحظة أو المصدر التراثي
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    required
                    placeholder="أخبرنا عن تفاصيل الرواية أو المصدر الكلاسيكي..."
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.border,
                      color: tokens.textPrimary,
                    }}
                    className="w-full p-3 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-[#7FD1AE]"
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: tokens.deepAccent,
                    color: isDark ? tokens.background : '#FFFFFF',
                  }}
                  className="w-full py-3 rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer min-h-[44px]"
                >
                  إرسال المقترح
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
