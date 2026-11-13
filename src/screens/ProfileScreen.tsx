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
  Cloud,
  Calendar,
  Trash2,
  ExternalLink,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { CalendarEventItem } from '../services/calendar';

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
import { ContactScreen } from './ContactScreen';
import { useAuth } from '../context/AuthContext';
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
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  themeMode: propThemeMode,
  onToggleTheme: propOnToggleTheme,
  fontSize = 'md',
  onChangeFontSize,
  onReplayOnboarding,
  onOpenMethodology,
}) => {
  const { tokens, isDark, toggleTheme, isAutoDark, toggleAutoDark, autoDarkDescription } = useTheme();
  const {
    user,
    signIn,
    logOut,
    syncBookmarksToCloud,
    uploadBookmarksToDrive,
    sendEmailWithGmail,
    scheduleReadingSession,
    getUpcomingReadingEvents,
    cancelReadingSession,
  } = useAuth();
  const { t, lang, setLang, dir, flag } = useI18n();
  const [syncing, setSyncing] = useState(false);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [isGmailSummaryModalOpen, setIsGmailSummaryModalOpen] = useState(false);
  const [isSendingGmailSummary, setIsSendingGmailSummary] = useState(false);

  // Google Calendar state
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);
  const [isLoadingCalendarEvents, setIsLoadingCalendarEvents] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<CalendarEventItem | null>(null);
  const [isDeletingCalendarEvent, setIsDeletingCalendarEvent] = useState(false);
  const [isAddingNewCalendarSession, setIsAddingNewCalendarSession] = useState(false);
  const [newCalendarTitle, setNewCalendarTitle] = useState('مستكشف: جلسة قراءة أساطير عربية');
  const [newCalendarDate, setNewCalendarDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [newCalendarTime, setNewCalendarTime] = useState('20:00');
  const [newCalendarDuration, setNewCalendarDuration] = useState(30);
  const [isCreatingCalendarSession, setIsCreatingCalendarSession] = useState(false);

  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isContactScreenOpen, setIsContactScreenOpen] = useState(false);
  const [sentMessagesCount, setSentMessagesCount] = useState<number>(() => storage.getSentMessagesCount());
  const [isFontModalOpen, setIsFontModalOpen] = useState(false);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [isLangSheetOpen, setIsLangSheetOpen] = useState(false);

  const CURRENT_LANG_BADGES: Record<string, { flag: string; label: string; text: string }> = {
    ar: { flag: '🇹🇳', label: 'عربي', text: 'العربية الفصحى (واجهة كاملة RTL)' },
    en: { flag: '🇬🇧', label: 'English', text: 'English (LTR Interface)' },
    id: { flag: '🇮🇩', label: 'Indonesia', text: 'Bahasa Indonesia (LTR)' },
    th: { flag: '🇹🇭', label: 'ไทย', text: 'ไทย (LTR)' },
  };

  const LANG_SHEET_OPTIONS: { lang: Language; label: string; flag: string; dir: 'rtl' | 'ltr' }[] = [
    { lang: 'ar', label: 'العربية', flag: '🇹🇳', dir: 'rtl' },
    { lang: 'en', label: 'English', flag: '🇬🇧', dir: 'ltr' },
    { lang: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩', dir: 'ltr' },
    { lang: 'th', label: 'ไทย', flag: '🇹🇭', dir: 'ltr' },
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

  const handleSendGmailSummary = async () => {
    if (!user?.email) {
      setToastMessage('يرجى تسجيل الدخول بحساب Google أولاً ✉️');
      return;
    }

    setIsSendingGmailSummary(true);
    try {
      const bookmarkedMyths = allMyths.filter((m) => bookmarks.includes(m.id));
      const mythListHtml = bookmarkedMyths.length > 0
        ? bookmarkedMyths.map((m) => `
            <li style="margin-bottom: 8px;">
              <strong>${m.name}</strong> (${m.region} - ${m.typeLabel})
              <div style="font-size: 12px; color: #4A5568;">${m.summary}</div>
            </li>
          `).join('')
        : '<p>لا توجد أساطير محفوظة بعد.</p>';

      const emailHtml = `
        <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #12332D; padding: 20px; background-color: #FAFCFB;">
          <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; padding: 24px; border: 1px solid #E2E8F0;">
            <h1 style="color: #0E5C4D; margin-top: 0;">تقرير محفوظاتك في مستكشف 📜</h1>
            <p>مرحباً <strong>${user.displayName || 'مستكشفنا العزيز'}</strong>،</p>
            <p>إليك ملخص كامل بإحصاءات قراءتك والأساطير التي قمت بحفظها في تطبيق <strong>مُسْتَكْشِف</strong> (موسوعة الأساطير العربية):</p>
            
            <div style="background-color: #F0FDF8; border-radius: 12px; padding: 16px; margin: 16px 0;">
              <h3 style="color: #0E5C4D; margin-top: 0;">📊 إحصاءاتك:</h3>
              <ul style="padding-right: 20px; margin: 0;">
                <li>عدد الأساطير المحفوظة: <strong>${bookmarks.length}</strong></li>
                <li>فصول مقروءة: <strong>${stats.readChaptersCount}</strong></li>
                <li>دقائق القراءة التقديرية: <strong>${stats.estimatedReadingMinutes} دقيقة</strong></li>
                <li>عدد الشارات المكتسبة: <strong>${badges.filter(b => b.unlocked).length} من 6</strong></li>
              </ul>
            </div>

            <h3 style="color: #0E5C4D;">🔖 الأساطير المحفوظة (${bookmarkedMyths.length}):</h3>
            <ul style="padding-right: 20px;">
              ${mythListHtml}
            </ul>

            <hr style="border: 0; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #718096; text-align: center;">تم توليد هذا التقرير وإرساله بناءً على طلبك عبر تكامل Gmail في تطبيق مستكشف.</p>
          </div>
        </div>
      `;

      const result = await sendEmailWithGmail({
        to: user.email,
        subject: `مستكشف: تقرير محفوظاتك وإحصاءات القراءة (${bookmarks.length} أسطورة)`,
        bodyText: `تقرير محفوظات مستكشف\nالمحفوظات: ${bookmarks.length}\nالفصول المقروءة: ${stats.readChaptersCount}\nدقائق القراءة: ${stats.estimatedReadingMinutes}`,
        bodyHtml: emailHtml,
      });

      if (result.success) {
        setIsGmailSummaryModalOpen(false);
        setToastMessage(`تم إرسال تقرير المحفوظات إلى بريدك (${user.email}) بنجاح ✉️✨`);
      } else {
        setToastMessage(result.error || 'فشل إرسال التقرير عبر Gmail');
      }
    } catch {
      setToastMessage('تعذر إرسال التقرير عبر Gmail');
    } finally {
      setIsSendingGmailSummary(false);
    }
  };

  const handleLoadCalendarEvents = async () => {
    setIsLoadingCalendarEvents(true);
    try {
      const events = await getUpcomingReadingEvents();
      setCalendarEvents(events);
    } catch {
      setToastMessage('تعذر تحميل جلسات القراءة من تقويم Google');
    } finally {
      setIsLoadingCalendarEvents(false);
    }
  };

  const handleDeleteCalendarEvent = async () => {
    if (!eventToDelete) return;
    setIsDeletingCalendarEvent(true);
    try {
      const res = await cancelReadingSession(eventToDelete.id);
      if (res.success) {
        setCalendarEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id));
        setToastMessage('تم حذف جلسة القراءة من تقويم Google بنجاح 🗑️');
        setEventToDelete(null);
      } else {
        setToastMessage(res.error || 'تعذر حذف الجلسة من تقويم Google');
      }
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'خطأ أثناء حذف الجلسة');
    } finally {
      setIsDeletingCalendarEvent(false);
    }
  };

  const handleCreateProfileCalendarSession = async () => {
    setIsCreatingCalendarSession(true);
    try {
      const [hours, minutes] = newCalendarTime.split(':').map(Number);
      const start = new Date(newCalendarDate);
      start.setHours(hours || 20, minutes || 0, 0, 0);
      const end = new Date(start.getTime() + newCalendarDuration * 60 * 1000);

      const res = await scheduleReadingSession({
        summary: newCalendarTitle,
        description: `جلسة قراءة واستكشاف في تطبيق مستكشف الأساطير العربية.\nالمدة: ${newCalendarDuration} دقيقة.`,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

      if (res.success && res.event) {
        setToastMessage('تمت إضافة جلسة القراءة إلى تقويم Google بنجاح 📅✨');
        setIsAddingNewCalendarSession(false);
        handleLoadCalendarEvents();
      } else {
        setToastMessage(res.error || 'فشلت إضافة الجلسة إلى تقويم Google');
      }
    } catch (err) {
      setToastMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء جدولة الجلسة');
    } finally {
      setIsCreatingCalendarSession(false);
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

      {/* 1. Header with Avatar + Name & Firebase Auth */}
      <Card variant="white" className="p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar with Arabesque geometric pattern or user photo */}
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'المستخدم'}
                className="w-16 h-16 rounded-2xl object-cover border-2 shadow-md shrink-0"
                style={{ borderColor: tokens.primaryMint }}
              />
            ) : (
              <div
                style={{
                  background: `linear-gradient(135deg, ${isDark ? tokens.deepAccent : '#0E5C4D'}, ${tokens.primaryMint})`,
                  color: isDark ? tokens.background : '#FFFFFF',
                }}
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center font-['Aref_Ruqaa',serif] text-3xl font-bold shadow-md shrink-0"
              >
                <span>{user?.displayName ? user.displayName.charAt(0) : 'م'}</span>
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
            )}

            <div className="flex-1 min-w-0">
              <h2
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-2xl font-bold leading-tight truncate"
              >
                {user?.displayName || ar.profile.userName}
              </h2>
              <p
                style={{ color: tokens.textSecondary }}
                className="text-xs font-['Cairo',sans-serif] mt-0.5 truncate"
              >
                {user?.email || ar.profile.userRole}
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
                  <span className="text-sm leading-none">{activeLanguage.flag}</span>
                  <span>{activeLanguage.label}</span>
                </span>

                {user ? (
                  <span
                    style={{
                      color: tokens.deepAccent,
                      backgroundColor: isDark ? 'rgba(127, 209, 174, 0.25)' : 'rgba(127, 209, 174, 0.35)',
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    <CheckCircle2 size={10} />
                    <span>سحابة Firebase متصلة</span>
                  </span>
                ) : (
                  <span
                    style={{
                      color: tokens.deepAccent,
                      backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                    }}
                    className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    {ar.app.offlineBadge}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Auth Action Button */}
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    setSyncing(true);
                    try {
                      await syncBookmarksToCloud(bookmarks);
                      setToastMessage('تمت مزامنة المفضلة مع سحابة Firebase بنجاح ☁️');
                    } catch {
                      setToastMessage('تعذرت المزامنة، يرجى المحاولة لاحقاً');
                    } finally {
                      setSyncing(false);
                    }
                  }}
                  disabled={syncing}
                  style={{
                    backgroundColor: tokens.primaryMint,
                    color: '#0E5C4D',
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>{syncing ? 'جارٍ المزامنة...' : 'مزامنة السحابة'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => logOut()}
                  style={{
                    borderColor: tokens.border,
                    color: tokens.textSecondary,
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold border hover:opacity-80 transition-opacity cursor-pointer"
                >
                  خروج
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await signIn();
                    setToastMessage('تم تسجيل الدخول بنجاح عبر Google ✨');
                  } catch {
                    setToastMessage('تعذر تسجيل الدخول، يرجى المحاولة لاحقاً');
                  }
                }}
                style={{
                  backgroundColor: tokens.primaryMint,
                  color: '#0E5C4D',
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 shadow-xs"
              >
                <Sparkles size={14} />
                <span>تسجيل الدخول عبر Google</span>
              </button>
            )}
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
                  {ar.profile.darkMode}
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
              aria-label="الوضع الليلي"
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

          {/* Row 1.5: الوضع الليلي التلقائي (Auto Dark Mode) */}
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
                    الوضع الليلي التلقائي
                  </h4>
                  {isAutoDark && (
                    <span
                      style={{
                        backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(14, 92, 70, 0.1)',
                        color: tokens.deepAccent,
                      }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                      تلقائي نشط
                    </span>
                  )}
                </div>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  {isAutoDark
                    ? autoDarkDescription
                    : 'يعتمد على مستشعر الضوء في الجهاز أو توقيت غروب الشمس'}
                </p>
              </div>
            </div>

            {/* Toggle switch for الوضع الليلي التلقائي */}
            <button
              type="button"
              role="switch"
              aria-checked={isAutoDark}
              aria-label="الوضع الليلي التلقائي"
              onClick={() => {
                toggleAutoDark();
                setToastMessage(
                  !isAutoDark
                    ? 'تم تفعيل الوضع الليلي التلقائي (مستشعر الضوء وغروب الشمس) 🌓'
                    : 'تم إيقاف الوضع الليلي التلقائي'
                );
              }}
              style={{
                backgroundColor: isAutoDark ? tokens.primaryMint : tokens.coolBlueTint,
                borderColor: tokens.border,
              }}
              className="relative inline-flex h-8 w-14 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none min-h-[44px] min-w-[44px] items-center"
            >
              <span
                style={{
                  backgroundColor: isAutoDark ? (isDark ? tokens.background : '#0E5C4D') : '#FFFFFF',
                }}
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full shadow-md transition duration-200 ease-in-out ${
                  isAutoDark ? 'translate-x-[-24px]' : 'translate-x-1'
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
                  {CURRENT_LANG_BADGES[lang]?.text || 'العربية الفصحى (واجهة كاملة RTL)'}
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
                <span>{CURRENT_LANG_BADGES[lang]?.flag || '🇹🇳'}</span>
                <span>{CURRENT_LANG_BADGES[lang]?.label || 'عربي'}</span>
              </span>
              <ChevronLeft size={16} style={{ color: tokens.textSecondary }} className={dir === 'ltr' ? 'rotate-180' : ''} />
            </div>
          </button>

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
                  عن المنهج
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
            onClick={() => setIsContactScreenOpen(true)}
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
                <div className="flex items-center gap-2">
                  <h4
                    style={{ color: tokens.textPrimary }}
                    className="font-bold text-sm font-['Cairo',sans-serif]"
                  >
                    تواصل معنا
                  </h4>
                  <span
                    style={{
                      backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : 'rgba(74, 144, 217, 0.12)',
                      color: isDark ? '#7EB5F0' : '#2A70B8',
                    }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    {sentMessagesCount > 0 ? `المرسل: ${sentMessagesCount}` : 'مباشر'}
                  </span>
                </div>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  شكواك، اقتراحك، أو اكتشافك لخطأ — صوتك يصلنا
                </p>
                <p
                  style={{ color: isDark ? '#7EB5F0' : '#2A70B8' }}
                  className="text-[11px] font-medium mt-1"
                >
                  عدد الرسائل المرسلة من هذا الجهاز: {sentMessagesCount}
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
                  تصدير المفضلة
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

          {/* Row 7.5: Google Drive Backup */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                setToastMessage('يرجى تسجيل الدخول عبر Google أولاً للنسخ إلى Drive ☁️');
                return;
              }
              setIsDriveModalOpen(true);
            }}
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
                <Cloud size={20} />
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  نسخ احتياطي إلى Google Drive
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  حفظ نسخة من محفوظاتك وقراءاتك في مساحة Drive الخاصة بك
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
              <Cloud size={13} />
              <span>حفظ في Drive</span>
            </div>
          </button>

          {/* Row 7.6: تقرير المفضلة عبر Gmail */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                setToastMessage('يرجى تسجيل الدخول عبر Google أولاً لإرسال الملخص عبر Gmail ✉️');
                return;
              }
              setIsGmailSummaryModalOpen(true);
            }}
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
                <Mail size={20} />
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  إرسال ملخص المحفوظات عبر Gmail
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  إرسال تقرير أنيق بجميع أساطيرك وإحصاءاتك إلى بريدك الشخصي
                </p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: tokens.primaryMint,
                color: '#0E5C4D',
              }}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-opacity"
            >
              <Mail size={13} />
              <span>إرسال تقرير</span>
            </div>
          </button>

          {/* Row 7.7: جلسات القراءة في تقويم Google */}
          <button
            type="button"
            onClick={() => {
              if (!user) {
                setToastMessage('يرجى تسجيل الدخول عبر Google أولاً لعرض تقويم القراءة 📅');
                return;
              }
              setIsCalendarModalOpen(true);
              handleLoadCalendarEvents();
            }}
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
                <Calendar size={20} />
              </div>
              <div>
                <h4
                  style={{ color: tokens.textPrimary }}
                  className="font-bold text-sm font-['Cairo',sans-serif]"
                >
                  جلسات القراءة في تقويم Google
                </h4>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs mt-0.5"
                >
                  عرض وإدارة مواعيد وتذكيرات جلسات قراءة الأساطير
                </p>
              </div>
            </div>
            <div
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.textPrimary,
              }}
              className="px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-opacity"
            >
              <Calendar size={13} style={{ color: tokens.deepAccent }} />
              <span>إدارة التقويم</span>
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
                    تثبيت التطبيق
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

      {/* Modal: تأكيد النسخ الاحتياطي إلى Google Drive */}
      {isDriveModalOpen && (
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
              <div className="flex items-center gap-2">
                <Cloud size={20} style={{ color: tokens.deepAccent }} />
                <h3
                  style={{ color: tokens.deepAccent }}
                  className="font-['Aref_Ruqaa',serif] text-xl font-bold"
                >
                  النسخ الاحتياطي إلى Google Drive
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
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
                سيتم حفظ ملف باسم <strong>mustakshif-bookmarks-backup.json</strong> في مساحة Google Drive الخاصة بحسابك (<strong>{user?.email}</strong>).
              </p>
              <div
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.borderSubtle,
                }}
                className="p-3 rounded-xl border text-xs space-y-1"
              >
                <p>• عدد المحفوظات المشمولة: {bookmarks.length}</p>
                <p>• عدد الفصول المقروءة: {stats.readChaptersCount}</p>
                <p>• إجمالي الأوسمة المفتوحة: {badges.filter((b) => b.unlocked).length} من 6</p>
              </div>
              <p style={{ color: tokens.textSecondary }} className="text-xs">
                هل توافق على رفع وحفظ هذا الملف في حسابك على Google Drive؟
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsDriveModalOpen(false)}
                style={{
                  borderColor: tokens.border,
                  color: tokens.textSecondary,
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold border hover:opacity-80 transition-opacity cursor-pointer min-h-[44px]"
              >
                إلغاء
              </button>
              <button
                type="button"
                disabled={isUploadingToDrive}
                onClick={async () => {
                  setIsUploadingToDrive(true);
                  try {
                    const res = await uploadBookmarksToDrive(bookmarks);
                    if (res.success) {
                      setToastMessage('تم رفع النسخة الاحتياطية إلى Google Drive بنجاح ☁️✅');
                      setIsDriveModalOpen(false);
                    } else {
                      setToastMessage(res.error || 'تعذر الرفع إلى Google Drive');
                    }
                  } catch (err: unknown) {
                    setToastMessage(err instanceof Error ? err.message : 'حدث خطأ أثناء الرفع إلى Drive');
                  } finally {
                    setIsUploadingToDrive(false);
                  }
                }}
                style={{
                  backgroundColor: tokens.primaryMint,
                  color: '#0E5C4D',
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-2 shadow-xs min-h-[44px]"
              >
                {isUploadingToDrive ? (
                  <span>جارٍ الحفظ في Drive...</span>
                ) : (
                  <>
                    <Cloud size={14} />
                    <span>موافقة وحفظ في Drive</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet: اختيار لغة التطبيق (RTL-safe with 3 radio options) */}
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
                  {t('profile.language') || 'اختيار لغة التطبيق'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLangSheetOpen(false)}
                style={{ color: tokens.textSecondary }}
                aria-label="إغلاق"
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Radio Options: 🇹🇳 العربية | 🇮🇩 Bahasa Indonesia | 🇹🇭 ไทย */}
            <div className="space-y-2.5" role="radiogroup" aria-label={t('profile.language') || 'اختيار لغة التطبيق'}>
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
                        window.localStorage.setItem('mustakshif:lang', item.lang);
                        document.documentElement.setAttribute('lang', item.lang);
                        document.documentElement.setAttribute('dir', item.dir);
                      } catch {}
                      setIsLangSheetOpen(false);
                      setToastMessage(LANG_CHANGE_TOAST[item.lang]);
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
                      <span className="text-2xl leading-none">{item.flag}</span>
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
                          {item.dir === 'rtl' ? 'واجهة من اليمين لليسار (RTL)' : 'واجهة من اليسار لليمين (LTR)'}
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

      {/* Modal: تأكيد إرسال ملخص المحفوظات عبر Gmail */}
      {isGmailSummaryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
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
              <div className="flex items-center gap-2">
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.2)',
                    color: tokens.deepAccent,
                  }}
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Mail size={18} />
                </div>
                <h3
                  style={{ color: tokens.deepAccent }}
                  className="font-['Aref_Ruqaa',serif] text-xl font-bold"
                >
                  تأكيد إرسال الملخص عبر Gmail
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGmailSummaryModalOpen(false)}
                disabled={isSendingGmailSummary}
                style={{ color: tokens.textSecondary }}
                aria-label="إغلاق"
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed" style={{ color: tokens.textPrimary }}>
              <p>
                هل تؤكد رغبتك في إرسال تقرير مفصل بجميع محفوظاتك ({bookmarks.length} أسطورة) وإحصاءات قراءتك إلى بريدك الإلكتروني الشخصي في Gmail؟
              </p>

              <div
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.borderSubtle,
                }}
                className="p-3.5 rounded-2xl border space-y-1.5 font-['Cairo',sans-serif]"
              >
                <div>
                  <span style={{ color: tokens.textSecondary }}>البريد المستلم: </span>
                  <span className="font-bold">{user?.email}</span>
                </div>
                <div>
                  <span style={{ color: tokens.textSecondary }}>محتوى التقرير: </span>
                  <span>قائمة الأساطير المحفوظة، الفصول المقروءة، دقائق القراءة والشارات</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSendGmailSummary}
                disabled={isSendingGmailSummary}
                style={{
                  backgroundColor: tokens.primaryMint,
                  color: '#0E5C4D',
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:opacity-90 transition-opacity cursor-pointer min-h-[44px]"
              >
                {isSendingGmailSummary ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#0E5C4D] border-t-transparent rounded-full animate-spin" />
                    <span>جارٍ الإرسال عبر Gmail...</span>
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    <span>تأكيد الإرسال عبر Gmail</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsGmailSummaryModalOpen(false)}
                disabled={isSendingGmailSummary}
                style={{
                  borderColor: tokens.border,
                  color: tokens.textSecondary,
                }}
                className="py-3 px-4 rounded-xl font-bold text-xs border hover:opacity-80 transition-opacity cursor-pointer min-h-[44px]"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: إدارة جلسات القراءة في تقويم Google */}
      {isCalendarModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="إدارة جلسات القراءة في تقويم Google"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
        >
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-full max-w-lg rounded-3xl border p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: tokens.borderSubtle }}>
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                    color: tokens.deepAccent,
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                >
                  <Calendar size={20} />
                </div>
                <div>
                  <h3 style={{ color: tokens.textPrimary }} className="text-base font-bold">
                    جلسات القراءة في تقويم Google
                  </h3>
                  <p style={{ color: tokens.textSecondary }} className="text-xs">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleLoadCalendarEvents}
                  disabled={isLoadingCalendarEvents}
                  aria-label="تحديث المواعيد"
                  title="تحديث"
                  style={{ color: tokens.textSecondary }}
                  className="p-1.5 rounded-lg hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <RefreshCw size={17} className={isLoadingCalendarEvents ? 'animate-spin' : ''} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCalendarModalOpen(false);
                    setIsAddingNewCalendarSession(false);
                    setEventToDelete(null);
                  }}
                  aria-label="إغلاق"
                  style={{ color: tokens.textSecondary }}
                  className="p-1 rounded-full hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Sub-header actions: Toggle add form */}
            <div className="flex items-center justify-between gap-2">
              <span style={{ color: tokens.textPrimary }} className="text-xs font-bold">
                المواعيد القادمة ({calendarEvents.length})
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNewCalendarSession((prev) => !prev)}
                style={{
                  backgroundColor: isAddingNewCalendarSession
                    ? tokens.surface
                    : isDark
                    ? 'rgba(127, 209, 174, 0.2)'
                    : tokens.primaryMint,
                  borderColor: tokens.border,
                  color: isDark ? tokens.deepAccent : '#0E5C4D',
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isAddingNewCalendarSession ? (
                  <>
                    <X size={13} />
                    <span>إغلاق النموذج</span>
                  </>
                ) : (
                  <>
                    <Plus size={13} />
                    <span>جدولة جلسة جديدة</span>
                  </>
                )}
              </button>
            </div>

            {/* Add Session Form */}
            {isAddingNewCalendarSession && (
              <div
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                }}
                className="rounded-2xl border p-4 space-y-3"
              >
                <h4 style={{ color: tokens.textPrimary }} className="text-xs font-bold">
                  جدولة تذكير قراءة جديد في تقويمك
                </h4>

                <div className="space-y-1">
                  <label style={{ color: tokens.textSecondary }} className="text-[11px] block">
                    عنوان الجلسة
                  </label>
                  <input
                    type="text"
                    value={newCalendarTitle}
                    onChange={(e) => setNewCalendarTitle(e.target.value)}
                    style={{
                      backgroundColor: tokens.card,
                      borderColor: tokens.border,
                      color: tokens.textPrimary,
                    }}
                    className="w-full px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-teal-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label style={{ color: tokens.textSecondary }} className="text-[11px] block">
                      التاريخ
                    </label>
                    <input
                      type="date"
                      value={newCalendarDate}
                      onChange={(e) => setNewCalendarDate(e.target.value)}
                      style={{
                        backgroundColor: tokens.card,
                        borderColor: tokens.border,
                        color: tokens.textPrimary,
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label style={{ color: tokens.textSecondary }} className="text-[11px] block">
                      الوقت
                    </label>
                    <input
                      type="time"
                      value={newCalendarTime}
                      onChange={(e) => setNewCalendarTime(e.target.value)}
                      style={{
                        backgroundColor: tokens.card,
                        borderColor: tokens.border,
                        color: tokens.textPrimary,
                      }}
                      className="w-full px-2.5 py-1.5 rounded-xl border text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label style={{ color: tokens.textSecondary }} className="text-[11px] block">
                    المدة
                  </label>
                  <div className="flex gap-2">
                    {[15, 30, 45, 60].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setNewCalendarDuration(mins)}
                        style={{
                          backgroundColor:
                            newCalendarDuration === mins
                              ? isDark
                                ? 'rgba(127, 209, 174, 0.25)'
                                : tokens.primaryMint
                              : tokens.card,
                          borderColor: newCalendarDuration === mins ? tokens.deepAccent : tokens.border,
                          color:
                            newCalendarDuration === mins
                              ? isDark
                                ? tokens.deepAccent
                                : '#0E5C4D'
                              : tokens.textSecondary,
                        }}
                        className="flex-1 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer"
                      >
                        {mins} د
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explicit Creation Confirmation Box */}
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(127, 209, 174, 0.08)' : 'rgba(127, 209, 174, 0.12)',
                    borderColor: 'rgba(127, 209, 174, 0.4)',
                  }}
                  className="rounded-xl border p-3 space-y-1 text-xs"
                >
                  <div className="font-bold flex items-center gap-1" style={{ color: tokens.deepAccent }}>
                    <Info size={13} />
                    <span>تأكيد تفاصيل الحدث في تقويم Google:</span>
                  </div>
                  <p style={{ color: tokens.textPrimary }} className="text-[11px] leading-5">
                    سيتم إنشاء حدث باسم «{newCalendarTitle}» بتاريخ {newCalendarDate} الساعة {newCalendarTime} ({newCalendarDuration} دقيقة) في حساب ({user?.email}).
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewCalendarSession(false)}
                    style={{
                      backgroundColor: tokens.card,
                      borderColor: tokens.border,
                      color: tokens.textSecondary,
                    }}
                    className="px-3.5 py-2 rounded-xl border text-xs font-medium cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateProfileCalendarSession}
                    disabled={isCreatingCalendarSession}
                    style={{
                      backgroundColor: tokens.primaryMint,
                      color: '#0E5C4D',
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isCreatingCalendarSession ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>جارٍ الإضافة...</span>
                      </>
                    ) : (
                      <>
                        <Calendar size={14} />
                        <span>تأكيد الإضافة إلى تقويم Google</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Events List */}
            {isLoadingCalendarEvents ? (
              <div className="py-8 text-center space-y-2">
                <span className="inline-block w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                <p style={{ color: tokens.textSecondary }} className="text-xs">
                  جارٍ تحميل جلسات القراءة من تقويم Google...
                </p>
              </div>
            ) : calendarEvents.length === 0 ? (
              <div
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                }}
                className="rounded-2xl border p-6 text-center space-y-2"
              >
                <div
                  style={{ backgroundColor: 'rgba(127, 209, 174, 0.15)' }}
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
                >
                  <Calendar size={22} style={{ color: tokens.deepAccent }} />
                </div>
                <h4 style={{ color: tokens.textPrimary }} className="text-sm font-bold">
                  لا توجد جلسات قراءة مجدولة حالياً
                </h4>
                <p style={{ color: tokens.textSecondary }} className="text-xs leading-5 max-w-sm mx-auto">
                  يمكنك جدولة تذكير لقراءة أي أسطورة مباشرة من أعلى صفحة المقال، أو الضغط على «جدولة جلسة جديدة» أعلاه.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {calendarEvents.map((ev) => {
                  const dateStr = ev.start.dateTime
                    ? new Date(ev.start.dateTime).toLocaleDateString('ar-SA', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : ev.start.date || '';

                  return (
                    <div
                      key={ev.id}
                      style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.border,
                      }}
                      className="p-3.5 rounded-2xl border flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <h4 style={{ color: tokens.textPrimary }} className="text-xs font-bold truncate">
                          {ev.summary}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px]" style={{ color: tokens.textSecondary }}>
                          <Clock size={12} />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="عرض في تقويم Google"
                            title="فتح في Google Calendar"
                            style={{
                              backgroundColor: tokens.card,
                              borderColor: tokens.border,
                              color: tokens.coolBlueAccent,
                            }}
                            className="p-2 rounded-xl border hover:opacity-80 transition-all flex items-center justify-center"
                          >
                            <ExternalLink size={14} />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setEventToDelete(ev)}
                          aria-label="حذف من التقويم"
                          title="حذف الجلسة"
                          style={{
                            backgroundColor: tokens.card,
                            borderColor: tokens.border,
                            color: '#E53E3E',
                          }}
                          className="p-2 rounded-xl border hover:opacity-80 transition-all flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* MANDATORY DELETE CONFIRMATION DIALOG */}
            {eventToDelete && (
              <div
                role="alertdialog"
                aria-modal="true"
                aria-label="تأكيد حذف الحدث من تقويم Google"
                className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
              >
                <div
                  style={{
                    backgroundColor: tokens.card,
                    borderColor: tokens.border,
                  }}
                  className="w-full max-w-sm rounded-3xl border p-5 shadow-2xl space-y-4 text-right"
                >
                  <div className="flex items-center gap-2 text-red-500 font-bold text-sm">
                    <Trash2 size={18} />
                    <span>تأكيد حذف الحدث من تقويم Google</span>
                  </div>

                  <p style={{ color: tokens.textPrimary }} className="text-xs leading-5">
                    هل أنت متأكد من رغبتك في حذف جلسة القراءة «<strong>{eventToDelete.summary}</strong>» المجدولة في تقويم Google لحساب (<strong>{user?.email}</strong>)؟
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEventToDelete(null)}
                      disabled={isDeletingCalendarEvent}
                      style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.border,
                        color: tokens.textSecondary,
                      }}
                      className="px-4 py-2 rounded-xl border text-xs font-medium cursor-pointer"
                    >
                      إلغاء
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteCalendarEvent}
                      disabled={isDeletingCalendarEvent}
                      className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isDeletingCalendarEvent ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>جارٍ الحذف...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 size={13} />
                          <span>تأكيد الحذف من التقويم</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileScreen;
