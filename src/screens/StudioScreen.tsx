/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Studio Screen (استوديو المبدعين)
 * Aggregates game hooks and story writing prompts from classical Arab folklore.
 * Features category and theme filtering, starred favorites, copy, and export.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Sparkles,
  Gamepad2,
  PenTool,
  Star,
  Copy,
  Check,
  Download,
  BookOpen,
  ChevronLeft,
  FilterX,
  Layers,
  Quote,
  Search,
  X,
  Wand2,
  RotateCcw,
} from 'lucide-react';

import { useTheme } from '../theme/ThemeContext';
import { ar } from '../i18n/ar';
import { storage } from '../data/storage';
import { getAllEntries } from '../data/seed';
import { MythEntry } from '../data/types';
import storiesData from '../data/stories.json';
import { DeepStoriesMap } from '../data/storyTypes';
import { normalizeArabic } from '../utils/arabicSearch';
import {
  AggregatedHook,
  AggregatedQuote,
  STUDIO_CATEGORY_OPTIONS,
  getAggregatedHooks,
  getAggregatedQuotes,
  extractAllThemes,
  filterHooks,
  filterQuotes,
  formatQuoteForCopy,
  formatHooksForExport,
  resolveMythForStoryKey,
} from '../utils/studioHooks';

export interface StudioScreenProps {
  onSelectEntry: (entry: MythEntry) => void;
}

export const StudioScreen: React.FC<StudioScreenProps> = ({ onSelectEntry }) => {
  const { tokens, isDark } = useTheme();

  // All myth entries and deep stories
  const allMythEntries = useMemo(() => getAllEntries(), []);
  const deepStories = storiesData as unknown as DeepStoriesMap;

  // Aggregate all hooks once
  const allHooks = useMemo(
    () => getAggregatedHooks(deepStories, allMythEntries),
    [deepStories, allMythEntries]
  );

  // Extract all unique themes
  const allThemes = useMemo(() => extractAllThemes(deepStories), [deepStories]);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTheme, setSelectedTheme] = useState<string>('all');

  // Starred / Favorite Hooks State (persisted to storage)
  const [starredHookIds, setStarredHookIds] = useState<string[]>(() =>
    storage.getFavoriteHooks()
  );

  // Starred / Favorite Quotes State (persisted to storage)
  const [starredQuoteIds, setStarredQuoteIds] = useState<string[]>(() =>
    storage.getFavoriteQuotes()
  );

  // Quotes Section Filters State
  const [quoteTypeFilter, setQuoteTypeFilter] = useState<string>('all');
  const [quoteSearchQuery, setQuoteSearchQuery] = useState<string>('');
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [copiedHookId, setCopiedHookId] = useState<string | null>(null);

  // مولّد فكرة حكاية State
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  const handleGenerateStoryIdea = () => {
    if (allMythEntries.length < 2) return;
    const shuffled = [...allMythEntries].sort(() => 0.5 - Math.random());
    const myth1 = shuffled[0];
    const myth2 = shuffled[1];

    const hookPool: string[] = [];
    Object.values(deepStories).forEach((ds) => {
      if (ds.writingHooks) hookPool.push(...ds.writingHooks);
      if (ds.storyHooks) hookPool.push(...ds.storyHooks);
      if (ds.gameHooks) hookPool.push(...ds.gameHooks);
    });
    const randomHook = hookPool.length > 0
      ? hookPool[Math.floor(Math.random() * hookPool.length)]
      : 'سر قديم يتوارثه الرعاة في ظلمات الليل';

    const regions = [
      myth1.region,
      myth2.region,
      'وادي عبقر',
      'مشارف إرم ذات العماد',
      'كثبان الربع الخالي',
      'حصن الأبلق في تيماء',
      'جبل قاف الأسطوري',
      'بئر برهوت المظلم',
      'سد مأرب العظيم',
      'مضارب نجد وتهامة',
    ].filter(Boolean);
    const randomRegion = regions[Math.floor(Math.random() * regions.length)];

    const promptText = `التقيا عند ${randomRegion}: ${myth1.name} و${myth2.name}، وبينهما خيط: «${randomHook}».`;
    setGeneratedPrompt(promptText);
  };

  const handleCopyGeneratedPrompt = async () => {
    if (!generatedPrompt) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedPrompt);
      }
      setToastMessage('تم نسخ فكرة الحكاية بنجاح 📜');
    } catch {
      setToastMessage('تم نسخ فكرة الحكاية بنجاح 📜');
    }
  };

  // Save starred hooks to storage whenever updated
  useEffect(() => {
    storage.setFavoriteHooks(starredHookIds);
  }, [starredHookIds]);

  // Save starred quotes to storage whenever updated
  useEffect(() => {
    storage.setFavoriteQuotes(starredQuoteIds);
  }, [starredQuoteIds]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Filtered hooks based on selected category & theme
  const filteredHooks = useMemo(
    () => filterHooks(allHooks, selectedCategory, selectedTheme),
    [allHooks, selectedCategory, selectedTheme]
  );

  // Separate into Game Hooks and Writing Hooks
  const gameHooks = useMemo(
    () => filteredHooks.filter((h) => h.type === 'game'),
    [filteredHooks]
  );

  const writingHooks = useMemo(
    () => filteredHooks.filter((h) => h.type === 'writing'),
    [filteredHooks]
  );

  // Aggregate all quotes across stories
  const allQuotes = useMemo(
    () => getAggregatedQuotes(deepStories, allMythEntries),
    [deepStories, allMythEntries]
  );

  // Filtered quotes based on type filter and normalized search query
  const filteredQuotes = useMemo(
    () => filterQuotes(allQuotes, quoteTypeFilter, quoteSearchQuery, normalizeArabic),
    [allQuotes, quoteTypeFilter, quoteSearchQuery]
  );

  // Toggle favorite status of a hook
  const handleToggleStar = (hookId: string) => {
    setStarredHookIds((prev) =>
      prev.includes(hookId) ? prev.filter((id) => id !== hookId) : [...prev, hookId]
    );
  };

  // Toggle favorite status of a quote
  const handleToggleStarQuote = (quoteId: string) => {
    setStarredQuoteIds((prev) =>
      prev.includes(quoteId) ? prev.filter((id) => id !== quoteId) : [...prev, quoteId]
    );
  };

  // Copy individual hook to clipboard
  const handleCopyHook = async (hook: AggregatedHook) => {
    const textToCopy = `${hook.text} — ${hook.mythName}`;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopiedHookId(hook.id);
      setToastMessage(ar.studio.copiedToast);
      setTimeout(() => {
        setCopiedHookId((prev) => (prev === hook.id ? null : prev));
      }, 2000);
    } catch {
      setToastMessage(ar.studio.copiedToast);
    }
  };

  // Copy individual quote to clipboard: text + " — " + source
  const handleCopyQuote = async (quote: AggregatedQuote) => {
    const textToCopy = formatQuoteForCopy(quote);
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setCopiedQuoteId(quote.id);
      setToastMessage(ar.studio.quotesCopiedToast);
      setTimeout(() => {
        setCopiedQuoteId((prev) => (prev === quote.id ? null : prev));
      }, 2000);
    } catch {
      setToastMessage(ar.studio.quotesCopiedToast);
    }
  };

  // Export all starred hooks as one plain-text list (hook + myth name)
  const handleExportSelected = async () => {
    const starredHooksList = allHooks.filter((h) => starredHookIds.includes(h.id));

    if (starredHooksList.length === 0) {
      setToastMessage(ar.studio.noSelectedToast);
      return;
    }

    const exportContent = formatHooksForExport(starredHooksList);

    // 1. Copy to clipboard
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(exportContent);
      }
    } catch {
      // Fallback if clipboard fails
    }

    // 2. Download as .txt file
    try {
      const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'افكار_الاستوديو_المختارة.txt';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback
    }

    // 3. Show verbatim required toast: "تم تصدير أفكارك"
    setToastMessage(ar.studio.exportToast);
  };

  // Navigate to myth Article
  const handleNavigateToMyth = (mythId: string) => {
    const myth = resolveMythForStoryKey(mythId, allMythEntries);
    if (myth) {
      onSelectEntry(myth);
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedTheme('all');
  };

  const isFilterActive = selectedCategory !== 'all' || selectedTheme !== 'all';
  const hasNoResults = gameHooks.length === 0 && writingHooks.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl border shadow-xl flex items-center gap-2.5 backdrop-blur-md animate-in slide-in-from-top-2"
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

      {/* Header Banner */}
      <section
        style={{
          backgroundColor: tokens.card,
          borderColor: tokens.border,
        }}
        className="rounded-3xl p-5 border relative overflow-hidden shadow-xs"
      >
        <div
          style={{
            background: isDark
              ? 'radial-gradient(circle at top right, rgba(127,209,174,0.18), transparent 70%)'
              : 'radial-gradient(circle at top right, rgba(127,209,174,0.25), transparent 70%)',
          }}
          className="absolute inset-0 pointer-events-none"
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold"
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.1)',
                color: tokens.deepAccent,
              }}
            >
              <Sparkles size={12} />
              <span>مختبر السرد والتصميم</span>
            </div>
            <h2
              style={{ color: tokens.deepAccent }}
              className="text-2xl font-bold font-['Aref_Ruqaa',serif] leading-tight"
            >
              {ar.studio.title}
            </h2>
            <p style={{ color: tokens.textSecondary }} className="text-xs leading-relaxed max-w-sm">
              {ar.studio.subtitle}
            </p>
          </div>

          {/* Action: تصدير المختار */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportSelected}
              aria-label={ar.studio.exportSelected}
              style={{
                backgroundColor: tokens.deepAccent,
                color: isDark ? '#0B2420' : '#FFFFFF',
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md hover:opacity-90 transition-all active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Download size={15} />
              <span>{ar.studio.exportSelected}</span>
              {starredHookIds.length > 0 && (
                <span
                  style={{
                    backgroundColor: isDark ? '#0B2420' : '#FFFFFF',
                    color: tokens.deepAccent,
                  }}
                  className="px-1.5 py-0.2 rounded-full text-[10px] font-extrabold"
                >
                  {starredHookIds.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* مولّد فكرة حكاية Generator Card */}
      <section
        style={{
          backgroundColor: tokens.card,
          borderColor: tokens.border,
        }}
        className="rounded-3xl p-5 border relative overflow-hidden shadow-xs space-y-3.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(14, 92, 77, 0.1)',
                color: tokens.deepAccent,
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            >
              <Wand2 size={18} />
            </div>
            <div>
              <h3
                style={{ color: tokens.deepAccent }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold leading-tight"
              >
                مولّد فكرة حكاية
              </h3>
              <p style={{ color: tokens.textSecondary }} className="text-xs">
                امزج أسطورتين مع خيط سردي وموقع تراثي لإلهام روايتك أو لعبتك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateStoryIdea}
            style={{
              backgroundColor: tokens.deepAccent,
              color: isDark ? '#0B2420' : '#FFFFFF',
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs shadow-md hover:opacity-90 active:scale-95 transition-all cursor-pointer min-h-[44px]"
          >
            <Sparkles size={15} />
            <span>{generatedPrompt ? 'توليد فكرة جديدة' : 'ولّد فكرة حكاية'}</span>
          </button>
        </div>

        {generatedPrompt && (
          <div
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            }}
            className="p-4 rounded-2xl border space-y-3 animate-in fade-in slide-in-from-top-1"
          >
            <p
              style={{ color: tokens.textPrimary }}
              className="font-['Amiri',serif] text-base sm:text-lg leading-relaxed text-right font-medium"
            >
              {generatedPrompt}
            </p>

            <div className="flex items-center justify-between gap-2 pt-2 border-t" style={{ borderColor: tokens.borderSubtle }}>
              <button
                type="button"
                onClick={handleGenerateStoryIdea}
                style={{ color: tokens.deepAccent }}
                className="inline-flex items-center gap-1.5 text-xs font-bold hover:underline cursor-pointer min-h-[36px]"
              >
                <RotateCcw size={14} />
                <span>إعادة التوليد</span>
              </button>

              <button
                type="button"
                onClick={handleCopyGeneratedPrompt}
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: tokens.deepAccent,
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shadow-2xs hover:opacity-90 transition-all cursor-pointer min-h-[36px]"
              >
                <Copy size={14} />
                <span>نسخ الفكرة</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Filter Controls: Category chips & Theme dropdown */}
      <section className="space-y-3">
        {/* Category filter chips */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <span style={{ color: tokens.textSecondary }} className="text-xs font-semibold">
              التصنيف:
            </span>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{ color: tokens.deepAccent }}
                className="text-[11px] underline cursor-pointer hover:opacity-80"
              >
                إعادة التعيين
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
            {STUDIO_CATEGORY_OPTIONS.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    backgroundColor: isActive
                      ? (isDark ? tokens.deepAccent : tokens.deepAccent)
                      : tokens.card,
                    color: isActive
                      ? (isDark ? '#0B2420' : '#FFFFFF')
                      : tokens.textSecondary,
                    borderColor: isActive ? tokens.deepAccent : tokens.border,
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95"
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme dropdown */}
        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="p-3 rounded-2xl border flex items-center gap-3 shadow-xs"
        >
          <Layers size={16} style={{ color: tokens.deepAccent }} className="shrink-0" />
          <div className="flex-1 flex items-center justify-between gap-2 min-w-0">
            <label htmlFor="theme-filter-select" style={{ color: tokens.textSecondary }} className="text-xs font-medium shrink-0">
              الثيم السردي:
            </label>
            <select
              id="theme-filter-select"
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.textPrimary,
              }}
              className="flex-1 text-xs py-1.5 px-3 rounded-xl border focus:outline-hidden font-['Cairo',sans-serif] cursor-pointer"
            >
              <option value="all">{ar.studio.allThemesOption}</option>
              {allThemes.map((theme) => (
                <option key={theme} value={theme}>
                  {theme}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Main Content: Hook Sections or Empty State */}
      {hasNoResults ? (
        /* Empty State */
        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="py-12 px-6 rounded-3xl border text-center space-y-3 shadow-xs animate-in fade-in"
        >
          <div
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.1)' : 'rgba(13, 92, 70, 0.05)',
              color: tokens.deepAccent,
            }}
            className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
          >
            <FilterX size={24} />
          </div>
          <p
            style={{ color: tokens.textPrimary }}
            className="text-sm font-bold font-['Aref_Ruqaa',serif]"
          >
            {ar.studio.emptyMessage}
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.1)',
              color: tokens.deepAccent,
            }}
            className="px-4 py-2 rounded-xl text-xs font-bold hover:opacity-80 transition-all cursor-pointer"
          >
            عرض جميع الأفكار
          </button>
        </div>
      ) : (
        <div className="space-y-7">
          {/* Section 1: أفكار للألعاب (Game Hooks) */}
          {gameHooks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.1)',
                      color: tokens.deepAccent,
                    }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <Gamepad2 size={16} />
                  </div>
                  <h3
                    style={{ color: tokens.textPrimary }}
                    className="font-['Aref_Ruqaa',serif] text-lg font-bold"
                  >
                    {ar.studio.gameHooks}
                  </h3>
                </div>
                <span
                  style={{
                    backgroundColor: tokens.card,
                    borderColor: tokens.border,
                    color: tokens.textSecondary,
                  }}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                >
                  {gameHooks.length}
                </span>
              </div>

              <div className="space-y-3">
                {gameHooks.map((hook) => {
                  const isStarred = starredHookIds.includes(hook.id);
                  const isCopied = copiedHookId === hook.id;

                  return (
                    <div
                      key={hook.id}
                      style={{
                        backgroundColor: tokens.card,
                        borderColor: isStarred ? tokens.deepAccent : tokens.border,
                      }}
                      className={`p-4 rounded-2xl border transition-all shadow-xs space-y-3 ${
                        isStarred ? 'ring-1 ring-[#7FD1AE]/40' : ''
                      }`}
                    >
                      {/* Hook text */}
                      <p
                        style={{ color: tokens.textPrimary }}
                        className="text-xs leading-relaxed font-medium"
                      >
                        {hook.text}
                      </p>

                      {/* Card Bottom Meta & Actions */}
                      <div
                        style={{ borderColor: tokens.borderSubtle }}
                        className="pt-2 border-t flex items-center justify-between gap-2"
                      >
                        {/* Tappable source myth name */}
                        <button
                          type="button"
                          onClick={() => handleNavigateToMyth(hook.mythId)}
                          style={{
                            backgroundColor: isDark
                              ? 'rgba(127, 209, 174, 0.15)'
                              : 'rgba(13, 92, 70, 0.08)',
                            color: tokens.deepAccent,
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold hover:opacity-80 transition-all cursor-pointer min-h-[32px]"
                          title="عرض الأسطورة الكاملة"
                        >
                          <BookOpen size={12} />
                          <span>{hook.mythName}</span>
                          <ChevronLeft size={12} />
                        </button>

                        {/* Action buttons: Star & Copy */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStar(hook.id)}
                            aria-label={isStarred ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                            style={{
                              color: isStarred ? '#E5A93C' : tokens.textSecondary,
                              backgroundColor: isStarred
                                ? (isDark ? 'rgba(229, 169, 60, 0.2)' : 'rgba(229, 169, 60, 0.15)')
                                : 'transparent',
                            }}
                            className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Star size={16} className={isStarred ? 'fill-current' : ''} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyHook(hook)}
                            aria-label="نسخ الفكرة"
                            style={{
                              color: isCopied ? tokens.deepAccent : tokens.textSecondary,
                              backgroundColor: isCopied
                                ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.15)')
                                : 'transparent',
                            }}
                            className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Section 2: بذور للقصص (Writing Hooks) */}
          {writingHooks.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      backgroundColor: isDark ? 'rgba(127, 178, 232, 0.2)' : 'rgba(127, 178, 232, 0.15)',
                      color: tokens.coolBlueAccent,
                    }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0"
                  >
                    <PenTool size={16} />
                  </div>
                  <h3
                    style={{ color: tokens.textPrimary }}
                    className="font-['Aref_Ruqaa',serif] text-lg font-bold"
                  >
                    {ar.studio.writingHooks}
                  </h3>
                </div>
                <span
                  style={{
                    backgroundColor: tokens.card,
                    borderColor: tokens.border,
                    color: tokens.textSecondary,
                  }}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
                >
                  {writingHooks.length}
                </span>
              </div>

              <div className="space-y-3">
                {writingHooks.map((hook) => {
                  const isStarred = starredHookIds.includes(hook.id);
                  const isCopied = copiedHookId === hook.id;

                  return (
                    <div
                      key={hook.id}
                      style={{
                        backgroundColor: tokens.card,
                        borderColor: isStarred ? tokens.deepAccent : tokens.border,
                      }}
                      className={`p-4 rounded-2xl border transition-all shadow-xs space-y-3 ${
                        isStarred ? 'ring-1 ring-[#7FD1AE]/40' : ''
                      }`}
                    >
                      {/* Hook text */}
                      <p
                        style={{ color: tokens.textPrimary }}
                        className="text-xs leading-relaxed font-medium"
                      >
                        {hook.text}
                      </p>

                      {/* Card Bottom Meta & Actions */}
                      <div
                        style={{ borderColor: tokens.borderSubtle }}
                        className="pt-2 border-t flex items-center justify-between gap-2"
                      >
                        {/* Tappable source myth name */}
                        <button
                          type="button"
                          onClick={() => handleNavigateToMyth(hook.mythId)}
                          style={{
                            backgroundColor: isDark
                              ? 'rgba(127, 178, 232, 0.15)'
                              : 'rgba(127, 178, 232, 0.1)',
                            color: tokens.coolBlueAccent,
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold hover:opacity-80 transition-all cursor-pointer min-h-[32px]"
                          title="عرض الأسطورة الكاملة"
                        >
                          <BookOpen size={12} />
                          <span>{hook.mythName}</span>
                          <ChevronLeft size={12} />
                        </button>

                        {/* Action buttons: Star & Copy */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleStar(hook.id)}
                            aria-label={isStarred ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
                            style={{
                              color: isStarred ? '#E5A93C' : tokens.textSecondary,
                              backgroundColor: isStarred
                                ? (isDark ? 'rgba(229, 169, 60, 0.2)' : 'rgba(229, 169, 60, 0.15)')
                                : 'transparent',
                            }}
                            className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            <Star size={16} className={isStarred ? 'fill-current' : ''} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyHook(hook)}
                            aria-label="نسخ الفكرة"
                            style={{
                              color: isCopied ? tokens.deepAccent : tokens.textSecondary,
                              backgroundColor: isCopied
                                ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.15)')
                                : 'transparent',
                            }}
                            className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                          >
                            {isCopied ? <Check size={16} /> : <Copy size={16} />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Divider between hooks and quotes */}
      <div
        style={{ borderColor: tokens.borderSubtle }}
        className="border-t my-8"
      />

      {/* SECTION 3: منتزه الاقتباسات (Quote Promenade) */}
      <section className="space-y-4 pt-1 pb-4">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2.5">
            <div
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.1)',
                color: tokens.deepAccent,
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
            >
              <Quote size={18} />
            </div>
            <div>
              <h3
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-xl font-bold leading-tight"
              >
                {ar.studio.quotesSectionTitle}
              </h3>
              <p
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-medium"
              >
                {ar.studio.quotesSubtitle}
              </p>
            </div>
          </div>
          <span
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
              color: tokens.textSecondary,
            }}
            className="self-start sm:self-auto px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
          >
            {filteredQuotes.length} من {allQuotes.length} اقتباس
          </span>
        </div>

        {/* Filter controls: Search input & Type chips */}
        <div className="space-y-2.5">
          {/* Search Input with Arabic normalization */}
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border shadow-xs transition-colors focus-within:ring-2 focus-within:ring-[#7FD1AE]/40"
          >
            <Search size={16} style={{ color: tokens.textSecondary }} className="shrink-0" />
            <input
              type="text"
              value={quoteSearchQuery}
              onChange={(e) => setQuoteSearchQuery(e.target.value)}
              placeholder={ar.studio.quotesSearchPlaceholder}
              style={{
                color: tokens.textPrimary,
              }}
              className="w-full bg-transparent text-xs py-1.5 focus:outline-hidden placeholder:text-neutral-400 font-['Cairo',sans-serif]"
              dir="rtl"
            />
            {quoteSearchQuery && (
              <button
                type="button"
                onClick={() => setQuoteSearchQuery('')}
                aria-label="مسح البحث"
                style={{ color: tokens.textSecondary }}
                className="p-1 rounded-lg hover:opacity-80 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter Chips: الكل / نص حرفي / بأسلوب المصدر */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all', label: ar.studio.quotesFilterAll, isAdaptive: false },
              { id: 'نص حرفي', label: ar.studio.quotesFilterLiteral, isAdaptive: false },
              { id: 'بأسلوب المصدر', label: ar.studio.quotesFilterAdaptive, isAdaptive: true },
            ].map((chip) => {
              const isActive = quoteTypeFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setQuoteTypeFilter(chip.id)}
                  style={{
                    backgroundColor: isActive
                      ? (chip.isAdaptive
                          ? (isDark ? 'rgba(127, 178, 232, 0.3)' : '#7FB2E8')
                          : tokens.deepAccent)
                      : tokens.card,
                    color: isActive
                      ? (isDark ? '#0B2420' : (chip.isAdaptive ? '#0B2420' : '#FFFFFF'))
                      : tokens.textSecondary,
                    borderColor: isActive
                      ? (chip.isAdaptive ? '#7FB2E8' : tokens.deepAccent)
                      : tokens.border,
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95"
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quotes Cards List or Empty State */}
        {filteredQuotes.length === 0 ? (
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="py-10 px-6 rounded-3xl border text-center space-y-2 shadow-xs animate-in fade-in"
          >
            <div
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.1)' : 'rgba(13, 92, 70, 0.05)',
                color: tokens.deepAccent,
              }}
              className="w-10 h-10 rounded-2xl mx-auto flex items-center justify-center"
            >
              <Quote size={20} />
            </div>
            <p
              style={{ color: tokens.textPrimary }}
              className="text-xs font-bold font-['Aref_Ruqaa',serif]"
            >
              {ar.studio.quotesEmptyMessage}
            </p>
            {(quoteSearchQuery || quoteTypeFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setQuoteSearchQuery('');
                  setQuoteTypeFilter('all');
                }}
                style={{
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.1)',
                  color: tokens.deepAccent,
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold hover:opacity-80 transition-all cursor-pointer mt-1"
              >
                مسح عوامل التصفية
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredQuotes.map((quote) => {
              const isStarred = starredQuoteIds.includes(quote.id);
              const isCopied = copiedQuoteId === quote.id;
              const isLiteral = quote.type === 'نص حرفي';

              return (
                <div
                  key={quote.id}
                  style={{
                    backgroundColor: tokens.card,
                    borderColor: isStarred ? tokens.deepAccent : tokens.border,
                  }}
                  className={`p-4 rounded-2xl border transition-all shadow-xs space-y-3 relative ${
                    isStarred ? 'ring-1 ring-[#7FD1AE]/40' : ''
                  }`}
                >
                  {/* Top card row: Type pill and actions */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Type pill: "نص حرفي" mint / "بأسلوب المصدر" blue */}
                    <span
                      style={{
                        backgroundColor: isLiteral
                          ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.15)')
                          : (isDark ? 'rgba(127, 178, 232, 0.2)' : 'rgba(127, 178, 232, 0.15)'),
                        color: isLiteral ? tokens.deepAccent : tokens.coolBlueAccent,
                        borderColor: isLiteral
                          ? (isDark ? 'rgba(127, 209, 174, 0.4)' : 'rgba(13, 92, 70, 0.25)')
                          : (isDark ? 'rgba(127, 178, 232, 0.4)' : 'rgba(127, 178, 232, 0.3)'),
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold border"
                    >
                      {quote.type}
                    </span>

                    {/* Star & Copy action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleStarQuote(quote.id)}
                        aria-label={isStarred ? 'إزالة الاقتباس من المفضلة' : 'حفظ الاقتباس في المفضلة'}
                        style={{
                          color: isStarred ? '#E5A93C' : tokens.textSecondary,
                          backgroundColor: isStarred
                            ? (isDark ? 'rgba(229, 169, 60, 0.2)' : 'rgba(229, 169, 60, 0.15)')
                            : 'transparent',
                        }}
                        className="p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title={isStarred ? 'في المفضلة' : 'إضافة للمفضلة'}
                      >
                        <Star size={15} className={isStarred ? 'fill-current' : ''} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyQuote(quote)}
                        aria-label="نسخ الاقتباس"
                        style={{
                          color: isCopied ? tokens.deepAccent : tokens.textSecondary,
                          backgroundColor: isCopied
                            ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.15)')
                            : 'transparent',
                        }}
                        className="p-1.5 rounded-xl transition-all hover:scale-105 active:scale-95 cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                        title="نسخ الاقتباس والمصدر"
                      >
                        {isCopied ? <Check size={15} /> : <Copy size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Quote text in serif Arabic style (Amiri) */}
                  <blockquote
                    style={{
                      color: tokens.textPrimary,
                      borderRightColor: isLiteral ? tokens.deepAccent : tokens.coolBlueAccent,
                    }}
                    className="font-['Amiri',serif] text-sm sm:text-base leading-relaxed pr-3 border-r-2 my-1"
                  >
                    «{quote.text}»
                  </blockquote>

                  {/* Source line beneath quote and myth navigation */}
                  <div
                    style={{ borderColor: tokens.borderSubtle }}
                    className="pt-2 border-t flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 text-xs">
                      <span style={{ color: tokens.textSecondary }} className="font-medium text-[11px]">
                        المصدر: {quote.source}
                      </span>
                    </div>

                    {/* Source myth button */}
                    <button
                      type="button"
                      onClick={() => handleNavigateToMyth(quote.mythId)}
                      style={{
                        backgroundColor: isDark
                          ? 'rgba(127, 209, 174, 0.15)'
                          : 'rgba(13, 92, 70, 0.08)',
                        color: tokens.deepAccent,
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold hover:opacity-80 transition-all cursor-pointer min-h-[28px]"
                      title="عرض الأسطورة الكاملة"
                    >
                      <BookOpen size={11} />
                      <span>{quote.mythName}</span>
                      <ChevronLeft size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default StudioScreen;
