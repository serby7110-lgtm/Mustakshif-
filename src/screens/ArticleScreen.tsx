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

import React, { useState, useEffect, useMemo } from 'react';
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
  Feather,
  Copy,
  X,
  Landmark,
  ArrowLeft,
  Info,
  Scale,
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { Tag, TagVariant } from '../components/primitives/Tag';
import { IconButton } from '../components/primitives/IconButton';
import { MythEntry, MythEra } from '../data/types';
import { MYTH_ENTRIES, getEntryById } from '../data/seed';
import { getDeepStory } from '../data/storyTypes';
import { storage, FontSize } from '../data/storage';
import { getEstimatedReadingTime, formatReadingTime } from '../utils/readingTime';
import { useTheme } from '../theme/ThemeContext';
import { useArabicTTS, TTSState } from '../hooks/useArabicTTS';
import { ar } from '../i18n/ar';
import { getCivByRelatedMythId } from '../data/civTypes';
import { MethodologyScreen } from './MethodologyScreen';

export interface ArticleScreenProps {
  entryId: string;
  onBack: () => void;
  onSelectRelated: (entry: MythEntry) => void;
  isSaved?: boolean;
  onToggleSave?: (id: string) => void;
  initialChapterIndex?: number;
  onSelectCivilization?: (civId: string) => void;
  onOpenMethodology?: () => void;
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
}) => {
  const { tokens, isDark } = useTheme();

  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  // Resolve entry from seed.ts by route param id
  const entry = useMemo(() => {
    return getEntryById(entryId) || MYTH_ENTRIES[0];
  }, [entryId]);

  // Deep Story content for game developers and story writers
  const deepStory = useMemo(() => {
    return getDeepStory(entry.id);
  }, [entry.id]);

  // Cross-link: check if current myth belongs to any civilization's relatedMyths
  const relatedCivilization = useMemo(() => {
    return getCivByRelatedMythId(entry.id);
  }, [entry.id]);

  // Reading progress state (thin mint bar at top)
  const [readingProgress, setReadingProgress] = useState(0);

  // Active chapter tracking for sticky chapter chips
  const [activeChapterIndex, setActiveChapterIndex] = useState(0);

  // Font size state (A- / A+): persisted in storage, applied to body & chapters only
  const [fontSize, setFontSizeState] = useState<FontSize>(() => storage.getFontSize());

  // Quote copy state
  const [copiedQuoteIdx, setCopiedQuoteIdx] = useState<number | null>(null);

  // Inspire dialog states ("ألهمني")
  const [inspireModalOpen, setInspireModalOpen] = useState(false);
  const [selectedHook, setSelectedHook] = useState<{
    type: 'game' | 'writing';
    label: string;
    icon: string;
    text: string;
  } | null>(null);
  const [copiedHook, setCopiedHook] = useState(false);

  // Timeline era slider state: default to first era or 'جاهلية'
  const eras: readonly MythEra[] = ['جاهلية', 'صدر الإسلام', 'العصر العباسي'];
  const [activeEra, setActiveEra] = useState<MythEra>('جاهلية');

  // Myth Dual-narrative mode (mythTradition vs mythAnalysis)
  const [mythNarrativeView, setMythNarrativeView] = useState<'tradition' | 'analysis'>(() => {
    return storage.getMythDualNarrativeView();
  });

  const handleSelectMythNarrative = (view: 'tradition' | 'analysis') => {
    setMythNarrativeView(view);
    storage.setMythDualNarrativeView(view);
  };

  const hasMythTradition = Boolean(entry.mythTradition && entry.mythTradition.trim().length > 0);
  const hasMythAnalysis = Boolean(entry.mythAnalysis && entry.mythAnalysis.trim().length > 0);
  const showMythDualSection = hasMythTradition || hasMythAnalysis;

  const effectiveMythNarrativeView: 'tradition' | 'analysis' =
    hasMythTradition && hasMythAnalysis
      ? mythNarrativeView
      : hasMythTradition
      ? 'tradition'
      : 'analysis';

  const currentMythNarrativeText =
    effectiveMythNarrativeView === 'tradition'
      ? entry.mythTradition
      : entry.mythAnalysis;

  const renderDualNarrativeSection = () => {
    if (!showMythDualSection) return null;

    return (
      <section aria-label="القراءة التاريخية" className="space-y-3 pt-1">
        <div className="flex items-center justify-between pb-0.5">
          <div className="flex items-center gap-2">
            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-xl font-bold flex items-center gap-2"
            >
              <Scroll size={20} style={{ color: tokens.deepAccent }} />
              <span>القراءة التاريخية</span>
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
              title="عن المنهج"
              aria-label="عن المنهج"
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
              وجهتا نظر للأسطورة
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
            aria-label="اختيار القراءة التاريخية"
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
              <span>الرواية الشعبية</span>
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
              <span>التحليل التاريخي</span>
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
          className="p-4 sm:p-5 rounded-2xl border shadow-xs transition-colors duration-200 space-y-2.5"
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
                  <span>الرواية الشعبية</span>
                </>
              ) : (
                <>
                  <BookOpen size={12} />
                  <span>التحليل التاريخي</span>
                </>
              )}
            </span>

            <span
              style={{ color: tokens.textSecondary }}
              className="text-[11px] font-['Cairo',sans-serif]"
            >
              {effectiveMythNarrativeView === 'tradition' ? 'من الموروث الشعبي' : 'قراءة نقدية وتاريخية'}
            </span>
          </div>

          <p
            style={{ color: tokens.textPrimary }}
            className="font-['Amiri',serif] text-base sm:text-lg leading-8 sm:leading-9 text-justify pt-1"
          >
            {currentMythNarrativeText}
          </p>
        </div>
      </section>
    );
  };

  // Track window scroll for thin mint reading progress bar & chapter tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / scrollHeight) * 100));
        setReadingProgress(progress);

        // Persist myth reading progress
        const roundedProgress = progress >= 90 ? 100 : Math.max(10, Math.round(progress));
        storage.setMythProgress(entry.id, roundedProgress);

        // Check active chapter if deepStory exists
        if (deepStory?.chapters && deepStory.chapters.length > 0) {
          let currIdx = 0;
          for (let i = 0; i < deepStory.chapters.length; i++) {
            const el = document.getElementById(`chapter-${i}`);
            if (el) {
              const rect = el.getBoundingClientRect();
              if (rect.top <= 200) {
                currIdx = i;
              }
            }
          }
          setActiveChapterIndex(currIdx);
          storage.markChapterRead(`${entry.id}_${currIdx}`);

          // Persist last read chapter for Home v2
          storage.setLastReadChapter({
            mythId: entry.id,
            mythName: entry.name,
            chapterIndex: currIdx,
            chapterTitle: deepStory.chapters[currIdx]?.title || '',
            progressPercent: roundedProgress,
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [deepStory, entry]);

  // Deep-link to chapter if initialChapterIndex is provided
  useEffect(() => {
    if (initialChapterIndex !== undefined) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`chapter-${initialChapterIndex}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setActiveChapterIndex(initialChapterIndex);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [initialChapterIndex]);

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

  // Font size typography classes applied exclusively to body paragraphs and chapters
  const bodyTextSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'sm':
        return 'text-xs sm:text-sm leading-7 sm:leading-8';
      case 'lg':
        return 'text-base sm:text-lg leading-9 sm:leading-10';
      case 'md':
      default:
        return 'text-sm sm:text-[15px] leading-8 sm:leading-9';
    }
  }, [fontSize]);

  // Copy quote handler: copies text + " — " + source
  const handleCopyQuote = (quoteText: string, quoteSource: string, idx: number) => {
    const textToCopy = `${quoteText} — ${quoteSource}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy);
      }
    } catch {}
    setCopiedQuoteIdx(idx);
    setTimeout(() => setCopiedQuoteIdx(null), 2000);
  };

  // Gather hooks for "ألهمني" feature
  const availableHooks = useMemo(() => {
    const list: Array<{ type: 'game' | 'writing'; label: string; icon: string; text: string }> = [];
    if (deepStory?.gameHooks) {
      deepStory.gameHooks.forEach((h) => {
        list.push({ type: 'game', label: 'فكرة لعبة', icon: '🎮', text: h });
      });
    }
    if (deepStory?.writingHooks) {
      deepStory.writingHooks.forEach((h) => {
        list.push({ type: 'writing', label: 'فكرة قصة', icon: '✍️', text: h });
      });
    }
    if (list.length === 0) {
      list.push({
        type: 'game',
        label: 'فكرة لعبة',
        icon: '🎮',
        text: `استكشاف أسطورة ${entry.name}: ميكانيكا عالم مفتوح في ${entry.region} مع ألغاز حل خيوط ${entry.summary}`,
      });
      list.push({
        type: 'writing',
        label: 'فكرة قصة',
        icon: '✍️',
        text: `حبكة سردية تدور حول مواجهة سر ${entry.name} في ${entry.timeline[0]?.era || 'البادية'} والصراع الإنساني مع المجهول.`,
      });
    }
    return list;
  }, [deepStory, entry]);

  // Open Inspire Modal with a random hook
  const handleOpenInspireModal = () => {
    const randomHook = availableHooks[Math.floor(Math.random() * availableHooks.length)];
    setSelectedHook(randomHook);
    setCopiedHook(false);
    setInspireModalOpen(true);
  };

  // Re-roll hook
  const handleReshuffleHook = () => {
    if (availableHooks.length <= 1) return;
    let nextHook = selectedHook;
    while (nextHook === selectedHook) {
      nextHook = availableHooks[Math.floor(Math.random() * availableHooks.length)];
    }
    setSelectedHook(nextHook);
    setCopiedHook(false);
  };

  // Copy selected inspire hook
  const handleCopyHook = () => {
    if (!selectedHook) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(selectedHook.text);
      }
    } catch {}
    setCopiedHook(true);
    setTimeout(() => setCopiedHook(false), 2000);
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
    if (entry.timeline && entry.timeline.length > 0) {
      setActiveEra(entry.timeline[0].era);
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
    if (ttsState === 'idle') {
      // First tap: reads entry title then all body paragraphs in order
      speak([entry.name, ...entry.body]);
    } else if (ttsState === 'playing') {
      // Second tap: pause
      pause();
    } else if (ttsState === 'paused') {
      // Third tap: resume
      resume();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${ar.app.title} | ${entry.name}`,
        text: entry.summary,
        url: window.location.href,
      }).catch(() => {});
    } else {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleCopyQuest = async () => {
    const chaptersText =
      (deepStory?.chapters || [])
        .map((c) => `${c.title}:\n${c.text}`)
        .join('\n\n') || entry.body.join('\n\n');

    const questData = {
      id: entry.id,
      name: entry.name,
      category: entry.category,
      region: entry.region,
      story: chaptersText,
      scenes: deepStory?.scenes || [],
      decision: deepStory?.decision || '',
    };

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(JSON.stringify(questData, null, 2));
      } else {
        const ta = document.createElement('textarea');
        ta.value = JSON.stringify(questData, null, 2);
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast('تم نسخ مهمة اللعبة كـ JSON 🎮');
    } catch {
      showToast('تم نسخ مهمة اللعبة كـ JSON 🎮');
    }
  };

  const handleCopyGameCard = async () => {
    const fullCard = {
      ...entry,
      deepStory: deepStory || null,
    };

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(JSON.stringify(fullCard, null, 2));
      } else {
        const ta = document.createElement('textarea');
        ta.value = JSON.stringify(fullCard, null, 2);
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showToast('تم نسخ بطاقة اللعبة كـ JSON 📋');
    } catch {
      showToast('تم نسخ بطاقة اللعبة كـ JSON 📋');
    }
  };

  const handleCopyDecision = async (decText: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(decText);
      }
      showToast('تم نسخ قرار اللاعب ⚖️');
    } catch {
      showToast('تم نسخ قرار اللاعب ⚖️');
    }
  };

  const activeTimelineNote = useMemo(() => {
    const found = entry.timeline.find((t) => t.era === activeEra);
    if (found) return found.note;

    if (activeEra === 'جاهلية') {
      return 'تداولت القبائل أخبار هذه الأسطورة في أسمار البادية قبل تدوين المعاجم، وارتبطت بمهالك الصحراء والشعر الجاهلي.';
    }
    if (activeEra === 'صدر الإسلام') {
      return 'تناولتها الروايات في صدر الإسلام لتفريق الحقيقة الإيمانية عن الخرافات الجاهلية الشائعة.';
    }
    return 'دوّنها كبار علماء العصر العباسي كالجاحظ والمسعودي وابن الكلبي في مصنفات الأدب والتاريخ والحيوان.';
  }, [entry, activeEra]);

  const getTagVariant = (tag: string): TagVariant => {
    if (tag === 'رعب') return 'horror';
    if (tag === 'تاريخ') return 'history';
    if (tag === 'خرافي') return 'supernatural';
    return 'neutral';
  };

  if (isMethodologyOpen) {
    return <MethodologyScreen onBack={() => setIsMethodologyOpen(false)} />;
  }

  return (
    <article className="space-y-6 pb-12 animate-in fade-in duration-200" dir="rtl">
      {/* Thin mint reading-progress bar fixed at top of the screen */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-1 pointer-events-none transition-all duration-150"
        style={{
          backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
        }}
        aria-hidden="true"
      >
        <div
          className="h-full transition-all duration-100 ease-out"
          style={{
            width: `${readingProgress}%`,
            backgroundColor: tokens.primaryMint,
          }}
        />
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
        aria-label="شريط أدوات المقال"
        className="flex items-center justify-between gap-3 pt-1 flex-wrap"
      >
        {/* Actions row: share, bookmark, game card copy, speaker + Font-size control (A- / A+) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <IconButton
            icon={copiedShare ? <Check size={18} style={{ color: tokens.deepAccent }} /> : <Share2 size={18} />}
            label={copiedShare ? ar.article.shareSuccess : ar.article.share}
            variant="surface"
            size="md"
            onClick={handleShare}
          />

          <IconButton
            icon={<Bookmark size={18} className={isSaved ? 'fill-current' : ''} style={{ color: isSaved ? tokens.deepAccent : undefined }} />}
            label={isSaved ? ar.article.bookmarkRemove : ar.article.bookmarkAdd}
            variant="surface"
            size="md"
            onClick={() => onToggleSave?.(entry.id)}
          />

          {/* Icon button: انسخ كبطاقة لعبة */}
          <IconButton
            icon={<Gamepad2 size={18} style={{ color: tokens.coolBlueAccent }} />}
            label="انسخ كبطاقة لعبة"
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
                  ? ar.article.audioPause
                  : ttsState === 'paused'
                  ? ar.article.audioResume
                  : ar.article.audioPlay
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
            aria-label="التحكم بحجم الخط"
          >
            <button
              type="button"
              onClick={() => handleFontSizeChange('down')}
              disabled={fontSize === 'sm'}
              aria-label="تصغير الخط"
              title="تصغير الخط (A-)"
              style={{
                color: fontSize === 'sm' ? tokens.borderSubtle : tokens.textPrimary,
              }}
              className="px-2 py-1 text-xs font-bold hover:opacity-80 transition-colors disabled:opacity-40 cursor-pointer min-h-[36px] min-w-[32px] flex items-center justify-center font-serif"
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
              aria-label="تكبير الخط"
              title="تكبير الخط (A+)"
              style={{
                color: fontSize === 'lg' ? tokens.borderSubtle : tokens.textPrimary,
              }}
              className="px-2 py-1 text-sm font-bold hover:opacity-80 transition-colors disabled:opacity-40 cursor-pointer min-h-[36px] min-w-[32px] flex items-center justify-center font-serif"
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
            aria-label={ar.article.back}
            title={ar.article.back}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.deepAccent,
            }}
            className="flex items-center justify-center w-11 h-11 rounded-2xl border shadow-sm transition-all duration-150 active:scale-95 cursor-pointer min-h-[44px] min-w-[44px]"
          >
            <ChevronRight size={22} className="stroke-[2.5]" />
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
              {ttsState === 'playing' ? 'يتم السرد الآن…' : 'صوت الراوي متوقف مؤقتاً'}
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
              aria-label={ttsState === 'playing' ? ar.article.audioPause : ar.article.audioResume}
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
              aria-label={ar.article.audioStop}
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
          <img
            src={entry.heroImage}
            alt={entry.name}
            className="w-full h-full object-cover object-center"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {/* Region Badge */}
          <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-xs text-white">
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-medium border border-white/20">
              <MapPin size={12} style={{ color: tokens.primaryMint }} />
              <span>{entry.region}</span>
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
          {entry.name}
        </h1>

        {/* STEP 4: Small progress hint text under the title while playing */}
        {ttsState === 'playing' && (
          <p
            dir="rtl"
            style={{ color: tokens.textSecondary }}
            className="text-xs sm:text-sm font-['Cairo',sans-serif] animate-pulse flex items-center justify-center gap-1.5"
          >
            <span>يتم السرد الآن…</span>
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
            <span>{entry.typeLabel}</span>
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
            <span>{formatReadingTime(getEstimatedReadingTime(entry))}</span>
          </span>

          {entry.tags && entry.tags.length > 0 && (
            <Tag variant={getTagVariant(entry.tags[0])} size="sm">
              {entry.tags[0]}
            </Tag>
          )}
        </div>

        {/* "سمات" chips row (traits) after the typeLabel pill */}
        {deepStory?.traits && deepStory.traits.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-0.5">
            <span style={{ color: tokens.textSecondary }} className="text-xs font-bold">
              السمات:
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

        {/* STEP 1 Cross-link: Mint banner card under the summary */}
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
              className="w-full p-3 sm:p-3.5 rounded-2xl border shadow-xs hover:scale-[1.01] active:scale-98 transition-all cursor-pointer flex items-center justify-between gap-3 text-right group"
              aria-label={`اقرأ حضارة هذا القوم: ${relatedCivilization.name}`}
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
                <div className="text-right min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold font-['Cairo',sans-serif]">
                      اقرأ حضارة هذا القوم ←
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
                    {relatedCivilization.era} • {relatedCivilization.region}
                  </span>
                </div>
              </div>

              <div
                style={{ color: tokens.deepAccent }}
                className="transform group-hover:-translate-x-1 transition-transform shrink-0 p-1"
              >
                <ArrowLeft size={16} />
              </div>
            </button>
          </div>
        )}
      </div>

      {/* 4. Body Narrative Card with persisted font-size control applied */}
      <Card
        variant="white"
        elevation="card"
        padded="lg"
        className="rounded-[20px] space-y-4 text-right"
      >
        <div
          style={{ borderColor: tokens.borderSubtle }}
          className="border-b pb-3 flex items-center justify-between"
        >
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-xl font-bold"
          >
            {ar.article.narrativeTitle}
          </h2>
          <span
            style={{ color: tokens.textSecondary }}
            className="text-[11px] font-medium"
          >
            {ar.article.paragraphsCount(entry.body.length)}
          </span>
        </div>

        <div
          style={{ color: tokens.textPrimary }}
          className="space-y-4 font-['Cairo',sans-serif]"
        >
          {entry.body.map((paragraph, index) => (
            <p key={index} className={`text-justify indent-4 ${bodyTextSizeClass}`}>
              {paragraph}
            </p>
          ))}
        </div>
      </Card>

      {/* 4.5. Deep Story Content for Game Developers & Writers */}
      {deepStory && (
        <section aria-label="الحكاية الكاملة وعدّة المبدع" className="space-y-6 pt-1 text-right">
          {/* Section "الحكاية الكاملة" */}
          {deepStory.chapters && deepStory.chapters.length > 0 && (
            <div className="space-y-3.5">
              {/* Sticky horizontal chapter chips */}
              <div
                style={{
                  backgroundColor: isDark ? 'rgba(11, 36, 32, 0.94)' : 'rgba(242, 251, 247, 0.95)',
                  borderColor: tokens.borderSubtle,
                }}
                className="sticky top-1 z-30 py-2.5 backdrop-blur-md -mx-4 px-4 sm:mx-0 sm:px-0 border-b"
              >
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                  <span
                    style={{ color: tokens.textSecondary }}
                    className="text-[11px] font-bold shrink-0 pl-1"
                  >
                    الفصول:
                  </span>
                  {deepStory.chapters.map((ch, idx) => {
                    const isActive = activeChapterIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setActiveChapterIndex(idx);
                          document.getElementById(`chapter-${idx}`)?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        }}
                        style={{
                          backgroundColor: isActive ? tokens.primaryMint : tokens.card,
                          color: isActive ? '#0E5C4D' : tokens.textSecondary,
                          borderColor: isActive ? 'rgba(14, 92, 77, 0.35)' : tokens.border,
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border shadow-2xs whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 min-h-[36px]"
                      >
                        <span className="text-[10px] opacity-75">#{idx + 1}</span>
                        <span>{ch.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pb-1">
                <h3
                  style={{ color: tokens.textPrimary }}
                  className="font-['Aref_Ruqaa',serif] text-xl font-bold flex items-center gap-2"
                >
                  <BookOpen size={20} style={{ color: tokens.primaryMint }} />
                  <span>الحكاية الكاملة</span>
                </h3>
                <span
                  style={{
                    backgroundColor: tokens.coolBlueTint,
                    color: tokens.coolBlueAccent,
                  }}
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                >
                  {deepStory.chapters.length} فصول
                </span>
              </div>

              <div className="space-y-4">
                {deepStory.chapters.map((chapter, idx) => (
                  <React.Fragment key={idx}>
                    <Card
                      id={`chapter-${idx}`}
                      variant="white"
                      elevation="card"
                      padded="lg"
                      className="rounded-[20px] space-y-3.5 text-right scroll-mt-20"
                    >
                      <div
                        style={{ borderColor: tokens.borderSubtle }}
                        className="border-b pb-2 flex items-center justify-between"
                      >
                        <h4
                          style={{ color: tokens.deepAccent }}
                          className="font-['Aref_Ruqaa',serif] text-lg sm:text-xl font-bold leading-snug"
                        >
                          {chapter.title}
                        </h4>
                        <span
                          style={{ color: tokens.textSecondary }}
                          className="text-[11px] font-mono"
                        >
                          فصل {idx + 1}
                        </span>
                      </div>

                      <div
                        style={{ color: tokens.textPrimary }}
                        className={`space-y-3 font-['Cairo',sans-serif] text-justify whitespace-pre-line ${bodyTextSizeClass}`}
                      >
                        {chapter.text}
                      </div>
                    </Card>

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
                ))}
              </div>
            </div>
          )}

          {/* Section "من المصادر" */}
          {deepStory.quotes && deepStory.quotes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1">
                <h3
                  style={{ color: tokens.textPrimary }}
                  className="font-['Aref_Ruqaa',serif] text-xl font-bold flex items-center gap-2"
                >
                  <Scroll size={20} style={{ color: tokens.coolBlueAccent }} />
                  <span>من المصادر</span>
                </h3>
                <span
                  style={{ color: tokens.textSecondary }}
                  className="text-[11px]"
                >
                  نصوص ومقتطفات تراثية
                </span>
              </div>

              <div className="space-y-3">
                {deepStory.quotes.map((quote, idx) => {
                  const isLiteral = quote.type === 'نص حرفي';
                  return (
                    <Card
                      key={idx}
                      variant="white"
                      elevation="subtle"
                      padded="md"
                      className="rounded-[18px] space-y-3 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2">
                        {/* pill showing the type: "نص حرفي" = mint pill, "بأسلوب المصدر" = blue pill */}
                        <span
                          style={{
                            backgroundColor: isLiteral ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)') : tokens.coolBlueTint,
                            color: isLiteral ? (isDark ? tokens.deepAccent : '#0E5C4D') : tokens.coolBlueAccent,
                            borderColor: isLiteral ? 'rgba(127, 209, 174, 0.4)' : tokens.border,
                          }}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs"
                        >
                          {quote.type}
                        </span>

                        {/* Copy button that copies: quote text + " — " + source */}
                        <button
                          type="button"
                          onClick={() => handleCopyQuote(quote.text, quote.source, idx)}
                          style={{
                            backgroundColor: tokens.surface,
                            borderColor: tokens.border,
                            color: copiedQuoteIdx === idx ? tokens.deepAccent : tokens.textSecondary,
                          }}
                          className="p-1 px-2.5 rounded-lg border text-xs flex items-center gap-1 hover:opacity-80 transition-colors cursor-pointer min-h-[32px]"
                          title="نسخ الاقتباس والمصدر"
                          aria-label="نسخ الاقتباس والمصدر"
                        >
                          {copiedQuoteIdx === idx ? (
                            <>
                              <Check size={13} style={{ color: tokens.deepAccent }} />
                              <span className="text-[11px] font-bold">تم النسخ</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span className="text-[11px]">نسخ</span>
                            </>
                          )}
                        </button>
                      </div>

                      <blockquote
                        style={{
                          color: tokens.textPrimary,
                          borderColor: isLiteral ? tokens.primaryMint : tokens.coolBlueAccent,
                        }}
                        className="pr-3.5 border-r-2 font-['Amiri',serif] text-base sm:text-lg leading-8 sm:leading-9 text-justify font-normal"
                      >
                        {quote.text}
                      </blockquote>

                      <div
                        style={{
                          borderColor: tokens.borderSubtle,
                          color: tokens.textSecondary,
                        }}
                        className="pt-2 border-t flex items-center justify-between text-xs"
                      >
                        <span className="font-['Cairo',sans-serif] font-medium">
                          المصدر: <strong style={{ color: tokens.deepAccent }}>{quote.source}</strong>
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* القراءة التاريخية: Dual-narrative mode (after quotes) */}
          {renderDualNarrativeSection()}

          {/* Section "عدّة المبدع" */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1">
              <h3
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold flex items-center gap-2"
              >
                <Sparkles size={20} style={{ color: tokens.deepAccent }} />
                <span>عدّة المبدع</span>
              </h3>
              <span
                style={{
                  backgroundColor: tokens.coolBlueTint,
                  color: tokens.coolBlueAccent,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                للكتاب والمطورين
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
              {/* Row 1: العناصر الدرامية (motifs) */}
              {deepStory.motifs && deepStory.motifs.length > 0 && (
                <div className="space-y-1.5">
                  <span
                    style={{ color: tokens.deepAccent }}
                    className="text-xs font-bold block"
                  >
                    العناصر الدرامية:
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

              {/* Row 2: الثيمات (themes) */}
              {deepStory.themes && deepStory.themes.length > 0 && (
                <div className="space-y-1.5">
                  <span
                    style={{ color: tokens.deepAccent }}
                    className="text-xs font-bold block"
                  >
                    الثيمات:
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

              {/* Row 3: شخصيات الحكاية (cast) */}
              {deepStory.cast && deepStory.cast.length > 0 && (
                <div className="space-y-1.5">
                  <span
                    style={{ color: tokens.deepAccent }}
                    className="text-xs font-bold block"
                  >
                    شخصيات الحكاية:
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
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
                      >
                        👤 {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Two cards side by side (stacked on mobile): "لصنّاع الألعاب" & "لكتّاب القصص" */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* لصنّاع الألعاب */}
              <Card
                variant="white"
                elevation="card"
                padded="md"
                className="rounded-[20px] space-y-3"
              >
                <div
                  style={{ borderColor: tokens.borderSubtle }}
                  className="flex items-center gap-2 pb-2.5 border-b"
                >
                  <div
                    style={{
                      backgroundColor: tokens.coolBlueTint,
                      color: tokens.coolBlueAccent,
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Gamepad2 size={18} />
                  </div>
                  <h4
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-lg font-bold"
                  >
                    لصنّاع الألعاب
                  </h4>
                </div>

                <ul className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
                  {(deepStory.gameHooks || []).map((hook, i) => (
                    <li
                      key={i}
                      style={{ color: tokens.textPrimary }}
                      className="flex items-start gap-2"
                    >
                      <span
                        style={{ color: tokens.coolBlueAccent }}
                        className="shrink-0 mt-0.5"
                      >
                        🎮
                      </span>
                      <span>{hook}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* لكتّاب القصص */}
              <Card
                variant="white"
                elevation="card"
                padded="md"
                className="rounded-[20px] space-y-3"
              >
                <div
                  style={{ borderColor: tokens.borderSubtle }}
                  className="flex items-center gap-2 pb-2.5 border-b"
                >
                  <div
                    style={{
                      backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                      color: tokens.deepAccent,
                    }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Feather size={18} />
                  </div>
                  <h4
                    style={{ color: tokens.deepAccent }}
                    className="font-['Aref_Ruqaa',serif] text-lg font-bold"
                  >
                    لكتّاب القصص
                  </h4>
                </div>

                <ul className="space-y-2 text-xs sm:text-[13px] leading-relaxed">
                  {(deepStory.writingHooks || []).map((hook, i) => (
                    <li
                      key={i}
                      style={{ color: tokens.textPrimary }}
                      className="flex items-start gap-2"
                    >
                      <span
                        style={{ color: tokens.primaryMint }}
                        className="shrink-0 mt-0.5"
                      >
                        ✍️
                      </span>
                      <span>{hook}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* خطافات حكاية (storyHooks) & أدوار لعبية (gameRoles) */}
            {(deepStory.storyHooks || deepStory.gameRoles) && (
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                }}
                className="p-4 sm:p-5 rounded-2xl border shadow-xs space-y-3.5"
              >
                {/* خطافات حكاية */}
                {deepStory.storyHooks && deepStory.storyHooks.length > 0 && (
                  <div className="space-y-2">
                    <span
                      style={{ color: tokens.deepAccent }}
                      className="text-xs font-bold flex items-center gap-1.5"
                    >
                      <Scroll size={14} style={{ color: tokens.primaryMint }} />
                      <span>خطافات حكاية:</span>
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

                {/* أدوار لعبية */}
                {deepStory.gameRoles && deepStory.gameRoles.length > 0 && (
                  <div className="space-y-2 pt-1 border-t" style={{ borderColor: tokens.borderSubtle }}>
                    <span
                      style={{ color: tokens.deepAccent }}
                      className="text-xs font-bold flex items-center gap-1.5"
                    >
                      <Gamepad2 size={14} style={{ color: tokens.coolBlueAccent }} />
                      <span>أدوار لعبية:</span>
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
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border"
                        >
                          🎮 {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* مشاهد مقترحة (scenes vertical timeline) */}
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
                  <span>مشاهد مقترحة</span>
                </h4>

                <div className="relative pr-5 space-y-4 border-r-2" style={{ borderColor: tokens.primaryMint }}>
                  {deepStory.scenes.map((scene, idx) => (
                    <div key={idx} className="relative">
                      {/* Teal node per scene */}
                      <div
                        style={{
                          backgroundColor: tokens.deepAccent,
                          borderColor: tokens.primaryMint,
                        }}
                        className="absolute -right-[27px] top-1 w-3.5 h-3.5 rounded-full border-2 ring-4 ring-[#7FD1AE]/20"
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

            {/* قرار اللاعب (highlighted card with cool-blue tinted background #E8F1FB, blue border, decision text in bold, plus a copy button) */}
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
                    <span>قرار اللاعب</span>
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
                    title="نسخ قرار اللاعب"
                  >
                    <Copy size={14} />
                    <span>نسخ القرار</span>
                  </button>
                </div>
                <p style={{ color: tokens.textPrimary }} className="text-sm sm:text-base font-bold leading-relaxed">
                  {deepStory.decision}
                </p>
              </div>
            )}

            {/* Button: حوّل إلى مهمة لعبة */}
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
                <span>حوّل إلى مهمة لعبة</span>
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
            <span>{ar.article.timelineTitle}</span>
          </h3>
          <span style={{ color: tokens.textSecondary }} className="text-[11px]">
            {ar.article.timelineSubtitle}
          </span>
        </div>

        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="p-3 sm:p-4 rounded-[18px] border shadow-xs space-y-4"
        >
          <div className="relative flex items-center justify-between px-2 sm:px-4">
            <div
              style={{ backgroundColor: tokens.coolBlueTint }}
              className="absolute top-1/2 inset-x-8 -translate-y-1/2 h-1 rounded-full z-0"
            />

            <div
              className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full transition-all duration-300 z-0"
              style={{
                backgroundColor: tokens.coolBlueAccent,
                right: activeEra === 'جاهلية' ? '15%' : activeEra === 'صدر الإسلام' ? '15%' : '15%',
                left: activeEra === 'جاهلية' ? '65%' : activeEra === 'صدر الإسلام' ? '35%' : '15%',
              }}
            />

            {eras.map((era) => {
              const isActive = activeEra === era;

              return (
                <button
                  key={era}
                  type="button"
                  onClick={() => setActiveEra(era)}
                  className="relative z-10 flex flex-col items-center group cursor-pointer focus:outline-none min-h-[48px]"
                >
                  <div
                    style={{
                      backgroundColor: isActive ? tokens.coolBlueAccent : tokens.card,
                      color: isActive ? (isDark ? tokens.background : '#FFFFFF') : tokens.textSecondary,
                      borderColor: isActive ? tokens.coolBlueAccent : tokens.borderSubtle,
                    }}
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 border-2 shadow-sm"
                  >
                    {era === 'جاهلية' ? '١' : era === 'صدر الإسلام' ? '٢' : '٣'}
                  </div>
                  <span
                    style={{
                      color: isActive ? tokens.coolBlueAccent : tokens.textSecondary,
                      fontWeight: isActive ? 700 : 500,
                    }}
                    className="text-xs mt-1.5 font-['Cairo',sans-serif] transition-colors leading-none"
                  >
                    {era}
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
            className="p-3.5 rounded-xl border text-right transition-all"
          >
            <div
              style={{ color: tokens.coolBlueAccent }}
              className="flex items-center gap-1.5 mb-1 text-xs font-bold"
            >
              <span>ملاحظة العصر:</span>
              <span style={{ color: tokens.textPrimary }}>{activeEra}</span>
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

      {/* 7. "المصادر" Section */}
      <div className="space-y-3">
        <h3
          style={{ color: tokens.textPrimary }}
          className="font-['Aref_Ruqaa',serif] text-lg font-bold flex items-center gap-2"
        >
          <BookOpen size={18} style={{ color: tokens.coolBlueAccent }} />
          <span>{ar.article.sourcesTitle}</span>
        </h3>

        <div className="space-y-2.5">
          {entry.sources.map((src, index) => (
            <div
              key={index}
              style={{
                backgroundColor: tokens.card,
                borderColor: tokens.border,
              }}
              className="flex items-center justify-between gap-3 p-3.5 rounded-2xl border shadow-xs text-right min-h-[48px]"
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

                <div className="text-right">
                  <h4
                    style={{ color: tokens.textPrimary }}
                    className="font-bold text-sm font-['Cairo',sans-serif] leading-tight"
                  >
                    {src.title}
                  </h4>
                  <p
                    style={{ color: tokens.textSecondary }}
                    className="text-xs mt-0.5"
                  >
                    {ar.article.author} {src.author}
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
                {src.year}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 8. "الكيانات ذات الصلة" */}
      {entry.related && entry.related.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <h3
              style={{ color: tokens.textPrimary }}
              className="font-['Aref_Ruqaa',serif] text-lg font-bold flex items-center gap-2"
            >
              <Compass size={18} style={{ color: tokens.deepAccent }} />
              <span>{ar.article.relatedTitle}</span>
            </h3>
            <span style={{ color: tokens.textSecondary }} className="text-[11px]">
              {ar.article.relatedSubtitle}
            </span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-1 px-1">
            {entry.related.map((relId) => {
              const rel = getEntryById(relId);
              if (!rel) return null;

              return (
                <button
                  key={rel.id}
                  type="button"
                  onClick={() => onSelectRelated(rel)}
                  style={{
                    backgroundColor: tokens.card,
                    borderColor: tokens.border,
                  }}
                  className="flex items-center gap-3 p-2.5 pr-3 pl-4 rounded-2xl border shadow-xs transition-all duration-200 cursor-pointer shrink-0 text-right group min-h-[52px]"
                >
                  <div
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.borderSubtle,
                    }}
                    className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border"
                  >
                    <img
                      src={rel.heroImage}
                      alt={rel.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>

                  <div className="text-right">
                    <span
                      style={{ color: tokens.textPrimary }}
                      className="font-['Aref_Ruqaa',serif] text-sm font-bold block truncate max-w-[130px]"
                    >
                      {rel.name}
                    </span>
                    <span
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] block truncate max-w-[130px]"
                    >
                      {rel.typeLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* End of article actions: cool-blue button "ألهمني" and "العودة للرئيسية" */}
      <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* Cool-blue button "ألهمني" */}
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
          <span>ألهمني</span>
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
          <span>← {ar.article.backHome}</span>
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
            className="w-full max-w-lg rounded-[24px] p-5 sm:p-6 shadow-2xl border space-y-4 animate-in zoom-in-95 duration-200 text-right"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-label="فكرة ملهمة للمبدعين"
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
                    ألهمني
                  </h3>
                  <p style={{ color: tokens.textSecondary }} className="text-xs">
                    فكرة مستوحاة من {entry.name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspireModalOpen(false)}
                style={{ color: tokens.textSecondary }}
                className="p-2 rounded-xl hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="إغلاق النافذة"
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
                  <span>{selectedHook.icon}</span>
                  <span>{selectedHook.label}</span>
                </span>
              </div>

              <p
                style={{ color: tokens.textPrimary }}
                className="font-['Amiri',serif] text-base sm:text-lg leading-8 text-justify"
              >
                «{selectedHook.text}»
              </p>
            </div>

            {/* Action buttons: نسخ and فكرة أخرى */}
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
                <span>فكرة أخرى</span>
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
                    <span>تم النسخ!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>نسخ</span>
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
