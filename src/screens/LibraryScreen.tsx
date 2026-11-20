/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Library Screen v2 (المكتبة)
 * Upgraded long-form reading library:
 * - Sort menu: الأحدث / الأكثر قراءة / أبجدي
 * - View toggle: grid / list (persisted in local storage)
 * - Reading-status filter chips: لم أقرأ / أقرأ الآن / انتهيت
 * - Unified all-entries list with "حكاية كاملة" badges & search
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  BookOpen,
  ChevronLeft,
  Sparkles,
  LayoutGrid,
  List,
  ArrowUpDown,
  CheckCircle2,
  Clock,
  BookMarked,
  Wand2,
  Bookmark,
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { StudioScreen } from './StudioScreen';
import { MythEntry } from '../data/types';
import { getAllEntries } from '../data/seed';
import { LONG_FORM_ENTRIES, toLibraryMythEntry } from '../data/longForm';
import { CONTENT_CATALOG } from '../content/catalog';
import type { ContentType } from '../content/catalogTypes';
import { hasDeepStory } from '../data/storyTypes';
import { getEstimatedReadingTime, formatReadingTime } from '../utils/readingTime';
import { normalizeArabic } from '../utils/arabicSearch';
import { useTheme } from '../theme/ThemeContext';
import { storage } from '../data/storage';
import {
  SortOption,
  ReadingStatusFilter,
  ViewMode,
  sortMyths,
  filterMythsByReadingStatus,
  getReadingStatus,
} from '../utils/libraryAndProfile';
import { SurpriseMeButton } from '../components/primitives/SurpriseMeButton';
import { LockedHeroImage, PremiumPill } from '../components/primitives/LockedMediaBadges';
import { useDebounce } from '../hooks/useDebounce';
import { useI18n } from '../i18n/i18n';
import { getLocalizedEntry } from '../content';
export interface LibraryScreenProps {
  onSelectEntry: (entry: MythEntry) => void;
  savedIds?: string[];
  historyIds?: string[];
  onToggleSave?: (id: string, e?: React.MouseEvent) => void;
  onClearHistory?: () => void;
  onExploreClick?: () => void;
  isPremiumActive?: boolean;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  onSelectEntry,
  savedIds,
  historyIds,
  isPremiumActive,
}) => {
  const { t, lang, dir } = useI18n();
  const { tokens, isDark } = useTheme();
  const effectivePremium = isPremiumActive ?? storage.hasPremiumMonthly();

  // Segmented control: 'myths' | 'studio'
  const [activeSegment, setActiveSegment] = useState<'myths' | 'studio'>('myths');

  // Search query (raw input for instant responsive UI + 300ms debounced for filtering)
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Pagination state (show 20, load more on scroll)
  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);

  // Persisted view mode: 'grid' | 'list'
  const [viewMode, setViewModeState] = useState<ViewMode>(() =>
    storage.getLibraryViewMode()
  );

  // Sorting state: 'latest' | 'mostRead' | 'alphabetical'
  const [sortBy, setSortBy] = useState<SortOption>('latest');

  // Reading status filter: 'all' | 'unread' | 'reading' | 'completed'
  const [statusFilter, setStatusFilter] = useState<ReadingStatusFilter>('all');

  // Favorites filter & content type filter
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [contentTypeFilter, setContentTypeFilter] = useState<ContentType | 'all'>('all');

  // Local reading progress map
  const [progressMap, setProgressMap] = useState<Record<string, number>>(() =>
    storage.getAllMythProgress()
  );

  // Sync progress on component mount, navigation state changes, and window focus
  useEffect(() => {
    const syncProgress = () => setProgressMap(storage.getAllMythProgress());
    syncProgress();
    window.addEventListener('focus', syncProgress);
    window.addEventListener('storage', syncProgress);
    return () => {
      window.removeEventListener('focus', syncProgress);
      window.removeEventListener('storage', syncProgress);
    };
  }, [savedIds, historyIds]);

  // Update view mode with storage persistence
  const handleToggleViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    storage.setLibraryViewMode(mode);
  };

  // All raw entries merged from seed.ts (including 5 public-domain stories) & long-form entries
  const rawAllMyths = useMemo(() => {
    const base = getAllEntries();
    const seen = new Set(base.map((m) => m?.id).filter((id): id is string => Boolean(id)));
    const longFormExtras = (Array.isArray(LONG_FORM_ENTRIES) ? LONG_FORM_ENTRIES : [])
      .filter((lf) => lf?.id && !seen.has(lf.id))
      .map(toLibraryMythEntry);
    return [...base.filter(Boolean), ...longFormExtras];
  }, []);

  const contentTypeById = useMemo(() => {
    const map = new Map<string, ContentType>();
    for (const item of CONTENT_CATALOG) {
      map.set(item.id, item.type);
    }
    return map;
  }, []);

  const rawById = useMemo(() => {
    const map = new Map<string, MythEntry>();
    rawAllMyths.forEach((m) => {
      if (m?.id) map.set(m.id, m);
    });
    return map;
  }, [rawAllMyths]);

  // Localized entries for display
  const allMyths = useMemo(() => {
    return rawAllMyths.map((m) => getLocalizedEntry(m, lang));
  }, [rawAllMyths, lang]);

  // Calculate counts for each reading status
  const statusCounts = useMemo(() => {
    let unread = 0;
    let reading = 0;
    let completed = 0;

    for (const m of allMyths) {
      if (!m?.id) continue;
      const st = getReadingStatus(m.id, progressMap);
      if (st === 'reading') reading++;
      else if (st === 'completed') completed++;
      else unread++;
    }

    return { all: allMyths.length, unread, reading, completed };
  }, [allMyths, progressMap]);

  // Search filtering across both localized & raw Arabic fields
  const searchFilteredMyths = useMemo(() => {
    const q = debouncedSearchQuery.trim();
    if (!q) return allMyths;
    const normQ = normalizeArabic(q);
    const lowerQ = q.toLowerCase();
    return allMyths.filter((entry) => {
      if (!entry) return false;
      const raw = rawById.get(entry.id);
      const normName = normalizeArabic(entry.name ?? '');
      const normSummary = normalizeArabic(entry.summary ?? '');
      const latin = (entry.latinName ?? '').toLowerCase();
      const tags = (Array.isArray(entry.tags) ? entry.tags : []).map((tg) => normalizeArabic(tg));
      const normRegion = normalizeArabic(entry.region ?? '');
      const rawText = raw
        ? normalizeArabic(`${raw.name ?? ''} ${raw.summary ?? ''} ${raw.region ?? ''} ${(Array.isArray(raw.tags) ? raw.tags : []).join(' ')}`)
        : '';
      return (
        normName.includes(normQ) ||
        normSummary.includes(normQ) ||
        normRegion.includes(normQ) ||
        latin.includes(lowerQ) ||
        tags.some((tg) => tg.includes(normQ)) ||
        rawText.includes(normQ)
      );
    });
  }, [allMyths, rawById, debouncedSearchQuery]);

  // Status + Favorites + Content Type filtering
  const statusFilteredMyths = useMemo(() => {
    let result = filterMythsByReadingStatus(searchFilteredMyths, statusFilter, progressMap);
    if (onlyFavorites) {
      const favSet = new Set(savedIds ?? []);
      result = result.filter((m) => favSet.has(m.id));
    }
    if (contentTypeFilter !== 'all') {
      result = result.filter((m) => (contentTypeById.get(m.id) ?? 'myth') === contentTypeFilter);
    }
    return result;
  }, [searchFilteredMyths, statusFilter, progressMap, onlyFavorites, savedIds, contentTypeFilter, contentTypeById]);

  // Sorting
  const finalSortedMyths = useMemo(() => {
    return sortMyths(statusFilteredMyths, sortBy, progressMap);
  }, [statusFilteredMyths, sortBy, progressMap]);

  // Reset pagination to first 20 items whenever filter/sort/search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearchQuery, statusFilter, sortBy, onlyFavorites, contentTypeFilter]);

  // Auto load next 20 items on <main> or window scroll
  useEffect(() => {
    const mainEl = document.querySelector('main');
    const handleScroll = () => {
      const mainScrolls = mainEl && mainEl.scrollHeight > mainEl.clientHeight + 2;
      const reachedBottom = mainScrolls
        ? mainEl.scrollTop + mainEl.clientHeight >= mainEl.scrollHeight - 300
        : window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 300;

      if (reachedBottom) {
        setVisibleCount((prev) => {
          if (prev >= finalSortedMyths.length) return prev;
          return Math.min(prev + PAGE_SIZE, finalSortedMyths.length);
        });
      }
    };

    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, [finalSortedMyths.length]);

  // Paginated visible slice of myths
  const pagedMyths = useMemo(() => {
    return finalSortedMyths.slice(0, visibleCount);
  }, [finalSortedMyths, visibleCount]);

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200" dir={dir}>
      {/* 1. Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold leading-tight"
          >
            {t('library.title')}
          </h2>
          <p
            style={{ color: tokens.textSecondary }}
            className="text-xs font-['Cairo',sans-serif] mt-0.5"
          >
            {t('library.subtitle', { count: allMyths.length })}
          </p>
        </div>
        <div
          style={{
            backgroundColor: tokens.surface,
            borderColor: tokens.border,
            color: tokens.deepAccent,
          }}
          className="w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs"
        >
          <BookOpen size={20} strokeWidth={1.8} />
        </div>
      </div>

      {/* Segment Selector: الأساطير | أدوات المبدع */}
      <div
        style={{
          backgroundColor: isDark ? 'rgba(18, 51, 45, 0.6)' : '#E8F1FB',
          borderColor: tokens.border,
        }}
        className="p-1 rounded-2xl flex items-center gap-1 border shadow-xs"
      >
        <button
          type="button"
          onClick={() => setActiveSegment('myths')}
          style={{
            backgroundColor: activeSegment === 'myths' ? tokens.deepAccent : 'transparent',
            color: activeSegment === 'myths'
              ? (isDark ? '#0B2420' : '#FFFFFF')
              : tokens.textSecondary,
          }}
          className="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <BookOpen size={15} />
          <span>{t('library.myths')}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSegment('studio')}
          style={{
            backgroundColor: activeSegment === 'studio' ? tokens.deepAccent : 'transparent',
            color: activeSegment === 'studio'
              ? (isDark ? '#0B2420' : '#FFFFFF')
              : tokens.textSecondary,
          }}
          className="flex-1 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Wand2 size={15} />
          <span>{t('library.creatorTools')}</span>
        </button>
      </div>

      {activeSegment === 'studio' ? (
        <div className="pt-1">
          <StudioScreen onSelectEntry={onSelectEntry} />
        </div>
      ) : (
        <>
          {/* 2. Search Bar at top */}
          <div className="relative">
            <div
              style={{
                backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="relative flex items-center border rounded-2xl shadow-xs transition-all duration-200"
        >
          <div
            style={{ color: tokens.deepAccent }}
            className="ps-3.5 pe-2"
          >
            <Search size={18} strokeWidth={2.2} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('library.searchPlaceholder')}
            style={{
              color: tokens.textPrimary,
            }}
            className="w-full py-3 pe-10 ps-1 text-sm bg-transparent outline-none font-['Cairo',sans-serif] min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: tokens.textSecondary }}
              className="absolute end-3 p-1 rounded-full hover:opacity-80 cursor-pointer"
              aria-label={t('home.clearSearch')}
            >
              <X size={16} />
            </button>
          )}
        </div>
        {searchQuery.trim() && (
          <div
            style={{ color: tokens.textSecondary }}
            className="mt-1 text-[11px] ps-2"
          >
            {t('library.resultsShown', { shown: finalSortedMyths.length, total: allMyths.length })}
          </div>
        )}
      </div>

      {/* 3. Controls Bar: Reading-status chips + Sort menu + View mode toggle */}
      <div className="space-y-2.5">
        {/* Reading Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            style={{
              backgroundColor: statusFilter === 'all'
                ? tokens.deepAccent
                : tokens.card,
              color: statusFilter === 'all'
                ? (isDark ? '#0B2420' : '#FFFFFF')
                : tokens.textSecondary,
              borderColor: statusFilter === 'all' ? tokens.deepAccent : tokens.border,
            }}
            className="shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95"
          >
            <span>{t('library.statusAll')}</span>
            <span className="text-[10px] ms-1 opacity-80">({statusCounts.all})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('unread')}
            style={{
              backgroundColor: statusFilter === 'unread'
                ? tokens.deepAccent
                : tokens.card,
              color: statusFilter === 'unread'
                ? (isDark ? '#0B2420' : '#FFFFFF')
                : tokens.textSecondary,
              borderColor: statusFilter === 'unread' ? tokens.deepAccent : tokens.border,
            }}
            className="shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95"
          >
            <span>{t('library.statusUnread')}</span>
            <span className="text-[10px] ms-1 opacity-80">({statusCounts.unread})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('reading')}
            style={{
              backgroundColor: statusFilter === 'reading'
                ? tokens.deepAccent
                : tokens.card,
              color: statusFilter === 'reading'
                ? (isDark ? '#0B2420' : '#FFFFFF')
                : tokens.textSecondary,
              borderColor: statusFilter === 'reading' ? tokens.deepAccent : tokens.border,
            }}
            className="shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95 flex items-center gap-1"
          >
            <Clock size={12} />
            <span>{t('library.statusReading')}</span>
            <span className="text-[10px] ms-1 opacity-80">({statusCounts.reading})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('completed')}
            style={{
              backgroundColor: statusFilter === 'completed'
                ? tokens.deepAccent
                : tokens.card,
              color: statusFilter === 'completed'
                ? (isDark ? '#0B2420' : '#FFFFFF')
                : tokens.textSecondary,
              borderColor: statusFilter === 'completed' ? tokens.deepAccent : tokens.border,
            }}
            className="shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95 flex items-center gap-1"
          >
            <CheckCircle2 size={12} />
            <span>{t('library.statusCompleted')}</span>
            <span className="text-[10px] ms-1 opacity-80">({statusCounts.completed})</span>
          </button>

          <button
            type="button"
            data-testid="library-favorites-filter"
            onClick={() => setOnlyFavorites((v) => !v)}
            style={{
              backgroundColor: onlyFavorites ? tokens.primaryMint : tokens.card,
              color: onlyFavorites ? '#0E5C4D' : tokens.textSecondary,
              borderColor: onlyFavorites ? tokens.primaryMint : tokens.border,
            }}
            className="shrink-0 px-3 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95 flex items-center gap-1"
          >
            <Bookmark size={12} className={onlyFavorites ? 'fill-current' : ''} />
            <span>{t('library.favoritesFilter')}</span>
            <span className="text-[10px] ms-1 opacity-80">({(savedIds ?? []).length})</span>
          </button>
        </div>

        {/* Content Type Filter Chips (الكل | قصة | أسطورة | كوسمولوجيا | فلكلور) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {(['all', 'story', 'myth', 'cosmology', 'folklore'] as const).map((tp) => {
            const active = contentTypeFilter === tp;
            return (
              <button
                key={tp}
                type="button"
                data-testid={`library-type-filter-${tp}`}
                onClick={() => setContentTypeFilter(tp)}
                style={{
                  backgroundColor: active ? tokens.coolBlueTint : tokens.card,
                  color: active ? tokens.coolBlueAccent : tokens.textSecondary,
                  borderColor: active ? tokens.coolBlueAccent : tokens.borderSubtle,
                }}
                className="shrink-0 px-3 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer min-h-[32px]"
              >
                {t(`contentTypes.${tp}`)}
              </button>
            );
          })}
        </div>

        {/* Sort & View Mode Row */}
        <div className="flex items-center justify-between gap-2 pt-0.5">
          {/* Sort Dropdown */}
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xs"
          >
            <ArrowUpDown size={14} style={{ color: tokens.deepAccent }} />
            <span style={{ color: tokens.textSecondary }} className="text-[11px] font-medium shrink-0">
              {t('library.sort')}:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                backgroundColor: 'transparent',
                color: tokens.textPrimary,
              }}
              className="text-xs font-bold focus:outline-none cursor-pointer font-['Cairo',sans-serif]"
              aria-label={t('library.sort')}
            >
              <option value="latest">{t('library.newest')}</option>
              <option value="mostRead">{t('library.mostRead')}</option>
              <option value="alphabetical">{t('library.alphabetical')}</option>
            </select>
          </div>

          {/* View Mode Toggle (Grid / List) */}
          <div
            style={{
              backgroundColor: tokens.card,
              borderColor: tokens.border,
            }}
            className="flex items-center p-0.5 rounded-xl border shadow-xs"
            role="group"
            aria-label={t('library.viewGrid')}
          >
            <button
              type="button"
              onClick={() => handleToggleViewMode('grid')}
              aria-label={t('library.viewGrid')}
              aria-pressed={viewMode === 'grid'}
              style={{
                backgroundColor: viewMode === 'grid'
                  ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.12)')
                  : 'transparent',
                color: viewMode === 'grid' ? tokens.deepAccent : tokens.textSecondary,
              }}
              className="p-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80"
              title={t('library.viewGrid')}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('list')}
              aria-label={t('library.viewList')}
              aria-pressed={viewMode === 'list'}
              style={{
                backgroundColor: viewMode === 'list'
                  ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.12)')
                  : 'transparent',
                color: viewMode === 'list' ? tokens.deepAccent : tokens.textSecondary,
              }}
              className="p-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80"
              title={t('library.viewList')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Unified all-entries list / grid */}
      {finalSortedMyths.length === 0 ? (
        <Card variant="white" className="p-8 text-center space-y-3 my-4">
          <BookMarked size={36} className="mx-auto" style={{ color: tokens.textSecondary }} />
          <p
            style={{ color: tokens.textPrimary }}
            className="font-['Aref_Ruqaa',serif] text-lg font-bold"
          >
            {t('library.emptyResults')}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
              setOnlyFavorites(false);
              setContentTypeFilter('all');
            }}
            style={{
              backgroundColor: tokens.deepAccent,
              color: isDark ? tokens.background : '#FFFFFF',
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            {t('library.resetFilters')}
          </button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {pagedMyths.map((entry) => {
            if (!entry) return null;
            const rawEntry = rawById.get(entry.id) ?? entry;
            const status = getReadingStatus(entry.id, progressMap);
            const rawProgress = progressMap?.[entry.id] ?? progressMap?.[`al-${entry.id}`] ?? 0;
            const progressVal = Number.isFinite(rawProgress) ? rawProgress : 0;
            const isLocked = Boolean(entry.isPremium) && !effectivePremium;

            return (
              <Card
                key={entry.id}
                variant="white"
                elevation="subtle"
                interactive
                className="p-3.5 flex flex-col justify-between group overflow-hidden transition-all cursor-pointer"
                onClick={() => onSelectEntry(rawEntry)}
              >
                <div>
                  <div
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.borderSubtle,
                    }}
                    className="relative h-36 w-full rounded-xl overflow-hidden mb-2.5 border"
                  >
                    <LockedHeroImage
                      src={entry.heroImage}
                      alt={entry.name ?? ''}
                      isLocked={isLocked}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        if (img.dataset.fallbackApplied === '1') return;
                        img.dataset.fallbackApplied = '1';
                        img.src = '/icons/icon.svg';
                      }}
                    />

                    {/* Bottom Start: Type Label */}
                    {entry.typeLabel && (
                      <span
                        style={{
                          backgroundColor: isDark ? 'rgba(18, 51, 45, 0.95)' : 'rgba(255, 255, 255, 0.92)',
                          color: tokens.deepAccent,
                          borderColor: tokens.border,
                        }}
                        className="absolute bottom-2 start-2 px-2 py-0.5 rounded-md backdrop-blur-xs text-[10px] font-bold border shadow-xs"
                      >
                        {entry.typeLabel}
                      </span>
                    )}

                    {/* Top Start: long / Premium / full story badges */}
                    {entry.isLongForm || entry.isPremium ? (
                      <div className="absolute top-2 start-2 flex items-center gap-1">
                        {entry.isLongForm && (
                          <span
                            style={{
                              backgroundColor: tokens.primaryMint,
                              color: '#0E5C4D',
                              borderColor: 'rgba(14, 92, 77, 0.25)',
                            }}
                            className="px-2 py-0.5 rounded-full backdrop-blur-xs text-[10px] font-bold border shadow-xs flex items-center gap-1"
                          >
                            <BookOpen size={10} style={{ color: '#0E5C4D' }} />
                            <span>{t('library.longBadge')}</span>
                          </span>
                        )}
                        {entry.isPremium && <PremiumPill />}
                      </div>
                    ) : (
                      hasDeepStory(entry.id) && (
                        <span
                          style={{
                            backgroundColor: tokens.primaryMint,
                            color: '#0E5C4D',
                            borderColor: 'rgba(14, 92, 77, 0.25)',
                          }}
                          className="absolute top-2 start-2 px-2.5 py-0.5 rounded-full backdrop-blur-xs text-[10px] font-bold border shadow-xs flex items-center gap-1"
                        >
                          <Sparkles size={10} style={{ color: '#0E5C4D' }} />
                          <span>{t('library.fullStory')}</span>
                        </span>
                      )
                    )}

                    {/* Top End: Reading status pill */}
                    {status === 'completed' && (
                      <span
                        style={{
                          backgroundColor: isDark ? 'rgba(127, 209, 174, 0.9)' : 'rgba(14, 92, 77, 0.9)',
                          color: isDark ? '#0B2420' : '#FFFFFF',
                        }}
                        className="absolute top-2 end-2 px-2 py-0.5 rounded-full backdrop-blur-xs text-[10px] font-bold shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 size={10} />
                        <span>{t('library.completedBadge')}</span>
                      </span>
                    )}
                    {status === 'reading' && (
                      <span
                        style={{
                          backgroundColor: isDark ? 'rgba(127, 178, 232, 0.9)' : 'rgba(79, 142, 219, 0.9)',
                          color: '#FFFFFF',
                        }}
                        className="absolute top-2 end-2 px-2 py-0.5 rounded-full backdrop-blur-xs text-[10px] font-bold shadow-xs flex items-center gap-1"
                      >
                        <Clock size={10} />
                        <span>{progressVal}%</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3
                      style={{ color: tokens.textPrimary }}
                      className="font-['Aref_Ruqaa',serif] text-lg font-bold group-hover:opacity-90 transition-colors truncate"
                    >
                      {entry.name ?? ''}
                    </h3>
                    {entry.latinName && (
                      <span
                        style={{ color: tokens.textSecondary }}
                        className="text-[10px] font-mono shrink-0"
                      >
                        {entry.latinName}
                      </span>
                    )}
                  </div>

                  <p
                    style={{ color: tokens.textSecondary }}
                    className="text-xs line-clamp-2 leading-relaxed"
                  >
                    {entry.summary ?? ''}
                  </p>
                </div>

                <div
                  style={{ borderColor: tokens.borderSubtle }}
                  className="mt-3 pt-2.5 border-t flex items-center justify-between text-[11px] font-medium"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      style={{ color: tokens.textSecondary }}
                      className="text-[10px] truncate max-w-[100px]"
                    >
                      {entry.region ?? ''}
                    </span>
                    <span
                      style={{ color: tokens.deepAccent }}
                      className="text-[10px] font-mono shrink-0"
                    >
                      {formatReadingTime(getEstimatedReadingTime(rawEntry), lang)}
                    </span>
                  </div>
                  <div
                    style={{ color: tokens.coolBlueAccent }}
                    className={`flex items-center gap-1 transition-transform font-bold shrink-0 ${
                      dir === 'ltr' ? 'group-hover:translate-x-[2px]' : 'group-hover:translate-x-[-2px]'
                    }`}
                  >
                    <span>{t('article.readStory')}</span>
                    <ChevronLeft size={14} className={dir === 'ltr' ? 'rotate-180' : ''} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* ================= LIST VIEW ================= */
        <div className="space-y-3">
          {pagedMyths.map((entry) => {
            if (!entry) return null;
            const rawEntry = rawById.get(entry.id) ?? entry;
            const status = getReadingStatus(entry.id, progressMap);
            const rawProgress = progressMap?.[entry.id] ?? progressMap?.[`al-${entry.id}`] ?? 0;
            const progressVal = Number.isFinite(rawProgress) ? rawProgress : 0;
            const isLocked = Boolean(entry.isPremium) && !effectivePremium;

            return (
              <Card
                key={entry.id}
                variant="white"
                elevation="subtle"
                interactive
                className="p-3 group transition-all cursor-pointer flex items-center gap-3.5"
                onClick={() => onSelectEntry(rawEntry)}
              >
                {/* Thumbnail Image */}
                <div
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.borderSubtle,
                  }}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border"
                >
                  <LockedHeroImage
                    src={entry.heroImage}
                    alt={entry.name ?? ''}
                    isLocked={isLocked}
                    compact
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      if (img.dataset.fallbackApplied === '1') return;
                      img.dataset.fallbackApplied = '1';
                      img.src = '/icons/icon.svg';
                    }}
                  />
                  {/* Status indicator overlay on thumbnail */}
                  {status === 'completed' && (
                    <span
                      style={{
                        backgroundColor: tokens.primaryMint,
                        color: '#0E5C4D',
                      }}
                      className="absolute bottom-1 start-1 p-0.5 rounded-full"
                    >
                      <CheckCircle2 size={12} />
                    </span>
                  )}
                  {status === 'reading' && (
                    <span
                      style={{
                        backgroundColor: tokens.coolBlueAccent,
                        color: '#FFFFFF',
                      }}
                      className="absolute bottom-1 start-1 px-1 rounded-sm text-[9px] font-bold"
                    >
                      {progressVal}%
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      style={{ color: tokens.textPrimary }}
                      className="font-['Aref_Ruqaa',serif] text-base sm:text-lg font-bold group-hover:opacity-90 transition-colors"
                    >
                      {entry.name ?? ''}
                    </h3>
                    {(entry.isLongForm || entry.isPremium) && (
                      <>
                        {entry.isLongForm && (
                          <span
                            style={{
                              backgroundColor: tokens.primaryMint,
                              color: '#0E5C4D',
                            }}
                            className="px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5"
                          >
                            <BookOpen size={9} />
                            <span>{t('library.longBadge') || 'طويلة'}</span>
                          </span>
                        )}
                        {entry.isPremium && <PremiumPill />}
                      </>
                    )}
                    {!entry.isLongForm && hasDeepStory(entry.id) && (
                      <span
                        style={{
                          backgroundColor: tokens.primaryMint,
                          color: '#0E5C4D',
                        }}
                        className="px-2 py-0.2 rounded-full text-[10px] font-bold flex items-center gap-0.5"
                      >
                        <Sparkles size={9} />
                        <span>{t('library.fullStory')}</span>
                      </span>
                    )}
                    {entry.typeLabel && (
                      <span
                        style={{ color: tokens.textSecondary }}
                        className="text-[10px] hidden sm:inline"
                      >
                        • {entry.typeLabel}
                      </span>
                    )}
                  </div>

                  <p
                    style={{ color: tokens.textSecondary }}
                    className="text-xs line-clamp-2 leading-relaxed"
                  >
                    {entry.summary ?? ''}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ color: tokens.deepAccent }}
                        className="text-[10px] font-mono"
                      >
                        {formatReadingTime(getEstimatedReadingTime(rawEntry), lang)}
                      </span>
                      {entry.region && (
                        <span style={{ color: tokens.textSecondary }} className="text-[10px]">
                          • {entry.region}
                        </span>
                      )}
                    </div>

                    <div
                      style={{ color: tokens.coolBlueAccent }}
                      className={`flex items-center gap-0.5 text-xs font-bold transition-transform ${
                        dir === 'ltr' ? 'group-hover:translate-x-[2px]' : 'group-hover:translate-x-[-2px]'
                      }`}
                    >
                      <span>{t('library.readAction')}</span>
                      <ChevronLeft size={13} className={dir === 'ltr' ? 'rotate-180' : ''} />
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination & Load More */}
      {finalSortedMyths.length > 0 && (
        <div className="pt-4 pb-2 flex flex-col items-center justify-center gap-2">
          <p style={{ color: tokens.textSecondary }} className="text-xs">
            {t('library.resultsShown', {
              shown: Math.min(visibleCount, finalSortedMyths.length),
              total: finalSortedMyths.length,
            })}
          </p>
          {visibleCount < finalSortedMyths.length ? (
            <button
              type="button"
              onClick={() =>
                setVisibleCount((prev) =>
                  Math.min(prev + PAGE_SIZE, finalSortedMyths.length)
                )
              }
              style={{
                backgroundColor: tokens.card,
                borderColor: tokens.border,
                color: tokens.deepAccent,
              }}
              className="px-6 py-2.5 rounded-full border text-xs font-bold hover:border-[#7FD1AE] transition-all cursor-pointer shadow-xs min-h-[44px] min-w-[44px]"
            >
              {t('library.loadMore', { remaining: finalSortedMyths.length - visibleCount }) || 'عرض المزيد'}
            </button>
          ) : (
            <span
              style={{ color: tokens.textSecondary }}
              className="text-[11px] font-medium inline-flex items-center gap-1"
            >
              <span>{t('library.allMythsLoaded', { total: finalSortedMyths.length })}</span>
              <Sparkles
                size={14}
                strokeWidth={1.9}
                style={{ color: isDark ? '#9FE8CC' : '#0E5C4D' }}
              />
            </span>
          )}
        </div>
      )}
        </>
      )}

      {/* Floating Action Button: فاجئني */}
      <SurpriseMeButton onSelectEntry={(entry) => onSelectEntry(entry)} />
    </div>
  );
};

export default LibraryScreen;
