/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Article / Entry Detail Screen (مستكشف)
 * Full RTL mythological reader screen with classical typography,
 * corner-ornamented hero framing, 3-node historical era slider,
 * sources list, related entities scroll, and text-to-speech (TTS) with play/pause.
 * All colors read strictly from theme tokens.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ChevronRight,
  Share2,
  Bookmark,
  Volume2,
  Play,
  Pause,
  RotateCcw,
  BookOpen,
  Check,
  Sparkles,
  MapPin,
  Clock,
  Compass,
  Scroll,
  Gamepad2,
  PenLine,
  User,
  Copy,
  X,
  Landmark,
  ArrowLeft,
  Info,
  Scale,
  Lock,
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { Tag, TagVariant } from '../components/primitives/Tag';
import { IconButton } from '../components/primitives/IconButton';
import { MythEntry, MythEra } from '../data/types';
import { MYTH_ENTRIES, getEntryById } from '../data/seed';
import { getLongFormEntryById } from '../data/longForm';
import { LongFormReaderSection } from '../components/longform/LongFormReaderSection';
import { getDeepStory } from '../data/storyTypes';
import { storage, FontSize } from '../data/storage';
import { getEstimatedReadingTime, formatReadingTime } from '../utils/readingTime';
import {
  resolveScrollMetrics,
  calculateReadingProgress,
  computePersistableProgress,
} from '../utils/readingProgress';
import { useTheme } from '../theme/ThemeContext';
import { useArabicTTS, TTSState } from '../hooks/useArabicTTS';
import { getCivByRelatedMythId } from '../data/civTypes';
import { MethodologyScreen } from './MethodologyScreen';
import { useI18n } from '../i18n/i18n';
import { resolveHeroImageUrl } from '../utils/assets';
import { copyTextSafely } from '../utils/clipboard';
import {
  getLocalizedEntry,
  getLocalizedLongFormEntry,
  getLocalizedCivilization,
  getLocalizedDeepStory,
  localizeTag,
  localizeEra,
  localizeEvidenceLabel,
} from '../content';
export interface ArticleScreenProps {
  entryId: string;
  onBack: () => void;
  onSelectRelated: (entry: MythEntry) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  initialChapterIndex?: number;
  onSelectCivilization?: (civId: string) => void;
  onOpenMethodology?: () => void;
  isPremiumActive?: boolean;
  onPremiumChange?: (active: boolean) => void;
  onOpenSubscription?: () => void;
}

export type TtsState = TTSState;

export const ArticleScreen: React.FC<ArticleScreenProps> = ({
  entryId,
  onBack,
  onSelectRelated,
  isSaved = false,
  onToggleSave,
  initialChapterIndex,
  onSelectCivilization,
  onOpenMethodology,
  isPremiumActive,
  onPremiumChange,
  onOpenSubscription,
}) => {
  const { t, lang, dir } = useI18n();
  const { tokens, isDark } = useTheme();

  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Resolve raw and localized entry from seed.ts / content by route param id
  const rawEntry = useMemo(() => {
    return getEntryById(entryId) ?? MYTH_ENTRIES[0];
  }, [entryId]);

  const entry = useMemo(() => {
    return rawEntry ? getLocalizedEntry(rawEntry, lang) : undefined;
  }, [rawEntry, lang]);

  const resolvedEntryId = entry?.id ?? '';

  // Long-form premium entry data (Chapter 1 free teaser + locked Chapters 2+)
  const longFormEntry = useMemo(() => {
    if (!resolvedEntryId) return undefined;
    const raw = getLongFormEntryById(resolvedEntryId);
    return raw ? getLocalizedLongFormEntry(raw, lang) : undefined;
  }, [resolvedEntryId, lang]);

  // Deep Story content for game developers and story writers
  const deepStory = useMemo(() => {
    if (!resolvedEntryId) return undefined;
    const raw = getDeepStory(resolvedEntryId);
    return getLocalizedDeepStory(raw, resolvedEntryId, lang);
  }, [resolvedEntryId, lang]);

  // Cross-link: check if current myth belongs to any civilization's relatedMyths
  const relatedCivilization = useMemo(() => {
    if (!resolvedEntryId) return undefined;
    const raw = getCivByRelatedMythId(resolvedEntryId);
    return raw ? getLocalizedCivilization(raw, lang) : undefined;
  }, [resolvedEntryId, lang]);

  // Reading progress state (bar pinned at top of ArticleScreen)
  const [readingProgress, setReadingProgress] = useState(0);
  const articleRef = useRef<HTMLElement | null>(null);

  // Active chapter tracking for sticky chapter chips
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);
  const chapterChipRefs = useRef<Record<number, HTMLButtonElement | null>>({});

  // Font size state (A- / A+): persisted in storage, applied to body & chapters only
  const [fontSize, setFontSizeState] = useState<FontSize>(() => storage.getFontSize());

  // Quote copy state
  const [copiedQuoteIdx, setCopiedQuoteIdx] = useState<number | null>(null);

  // Inspire dialog states ("ألهمني")
  const [inspireModalOpen, setInspireModalOpen] = useState(false);
  const [selectedHook, setSelectedHook] = useState<{
    type: 'game' | 'writing';
    label: string;
    text: string;
  } | null>(null);
  const [copiedHook, setCopiedHook] = useState(false);

  // Timeline era slider state: default to first era or 'جاهلية'
  const eras: readonly MythEra[] = ['جاهلية', 'صدر الإسلام', 'العصر العباسي'];
  const normalizeEra = (raw?: string): MythEra => {
    if (!raw) return 'جاهلية';
    if (raw === 'الجاهلية' || raw === 'جاهلية') return 'جاهلية';
    if (raw === 'صدر الإسلام') return 'صدر الإسلام';
    if (raw === 'العصر العباسي') return 'العصر العباسي';
    return 'جاهلية';
  };
  const [activeEra, setActiveEra] = useState<MythEra>('جاهلية');
  const activeEraIndex = Math.max(0, eras.indexOf(activeEra));
  const hookStrokeColor = isDark ? '#9FE8CC' : '#0E5C4D';

  // Myth Dual-narrative mode (mythTradition vs mythAnalysis)
  const [mythNarrativeView, setMythNarrativeView] = useState<'tradition' | 'analysis'>(() => {
    return storage.getMythDualNarrativeView();
  });

  const handleSelectMythNarrative = (view: 'tradition' | 'analysis') => {
    setMythNarrativeView(view);
    storage.setMythDualNarrativeView(view);
  };

  const hasMythTradition = Boolean(entry?.mythTradition && entry.mythTradition.trim().length > 0);
  const hasMythAnalysis = Boolean(entry?.mythAnalysis && entry.mythAnalysis.trim().length > 0);
  const showMythDualSection = hasMythTradition || hasMythAnalysis;

  const effectiveMythNarrativeView: 'tradition' | 'analysis' =
    hasMythTradition && hasMythAnalysis
      ? mythNarrativeView
      : hasMythTradition
      ? 'tradition'
      : 'analysis';

  const currentMythNarrativeText =
    effectiveMythNarrativeView === 'tradition'
      ? (entry?.mythTradition ?? '')
      : (entry?.mythAnalysis ?? '');

  const renderDualNarrativeSection = () => {
    if (!showMythDualSection) return null;

    return (
      <section aria-label={t('article.historicalReading') || 'القراءة التاريخية'} className="space-y-3 pt-1">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-2">
            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-xl font-bold flex items-center gap-2"
            >
              <Scroll size={20} style={{ color: tokens.deepAccent }} />
              <span>{t('article.historicalReading') || 'القراءة التاريخية'}</span>
            </h3>
            <button
              type="button"
              onClick={() => {
                if (onOpenMethodology) {
                  onOpenMethodology();
                } else {
                  setIsMethodologyOpen(true);
                }
              }}
              title={t('method.title')}
              aria-label={t('method.title')}
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.textSecondary,
              }}
              className="p-1 rounded-full border hover:text-[#7FD1AE] hover:border-[#7FD1AE] transition-all cursor-pointer inline-flex items-center justify-center min-w-[26px] min-h-[26px]"
            >
              <Info size={14} />
            </button>
          </div>
          {hasMythTradition && hasMythAnalysis && (
            <span
              style={{ color: tokens.textSecondary }}
              className="text-xs font-['Cairo',sans-serif] opacity-80"
            >
              {t('article.twoPerspectives')}
            </span>
          )}
        </div>

        {/* Toggle buttons: "الرواية الشعبية" (mint) / "التحليل التاريخي" (blue) */}
        {hasMythTradition && hasMythAnalysis && (
          <div
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            }}
            className="flex items-center gap-2 p-1 rounded-2xl border"
            role="tablist"
            aria-label={t('article.historicalReading')}
          >
            <button
              type="button"
              role="tab"
              aria-selected={effectiveMythNarrativeView === 'tradition'}
              onClick={() => handleSelectMythNarrative('tradition')}
              style={{
                backgroundColor: effectiveMythNarrativeView === 'tradition'
                  ? (isDark ? 'rgba(127, 209, 174, 0.22)' : tokens.primaryMint)
                  : 'transparent',
                color: effectiveMythNarrativeView === 'tradition'
                  ? (isDark ? '#7FD1AE' : '#0B483B')
                  : tokens.textSecondary,
                borderColor: effectiveMythNarrativeView === 'tradition'
                  ? (isDark ? '#7FD1AE' : '#64C19A')
                  : 'transparent',
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer font-['Cairo',sans-serif] ${
                effectiveMythNarrativeView === 'tradition' ? 'shadow-xs scale-[1.01]' : 'hover:opacity-80'
              }`}
            >
              <Scroll size={14} />
              <span>{t('method.folk')}</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={effectiveMythNarrativeView === 'analysis'}
              onClick={() => handleSelectMythNarrative('analysis')}
              style={{
                backgroundColor: effectiveMythNarrativeView === 'analysis'
                  ? (isDark ? 'rgba(74, 144, 217, 0.24)' : '#DCEBFB')
                  : 'transparent',
                color: effectiveMythNarrativeView === 'analysis'
                  ? (isDark ? '#8ABDF8' : '#1A4D7C')
                  : tokens.textSecondary,
                borderColor: effectiveMythNarrativeView === 'analysis'
                  ? (isDark ? '#4A90D9' : '#85B6EA')
                  : 'transparent',
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold border transition-all duration-150 inline-flex items-center justify-center gap-1.5 cursor-pointer font-['Cairo',sans-serif] ${
                effectiveMythNarrativeView === 'analysis' ? 'shadow-xs scale-[1.01]' : 'hover:opacity-80'
              }`}
            >
              <BookOpen size={14} />
              <span>{t('method.analysis')}</span>
            </button>
          </div>
        )}

        {/* Selected view text card */}
        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: isDark
              ? (effectiveMythNarrativeView === 'tradition' ? 'rgba(127, 209, 174, 0.35)' : 'rgba(74, 144, 217, 0.35)')
              : (effectiveMythNarrativeView === 'tradition' ? '#C0E9DA' : '#CADFF8'),
          }}
          className="px-4 py-5 rounded-2xl border shadow-xs transition-colors duration-200 space-y-2.5"
        >
          <div className="flex items-center justify-between">
            <span
              style={{
                backgroundColor: effectiveMythNarrativeView === 'tradition'
                  ? (isDark ? 'rgba(127, 209, 174, 0.18)' : '#E8F8F2')
                  : (isDark ? 'rgba(74, 144, 217, 0.18)' : '#EBF3FC'),
                color: effectiveMythNarrativeView === 'tradition'
                  ? (isDark ? '#7FD1AE' : '#0B5344')
                  : (isDark ? '#8ABDF8' : '#184F82'),
                borderColor: effectiveMythNarrativeView === 'tradition'
                  ? (isDark ? 'rgba(127, 209, 174, 0.4)' : '#BDE7D7')
                  : (isDark ? 'rgba(74, 144, 217, 0.4)' : '#C3DAF7'),
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
            >
              {effectiveMythNarrativeView === 'tradition' ? (
                <>
                  <Scroll size={12} />
                  <span>{t('method.folk')}</span>
                </>
              ) : (
                <>
                  <BookOpen size={12} />
                  <span>{t('method.analysis')}</span>
                </>
              )}
            </span>

            <span
              style={{ color: tokens.textSecondary }}
              className="text-[11px] font-['Cairo',sans-serif]"
            >
              {effectiveMythNarrativeView === 'tradition'
                ? t('article.folkPerspective')
                : t('article.criticalPerspective')}
            </span>
          </div>

          <p
            style={{ color: tokens.textPrimary }}
            className="font-['Amiri',serif] text-[17px] sm:text-[18px] leading-[1.95] text-start pt-1"
          >
            {currentMythNarrativeText}
          </p>
        </div>
      </section>
    );
  };

  // Smooth scroll handler for chapter navigation
  const handleScrollToChapter = (idx: number) => {
    setActiveChapterIndex(idx);
    const chipEl = chapterChipRefs.current[idx];
    if (chipEl) {
      chipEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
    const targetEl = document.getElementById(`chapter-${idx}`);
    if (!targetEl) return;

    // Support both scroll inside <main> and window scroll
    const scrollContainer = targetEl.closest('main') || document.documentElement;
    if (scrollContainer && scrollContainer !== document.documentElement) {
      const parentRect = scrollContainer.getBoundingClientRect();
      const elRect = targetEl.getBoundingClientRect();
      // 75px offset accommodates sticky chapter chips bar & padding
      const targetScrollTop = scrollContainer.scrollTop + (elRect.top - parentRect.top) - 75;
      scrollContainer.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      });
    } else {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Reset scroll position cleanly when navigating to a different article
  useEffect(() => {
    setReadingProgress(0);
    setActiveChapterIndex(0);
    const mainEl = document.querySelector('main');
    if (mainEl && typeof mainEl.scrollTo === 'function') {
      mainEl.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [entryId]);

  // Track window or main scroll & layout resizes for reading progress bar & chapter tracking
  useEffect(() => {
    const handleScroll = () => {
      const mainEl = document.querySelector('main');
      const metrics = resolveScrollMetrics({
        mainScrollHeight: mainEl?.scrollHeight ?? 0,
        mainClientHeight: mainEl?.clientHeight ?? 0,
        mainScrollTop: mainEl?.scrollTop ?? 0,
        docScrollHeight: document.documentElement?.scrollHeight ?? 0,
        viewportHeight: window.innerHeight || document.documentElement?.clientHeight || 0,
        windowScrollY: window.scrollY ?? 0,
      });

      const progress = calculateReadingProgress(metrics.scrollTop, metrics.scrollableHeight);
      setReadingProgress(progress);

      if (!entry?.id) return;
      const roundedProgress = computePersistableProgress(progress);
      if (roundedProgress > 0) {
        storage.setMythProgress(entry.id, roundedProgress);
      }

      // Check active chapter if deepStory exists
      if (deepStory?.chapters && deepStory.chapters.length > 0) {
        let currIdx = 0;
        for (let i = 0; i < deepStory.chapters.length; i++) {
          const el = document.getElementById(`chapter-${i}`);
          if (el) {
            const rect = el.getBoundingClientRect();
            if (rect.top <= 220) {
              currIdx = i;
            }
          }
        }
        setActiveChapterIndex(currIdx);
        storage.markChapterRead(`${entry.id}_${currIdx}`);

        // Persist last read chapter for Home v2
        storage.setLastReadChapter({
          mythId: entry.id,
          mythName: entry.name ?? '',
          chapterIndex: currIdx,
          chapterTitle: deepStory.chapters[currIdx]?.title ?? '',
          progressPercent: roundedProgress,
        });
      }
    };

    const mainEl = document.querySelector('main');
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => handleScroll());
      if (articleRef.current) resizeObserver.observe(articleRef.current);
      if (mainEl) resizeObserver.observe(mainEl);
    }

    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [deepStory, entry]);

  // Deep-link to chapter if initialChapterIndex is provided with smooth scrolling
  useEffect(() => {
    if (typeof initialChapterIndex === 'number' && Number.isFinite(initialChapterIndex) && initialChapterIndex >= 0) {
      const chaptersLen = deepStory?.chapters?.length ?? 0;
      const safeIdx = chaptersLen > 0 ? Math.min(initialChapterIndex, chaptersLen - 1) : initialChapterIndex;
      const timer = setTimeout(() => {
        handleScrollToChapter(safeIdx);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [initialChapterIndex, deepStory?.chapters?.length]);

  // Font size change handler
  const handleFontSizeChange = (direction: 'up' | 'down') => {
    let nextSize: FontSize = fontSize;
    if (direction === 'down') {
      if (fontSize === 'lg') nextSize = 'md';
      else if (fontSize === 'md') nextSize = 'sm';
    } else {
      if (fontSize === 'sm') nextSize = 'md';
      else if (fontSize === 'md') nextSize = 'lg';
    }
    setFontSizeState(nextSize);
    storage.setFontSize(nextSize);
  };

  // Font size typography classes applied exclusively to body paragraphs and chapters (base: 17px mobile / 18px tablet+, line-height 1.95)
  const bodyTextSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'sm':
        return 'text-[15px] sm:text-[16px] leading-[1.95]';
      case 'lg':
        return 'text-[19px] sm:text-[20px] leading-[1.95]';
      case 'md':
      default:
        return 'text-[17px] sm:text-[18px] leading-[1.95]';
    }
  }, [fontSize]);

  // Copy quote handler: copies text + " — " + source
  const handleCopyQuote = async (quoteText: string, quoteSource: string, idx: number) => {
    const textToCopy = `${quoteText} — ${quoteSource}`;
    const copied = await copyTextSafely(textToCopy);
    if (copied) {
      setCopiedQuoteIdx(idx);
      setTimeout(() => setCopiedQuoteIdx(null), 2000);
    } else {
      showToast(t('common.copyError'));
    }
  };

  // Gather hooks for Inspire modal
  const availableHooks = useMemo(() => {
    const list: Array<{ type: 'game' | 'writing'; label: string; text: string }> = [];
    if (deepStory?.gameHooks) {
      deepStory.gameHooks.forEach((h) => {
        list.push({ type: 'game', label: t('article.gameIdea'), text: h });
      });
    }
    if (deepStory?.writingHooks) {
      deepStory.writingHooks.forEach((h) => {
        list.push({ type: 'writing', label: t('article.storyIdea'), text: h });
      });
    }
    if (list.length === 0) {
      const firstEra = entry?.timeline?.[0]?.era;
      const safeName = entry?.name ?? '';
      const safeRegion = entry?.region ?? '';
      const safeSummary = entry?.summary ?? '';
      list.push({
        type: 'game',
        label: t('article.gameIdea'),
        text: `${safeName}${safeRegion ? ` (${safeRegion})` : ''}: ${safeSummary}`,
      });
      list.push({
        type: 'writing',
        label: t('article.storyIdea'),
        text: `${safeName} — ${firstEra ? localizeEra(firstEra, lang) : localizeEra('جاهلية', lang)}: ${safeSummary}`,
      });
    }
    return list;
  }, [deepStory, entry, lang, t]);

  // Open Inspire Modal with a random hook
  const handleOpenInspireModal = () => {
    if (availableHooks.length === 0) return;
    const randomHook = availableHooks[Math.floor(Math.random() * availableHooks.length)];
    setSelectedHook(randomHook);
    setCopiedHook(false);
    setInspireModalOpen(true);
  };

  // Re-roll hook deterministically without risking an infinite loop
  const handleReshuffleHook = () => {
    const len = availableHooks.length;
    if (len <= 1) return;
    const currentIdx = selectedHook ? availableHooks.indexOf(selectedHook) : -1;
    const offset = currentIdx >= 0 ? (currentIdx + 1 + Math.floor(Math.random() * (len - 1))) % len : 0;
    setSelectedHook(availableHooks[offset]);
    setCopiedHook(false);
  };

  // Copy selected inspire hook
  const handleCopyHook = async () => {
    if (!selectedHook) return;
    const copied = await copyTextSafely(selectedHook.text);
    if (copied) {
      setCopiedHook(true);
      setTimeout(() => setCopiedHook(false), 2000);
    } else {
      showToast(t('common.copyError'));
    }
  };

  // Arabic Text-to-Speech hook: idle | playing | paused
  const {
    speak,
    pause,
    resume,
    stop,
    state: ttsState,
    isSupported,
  } = useArabicTTS();

  const [copiedShare, setCopiedShare] = useState(false);

  // Initialize active era based on entry timeline if available
  useEffect(() => {
    if (Array.isArray(entry?.timeline) && entry.timeline.length > 0) {
      setActiveEra(normalizeEra(entry.timeline[0]?.era));
    } else {
      setActiveEra('جاهلية');
    }
  }, [entry]);

  // Stop speech synthesis when navigating away or switching entry
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop, entryId]);

  const handleToggleSpeech = () => {
    if (!entry) return;
    if (ttsState === 'idle') {
      // First tap: reads entry title then all body paragraphs in order
      if (!Array.isArray(entry.body)) {
        speak([entry.name ?? '']);
        return;
      }
      speak([entry.name, ...entry.body]);
    } else if (ttsState === 'playing') {
      // Second tap: pause
      pause();
    } else if (ttsState === 'paused') {
      // Third tap: resume
      resume();
    }
  };

  const handleShare = async () => {
    if (!entry) return;
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `${t('app.title')} | ${entry.name ?? ''}`,
          text: entry.summary ?? '',
          url: shareUrl,
        });
        return;
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') {
          return;
        }
        console.warn('[ArticleScreen] navigator.share failed, falling back to clipboard:', err);
      }
    }

    const copied = await copyTextSafely(shareUrl || (entry.name ?? ''));
    if (copied) {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } else {
      showToast(t('common.copyError'));
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleCopyQuest = async () => {
    if (!entry) return;
    const bodyText = Array.isArray(entry.body) ? entry.body.join('\n\n') : '';
    const chaptersText =
      (Array.isArray(deepStory?.chapters) ? deepStory.chapters : [])
        .map((c) => `${c?.title ?? ''}:\n${c?.text ?? ''}`)
        .join('\n\n') || bodyText;

    const questData = {
      id: entry.id,
      name: entry.name ?? '',
      category: entry.category,
      region: entry.region ?? '',
      story: chaptersText,
      scenes: Array.isArray(deepStory?.scenes) ? deepStory.scenes : [],
      decision: deepStory?.decision ?? '',
    };

    const copied = await copyTextSafely(JSON.stringify(questData, null, 2));
    showToast(copied ? t('common.copied') : t('common.copyError'));
  };

  const handleCopyGameCard = async () => {
    if (!entry) return;
    const fullCard = {
      ...entry,
      deepStory: deepStory || null,
    };

    const copied = await copyTextSafely(JSON.stringify(fullCard, null, 2));
    showToast(copied ? t('common.copied') : t('common.copyError'));
  };

  const handleCopyDecision = async (decText: string) => {
    const copied = await copyTextSafely(decText ?? '');
    showToast(copied ? t('common.copied') : t('common.copyError'));
  };

  const activeTimelineNote = useMemo(() => {
    const timelineList = Array.isArray(entry?.timeline) ? entry.timeline : [];
    const found = timelineList.find((tl) => normalizeEra(tl?.era) === activeEra);
    if (found?.note) return found.note;

    if (activeEra === 'جاهلية') {
      return t('article.defaultNoteJahiliyya');
    }
    if (activeEra === 'صدر الإسلام') {
      return t('article.defaultNoteEarlyIslam');
    }
    return t('article.defaultNoteAbbasid');
  }, [entry, activeEra, t]);

  const getTagVariant = (tag: string): TagVariant => {
    if (tag === 'رعب') return 'horror';
    if (tag === 'تاريخ') return 'history';
    if (tag === 'خرافي') return 'supernatural';
    return 'neutral';
  };

  if (isMethodologyOpen) {
    return <MethodologyScreen onBack={() => setIsMethodologyOpen(false)} />;
  }

  if (!rawEntry || !entry) {
    return (
      <article className="space-y-6 pb-12 animate-in fade-in duration-200" dir={dir}>
        <nav className="flex items-center justify-end pt-1">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('article.back')}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="flex items-center justify-center w-11 h-11 rounded-2xl border shadow-sm cursor-pointer min-h-[44px] min-w-[44px]"
          >
            <ChevronRight size={22} className={`stroke-[2.5] ${dir === 'ltr' ? 'rotate-180' : ''}`} />
          </button>
        </nav>
        <Card variant="white" elevation="subtle" className="p-8 text-center space-y-3 rounded-[20px]">
          <BookOpen size={32} className="mx-auto" style={{ color: tokens.textSecondary }} />
          <p style={{ color: tokens.textPrimary }} className="font-['Aref_Ruqaa',serif] text-lg font-bold">
            {t('article.entryNotFound')}
          </p>
          <button
            type="button"
            onClick={onBack}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-full border text-xs font-bold cursor-pointer min-h-[44px]"
          >
            {t('article.backHome')}
          </button>
        </Card>
      </article>
    );
  }

  const heroImageUrl = resolveHeroImageUrl(entry.heroImage);
  const safeBody = Array.isArray(entry.body) ? entry.body : [];
  const safeDeepChapters = Array.isArray(deepStory?.chapters) ? deepStory.chapters.filter(Boolean) : [];
  const hasLongFormChapters = Array.isArray(longFormEntry?.chapters) && longFormEntry.chapters.length > 0;
  const safeSources = Array.isArray(entry.sources) ? entry.sources : [];
  const safeRelatedIds = Array.isArray(entry.related) ? entry.related : [];

  return (
    <article ref={articleRef} className="space-y-6 pb-12 animate-in fade-in duration-200" dir={dir}>
      {/* Show notice banner ONLY if current non-Arabic entry has partially missing translation */}
      {lang !== 'ar' &&
        Boolean(
          entry.hasMissingTranslation ||
            longFormEntry?.hasMissingTranslation ||
            deepStory?.hasMissingTranslation
        ) && (
        <div
          style={{
            backgroundColor: isDark ? 'rgba(127, 209, 174, 0.12)' : '#E8F7F0',
            borderColor: tokens.primaryMint,
            color: tokens.deepAccent,
          }}
          className="p-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 shadow-2xs"
        >
          <span>{t('article.fallbackArabicNotice')}</span>
          <span className="text-sm">🇹🇳</span>
        </div>
      )}

      {/* Reading-progress bar fixed at top of ArticleScreen */}
      <div
        role="progressbar"
        aria-label={t('article.readingProgressLabel')}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(readingProgress)}
        data-testid="article-reading-progress"
        dir={dir}
        className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 pointer-events-none"
      >
        <div
          className="h-1.5 w-full overflow-hidden backdrop-blur-xs"
          style={{
            backgroundColor: isDark ? 'rgba(11, 36, 32, 0.88)' : 'rgba(221, 238, 230, 0.92)',
          }}
        >
          <div
            data-testid="article-reading-progress-fill"
            className="h-full transition-[width] duration-150 ease-out rounded-e-full"
            style={{
              width: `${readingProgress}%`,
              background: `linear-gradient(to ${dir === 'rtl' ? 'left' : 'right'}, ${tokens.deepAccent}, ${tokens.primaryMint})`,
              backgroundColor: tokens.primaryMint,
            }}
          />
        </div>
      </div>

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

      {/* 1. Top Bar */}
      <nav
        aria-label={t('article.narrativeTitle')}
        className="flex items-center justify-between gap-3 pt-1 flex-wrap"
      >
        {/* Actions row: share, bookmark, game card copy, speaker + Font-size control (A- / A+) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <IconButton
            icon={copiedShare ? <Check size={18} style={{ color: tokens.deepAccent }} /> : <Share2 size={18} />}
            label={copiedShare ? t('article.shareSuccess') : t('article.share')}
            variant="surface"
            size="md"
            onClick={handleShare}
          />

          <IconButton
            icon={<Bookmark size={18} className={isSaved ? 'fill-current' : ''} style={{ color: isSaved ? tokens.deepAccent : undefined }} />}
            label={isSaved ? t('article.bookmarkRemove') : t('article.bookmarkAdd')}
            variant="surface"
            size="md"
            onClick={() => onToggleSave?.(entry.id)}
          />

          <IconButton
            icon={<Gamepad2 size={18} style={{ color: tokens.coolBlueAccent }} />}
            label={t('article.copyGameCard')}
            variant="surface"
            size="md"
            onClick={handleCopyGameCard}
          />

          {isSupported && (
            <IconButton
              icon={
                ttsState === 'playing' ? (
                  <Pause size={18} style={{ color: tokens.deepAccent }} className="animate-pulse" />
                ) : ttsState === 'paused' ? (
                  <Play size={18} style={{ color: tokens.deepAccent }} />
                ) : (
                  <Volume2 size={18} />
                )
              }
              label={
                ttsState === 'playing'
                  ? t('article.audioPause')
                  : ttsState === 'paused'
                  ? t('article.audioResume')
                  : t('article.audioPlay')
              }
              variant={ttsState !== 'idle' ? 'primary' : 'surface'}
              size="md"
              onClick={handleToggleSpeech}
            />
          )}

          {/* Font-size control (A- / A+) persisted in local storage */}
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="flex items-center rounded-2xl border px-1 py-0.5 shadow-2xs"
            role="group"
            aria-label={t('article.fontSizeBadge')}
          >
            <button
              type="button"
              onClick={() => handleFontSizeChange('down')}
              disabled={fontSize === 'sm'}
              aria-label={t('article.fontShrinkAria')}
              title={`${t('article.fontShrinkAria')} (A-)`}
              style={{
                color: fontSize === 'sm' ? tokens.borderSubtle : tokens.textPrimary,
              }}
              className="px-2.5 py-1 text-xs font-bold hover:opacity-80 transition-colors disabled:opacity-40 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center font-serif"
            >
              A-
            </button>
            <span
              style={{ backgroundColor: tokens.borderSubtle }}
              className="w-px h-3.5 mx-0.5"
            />
            <button
              type="button"
              onClick={() => handleFontSizeChange('up')}
              disabled={fontSize === 'lg'}
              aria-label={t('article.fontEnlargeAria')}
              title={`${t('article.fontEnlargeAria')} (A+)`}
              style={{
                color: fontSize === 'lg' ? tokens.borderSubtle : tokens.textPrimary,
              }}
              className="px-2.5 py-1 text-sm font-bold hover:opacity-80 transition-colors disabled:opacity-40 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center font-serif"
            >
              A+
            </button>
          </div>
        </div>

        {/* Back arrow */}
        <div className="flex items-center">
          <button
            type="button"
            onClick={onBack}
            aria-label={t('article.back')}
            title={t('article.back')}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="flex items-center justify-center w-11 h-11 rounded-2xl border shadow-sm transition-all duration-150 active:scale-95 cursor-pointer min-h-[44px] min-w-[44px]"
          >
            <ChevronRight size={22} className={`stroke-[2.5] ${dir === 'ltr' ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </nav>

      {/* TTS Status Bar */}
      {isSupported && ttsState !== 'idle' && (
        <div
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            color: tokens.deepAccent,
          }}
          className="p-3.5 rounded-2xl border flex items-center justify-between text-xs shadow-xs animate-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-2.5">
            <span
              style={{ backgroundColor: tokens.primaryMint }}
              className={`w-2.5 h-2.5 rounded-full ${
                ttsState === 'playing' ? 'animate-ping' : ''
              }`}
            />
            <span className="font-bold">
              {ttsState === 'playing'
                ? (t('article.audioNarrating') || 'يتم السرد الآن…')
                : t('article.audioPauseTooltip')}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSpeech}
              style={{
                backgroundColor: tokens.card,
                color: tokens.deepAccent,
              }}
              className="p-1.5 rounded-xl shadow-xs cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={ttsState === 'playing' ? t('article.audioPause') : t('article.audioResume')}
            >
              {ttsState === 'playing' ? <Pause size={16} /> : <Play size={16} />}
            </button>

            <button
              type="button"
              onClick={stop}
              style={{
                backgroundColor: tokens.card,
                color: isDark ? '#FF9A9A' : '#A63333',
              }}
              className="p-1.5 rounded-xl shadow-xs cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('article.audioStop')}
            >
              <RotateCcw size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 2. Hero Image Framed */}
      <div
        style={{
          backgroundColor: tokens.card,
          borderColor: tokens.border,
        }}
        className="relative p-2.5 rounded-[24px] border shadow-sm"
      >
        {/* Classical Arabesque Corner Ornaments */}
        <div
          style={{ borderColor: tokens.deepAccent }}
          className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 rounded-tr-md pointer-events-none opacity-80"
        />
        <div
          style={{ backgroundColor: tokens.primaryMint }}
          className="absolute top-2.5 right-2.5 w-1 h-1 rounded-full pointer-events-none"
        />

        <div
          style={{ borderColor: tokens.deepAccent }}
          className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 rounded-tl-md pointer-events-none opacity-80"
        />
        <div
          style={{ backgroundColor: tokens.primaryMint }}
          className="absolute top-2.5 left-2.5 w-1 h-1 rounded-full pointer-events-none"
        />

        <div
          style={{ borderColor: tokens.deepAccent }}
          className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 rounded-br-md pointer-events-none opacity-80"
        />
        <div
          style={{ backgroundColor: tokens.primaryMint }}
          className="absolute bottom-2.5 right-2.5 w-1 h-1 rounded-full pointer-events-none"
        />

        <div
          style={{ borderColor: tokens.deepAccent }}
          className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 rounded-bl-md pointer-events-none opacity-80"
        />
        <div
          style={{ backgroundColor: tokens.primaryMint }}
          className="absolute bottom-2.5 left-2.5 w-1 h-1 rounded-full pointer-events-none"
        />

        {/* Inner Framed Image */}
        <div
          style={{ backgroundColor: tokens.surface }}
          className="relative h-60 sm:h-72 w-full rounded-[18px] overflow-hidden"
        >
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt={entry.name ?? ''}
              className="w-full h-full object-cover object-center"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: tokens.textSecondary }}>
              <BookOpen size={44} strokeWidth={1.4} className="opacity-50" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Region Badge */}
          <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs text-white">
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/20">
              <MapPin size={12} style={{ color: tokens.primaryMint }} />
              <span>{entry.region ?? ''}</span>
            </span>
            {entry.latinName && (
              <span className="text-[11px] font-mono text-white/90 bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                {entry.latinName}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Big Display-Font Arabic Title Centered with Mint Pill */}
      <div className="text-center space-y-2.5 pt-1">
        <h1
          style={{ color: tokens.deepAccent }}
          className="font-['Aref_Ruqaa',serif] text-3xl sm:text-4xl font-bold leading-tight tracking-wide"
        >
          {entry.name ?? ''}
        </h1>

        {/* Small progress hint text under the title while playing */}
        {ttsState === 'playing' && (
          <p
            dir={dir}
            style={{ color: tokens.textSecondary }}
            className="text-xs sm:text-sm font-['Cairo',sans-serif] animate-pulse flex items-center justify-center gap-1.5"
          >
            <span>{t('article.audioNarrating') || 'يتم السرد الآن…'}</span>
          </p>
        )}

        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold font-['Cairo',sans-serif] shadow-xs min-h-[32px]"
          >
            <Sparkles size={13} style={{ color: tokens.deepAccent }} />
            <span>{entry.typeLabel ?? ''}</span>
          </span>

          <span
            style={{
              backgroundColor: tokens.coolBlueTint,
              borderColor: tokens.border,
              color: tokens.coolBlueAccent,
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-bold shadow-xs min-h-[32px]"
          >
            <Clock size={13} style={{ color: tokens.coolBlueAccent }} />
            <span>{formatReadingTime(getEstimatedReadingTime(rawEntry), lang)}</span>
          </span>

          <span
            data-testid="article-reading-progress-text"
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.14)' : 'rgba(127, 209, 174, 0.22)',
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border text-xs font-mono font-bold shadow-xs min-h-[32px]"
          >
            <span>{t('article.readingProgressValue', { percent: Math.round(readingProgress) })}</span>
          </span>

          {Array.isArray(rawEntry.tags) && rawEntry.tags.length > 0 && rawEntry.tags[0] && (
            <Tag variant={getTagVariant(rawEntry.tags[0])} size="sm">
              {localizeTag(rawEntry.tags[0], lang)}
            </Tag>
          )}
        </div>

        {/* Traits chips row after typeLabel pill */}
        {deepStory?.traits && deepStory.traits.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
            <span style={{ color: tokens.textSecondary }} className="text-xs font-bold">
              {t('article.traits')}:
            </span>
            {deepStory.traits.map((trait, idx) => (
              <span
                key={idx}
                style={{
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.15)' : 'rgba(14, 92, 77, 0.08)',
                  borderColor: tokens.border,
                  color: tokens.deepAccent,
                }}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shadow-2xs"
              >
                ✦ {trait}
              </span>
            ))}
          </div>
        )}

        <p
          style={{ color: tokens.textSecondary }}
          className="text-xs sm:text-sm max-w-sm mx-auto leading-relaxed font-['Cairo',sans-serif] px-2"
        >
          {entry.summary}
        </p>

        {/* Cross-link: Mint banner card under the summary */}
        {relatedCivilization && (
          <div className="pt-2 px-1 max-w-md mx-auto">
            <button
              type="button"
              onClick={() => onSelectCivilization && onSelectCivilization(relatedCivilization.id)}
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.15)' : '#E6F8F0',
                borderColor: isDark ? 'rgba(127, 209, 174, 0.4)' : '#A7E5C8',
                color: isDark ? '#A7E5C8' : '#0B5545',
              }}
              className="w-full p-3 sm:p-3.5 rounded-2xl border shadow-xs hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center justify-between gap-3 text-start group"
              aria-label={`${t('article.relatedCivLabel')}: ${relatedCivilization.name}`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(127, 209, 174, 0.25)' : '#D0F3E4',
                    color: tokens.deepAccent,
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-current/20"
                >
                  <Landmark size={18} />
                </div>
                <div className="text-start min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-['Cairo',sans-serif]">
                      {t('article.relatedCivLabel')}
                    </span>
                    <span
                      style={{ color: tokens.deepAccent }}
                      className="text-xs font-bold font-['Aref_Ruqaa',serif] truncate"
                    >
                      {relatedCivilization.name}
                    </span>
                  </div>
                  <span
                    style={{ color: tokens.textSecondary }}
                    className="text-[11px] block truncate opacity-85"
                  >
                    {relatedCivilization.era || t('common.undated')} • {relatedCivilization.region ?? ''}
                  </span>
                </div>
              </div>

              <div
                style={{ color: tokens.deepAccent }}
                className={`transform transition-transform shrink-0 p-1 ${
                  dir === 'ltr' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'
                }`}
              >
                <ArrowLeft size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 4. Body Narrative Card with persisted font-size control applied */}
      <Card
        variant="white"
        elevation="card"
        padded={false}
        className="rounded-[20px] px-4 py-5 space-y-4 text-start"
      >
        <div
          style={{ borderColor: tokens.borderSubtle }}
          className="border-b pb-3 flex items-center justify-between"
        >
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-xl font-bold"
          >
            {t('article.narrativeTitle')}
          </h2>
          <span
            style={{ color: tokens.textSecondary }}
            className="text-[11px] font-medium"
          >
            {t('article.paragraphsCount', { count: safeBody.length })}
          </span>
        </div>

        {safeBody.length > 0 ? (
          <div
            style={{ color: tokens.textPrimary }}
            className="space-y-4 font-['Cairo',sans-serif]"
          >
            {safeBody.map((paragraph, index) => (
              <p key={index} className={`text-start ${bodyTextSizeClass}`}>
                {paragraph ?? ''}
              </p>
            ))}
          </div>
        ) : (
          <div
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.borderSubtle,
              color: tokens.textSecondary,
            }}
            className="p-4 rounded-2xl border text-xs sm:text-sm font-['Cairo',sans-serif]"
          >
            {t('article.noStoryYet')}
          </div>
        )}
      </Card>

      {/* 4.2. Long-Form Premium Chapters, Evidence Pills & Resume Reader (for entries without full deepStory chapters) */}
      {longFormEntry && !(deepStory?.chapters && deepStory.chapters.length > 0) && (
        <LongFormReaderSection
          entry={longFormEntry}
          bodyTextSizeClass={bodyTextSizeClass}
          isPremiumActive={isPremiumActive}
          onPremiumChange={onPremiumChange}
          onOpenSubscription={onOpenSubscription}
        />
      )}

      {/* 4.5. Deep Story Content for Game Developers & Writers */}
      {deepStory && (
        <section aria-label={t('article.chapters')} className="space-y-6 pt-1 text-start">
          {/* Chapters */}
          {safeDeepChapters.length > 0 ? (
            <div className="space-y-3.5">
              {/* Sticky horizontal chapter chips with inline padding & soft fade masks */}
              <div
                style={{
                  backgroundColor: isDark ? 'rgba(11, 36, 32, 0.94)' : 'rgba(242, 251, 247, 0.95)',
                  borderColor: tokens.borderSubtle,
                }}
                className="sticky top-1.5 z-30 py-2.5 backdrop-blur-md -mx-4 border-b"
              >
                <div className="relative">
                  {/* Soft fade masks on overflow edges */}
                  <div
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(to ${dir === 'rtl' ? 'left' : 'right'}, ${isDark ? '#0B2420' : '#F2FBF7'}, transparent)`,
                    }}
                    className="pointer-events-none absolute inset-y-0 start-0 w-4 z-10"
                  />
                  <div
                    aria-hidden="true"
                    style={{
                      background: `linear-gradient(to ${dir === 'rtl' ? 'right' : 'left'}, ${isDark ? '#0B2420' : '#F2FBF7'}, transparent)`,
                    }}
                    className="pointer-events-none absolute inset-y-0 end-0 w-6 z-10"
                  />

                  <div
                    style={{ paddingInline: '16px', scrollPaddingInline: '16px' }}
                    className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1"
                  >
                    <span
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] font-bold shrink-0 pe-1"
                    >
                      {t('article.chapters')}:
                    </span>
                    {safeDeepChapters.map((ch, idx) => {
                      const isActive = activeChapterIndex === idx;
                      return (
                        <button
                          key={idx}
                          ref={(el) => {
                            chapterChipRefs.current[idx] = el;
                          }}
                          type="button"
                          onClick={(e) => {
                            e.currentTarget.scrollIntoView({
                              behavior: 'smooth',
                              block: 'nearest',
                              inline: 'center',
                            });
                            handleScrollToChapter(idx);
                          }}
                          style={{
                            backgroundColor: isActive ? tokens.primaryMint : tokens.card,
                            color: isActive ? '#0E5C4D' : tokens.textSecondary,
                            borderColor: isActive ? 'rgba(14, 92, 77, 0.35)' : tokens.border,
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 min-h-[36px]"
                        >
                          <span className="text-[10px] opacity-75">#{idx + 1}</span>
                          <span>{ch.title ?? ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pb-1">
                <h3
                  style={{ color: tokens.textPrimary }}
                  className="font-['Aref_Ruqaa',serif] text-xl font-bold flex items-center gap-2"
                >
                  <BookOpen size={20} style={{ color: tokens.primaryMint }} />
                  <span>{t('article.chapters') || 'الحكاية الكاملة'}</span>
                </h3>
                <span
                  style={{
                    backgroundColor: tokens.coolBlueTint,
                    color: tokens.coolBlueAccent,
                  }}
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                >
                  {t('article.chaptersCount', { count: safeDeepChapters.length })}
                </span>
              </div>

              <div className="space-y-4">
                {safeDeepChapters.map((chapter, idx) => {
                  const effectivePremium = isPremiumActive ?? storage.hasPremiumMonthly();
                  const isChapterLocked = Boolean(entry.isPremium) && idx > 0 && !effectivePremium;
                  const chText = chapter.text ?? '';
                  const chEvLabel = chapter.evidenceLabel ?? '';
                  const hasChWords = typeof chapter.wordCount === 'number' && Number.isFinite(chapter.wordCount) && chapter.wordCount > 0;

                  return (
                    <React.Fragment key={idx}>
                      <div className="space-y-1.5">
                        {chEvLabel && (
                          <div className="flex items-center justify-between gap-2 px-1">
                            <span
                              style={{
                                backgroundColor: chEvLabel.includes('نص قرآني') || chEvLabel.includes('حديث')
                                  ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.28)')
                                  : tokens.coolBlueTint,
                                color: chEvLabel.includes('نص قرآني') || chEvLabel.includes('حديث')
                                  ? (isDark ? '#9FE8CC' : '#0E5C4D')
                                  : tokens.coolBlueAccent,
                                borderColor: tokens.border,
                              }}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs"
                            >
                              {localizeEvidenceLabel(chEvLabel, lang)}
                            </span>
                            {hasChWords && (
                              <span
                                style={{ color: tokens.textSecondary }}
                                className="text-[11px] font-mono"
                              >
                                {formatReadingTime(
                                  chapter.estimatedReadingMinutes ?? Math.max(1, Math.ceil((chapter.wordCount ?? 0) / 180)),
                                  lang
                                )}
                              </span>
                            )}
                          </div>
                        )}

                        <Card
                          id={`chapter-${idx}`}
                          variant="white"
                          elevation="card"
                          padded={false}
                          className="rounded-[20px] px-4 py-5 space-y-3.5 text-start scroll-mt-24 transition-all duration-300"
                        >
                          <div
                            style={{ borderColor: tokens.borderSubtle }}
                            className="border-b pb-2 flex items-center justify-between"
                          >
                            <h4
                              style={{ color: tokens.deepAccent }}
                              className="font-['Aref_Ruqaa',serif] text-lg sm:text-xl font-bold leading-snug"
                            >
                              {chapter.title ?? ''}
                            </h4>
                            <span
                              style={{ color: tokens.textSecondary }}
                              className="text-[11px] font-mono"
                            >
                              #{idx + 1}
                            </span>
                          </div>

                          {isChapterLocked ? (
                            <div
                              style={{
                                backgroundColor: isDark ? 'rgba(74, 144, 217, 0.14)' : '#E8F1FB',
                                borderColor: '#4A90D9',
                              }}
                              className="p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap"
                            >
                              <div className="flex items-center gap-2 text-xs font-bold" style={{ color: tokens.textPrimary }}>
                                <Lock size={15} strokeWidth={1.9} style={{ color: '#4A90D9' }} />
                                <span>{t('longForm.chapter2LockTitle')}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => onOpenSubscription?.()}
                                style={{ backgroundColor: '#4A90D9', color: '#FFFFFF' }}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer hover:opacity-90"
                              >
                                {t('longForm.subscribeNow') || 'اشترك الآن'}
                              </button>
                            </div>
                          ) : (
                            <div
                              style={{ color: tokens.textPrimary }}
                              className={`space-y-3 font-['Cairo',sans-serif] text-start whitespace-pre-line ${bodyTextSizeClass}`}
                            >
                              {chText.includes('[إعادة تخيل أدبي]') ? (
                                <>
                                  <div>{chText.split('[إعادة تخيل أدبي]')[0].trimEnd()}</div>
                                  <div
                                    style={{
                                      backgroundColor: tokens.coolBlueTint,
                                      borderColor: tokens.border,
                                    }}
                                    className="p-3.5 rounded-2xl border space-y-1.5"
                                  >
                                    <span
                                      style={{ color: tokens.coolBlueAccent }}
                                      className="inline-block text-[11px] font-bold"
                                    >
                                      [إعادة تخيل أدبي]
                                    </span>
                                    <div>{chText.split('[إعادة تخيل أدبي]').slice(1).join('[إعادة تخيل أدبي]').trim()}</div>
                                  </div>
                                </>
                              ) : (
                                chText || t('article.noStoryYet')
                              )}
                            </div>
                          )}

                          {!isChapterLocked && chapter.source && (
                            <div
                              style={{
                                borderColor: tokens.borderSubtle,
                                color: tokens.textSecondary,
                              }}
                              className="pt-2.5 border-t text-[11px] font-['Cairo',sans-serif] flex items-center justify-between gap-2"
                            >
                              <span>
                                {t('article.sourceLabel')} <strong style={{ color: tokens.deepAccent }}>{chapter.source}</strong>
                              </span>
                            </div>
                          )}
                        </Card>
                      </div>

                      {/* Ornamental divider between chapters */}
                      {idx < (deepStory.chapters?.length ?? 0) - 1 && (
                      <div className="flex items-center justify-center my-3 gap-3" aria-hidden="true">
                        <div
                          style={{
                            background: `linear-gradient(to left, transparent, ${tokens.borderSubtle}, transparent)`,
                          }}
                          className="h-px flex-1 max-w-[80px]"
                        />
                        <div className="flex items-center gap-1.5 opacity-80" style={{ color: tokens.deepAccent }}>
                          <span style={{ backgroundColor: tokens.primaryMint }} className="w-1 h-1 rounded-full" />
                          <span className="text-xs font-serif inline-block">❦</span>
                          <span style={{ backgroundColor: tokens.primaryMint }} className="w-1 h-1 rounded-full" />
                        </div>
                        <div
                          style={{
                            background: `linear-gradient(to right, transparent, ${tokens.borderSubtle}, transparent)`,
                          }}
                          className="h-px flex-1 max-w-[80px]"
                        />
                      </div>
                    )}
                  </React.Fragment>
                  );
                })}
              </div>
            </div>
          ) : !hasLongFormChapters && (
            <Card
              variant="white"
              elevation="subtle"
              className="p-4 rounded-[20px] text-xs font-['Cairo',sans-serif]"
            >
              <span style={{ color: tokens.textSecondary }}>{t('civ.noChaptersYet')}</span>
            </Card>
          )}

          {/* Section "من المصادر" */}
          {Array.isArray(deepStory.quotes) && deepStory.quotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3
                  style={{ color: tokens.textPrimary }}
                  className="font-['Aref_Ruqaa',serif] text-xl font-bold flex items-center gap-2"
                >
                  <Scroll size={20} style={{ color: tokens.coolBlueAccent }} />
                  <span>{t('article.quotes') || 'من المصادر'}</span>
                </h3>
                <span
                  style={{ color: tokens.textSecondary }}
                  className="text-[11px]"
                >
                  {t('article.quotesSubtitle')}
                </span>
              </div>

              <div className="space-y-3">
                {deepStory.quotes.map((quote, idx) => {
                  const qType = quote?.type || 'نص حرفي';
                  const qText = quote?.text ?? '';
                  const qSource = quote?.source || t('common.unknownAuthor');
                  const isLiteral =
                    qType === 'نص حرفي' ||
                    qType === localizeEvidenceLabel('نص حرفي', lang);
                  return (
                    <Card
                      key={idx}
                      variant="white"
                      elevation="subtle"
                      padded={false}
                      className="rounded-[18px] px-4 py-4 space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={{
                            backgroundColor: isLiteral ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)') : tokens.coolBlueTint,
                            color: isLiteral ? (isDark ? tokens.deepAccent : '#0E5C4D') : tokens.coolBlueAccent,
                            borderColor: isLiteral ? 'rgba(127, 209, 174, 0.4)' : tokens.border,
                          }}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs"
                        >
                          {localizeEvidenceLabel(qType, lang)}
                        </span>

                        {/* Copy button that copies: quote text + " — " + source */}
                        <button
                          type="button"
                          onClick={() => handleCopyQuote(qText, qSource, idx)}
                          style={{
                            backgroundColor: tokens.surface,
                            borderColor: tokens.border,
                            color: copiedQuoteIdx === idx ? tokens.deepAccent : tokens.textSecondary,
                          }}
                          className="p-1 px-2.5 rounded-lg border text-xs flex items-center gap-1 hover:opacity-80 transition-colors cursor-pointer min-h-[32px]"
                          title={t('article.copyQuote')}
                          aria-label={t('article.copyQuote')}
                        >
                          {copiedQuoteIdx === idx ? (
                            <>
                              <Check size={13} style={{ color: tokens.deepAccent }} />
                              <span className="text-[11px] font-bold">{t('article.copiedBadge')}</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span className="text-[11px]">{t('common.copy')}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <blockquote
                        style={{
                          color: tokens.textPrimary,
                          borderInlineStartColor: isLiteral ? tokens.primaryMint : tokens.coolBlueAccent,
                        }}
                        className="ps-3.5 border-s-2 font-['Amiri',serif] text-[17px] sm:text-[18px] leading-[1.95] text-start font-normal"
                      >
                        {qText}
                      </blockquote>

                      <div
                        style={{
                          borderColor: tokens.borderSubtle,
                          color: tokens.textSecondary,
                        }}
                        className="pt-2 border-t flex items-center justify-between text-xs"
                      >
                        <span className="font-['Cairo',sans-serif] font-medium">
                          {t('article.sourceLabel')} <strong style={{ color: tokens.deepAccent }}>{qSource}</strong>
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Dual-narrative mode (after quotes): الرواية الشعبية / التحليل التاريخي */}
          {renderDualNarrativeSection()}

          {/* Creator Kit section */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <h3
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold flex items-center gap-2"
              >
                <Sparkles size={20} style={{ color: tokens.deepAccent }} />
                <span>{t('article.creatorKit') || 'عدّة المبدع'}</span>
              </h3>
              <span
                style={{
                  backgroundColor: tokens.coolBlueTint,
                  color: tokens.coolBlueAccent,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('article.creativeSeeds')}
              </span>
            </div>

            {/* Above them three chip rows with Arabic labels: "العناصر الدرامية" (motifs), "الثيمات" (themes), "شخصيات الحكاية" (cast) */}
            <div
              style={{
                backgroundColor: tokens.card,
                borderColor: tokens.border,
              }}
              className="p-4 rounded-[20px] border shadow-xs space-y-3.5"
            >
              {/* Row 1: motifs */}
              {deepStory.motifs && deepStory.motifs.length > 0 && (
                <div className="space-y-1.5">
                  <span
                    style={{ color: tokens.deepAccent }}
                    className="text-xs font-bold block"
                  >
                    {t('article.motifsThemes') || 'العناصر الدرامية'}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {deepStory.motifs.map((motif, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: isDark ? 'rgba(127, 209, 174, 0.15)' : 'rgba(127, 209, 174, 0.22)',
                          color: tokens.deepAccent,
                          borderColor: tokens.border,
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                      >
                        ✦ {motif}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 2: themes */}
              {deepStory.themes && deepStory.themes.length > 0 && (
                <div className="space-y-1.5">
                  <span
                    style={{ color: tokens.deepAccent }}
                    className="text-xs font-bold block"
                  >
                    {t('article.motifsThemes') || 'الثيمات'}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {deepStory.themes.map((theme, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: tokens.coolBlueTint,
                          color: tokens.coolBlueAccent,
                          borderColor: tokens.border,
                        }}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                      >
                        ● {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 3: cast */}
              {deepStory.cast && deepStory.cast.length > 0 && (
                <div className="space-y-1.5">
                  <span
                    style={{ color: tokens.deepAccent }}
                    className="text-xs font-bold block"
                  >
                    {t('article.mainCast') || 'شخصيات الحكاية'}:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {deepStory.cast.map((c, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: tokens.surface,
                          color: tokens.textPrimary,
                          borderColor: tokens.borderSubtle,
                        }}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                      >
                        <User size={14} strokeWidth={1.9} style={{ color: hookStrokeColor }} />
                        <span>{c}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Two cards side by side */}
            {((deepStory.gameHooks && deepStory.gameHooks.length > 0) ||
              (deepStory.writingHooks && deepStory.writingHooks.length > 0)) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Game developers */}
              <Card
                variant="white"
                elevation="card"
                padded={false}
                className="rounded-[20px] px-4 py-5 space-y-3"
              >
                <div
                  style={{ borderColor: tokens.borderSubtle }}
                  className="flex items-center gap-2 pb-2.5 border-b"
                >
                  <div
                    style={{
                      backgroundColor: tokens.coolBlueTint,
                      color: hookStrokeColor,
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Gamepad2 size={18} strokeWidth={1.9} style={{ color: hookStrokeColor }} />
                  </div>
                  <h4
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-lg font-bold"
                  >
                    {t('article.gameHooks') || 'لصنّاع الألعاب'}
                  </h4>
                </div>

                <ul className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
                  {(deepStory.gameHooks || []).map((hook, i) => (
                    <li
                      key={i}
                      style={{ color: tokens.textPrimary }}
                      className="flex items-start gap-2"
                    >
                      <Gamepad2
                        size={18}
                        strokeWidth={1.9}
                        style={{ color: hookStrokeColor }}
                        className="shrink-0 mt-0.5"
                      />
                      <span>{hook}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* لكتّاب القصص */}
              <Card
                variant="white"
                elevation="card"
                padded={false}
                className="rounded-[20px] px-4 py-5 space-y-3"
              >
                <div
                  style={{ borderColor: tokens.borderSubtle }}
                  className="flex items-center gap-2 pb-2.5 border-b"
                >
                  <div
                    style={{
                      backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                      color: hookStrokeColor,
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <PenLine size={18} strokeWidth={1.9} style={{ color: hookStrokeColor }} />
                  </div>
                  <h4
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-lg font-bold"
                  >
                    {t('article.writingHooks') || 'لكتّاب القصص'}
                  </h4>
                </div>

                <ul className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
                  {(deepStory.writingHooks || []).map((hook, i) => (
                    <li
                      key={i}
                      style={{ color: tokens.textPrimary }}
                      className="flex items-start gap-2"
                    >
                      <PenLine
                        size={18}
                        strokeWidth={1.9}
                        style={{ color: hookStrokeColor }}
                        className="shrink-0 mt-0.5"
                      />
                      <span>{hook}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            )}

            {/* خطافات حكاية (storyHooks) & أدوار لعبية (gameRoles) */}
            {(deepStory.storyHooks || deepStory.gameRoles) && (
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                }}
                className="px-4 py-5 rounded-2xl border shadow-xs space-y-3.5"
              >
                {/* storyHooks */}
                {deepStory.storyHooks && deepStory.storyHooks.length > 0 && (
                  <div className="space-y-2">
                    <span
                      style={{ color: tokens.deepAccent }}
                      className="text-xs font-bold flex items-center gap-1.5"
                    >
                      <Scroll size={14} style={{ color: tokens.primaryMint }} />
                      <span>{t('article.storyHooksLabel')}:</span>
                    </span>
                    <ul className="space-y-1.5 text-xs sm:text-[13px] leading-relaxed">
                      {deepStory.storyHooks.map((hook, i) => (
                        <li key={i} style={{ color: tokens.textPrimary }} className="flex items-start gap-2">
                          <span style={{ color: tokens.primaryMint }} className="shrink-0 mt-0.5 font-bold">✦</span>
                          <span>{hook}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* gameRoles */}
                {deepStory.gameRoles && deepStory.gameRoles.length > 0 && (
                  <div className="space-y-2 pt-1 border-t" style={{ borderColor: tokens.borderSubtle }}>
                    <span
                      style={{ color: tokens.deepAccent }}
                      className="text-xs font-bold flex items-center gap-1.5"
                    >
                      <Gamepad2 size={18} strokeWidth={1.9} style={{ color: hookStrokeColor }} />
                      <span>{t('article.gameRoles')}:</span>
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {deepStory.gameRoles.map((role, i) => (
                        <span
                          key={i}
                          style={{
                            backgroundColor: tokens.coolBlueTint,
                            color: tokens.coolBlueAccent,
                            borderColor: tokens.border,
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border"
                        >
                          <Gamepad2 size={18} strokeWidth={1.9} style={{ color: hookStrokeColor }} />
                          <span>{role}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scenes timeline */}
            {deepStory.scenes && deepStory.scenes.length > 0 && (
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                }}
                className="p-4 sm:p-5 rounded-2xl border shadow-xs space-y-3.5"
              >
                <h4
                  style={{ color: tokens.deepAccent }}
                  className="font-['Aref_Ruqaa',serif] text-lg font-bold flex items-center gap-2"
                >
                  <Sparkles size={18} style={{ color: tokens.primaryMint }} />
                  <span>{t('article.scenes')}</span>
                </h4>

                <div className="relative ps-5 space-y-4 border-s-2" style={{ borderColor: tokens.primaryMint }}>
                  {deepStory.scenes.map((scene, idx) => (
                    <div key={idx} className="relative">
                      {/* Teal node per scene */}
                      <div
                        style={{
                          backgroundColor: tokens.deepAccent,
                          borderColor: tokens.primaryMint,
                        }}
                        className="absolute -start-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 ring-4 ring-[#7FD1AE]/20"
                      />
                      <div className="space-y-1">
                        <h5
                          style={{ color: tokens.deepAccent }}
                          className="font-['Aref_Ruqaa',serif] text-base font-bold leading-snug"
                        >
                          {scene.title}
                        </h5>
                        <p style={{ color: tokens.textSecondary }} className="text-xs sm:text-[13px] leading-relaxed">
                          {scene.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Player Decision */}
            {deepStory.decision && (
              <div
                style={{
                  backgroundColor: isDark ? 'rgba(74, 144, 217, 0.16)' : '#E8F1FB',
                  borderColor: tokens.coolBlueAccent,
                }}
                className="p-4 sm:p-5 rounded-2xl border-2 shadow-sm space-y-2.5 relative"
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    style={{ color: tokens.coolBlueAccent }}
                    className="flex items-center gap-2 font-['Aref_Ruqaa',serif] text-base font-bold"
                  >
                    <Scale size={18} />
                    <span>{t('article.decision')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyDecision(deepStory.decision!)}
                    style={{
                      backgroundColor: tokens.card,
                      borderColor: tokens.border,
                      color: tokens.coolBlueAccent,
                    }}
                    className="p-1.5 rounded-xl border flex items-center gap-1 text-xs font-bold hover:opacity-80 transition-opacity cursor-pointer px-2.5 py-1 min-h-[36px]"
                    title={t('common.copy')}
                  >
                    <Copy size={14} />
                    <span>{t('common.copy')}</span>
                  </button>
                </div>
                <p style={{ color: tokens.textPrimary }} className="text-sm sm:text-base font-bold leading-relaxed">
                  {deepStory.decision}
                </p>
              </div>
            )}

            {/* Button: Convert to Quest */}
            <div className="pt-1 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleCopyQuest}
                style={{
                  backgroundColor: tokens.coolBlueAccent,
                  color: isDark ? tokens.background : '#FFFFFF',
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer min-h-[44px]"
              >
                <Gamepad2 size={16} />
                <span>{t('article.convertQuest')}</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Fallback for entries without quotes section */}
      {!Boolean(deepStory && deepStory.quotes && deepStory.quotes.length > 0) && renderDualNarrativeSection()}

      {/* 5. Decorative Divider */}
      <div className="flex items-center justify-center my-6 gap-3" aria-hidden="true">
        <div
          style={{
            background: `linear-gradient(to left, transparent, ${tokens.primaryMint}, ${tokens.deepAccent})`,
          }}
          className="h-px flex-1 max-w-[90px] opacity-60"
        />
        <div className="flex items-center gap-1.5" style={{ color: tokens.deepAccent }}>
          <span style={{ backgroundColor: tokens.primaryMint }} className="w-1.5 h-1.5 rounded-full" />
          <span className="text-sm font-serif inline-block">◆</span>
          <span style={{ backgroundColor: tokens.primaryMint }} className="w-1.5 h-1.5 rounded-full" />
        </div>
        <div
          style={{
            background: `linear-gradient(to right, transparent, ${tokens.primaryMint}, ${tokens.deepAccent})`,
          }}
          className="h-px flex-1 max-w-[90px] opacity-60"
        />
      </div>

      {/* 6. Timeline: 3-Node Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3
            style={{ color: tokens.textPrimary }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold flex items-center gap-2"
          >
            <Clock size={18} style={{ color: tokens.coolBlueAccent }} />
            <span>{t('article.timeline')}</span>
          </h3>
          <span style={{ color: tokens.textSecondary }} className="text-[11px]">
            {t('article.timelineSub')}
          </span>
        </div>

        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="px-4 py-4 rounded-[18px] border shadow-xs space-y-4"
        >
          <div className="relative grid grid-cols-3 items-start">
            {/* Inactive remainder track (#DDEEE6) */}
            <div
              style={{
                backgroundColor: isDark ? 'rgba(221, 238, 230, 0.2)' : '#DDEEE6',
                right: '16.6667%',
                left: '16.6667%',
                top: '18px',
              }}
              className="absolute h-1 rounded-full z-0"
            />

            {/* Filled active connector segment up to active node (#4A90D9) */}
            <div
              className="absolute h-1 rounded-full transition-all duration-200 z-0"
              style={{
                backgroundColor: '#4A90D9',
                top: '18px',
                ...(dir === 'rtl' ? { right: '16.6667%' } : { left: '16.6667%' }),
                width: activeEraIndex === 0 ? '0%' : activeEraIndex === 1 ? '33.3333%' : '66.6667%',
              }}
            />

            {eras.map((era) => {
              const isActive = activeEra === era;
              const nodeNum =
                lang === 'ar'
                  ? era === 'جاهلية'
                    ? '١'
                    : era === 'صدر الإسلام'
                    ? '٢'
                    : '٣'
                  : era === 'جاهلية'
                  ? '1'
                  : era === 'صدر الإسلام'
                  ? '2'
                  : '3';

              return (
                <button
                  key={era}
                  type="button"
                  onClick={() => setActiveEra(era)}
                  aria-pressed={isActive}
                  className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none min-h-[48px]"
                >
                  <div
                    style={{
                      backgroundColor: isActive ? '#4A90D9' : (isDark ? tokens.card : '#FFFFFF'),
                      color: isActive ? '#FFFFFF' : tokens.textSecondary,
                      borderColor: isActive ? '#4A90D9' : (isDark ? tokens.borderSubtle : '#DDEEE6'),
                    }}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 border-2 shadow-sm ${
                      isActive ? 'ring-4 ring-[#4A90D9]/25' : ''
                    }`}
                  >
                    {nodeNum}
                  </div>
                  <span
                    style={{
                      color: isActive ? '#4A90D9' : tokens.textSecondary,
                      fontWeight: isActive ? 700 : 500,
                    }}
                    className="text-xs mt-1.5 font-['Cairo',sans-serif] transition-colors duration-200 leading-none text-center"
                  >
                    {localizeEra(era, lang)}
                  </span>
                </button>
              );
            })}
          </div>

          <div
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            }}
            className="p-3.5 rounded-xl border text-start transition-all"
          >
            <div
              style={{ color: tokens.coolBlueAccent }}
              className="flex items-center gap-1.5 mb-1 text-xs font-bold"
            >
              <span>{t('article.eraNoteLabel', { era: localizeEra(activeEra, lang) })}</span>
            </div>
            <p
              style={{ color: tokens.textPrimary }}
              className="text-xs sm:text-[13px] leading-relaxed font-['Cairo',sans-serif]"
            >
              {activeTimelineNote}
            </p>
          </div>
        </div>
      </div>

      {/* 7. Sources Section */}
      <div className="space-y-3">
        <h3
          style={{ color: tokens.textPrimary }}
          className="font-['Aref_Ruqaa',serif] text-lg font-bold flex items-center gap-2"
        >
          <BookOpen size={18} style={{ color: tokens.coolBlueAccent }} />
          <span>{t('article.sources')}</span>
        </h3>

        <div className="space-y-2.5">
          {safeSources.length > 0 ? (
            safeSources.map((src, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                }}
                className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xs text-start min-h-[48px]"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      backgroundColor: tokens.coolBlueTint,
                      color: tokens.coolBlueAccent,
                      borderColor: tokens.borderSubtle,
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                  >
                    <BookOpen size={19} strokeWidth={2} />
                  </div>

                  <div className="text-start">
                    <h4
                      style={{ color: tokens.textPrimary }}
                      className="font-bold text-sm font-['Cairo',sans-serif] leading-tight"
                    >
                      {src?.title || entry.name || ''}
                    </h4>
                    <p
                      style={{ color: tokens.textSecondary }}
                      className="text-xs mt-0.5"
                    >
                      {t('article.authorPrefix')} {src?.author || t('common.unknownAuthor')}
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    color: tokens.coolBlueAccent,
                    backgroundColor: tokens.coolBlueTint,
                  }}
                  className="text-[11px] font-mono px-2.5 py-1 rounded-lg shrink-0 font-medium"
                >
                  {src?.year || t('common.undated')}
                </span>
              </div>
            ))
          ) : (
            <div
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.borderSubtle,
                color: tokens.textSecondary,
              }}
              className="p-3.5 rounded-2xl border text-xs text-start"
            >
              {t('article.noSourcesYet')}
            </div>
          )}
        </div>
      </div>

      {/* 8. Related Entities */}
      {safeRelatedIds.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold flex items-center gap-2"
            >
              <Compass size={18} style={{ color: tokens.deepAccent }} />
              <span>{t('article.related')}</span>
            </h3>
            <span style={{ color: tokens.textSecondary }} className="text-[11px]">
              {t('article.relatedSub')}
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
            {safeRelatedIds.map((relId) => {
              const rawRel = getEntryById(relId);
              if (!rawRel) return null;
              const rel = getLocalizedEntry(rawRel, lang);
              const relHeroUrl = resolveHeroImageUrl(rel.heroImage);

              return (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectRelated(rawRel)}
                  style={{
                    backgroundColor: tokens.card,
                    borderColor: tokens.border,
                  }}
                  className="flex items-center gap-3 p-2.5 px-3 rounded-2xl border shadow-xs transition-all duration-200 cursor-pointer shrink-0 text-start group min-h-[52px]"
                >
                  <div
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.borderSubtle,
                    }}
                    className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center"
                  >
                    {relHeroUrl ? (
                      <img
                        src={relHeroUrl}
                        alt={rel.name ?? ''}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <BookOpen size={18} style={{ color: tokens.textSecondary }} className="opacity-60" />
                    )}
                  </div>

                  <div className="text-start">
                    <span
                      style={{ color: tokens.textPrimary }}
                      className="font-['Aref_Ruqaa',serif] text-sm font-bold block truncate max-w-[130px]"
                    >
                      {rel.name ?? ''}
                    </span>
                    <span
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] block truncate max-w-[130px]"
                    >
                      {rel.typeLabel ?? ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* End of article actions */}
      <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={handleOpenInspireModal}
          style={{
            backgroundColor: tokens.coolBlueAccent,
            color: isDark ? tokens.background : '#FFFFFF',
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-bold shadow-md hover:opacity-95 transition-all cursor-pointer min-h-[48px]"
        >
          <Sparkles size={18} />
          <span>{t('article.inspireMe')}</span>
        </button>

        <button
          type="button"
          onClick={onBack}
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            color: tokens.deepAccent,
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border text-xs font-bold hover:opacity-90 transition-colors cursor-pointer min-h-[48px]"
        >
          <span>{dir === 'rtl' ? '←' : '→'} {t('article.backHome')}</span>
        </button>
      </div>

      {/* Inspire Modal Dialog */}
      {inspireModalOpen && selectedHook && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setInspireModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="w-full max-w-lg rounded-[24px] p-5 sm:p-6 shadow-2xl border space-y-4 animate-in zoom-in-95 duration-200 text-start"
            dir={dir}
            role="dialog"
            aria-modal="true"
            aria-label={t('article.inspireMeTitle')}
          >
            <div
              style={{ borderColor: tokens.borderSubtle }}
              className="flex items-center justify-between pb-3 border-b"
            >
              <div className="flex items-center gap-2.5">
                <div
                  style={{
                    backgroundColor: tokens.coolBlueTint,
                    color: tokens.coolBlueAccent,
                  }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                >
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-xl font-bold"
                  >
                    {t('article.inspireMe')}
                  </h3>
                  <p style={{ color: tokens.textSecondary }} className="text-xs">
                    {t('article.inspireMeSub', { name: entry.name })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspireModalOpen(false)}
                style={{ color: tokens.textSecondary }}
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={t('common.close')}
              >
                <X size={20} />
              </button>
            </div>

            {/* Hook Card */}
            <div
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
              }}
              className="p-4 rounded-2xl border space-y-3"
            >
              <div className="flex items-center justify-between">
                <span
                  style={{
                    backgroundColor: selectedHook.type === 'game' ? tokens.coolBlueTint : (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)'),
                    color: selectedHook.type === 'game' ? tokens.coolBlueAccent : (isDark ? tokens.deepAccent : '#0E5C4D'),
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                >
                  {selectedHook.type === 'game' ? (
                    <Gamepad2 size={18} strokeWidth={1.9} style={{ color: hookStrokeColor }} />
                  ) : (
                    <PenLine size={18} strokeWidth={1.9} style={{ color: hookStrokeColor }} />
                  )}
                  <span>{selectedHook.label}</span>
                </span>
              </div>

              <p
                style={{ color: tokens.textPrimary }}
                className="font-['Amiri',serif] text-[17px] sm:text-[18px] leading-[1.95] text-start"
              >
                «{selectedHook.text}»
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleReshuffleHook}
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                  color: tokens.textSecondary,
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border text-xs font-bold hover:opacity-80 transition-colors cursor-pointer min-h-[44px]"
              >
                <RotateCcw size={15} />
                <span>{t('article.reshuffle')}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyHook}
                style={{
                  backgroundColor: tokens.primaryMint,
                  color: '#0E5C4D',
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer min-h-[44px]"
              >
                {copiedHook ? (
                  <>
                    <Check size={16} />
                    <span>{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>{t('common.copy')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};

export default ArticleScreen;
