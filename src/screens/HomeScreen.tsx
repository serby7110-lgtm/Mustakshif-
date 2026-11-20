/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Home Screen (مستكشف)
 * Full RTL layout with Arabic normalization global search,
 * keyword highlighting, 2x2 + 1 pastel category tiles, hero banner,
 * and most-read entries list. Colors read strictly from theme tokens.
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  Mic,
  Sparkles,
  Crown,
  Flame,
  Landmark,
  ChevronLeft,
  X,
  Users,
  BookOpen,
  Clock,
  Calendar,
  MapPin,
  Settings,
  Check,
  Orbit,
  Shuffle,
  Globe2,
  Filter,
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { Tag, TagVariant } from '../components/primitives/Tag';
import { SectionTitle } from '../components/primitives/SectionTitle';
import { Logo } from '../components/primitives/Logo';
import { LockedHeroImage, PremiumPill } from '../components/primitives/LockedMediaBadges';
import { MythEntry, MythCategory } from '../data/types';
import { MYTH_ENTRIES, getAllEntries, getEntriesByCategory, getEntryById } from '../data/seed';
import { getAllCivilizations } from '../data/civTypes';
import { getAzamaEntriesCount } from '../utils/azama';
import { storage, LastReadChapter } from '../data/storage';
import { searchEntries, searchCivilizations } from '../utils/arabicSearch';
import { getCivImageUrl, resolveHeroImageUrl } from '../utils/assets';
import { getEstimatedReadingTime, formatReadingTime } from '../utils/readingTime';
import { useTheme } from '../theme/ThemeContext';
import anqaBannerImg from '../assets/images/anqa_oasis_banner_1793094389649.jpg';
import { SurpriseMeButton } from '../components/primitives/SurpriseMeButton';
import { logAnalyticsEvent } from '../lib/firebase';
import { useI18n } from '../i18n/i18n';
import { getLocalizedEntry, getLocalizedCivilization, localizeTag } from '../content';
import {
  CONTENT_CATALOG,
  getCultureLabel,
  getTagLabel,
  getTypeLabel,
} from '../content/catalog';
import type { ContentType } from '../content/catalogTypes';
import {
  filterContentItems,
  getStoryOfTheDay,
  getUniqueCultures,
  getUniqueTags,
  pickRandomStory,
} from '../utils/catalogFilters';
const RunnerIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="15" cy="4" r="2" />
    <path d="M18 19l-4-3 1.5-4.5-3-1.5-1.5 3-4-2" />
    <path d="M7 21l3-5-2-4" />
    <path d="M13 14l3 5" />
  </svg>
);

const CrystalBallIcon = ({ size = 20, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="11" r="7" />
    <path d="M8 21h8" />
    <path d="M9 18l-1 3" />
    <path d="M15 18l1 3" />
    <path d="M10 8a3 3 0 0 1 3-3" />
  </svg>
);

export interface HomeScreenProps {
  onSelectEntry: (entry: MythEntry, chapterIndex?: number) => void;
  onOpenProfile?: () => void;
  onSelectCategoryFilter?: (category: MythCategory) => void;
  savedIds: string[];
  onToggleSave: (id: string, e?: React.MouseEvent) => void;
  onSelectCivilization?: (civId: string) => void;
  onExploreCivilizations?: () => void;
  onOpenAzama?: () => void;
  onOpenTag?: (tagKey: string) => void;
  onOpenCreatures?: (creatureId?: string) => void;
  isPremiumActive?: boolean;
  onOpenSubscription?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectEntry,
  onOpenProfile,
  onSelectCategoryFilter,
  savedIds,
  onToggleSave,
  onSelectCivilization,
  onExploreCivilizations,
  onOpenAzama,
  onOpenTag,
  onOpenCreatures,
  isPremiumActive,
  onOpenSubscription,
}) => {
  const { t, lang, dir } = useI18n();
  const { tokens, isDark } = useTheme();
  const effectivePremium = isPremiumActive ?? storage.hasPremiumMonthly();
  const azamaCount = useMemo(() => getAzamaEntriesCount(), []);

  React.useEffect(() => {
    if (!effectivePremium) {
      logAnalyticsEvent('premium_banner_view');
    }
  }, [effectivePremium]);

  const rawAllCivilizations = useMemo(() => getAllCivilizations() ?? [], []);
  const allCivilizations = useMemo(
    () => rawAllCivilizations.map((c) => getLocalizedCivilization(c, lang)),
    [rawAllCivilizations, lang]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'myths' | 'civs'>('all');
  const [isMicActive, setIsMicActive] = useState(false);
  const micTimerRef = useRef<number | null>(null);
  const [showAllMostRead, setShowAllMostRead] = useState(false);

  // Cross-cultural catalog filters
  const [explorerType, setExplorerType] = useState<ContentType | 'all'>('all');
  const [explorerCulture, setExplorerCulture] = useState<string>('all');
  const [explorerTag, setExplorerTag] = useState<string>('all');

  const storyOfDayItem = useMemo(() => getStoryOfTheDay(CONTENT_CATALOG), []);
  const availableCultures = useMemo(() => getUniqueCultures(CONTENT_CATALOG), []);
  const availableTags = useMemo(() => getUniqueTags(CONTENT_CATALOG), []);
  const filteredCatalog = useMemo(
    () =>
      filterContentItems(CONTENT_CATALOG, {
        type: explorerType,
        culture: explorerCulture,
        tag: explorerTag,
        query: searchQuery,
      }),
    [explorerType, explorerCulture, explorerTag, searchQuery]
  );

  const handleOpenCatalogStory = (storyId: string) => {
    const entry = getEntryById(storyId);
    if (entry) {
      onSelectEntry(entry);
    }
  };

  const handleOpenRandomStory = () => {
    const pool = filteredCatalog.length > 0 ? filteredCatalog : CONTENT_CATALOG;
    const picked = pickRandomStory(pool, storyOfDayItem?.id);
    if (picked) {
      handleOpenCatalogStory(picked.id);
    }
  };

  useEffect(() => {
    return () => {
      if (micTimerRef.current !== null) {
        clearTimeout(micTimerRef.current);
      }
    };
  }, []);

  // Check for last-read chapter (STEP 1: Home v2)
  const [lastRead] = useState<LastReadChapter | null>(() => storage.getLastReadChapter());
  const lastReadEntry = useMemo(() => {
    if (!lastRead?.mythId) return null;
    const raw = getEntryById(lastRead.mythId);
    return raw ? getLocalizedEntry(raw, lang) : null;
  }, [lastRead, lang]);

  // Phoenix entry for Hero Banner
  const anqaEntry = useMemo(() => {
    const raw = getEntryById('al-anqa') ?? MYTH_ENTRIES[1] ?? MYTH_ENTRIES[0];
    return raw ? getLocalizedEntry(raw, lang) : null;
  }, [lang]);

  // Entries for "الأكثر قراءة": الغول (al-ghul), إرم ذات العماد (iram-dhat-al-imad), الجن (al-jinn)
  const mostReadEntries = useMemo(() => {
    const ids = ['al-ghul', 'iram-dhat-al-imad', 'al-jinn', 'al-lat', 'zarqa-al-yamama'];
    const selected = ids
      .map((id) => getEntryById(id))
      .filter((e): e is MythEntry => Boolean(e))
      .map((e) => getLocalizedEntry(e, lang));
    return showAllMostRead ? selected : selected.slice(0, 3);
  }, [showAllMostRead, lang]);

  const rawAllEntries = useMemo(() => getAllEntries() ?? [], []);
  const allEntries = useMemo(
    () => rawAllEntries.map((e) => getLocalizedEntry(e, lang)),
    [rawAllEntries, lang]
  );

  // Global search across localized entries + Arabic fallback normalization
  const searchResults = useMemo(() => {
    if (searchScope === 'civs') return [];
    const localizedMatches = searchEntries(allEntries, searchQuery);
    if (lang === 'ar') return localizedMatches;
    const seen = new Set(localizedMatches.map((m) => m.entry.id));
    const arFallbackMatches = searchEntries(rawAllEntries, searchQuery)
      .filter((m) => !seen.has(m.entry.id))
      .map((m) => {
        const loc = getLocalizedEntry(m.entry, lang);
        return { ...m, entry: loc, snippet: loc.summary ?? '' };
      });
    return [...localizedMatches, ...arFallbackMatches];
  }, [allEntries, rawAllEntries, searchQuery, searchScope, lang]);

  // Civilizations search across localized + Arabic fallback
  const searchCivResults = useMemo(() => {
    if (searchScope === 'myths') return [];
    const localizedMatches = searchCivilizations(allCivilizations, searchQuery);
    if (lang === 'ar') return localizedMatches;
    const seen = new Set(localizedMatches.map((m) => m.civ.id));
    const arFallbackMatches = searchCivilizations(rawAllCivilizations, searchQuery)
      .filter((m) => !seen.has(m.civ.id))
      .map((m) => {
        const loc = getLocalizedCivilization(m.civ, lang);
        return { ...m, civ: loc, snippet: loc.economy || loc.region || '' };
      });
    return [...localizedMatches, ...arFallbackMatches];
  }, [allCivilizations, rawAllCivilizations, searchQuery, searchScope, lang]);

  const handleMicClick = () => {
    if (micTimerRef.current !== null) {
      clearTimeout(micTimerRef.current);
    }
    setIsMicActive(true);
    micTimerRef.current = window.setTimeout(() => {
      setSearchQuery(lang === 'ar' ? 'غول' : lang === 'th' ? 'กูล' : 'Ghoul');
      setIsMicActive(false);
      micTimerRef.current = null;
    }, 1000);
  };

  const getTagVariant = (tag: string): TagVariant => {
    if (tag === 'رعب') return 'horror';
    if (tag === 'تاريخ') return 'history';
    if (tag === 'خرافي') return 'supernatural';
    return 'neutral';
  };

  const getMatchedFieldLabel = (field: 'name' | 'summary' | 'tags' | 'body' | 'region') => {
    switch (field) {
      case 'name':
        return t('home.matchedInName');
      case 'summary':
        return t('home.matchedInSummary');
      case 'body':
        return t('home.matchedInBody');
      case 'tags':
        return t('home.matchedInTags');
      case 'region':
        return t('home.matchedInRegion');
    }
  };

  const renderHighlighted = (text: string | null | undefined, query: string) => {
    const safeText = text ?? '';
    if (!query.trim()) return safeText;
    const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const splitRegex = new RegExp(`(${cleanQ}|ال${cleanQ})`, 'gi');
    const matchRegex = new RegExp(`^(${cleanQ}|ال${cleanQ})$`, 'i');
    const parts = safeText.split(splitRegex);

    return parts.map((part, i) =>
      matchRegex.test(part) ? (
        <mark
          key={i}
          style={{
            backgroundColor: isDark ? 'rgba(127, 209, 174, 0.35)' : 'rgba(127, 209, 174, 0.4)',
            color: tokens.deepAccent,
          }}
          className="font-bold px-1 rounded-xs"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200" dir={dir}>
      {/* 0. Home Subscription Banner (First element of Home, above category tiles) */}
      {effectivePremium ? (
        <div className="pt-1 flex justify-start">
          <button
            type="button"
            data-testid="home-premium-active-chip"
            onClick={() => onOpenSubscription?.()}
            style={{
              backgroundColor: 'rgba(61, 220, 151, 0.16)',
              borderColor: '#3DDC97',
              color: isDark ? '#9FE8CC' : '#0E5C4D',
            }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border text-xs font-bold cursor-pointer hover:opacity-90 shadow-2xs"
          >
            <Check size={14} style={{ color: '#3DDC97' }} />
            <span>{t('home.premiumActiveChip') || 'Premium مفعّل ✓'}</span>
          </button>
        </div>
      ) : (
        <div
          data-testid="home-premium-banner"
          style={{
            background: 'linear-gradient(135deg, #E8F1FB 0%, #F2FBF7 100%)',
            borderColor: '#4A90D9',
          }}
          className="mt-1 p-3.5 rounded-[18px] border-2 shadow-xs flex items-center justify-between gap-2.5"
        >
          <p
            style={{ color: '#0E5C4D' }}
            className="text-xs sm:text-sm font-bold font-['Cairo',sans-serif] leading-snug flex-1"
          >
            {t('home.premiumBanner') || 'افتح كل القصص الطويلة وأزل الإعلانات'}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenSubscription?.()}
              style={{
                backgroundColor: '#4A90D9',
                color: '#FFFFFF',
              }}
              className="px-3.5 py-2 rounded-full text-xs font-bold cursor-pointer hover:opacity-90 min-h-[44px]"
            >
              {t('home.premiumSubscribe')}
            </button>
            <button
              type="button"
              onClick={() => onOpenSubscription?.()}
              aria-label={t('subscription.title')}
              title={t('subscription.title')}
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                color: '#0E5C4D',
                borderColor: 'rgba(74, 144, 217, 0.35)',
              }}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full border flex items-center justify-center cursor-pointer hover:opacity-90"
            >
              <Settings size={17} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* 1. Header: greeting + logo button */}
      <header className="flex items-center justify-between gap-4 pt-1">
        <div className="text-start">
          <h1
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold leading-tight tracking-wide"
          >
            {t('home.greeting')}
          </h1>
          <p
            style={{ color: tokens.textSecondary }}
            className="text-xs font-['Cairo',sans-serif] mt-0.5"
          >
            {t('home.subgreeting')}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          aria-label={t('home.profileAria')}
          title={t('home.profileAria')}
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
            color: tokens.deepAccent,
          }}
          className="relative w-12 h-12 rounded-2xl border-2 shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer group min-h-[44px] min-w-[44px]"
        >
          <Logo size={28} className="group-hover:rotate-12 transition-transform duration-300" />
          <span
            style={{
              backgroundColor: tokens.primaryMint,
              borderColor: tokens.card,
            }}
            className="absolute -top-0.5 -end-0.5 w-2.5 h-2.5 rounded-full border-2"
          />
        </button>
      </header>

      {/* 1.5. "أكمل القراءة" Card at the very top (only if a last-read chapter exists) */}
      {lastRead && lastReadEntry && (() => {
        const safeProgress = Number.isFinite(lastRead.progressPercent) ? lastRead.progressPercent : 0;
        const safeChapterIdx = Number.isFinite(lastRead.chapterIndex) ? lastRead.chapterIndex : 0;
        return (
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="p-4 sm:p-4.5 rounded-[22px] border shadow-sm relative overflow-hidden transition-all duration-200"
          >
            <div className="flex items-center justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2">
                <div
                  style={{
                    backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                    color: tokens.deepAccent,
                  }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                >
                  <BookOpen size={16} />
                </div>
                <span
                  style={{ color: tokens.deepAccent }}
                  className="text-xs font-bold font-['Aref_Ruqaa',serif]"
                >
                  {t('home.continueReading') || 'أكمل القراءة'}
                </span>
              </div>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-mono font-medium"
              >
                {t('home.progressComplete', { percent: safeProgress })}
              </span>
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3
                  style={{ color: tokens.textPrimary }}
                  className="font-['Aref_Ruqaa',serif] text-lg font-bold truncate leading-snug"
                >
                  {lastReadEntry.name || lastRead.mythName || ''}
                </h3>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs font-['Cairo',sans-serif] mt-0.5 truncate"
                >
                  {lastRead.chapterTitle || t('home.previousChapter')}
                </p>

                {/* Progress bar */}
                <div
                  style={{ backgroundColor: tokens.surface }}
                  className="w-full h-1.5 rounded-full overflow-hidden mt-2.5 border"
                >
                  <div
                    style={{
                      width: `${Math.max(5, Math.min(100, safeProgress))}%`,
                      backgroundColor: tokens.primaryMint,
                    }}
                    className="h-full rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectEntry(lastReadEntry, safeChapterIdx)}
                style={{
                  backgroundColor: tokens.primaryMint,
                  color: '#0E5C4D',
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer shrink-0 min-h-[44px]"
              >
                <span>{t('home.continueAction') || 'متابعة'}</span>
                <ChevronLeft size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
              </button>
            </div>
          </div>
        );
      })()}

      {/* 2. Global Search bar with Arabic normalization */}
      <div className="relative">
        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: isDark ? tokens.border : 'rgba(74, 144, 217, 0.35)',
          }}
          className="relative flex items-center rounded-2xl border-2 transition-all duration-200 overflow-hidden min-h-[48px] shadow-sm"
        >
          {/* Magnifier Icon */}
          <div
            style={{ color: tokens.coolBlueAccent }}
            className="ps-3.5 pe-2 flex items-center pointer-events-none"
          >
            <Search size={20} strokeWidth={2.2} />
          </div>

          {/* Search Input */}
          <input
            type="text"
            dir={dir}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('home.searchPlaceholder')}
            style={{
              color: tokens.textPrimary,
            }}
            className="w-full py-3 px-1 text-sm bg-transparent font-['Cairo',sans-serif] focus:outline-none min-h-[44px]"
          />

          {/* Clear button if has query */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: tokens.textSecondary }}
              className="p-2 hover:opacity-80 cursor-pointer ms-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('home.clearSearch')}
            >
              <X size={17} />
            </button>
          )}

          {/* Mic Icon */}
          <button
            type="button"
            onClick={handleMicClick}
            aria-label={t('home.voiceSearch')}
            title={t('home.voiceSearch')}
            style={{ color: tokens.coolBlueAccent }}
            className={`pe-3 ps-2 py-2 hover:opacity-80 transition-colors cursor-pointer flex items-center min-h-[44px] min-w-[44px] justify-center ${
              isMicActive ? 'animate-pulse' : ''
            }`}
          >
            <div
              style={{
                backgroundColor: isMicActive ? 'rgba(127, 209, 174, 0.3)' : 'transparent',
              }}
              className="p-1.5 rounded-full"
            >
              <Mic size={18} strokeWidth={2.2} />
            </div>
          </button>
        </div>

        {/* Global Search Results Popup */}
        {searchQuery.trim() !== '' && (
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="absolute top-full mt-2 inset-x-0 z-40 rounded-2xl border shadow-2xl max-h-96 overflow-y-auto divide-y animate-in fade-in slide-in-from-top-2"
          >
            {/* Header + Scope Toggle ("الكل | أساطير | حضارات") */}
            <div
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.borderSubtle,
                color: tokens.deepAccent,
              }}
              className="p-3 border-b space-y-2.5"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span>
                  {searchScope === 'all' && t('home.resultsCount', { count: searchResults.length + searchCivResults.length })}
                  {searchScope === 'myths' && t('home.mythsCount', { count: searchResults.length })}
                  {searchScope === 'civs' && t('home.civsCount', { count: searchCivResults.length })}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ color: tokens.textSecondary }}
                  className="text-[11px] hover:underline cursor-pointer"
                >
                  {t('home.closeSearch')}
                </button>
              </div>

              {/* Scope toggle buttons */}
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                }}
                className="flex items-center rounded-xl p-0.5 border text-xs"
                role="group"
                aria-label={t('home.searchFilterAria')}
              >
                <button
                  type="button"
                  onClick={() => setSearchScope('all')}
                  style={{
                    backgroundColor: searchScope === 'all' ? tokens.deepAccent : 'transparent',
                    color: searchScope === 'all' ? (isDark ? '#0B2420' : '#FFFFFF') : tokens.textSecondary,
                  }}
                  className="flex-1 py-2 rounded-lg font-bold text-center transition-all cursor-pointer min-h-[44px]"
                >
                  {t('home.scopeAll')}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchScope('myths')}
                  style={{
                    backgroundColor: searchScope === 'myths' ? tokens.deepAccent : 'transparent',
                    color: searchScope === 'myths' ? (isDark ? '#0B2420' : '#FFFFFF') : tokens.textSecondary,
                  }}
                  className="flex-1 py-2 rounded-lg font-bold text-center transition-all cursor-pointer min-h-[44px]"
                >
                  {t('home.scopeMyths')}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchScope('civs')}
                  style={{
                    backgroundColor: searchScope === 'civs' ? tokens.deepAccent : 'transparent',
                    color: searchScope === 'civs' ? (isDark ? '#0B2420' : '#FFFFFF') : tokens.textSecondary,
                  }}
                  className="flex-1 py-2 rounded-lg font-bold text-center transition-all cursor-pointer min-h-[44px]"
                >
                  {t('home.scopeCivs')}
                </button>
              </div>
            </div>

            {/* Results Content */}
            {searchResults.length === 0 && searchCivResults.length === 0 ? (
              <div className="p-5 text-center space-y-1">
                <p style={{ color: tokens.textPrimary }} className="text-xs font-bold">
                  {t('home.noResults', { query: searchQuery })}
                </p>
                <p style={{ color: tokens.textSecondary }} className="text-[11px]">
                  {t('home.noResultsHint')}
                </p>
              </div>
            ) : (
              <>
                {/* 1. Civilization results: show name + era + region and open CivilizationPage */}
                {searchCivResults.map(({ civ, snippet }) => (
                  <div
                    key={`civ-${civ.id}`}
                    onClick={() => {
                      setSearchQuery('');
                      if (onSelectCivilization) {
                        onSelectCivilization(civ.id);
                      }
                    }}
                    style={{
                      borderColor: tokens.borderSubtle,
                      backgroundColor: isDark ? 'rgba(127, 209, 174, 0.05)' : 'rgba(230, 248, 240, 0.3)',
                    }}
                    className="p-3.5 hover:opacity-90 transition-colors cursor-pointer flex items-center justify-between gap-3 text-start group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          style={{ color: tokens.deepAccent }}
                          className="font-bold text-base font-['Aref_Ruqaa',serif] group-hover:underline"
                        >
                          {renderHighlighted(civ?.name ?? '', searchQuery)}
                        </span>
                        <span
                          style={{
                            color: isDark ? '#7FD1AE' : '#0B5545',
                            backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : '#D0F3E4',
                            borderColor: isDark ? 'rgba(127, 209, 174, 0.4)' : '#A7E5C8',
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md font-bold border inline-flex items-center gap-1"
                        >
                          <Landmark size={10} />
                          <span>{t('home.civilizationBadge')}</span>
                        </span>
                        <span
                          style={{
                            color: tokens.coolBlueAccent,
                            backgroundColor: tokens.coolBlueTint,
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                        >
                          {civ.era || t('common.undated')}
                        </span>
                      </div>

                      <div
                        style={{ color: tokens.textSecondary }}
                        className="flex items-center gap-1.5 text-xs font-['Cairo',sans-serif] mb-1"
                      >
                        <MapPin size={11} className="shrink-0 opacity-70" />
                        <span>{civ.region ?? ''}</span>
                      </div>

                      {snippet && (
                        <p
                          style={{ color: tokens.textSecondary }}
                          className="text-xs line-clamp-1 leading-relaxed opacity-90"
                        >
                          {renderHighlighted(snippet, searchQuery)}
                        </p>
                      )}
                    </div>

                    <div
                      style={{ color: tokens.deepAccent }}
                      className={`${dir === 'ltr' ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'} transition-transform shrink-0 p-1`}
                    >
                      <ChevronLeft size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
                    </div>
                  </div>
                ))}

                {/* 2. Myth entries results */}
                {searchResults.map(({ entry, matchedField, snippet }) => {
                  const isLocked = Boolean(entry.isPremium) && !effectivePremium;
                  return (
                    <div
                      key={`myth-${entry.id}`}
                      onClick={() => {
                        setSearchQuery('');
                        onSelectEntry(entry);
                      }}
                      style={{ borderColor: tokens.borderSubtle }}
                      className="p-3.5 hover:opacity-90 transition-colors cursor-pointer flex items-center justify-between gap-3 text-start"
                    >
                      <div
                        style={{
                          backgroundColor: tokens.surface,
                          borderColor: tokens.borderSubtle,
                        }}
                        className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border"
                      >
                        <LockedHeroImage
                          src={entry.heroImage}
                          alt={entry.name}
                          isLocked={isLocked}
                          compact
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            style={{ color: tokens.textPrimary }}
                            className="font-bold text-sm font-['Aref_Ruqaa',serif]"
                          >
                            {renderHighlighted(entry?.name ?? '', searchQuery)}
                          </span>
                          {entry.isPremium && <PremiumPill />}
                          <span
                            style={{
                              color: tokens.deepAccent,
                              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(127, 209, 174, 0.25)',
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold"
                          >
                            {entry.typeLabel}
                          </span>
                          <span
                            style={{
                              color: tokens.textSecondary,
                              backgroundColor: tokens.coolBlueTint,
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded-md font-mono"
                          >
                            {getMatchedFieldLabel(matchedField)}
                          </span>
                          <span
                            style={{
                              color: tokens.deepAccent,
                              backgroundColor: tokens.surface,
                            }}
                            className="text-[10px] px-1.5 py-0.5 rounded-md font-mono border"
                          >
                            {formatReadingTime(getEstimatedReadingTime(entry), lang)}
                          </span>
                        </div>

                        <p
                          style={{ color: tokens.textSecondary }}
                          className="text-xs line-clamp-1 leading-relaxed"
                        >
                          {renderHighlighted(snippet || entry.summary, searchQuery)}
                        </p>
                      </div>

                      <ChevronLeft
                        size={16}
                        style={{ color: tokens.coolBlueAccent }}
                        className={`shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`}
                      />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Section "التصنيفات": 2x2 + 1 grid of category tiles */}
      <div>
        <SectionTitle
          title={t('home.categories')}
          subtitle={t('home.categoriesSub')}
        />

        <div className="grid grid-cols-2 gap-3 mt-3">
          {/* Tile 1: creatures */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('creatures')}
            style={{
              backgroundColor: tokens.coolBlueTint,
              borderColor: isDark ? 'rgba(127, 178, 232, 0.35)' : 'rgba(74, 144, 217, 0.3)',
            }}
            className="p-3.5 rounded-[18px] border text-start flex flex-col justify-between gap-2.5 min-h-[124px] hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: tokens.coolBlueAccent,
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Sparkles size={20} strokeWidth={1.8} />
              </div>
              <span
                style={{
                  color: tokens.coolBlueAccent,
                  backgroundColor: tokens.card,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('cat.creaturesCount', { count: getEntriesByCategory('creatures').length })}
              </span>
            </div>
            <div>
              <span
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.creatures')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {t('cat.creaturesSub')}
              </span>
            </div>
          </button>

          {/* Tile 2: gods */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('gods')}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.border,
            }}
            className="p-3.5 rounded-[18px] border text-start flex flex-col justify-between gap-2.5 min-h-[124px] hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: tokens.deepAccent,
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Crown size={20} strokeWidth={1.8} />
              </div>
              <span
                style={{
                  color: tokens.deepAccent,
                  backgroundColor: tokens.card,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('cat.godsCount', { count: getEntriesByCategory('gods').length })}
              </span>
            </div>
            <div>
              <span
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.gods')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {t('cat.godsSub')}
              </span>
            </div>
          </button>

          {/* Tile 3: artifacts/rituals */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('rituals')}
            style={{
              backgroundColor: isDark ? 'rgba(159, 232, 204, 0.12)' : 'rgba(14, 92, 77, 0.07)',
              borderColor: tokens.border,
            }}
            className="p-3.5 rounded-[18px] border text-start flex flex-col justify-between gap-2.5 min-h-[124px] hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: tokens.deepAccent,
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Flame size={20} strokeWidth={1.8} />
              </div>
              <span
                style={{
                  color: tokens.deepAccent,
                  backgroundColor: tokens.card,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('cat.ritualsCount', { count: getEntriesByCategory('rituals').length })}
              </span>
            </div>
            <div>
              <span
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.rituals')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {t('cat.ritualsSub')}
              </span>
            </div>
          </button>

          {/* Tile 4: places */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('places')}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="p-3.5 rounded-[18px] border text-start flex flex-col justify-between gap-2.5 min-h-[124px] hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.border,
                  color: tokens.deepAccent,
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Landmark size={20} strokeWidth={1.8} />
              </div>
              <span
                style={{
                  color: tokens.deepAccent,
                  backgroundColor: tokens.surface,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('cat.placesCount', { count: getEntriesByCategory('places').length })}
              </span>
            </div>
            <div>
              <span
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.places')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {t('cat.placesSub')}
              </span>
            </div>
          </button>

          {/* Tile 5: personalities */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('personalities')}
            style={{
              backgroundColor: tokens.coolBlueTint,
              borderColor: isDark ? 'rgba(127, 178, 232, 0.35)' : 'rgba(74, 144, 217, 0.3)',
            }}
            className="p-3.5 rounded-[18px] border text-start flex flex-col justify-between gap-2.5 min-h-[124px] hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: tokens.coolBlueAccent,
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Users size={20} strokeWidth={1.8} />
              </div>
              <span
                style={{
                  color: tokens.coolBlueAccent,
                  backgroundColor: tokens.card,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('cat.personalitiesCount', { count: getEntriesByCategory('personalities').length })}
              </span>
            </div>
            <div>
              <span
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.personalities')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {t('cat.personalitiesSub')}
              </span>
            </div>
          </button>

          {/* Tile 6: sa3aleek */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('sa3aleek')}
            style={{
              backgroundColor: isDark ? tokens.surface : '#F2FBF7',
              borderColor: isDark ? tokens.border : 'rgba(23, 135, 123, 0.25)',
            }}
            className="p-3.5 rounded-[18px] border text-start flex flex-col justify-between gap-2.5 min-h-[124px] hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: isDark ? tokens.deepAccent : '#17877B',
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <RunnerIcon size={20} />
              </div>
              <span
                style={{
                  color: isDark ? tokens.deepAccent : '#17877B',
                  backgroundColor: tokens.card,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('cat.sa3aleekCount', { count: getEntriesByCategory('sa3aleek').length })}
              </span>
            </div>
            <div>
              <span
                style={{ color: isDark ? tokens.textPrimary : '#0E5C4D' }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.sa3aleek')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {t('cat.sa3aleekSub')}
              </span>
            </div>
          </button>

          {/* Tile 7: kings */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('kings')}
            style={{
              backgroundColor: isDark ? tokens.coolBlueTint : '#E8F1FB',
              borderColor: isDark ? 'rgba(127, 178, 232, 0.35)' : 'rgba(74, 144, 217, 0.3)',
            }}
            className="p-3.5 rounded-[18px] border text-start flex flex-col justify-between gap-2.5 min-h-[124px] hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: isDark ? tokens.coolBlueAccent : '#4A90D9',
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Crown size={20} strokeWidth={1.8} />
              </div>
              <span
                style={{
                  color: isDark ? tokens.coolBlueAccent : '#4A90D9',
                  backgroundColor: tokens.card,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('cat.kingsCount', { count: getEntriesByCategory('kings').length })}
              </span>
            </div>
            <div>
              <span
                style={{ color: isDark ? tokens.textPrimary : '#0E5C4D' }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.kings')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {t('cat.kingsSub')}
              </span>
            </div>
          </button>

          {/* Tile 8: seers */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('seers')}
            style={{
              backgroundColor: isDark ? 'rgba(236, 231, 248, 0.14)' : '#ECE7F8',
              borderColor: isDark ? 'rgba(236, 231, 248, 0.35)' : 'rgba(150, 120, 220, 0.28)',
            }}
            className="p-3.5 rounded-[18px] border text-start flex flex-col justify-between gap-2.5 min-h-[124px] hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group col-span-1"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: '#6D28D9',
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <CrystalBallIcon size={20} />
              </div>
              <span
                style={{
                  color: '#6D28D9',
                  backgroundColor: tokens.card,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('cat.seersCount', { count: getEntriesByCategory('seers').length })}
              </span>
            </div>
            <div>
              <span
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.seers')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {t('cat.seersSub')}
              </span>
            </div>
          </button>

          {/* Tile 9: الطبقات والأكوان (Kitab al-Azama) */}
          <button
            type="button"
            data-testid="home-azama-tile"
            onClick={() => onOpenAzama?.()}
            style={{
              backgroundColor: isDark ? tokens.coolBlueTint : '#E8F1FB',
              borderColor: isDark ? 'rgba(127, 178, 232, 0.35)' : 'rgba(74, 144, 217, 0.35)',
            }}
            className="p-3.5 rounded-[18px] border text-start flex flex-col justify-between gap-2.5 min-h-[124px] hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group col-span-2"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: '#4A90D9',
                  color: '#FFFFFF',
                }}
                className="w-9 h-9 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs"
              >
                <Orbit size={20} strokeWidth={1.8} />
              </div>
              <span
                data-testid="home-azama-count"
                style={{
                  backgroundColor: '#4A90D9',
                  color: '#FFFFFF',
                }}
                className="text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono shadow-2xs"
              >
                {t('azama.tileCount', { count: azamaCount })}
              </span>
            </div>
            <div>
              <span
                style={{ color: isDark ? tokens.textPrimary : '#0E5C4D' }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('azama.tileTitle')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {t('azama.tileSubtitle')}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Hero banner "أسطورة اليوم" */}
      {anqaEntry && (
      <div className="relative">
        {/* Dark mode only: subtle CSS twinkling stars behind the Home hero banner */}
        {isDark && (
          <div className="absolute -inset-2.5 pointer-events-none overflow-hidden rounded-[26px] z-0">
            <div className="hero-twinkling-star top-2 right-8 w-1.5 h-1.5" style={{ animationDuration: '2.8s', animationDelay: '0.2s', backgroundColor: tokens.primaryMint }} />
            <div className="hero-twinkling-star top-6 right-24 w-1 h-1" style={{ animationDuration: '3.4s', animationDelay: '0.8s', backgroundColor: '#FFFFFF' }} />
            <div className="hero-twinkling-star top-12 right-1/3 w-1.5 h-1.5" style={{ animationDuration: '4.1s', animationDelay: '1.2s', backgroundColor: '#E8F1FB' }} />
            <div className="hero-twinkling-star top-4 left-14 w-1 h-1" style={{ animationDuration: '2.5s', animationDelay: '0.5s', backgroundColor: '#7FD1AE' }} />
            <div className="hero-twinkling-star top-10 left-32 w-1.5 h-1.5" style={{ animationDuration: '3.8s', animationDelay: '1.7s', backgroundColor: '#4A90D9' }} />
            <div className="hero-twinkling-star top-14 left-1/4 w-1 h-1" style={{ animationDuration: '3.1s', animationDelay: '0.9s', backgroundColor: '#ECE7F8' }} />
            <div className="hero-twinkling-star bottom-4 right-1/4 w-1 h-1" style={{ animationDuration: '4.5s', animationDelay: '2.1s', backgroundColor: '#FFFFFF' }} />
            <div className="hero-twinkling-star bottom-6 left-10 w-1.5 h-1.5" style={{ animationDuration: '3.6s', animationDelay: '1.4s', backgroundColor: '#7FD1AE' }} />
          </div>
        )}

        <div
          onClick={() => onSelectEntry(anqaEntry)}
          style={{ borderColor: tokens.border }}
          className="relative z-10 rounded-[22px] overflow-hidden shadow-md border cursor-pointer group transition-all duration-300"
        >
          <div className="relative h-60 sm:h-64 w-full overflow-hidden bg-black/40">
            <img
              src={anqaBannerImg}
              alt={t('home.heroAlt')}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent flex flex-col justify-end p-5 text-white">
              <span
                style={{
                  color: isDark ? tokens.background : tokens.deepAccent,
                  backgroundColor: tokens.primaryMint,
                }}
                className="inline-block self-start text-[11px] font-bold px-2.5 py-0.5 rounded-full mb-2 shadow-xs"
              >
                {t('home.mythOfDay')}
              </span>

              <h2 className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold text-white leading-tight tracking-wide drop-shadow-sm">
                {t('home.heroTitle')}
              </h2>

              <p className="text-xs text-white/90 font-['Cairo',sans-serif] mt-1.5 leading-relaxed line-clamp-2 max-w-sm">
                {anqaEntry.summary ?? ''}
              </p>

              {/* Action pill button */}
              <div className="mt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectEntry(anqaEntry);
                  }}
                  style={{
                    backgroundColor: tokens.coolBlueAccent,
                    color: isDark ? tokens.background : '#FFFFFF',
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-md transition-all duration-200 cursor-pointer min-h-[44px]"
                >
                  <span>{t('article.readStory')}</span>
                  <ChevronLeft size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
                </button>

                <span className="text-[11px] text-white/90 font-medium">
                  {formatReadingTime(getEstimatedReadingTime(anqaEntry), lang)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* 4.25. Story of the Day ("قصة اليوم"), Random Story ("قصة عشوائية"), Beings Directory, and Type/Culture/Tag Explorer */}
      <section data-testid="cross-cultural-explorer" className="space-y-3.5 pt-1">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-xl sm:text-2xl font-bold leading-tight"
            >
              {t('discover.sectionTitle')}
            </h2>
            <p style={{ color: tokens.textSecondary }} className="text-xs font-['Cairo',sans-serif] mt-0.5">
              {t('discover.sectionSub')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              data-testid="home-random-story-btn"
              onClick={handleOpenRandomStory}
              style={{
                backgroundColor: tokens.primaryMint,
                color: '#0E5C4D',
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <Shuffle size={15} />
              <span>{t('discover.randomStory')}</span>
            </button>

            <button
              type="button"
              data-testid="home-creatures-btn"
              onClick={() => onOpenCreatures?.()}
              style={{
                backgroundColor: tokens.coolBlueTint,
                borderColor: tokens.border,
                color: tokens.coolBlueAccent,
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-xs font-bold shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer min-h-[44px]"
            >
              <Sparkles size={15} />
              <span>{t('discover.openCreaturesShort')}</span>
            </button>
          </div>
        </div>

        {/* Story of the Day Card ("قصة اليوم") */}
        {storyOfDayItem && (
          <div
            data-testid="story-of-the-day-card"
            onClick={() => handleOpenCatalogStory(storyOfDayItem.id)}
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="rounded-[22px] border shadow-sm overflow-hidden cursor-pointer hover:border-[#7FD1AE] transition-all flex flex-col sm:flex-row"
          >
            <div className="relative h-40 sm:h-auto sm:w-40 shrink-0 overflow-hidden" style={{ backgroundColor: tokens.surface }}>
              <img
                src={resolveHeroImageUrl(storyOfDayItem.image)}
                alt={storyOfDayItem.title[lang] || storyOfDayItem.title.ar}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <span
                style={{
                  backgroundColor: '#4A90D9',
                  color: '#FFFFFF',
                }}
                className="absolute top-2.5 start-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs"
              >
                {t('discover.storyOfDay')}
              </span>
            </div>

            <div className="p-3.5 sm:p-4 flex-1 min-w-0 flex flex-col justify-between gap-2 text-start">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    style={{ backgroundColor: tokens.surface, color: tokens.deepAccent }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  >
                    {getTypeLabel(storyOfDayItem.type, lang)}
                  </span>
                  <span
                    style={{ backgroundColor: tokens.coolBlueTint, color: tokens.coolBlueAccent }}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                  >
                    <Globe2 size={10} />
                    <span>{getCultureLabel(storyOfDayItem.culture, lang)}</span>
                  </span>
                </div>
                <h3 style={{ color: tokens.deepAccent }} className="font-['Aref_Ruqaa',serif] text-lg sm:text-xl font-bold leading-snug">
                  {storyOfDayItem.title[lang] || storyOfDayItem.title.ar}
                </h3>
                <p style={{ color: tokens.textSecondary }} className="text-xs font-['Cairo',sans-serif] line-clamp-2 leading-relaxed">
                  {storyOfDayItem.summary[lang] || storyOfDayItem.summary.ar}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {storyOfDayItem.tags.slice(0, 3).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTag?.(tag);
                      }}
                      style={{
                        backgroundColor: tokens.surface,
                        borderColor: tokens.border,
                        color: tokens.deepAccent,
                      }}
                      className="px-2.5 py-0.5 rounded-full border text-[10px] font-bold cursor-pointer hover:opacity-80"
                    >
                      #{getTagLabel(tag, lang)}
                    </button>
                  ))}
                </div>
                <span style={{ color: tokens.coolBlueAccent }} className="text-xs font-bold inline-flex items-center gap-1">
                  <span>{t('article.readStory')}</span>
                  <ChevronLeft size={14} className={dir === 'ltr' ? 'rotate-180' : ''} />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter Controls: Type Chips + Culture/Tag Selectors */}
        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="p-3.5 rounded-[20px] border shadow-2xs space-y-2.5"
        >
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(['all', 'story', 'myth', 'cosmology', 'folklore'] as const).map((tp) => {
              const active = explorerType === tp;
              return (
                <button
                  key={tp}
                  type="button"
                  data-testid={`home-filter-type-${tp}`}
                  onClick={() => setExplorerType(tp)}
                  style={{
                    backgroundColor: active ? tokens.deepAccent : tokens.surface,
                    color: active ? (isDark ? '#0B2420' : '#FFFFFF') : tokens.textPrimary,
                    borderColor: active ? tokens.deepAccent : tokens.borderSubtle,
                  }}
                  className="shrink-0 px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer min-h-[36px] transition-all"
                >
                  {t(`contentTypes.${tp}`)}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Culture Filter */}
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs" style={{ borderColor: tokens.borderSubtle, backgroundColor: tokens.surface }}>
              <Globe2 size={14} style={{ color: tokens.coolBlueAccent }} className="shrink-0" />
              <span style={{ color: tokens.textSecondary }} className="font-bold shrink-0">
                {t('discover.filterCulture')}:
              </span>
              <select
                data-testid="home-filter-culture"
                value={explorerCulture}
                onChange={(e) => setExplorerCulture(e.target.value)}
                style={{ color: tokens.textPrimary }}
                className="flex-1 bg-transparent font-bold outline-none cursor-pointer min-w-0"
                aria-label={t('discover.filterCulture')}
              >
                <option value="all">{t('discover.allCultures')}</option>
                {availableCultures.map((c) => (
                  <option key={c} value={c}>
                    {getCultureLabel(c, lang)}
                  </option>
                ))}
              </select>
            </label>

            {/* Tag Filter */}
            <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs" style={{ borderColor: tokens.borderSubtle, backgroundColor: tokens.surface }}>
              <Filter size={14} style={{ color: tokens.deepAccent }} className="shrink-0" />
              <span style={{ color: tokens.textSecondary }} className="font-bold shrink-0">
                {t('discover.filterTag')}:
              </span>
              <select
                data-testid="home-filter-tag"
                value={explorerTag}
                onChange={(e) => setExplorerTag(e.target.value)}
                style={{ color: tokens.textPrimary }}
                className="flex-1 bg-transparent font-bold outline-none cursor-pointer min-w-0"
                aria-label={t('discover.filterTag')}
              >
                <option value="all">{t('discover.allTags')}</option>
                {availableTags.map((tg) => (
                  <option key={tg} value={tg}>
                    {getTagLabel(tg, lang)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {/* Filtered Content Preview Cards (always shows matching public-domain + filtered catalog stories) */}
        {filteredCatalog.length === 0 ? (
          <Card variant="white" className="p-5 text-center rounded-2xl">
            <p style={{ color: tokens.textSecondary }} className="text-xs font-bold">
              {t('discover.empty')}
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {filteredCatalog.slice(0, 6).map((item) => (
              <div
                key={item.id}
                data-testid={`explorer-card-${item.id}`}
                onClick={() => handleOpenCatalogStory(item.id)}
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                }}
                className="p-3 rounded-[18px] border shadow-2xs flex items-center gap-3 cursor-pointer hover:border-[#7FD1AE] transition-all text-start"
              >
                <img
                  src={resolveHeroImageUrl(item.image)}
                  alt={item.title[lang] || item.title.ar}
                  className="w-14 h-14 rounded-xl object-cover shrink-0 border"
                  style={{ borderColor: tokens.borderSubtle }}
                  loading="lazy"
                />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span style={{ color: tokens.textPrimary }} className="font-['Aref_Ruqaa',serif] text-base font-bold truncate">
                      {item.title[lang] || item.title.ar}
                    </span>
                    <span
                      style={{ backgroundColor: tokens.coolBlueTint, color: tokens.coolBlueAccent }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                      {getTypeLabel(item.type, lang)}
                    </span>
                    <span
                      style={{ backgroundColor: tokens.surface, color: tokens.deepAccent }}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    >
                      {getCultureLabel(item.culture, lang)}
                    </span>
                  </div>
                  <p style={{ color: tokens.textSecondary }} className="text-xs line-clamp-1">
                    {item.summary[lang] || item.summary.ar}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.tags.slice(0, 2).map((tg) => (
                      <button
                        key={tg}
                        type="button"
                        data-testid={`explorer-tag-${item.id}-${tg}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTag?.(tg);
                        }}
                        style={{
                          backgroundColor: tokens.surface,
                          borderColor: tokens.borderSubtle,
                          color: tokens.deepAccent,
                        }}
                        className="px-2 py-0.5 rounded-full border text-[10px] font-bold cursor-pointer hover:opacity-80"
                      >
                        #{getTagLabel(tg, lang)}
                      </button>
                    ))}
                  </div>
                </div>
                <ChevronLeft size={16} style={{ color: tokens.deepAccent }} className={dir === 'ltr' ? 'rotate-180 shrink-0' : 'shrink-0'} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4.5. Section "أقوامٌ وحضارات" (Horizontal scroll of civilization cards) */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h2
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-xl sm:text-2xl font-bold leading-tight"
            >
              {t('home.civilizations')}
            </h2>
            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs font-['Cairo',sans-serif] mt-0.5"
            >
              {t('home.civilizationsSub')}
            </p>
          </div>
          {onExploreCivilizations && (
            <button
              type="button"
              onClick={onExploreCivilizations}
              style={{ color: tokens.deepAccent }}
              className="text-xs font-bold hover:underline flex items-center gap-0.5 cursor-pointer min-h-[44px] px-1"
            >
              <span>{t('home.showAll')}</span>
              <ChevronLeft size={14} className={dir === 'ltr' ? 'rotate-180' : ''} />
            </button>
          )}
        </div>

        {allCivilizations.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-1 px-1 snap-x">
            {allCivilizations.map((civ) => {
              const civImg = getCivImageUrl(civ.id);
              return (
                <Card
                  key={civ.id}
                  variant="white"
                  elevation="subtle"
                  interactive
                  onClick={() => onSelectCivilization && onSelectCivilization(civ.id)}
                  className="shrink-0 w-64 rounded-2xl cursor-pointer hover:border-[#7FD1AE] transition-all snap-start border flex flex-col justify-between overflow-hidden group"
                >
                  {civImg && (
                    <div className="relative h-28 w-full overflow-hidden border-b border-black/5">
                      <img
                        src={civImg}
                        alt={civ.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-2 start-2">
                        <span
                          style={{
                            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.4)' : 'rgba(232, 241, 251, 0.95)',
                            color: isDark ? '#A7E5C8' : '#1F5896',
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-xs"
                        >
                          <Calendar size={10} />
                          <span>{civ.era || t('common.undated')}</span>
                        </span>
                      </div>
                      <div className="absolute bottom-2 inset-x-2.5 flex items-center justify-between text-white text-xs">
                        <span className="font-['Aref_Ruqaa',serif] text-base font-bold drop-shadow-sm">
                          {civ.name ?? ''}
                        </span>
                        <span className="text-[10px] opacity-90">
                          {t('home.citiesCount', { count: (Array.isArray(civ.cities) ? civ.cities : []).length })}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    {!civImg && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            style={{
                              backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : '#E8F1FB',
                              color: isDark ? '#7FD1AE' : '#2A69AC',
                              borderColor: isDark ? 'rgba(74, 144, 217, 0.4)' : '#CFE2F7',
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border"
                          >
                            <Calendar size={10} />
                            <span>{civ.era || t('common.undated')}</span>
                          </span>

                          <span
                            style={{ color: tokens.textSecondary }}
                            className="text-[10px] font-medium"
                          >
                            {t('home.citiesCount', { count: (Array.isArray(civ.cities) ? civ.cities : []).length })}
                          </span>
                        </div>

                        <h3
                          style={{ color: tokens.deepAccent }}
                          className="font-['Aref_Ruqaa',serif] text-lg font-bold"
                        >
                          {civ.name ?? ''}
                        </h3>
                      </div>
                    )}

                    <div
                      style={{ color: tokens.textSecondary }}
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <MapPin size={11} className="shrink-0 opacity-70" />
                      <span className="truncate">{civ.region ?? ''}</span>
                    </div>

                    <div
                      style={{ color: tokens.coolBlueAccent }}
                      className="pt-2 border-t flex items-center justify-between text-xs font-bold"
                    >
                      <span>{t('home.exploreCiv')}</span>
                      <ChevronLeft
                        size={14}
                        className={`transition-transform ${dir === 'ltr' ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card
            variant="white"
            elevation="subtle"
            className="p-4 sm:p-5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer hover:border-[#7FD1AE] transition-all"
            onClick={onExploreCivilizations}
          >
            <div className="space-y-1">
              <h3 style={{ color: tokens.deepAccent }} className="font-['Aref_Ruqaa',serif] text-base font-bold">
                {t('home.civilizations')}
              </h3>
              <p style={{ color: tokens.textSecondary }} className="text-xs">
                {t('home.civilizationsSub')}
              </p>
            </div>
            <div
              style={{
                backgroundColor: tokens.surface,
                borderColor: tokens.border,
                color: tokens.deepAccent,
              }}
              className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
            >
              <Landmark size={20} />
            </div>
          </Card>
        )}
      </section>

      {/* 5. Section "الأكثر قراءة" */}
      <div>
        <SectionTitle
          title={t('home.mostRead')}
          subtitle={t('home.mostReadSub')}
          action={
            <button
              type="button"
              onClick={() => setShowAllMostRead((v) => !v)}
              style={{ color: tokens.deepAccent }}
              className="text-xs font-bold hover:underline flex items-center gap-0.5 cursor-pointer min-h-[44px] px-1"
            >
              <span>{showAllMostRead ? t('home.showLess') : t('home.showAll')}</span>
              <ChevronLeft size={14} className={dir === 'ltr' ? 'rotate-180' : ''} />
            </button>
          }
        />

        <div className="mt-3 space-y-2.5">
          {mostReadEntries.map((entry) => {
            const isLocked = Boolean(entry.isPremium) && !effectivePremium;
            return (
              <Card
                key={entry.id}
                variant="white"
                elevation="subtle"
                interactive
                className="p-3 sm:p-3.5 flex items-center justify-between gap-3 group min-h-[72px]"
                onClick={() => onSelectEntry(entry)}
              >
                {/* Thumbnail */}
                <div
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.borderSubtle,
                  }}
                  className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border"
                >
                  <LockedHeroImage
                    src={resolveHeroImageUrl(entry.heroImage)}
                    alt={entry.name}
                    isLocked={isLocked}
                    compact
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Center: title & subtitle */}
                <div className="flex-1 min-w-0 text-start">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3
                      style={{ color: tokens.textPrimary }}
                      className="font-['Aref_Ruqaa',serif] text-base font-bold transition-colors truncate"
                    >
                      {entry.name ?? ''}
                    </h3>
                    {entry.isPremium && <PremiumPill />}
                  </div>
                  <p
                    style={{ color: tokens.textSecondary }}
                    className="text-xs font-['Cairo',sans-serif] mt-0.5 line-clamp-1 leading-relaxed"
                  >
                    {entry.summary ?? ''}
                  </p>
                  <span
                    style={{ color: tokens.deepAccent }}
                    className="text-[10px] font-medium mt-1 block"
                  >
                    {entry.region ?? ''}
                  </span>
                </div>

                {/* End side: Tag pill & reading time */}
                <div className="shrink-0 flex flex-col items-end gap-1.5">
                  {entry.tags?.[0] && (
                    <Tag variant={getTagVariant(entry.tags[0])} size="sm">
                      {localizeTag(entry.tags[0], lang)}
                    </Tag>
                  )}
                  <span
                    style={{ color: tokens.textSecondary }}
                    className="text-[10px] font-mono font-medium"
                  >
                    {formatReadingTime(getEstimatedReadingTime(entry), lang)}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Floating Action Button: فاجئني */}
      <SurpriseMeButton onSelectEntry={(entry) => onSelectEntry(entry)} />
    </div>
  );
};

export default HomeScreen;
