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
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { StudioScreen } from './StudioScreen';
import { MythEntry } from '../data/types';
import mythsData from '../data/myths.json';
import { hasDeepStory } from '../data/storyTypes';
import { getEstimatedReadingTime, formatReadingTime } from '../utils/readingTime';
import { legacyAr as ar } from '../i18n/legacyAr';
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
import { useDebounce } from '../hooks/useDebounce';

import { useI18n } from '../i18n/i18n';
export interface LibraryScreenProps {
  onSelectEntry: (entry: MythEntry) => void;
  savedIds?: string[];
  historyIds?: string[];
  onToggleSave?: (id: string, e?: React.MouseEvent) => void;
  onClearHistory?: () => void;
  onExploreClick?: () => void;
}

export const LibraryScreen: React.FC<LibraryScreenProps> = ({
  onSelectEntry,
}) => {
  const { t } = useI18n();
  const { tokens, isDark } = useTheme();

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

  // Local reading progress map
  const [progressMap, setProgressMap] = useState<Record<string, number>>(() =>
    storage.getAllMythProgress()
  );

  // Sync progress on component mount/focus
  useEffect(() => {
    setProgressMap(storage.getAllMythProgress());
  }, []);

  // Update view mode with storage persistence
  const handleToggleViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    storage.setLibraryViewMode(mode);
  };

  // All entries from myths.json
  const allMyths = useMemo(() => mythsData as unknown as MythEntry[], []);

  // Calculate counts for each reading status
  const statusCounts = useMemo(() => {
    let unread = 0;
    let reading = 0;
    let completed = 0;

    for (const m of allMyths) {
      const st = getReadingStatus(m.id, progressMap);
      if (st === 'reading') reading++;
      else if (st === 'completed') completed++;
      else unread++;
    }

    return { all: allMyths.length, unread, reading, completed };
  }, [allMyths, progressMap]);

  // Search filtering with 300ms debounced query and normalized index
  const searchFilteredMyths = useMemo(() => {
    const q = debouncedSearchQuery.trim();
    if (!q) return allMyths;
    const normQ = normalizeArabic(q);
    return allMyths.filter((entry) => {
      const normName = normalizeArabic(entry.name);
      const normSummary = normalizeArabic(entry.summary || '');
      const latin = (entry.latinName || '').toLowerCase();
      const tags = (entry.tags || []).map((t) => normalizeArabic(t));
      const normRegion = normalizeArabic(entry.region || '');
      return (
        normName.includes(normQ) ||
        normSummary.includes(normQ) ||
        normRegion.includes(normQ) ||
        latin.includes(q.toLowerCase()) ||
        tags.some((t) => t.includes(normQ))
      );
    });
  }, [allMyths, debouncedSearchQuery]);

  // Status filtering
  const statusFilteredMyths = useMemo(() => {
    return filterMythsByReadingStatus(searchFilteredMyths, statusFilter, progressMap);
  }, [searchFilteredMyths, statusFilter, progressMap]);

  // Sorting
  const finalSortedMyths = useMemo(() => {
    return sortMyths(statusFilteredMyths, sortBy, progressMap);
  }, [statusFilteredMyths, sortBy, progressMap]);

  // Reset pagination to first 20 items whenever filter/sort/search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [debouncedSearchQuery, statusFilter, sortBy]);

  // Auto load next 20 items on window scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 300
      ) {
        setVisibleCount((prev) => {
          if (prev >= finalSortedMyths.length) return prev;
          return Math.min(prev + PAGE_SIZE, finalSortedMyths.length);
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [finalSortedMyths.length]);

  // Paginated visible slice of myths
  const pagedMyths = useMemo(() => {
    return finalSortedMyths.slice(0, visibleCount);
  }, [finalSortedMyths, visibleCount]);

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200" dir="rtl">
      {/* 1. Header */}
      <div className="flex items-center justify-between gap-3 pt-1">
        <div>
          <h2
            style={{ color: tokens.deepAccent }}
            className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold leading-tight"
          >
            {ar.library.title}
          </h2>
          <p
            style={{ color: tokens.textSecondary }}
            className="text-xs font-['Cairo',sans-serif] mt-0.5"
          >
            جميع الأساطير والخرافات الموثقة ({allMyths.length} أسطورة)
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
            className="pr-3.5 pl-2"
          >
            <Search size={18} strokeWidth={2.2} />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث في جميع الأساطير (بالاسم، الملخص، أو الكلمات الدلالية)..."
            style={{
              color: tokens.textPrimary,
            }}
            className="w-full py-3 pl-10 pr-1 text-sm bg-transparent outline-none font-['Cairo',sans-serif] min-h-[44px]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: tokens.textSecondary }}
              className="absolute left-3 p-1 rounded-full hover:opacity-80 cursor-pointer"
              aria-label="مسح البحث"
            >
              <X size={16} />
            </button>
          )}
        </div>
        {searchQuery.trim() && (
          <div
            style={{ color: tokens.textSecondary }}
            className="mt-1 text-[11px] pr-2"
          >
            عرض {finalSortedMyths.length} من أصل {allMyths.length} أسطورة
          </div>
        )}
      </div>

      {/* 3. Controls Bar: Reading-status chips + Sort menu + View mode toggle */}
      <div className="space-y-2.5">
        {/* Reading Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {/* الكل */}
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
            <span>{t('map.all')}</span>
            <span className="text-[10px] mr-1 opacity-80">({statusCounts.all})</span>
          </button>

          {/* لم أقرأ */}
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
            <span>لم أقرأ</span>
            <span className="text-[10px] mr-1 opacity-80">({statusCounts.unread})</span>
          </button>

          {/* أقرأ الآن */}
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
            <span>أقرأ الآن</span>
            <span className="text-[10px] mr-1 opacity-80">({statusCounts.reading})</span>
          </button>

          {/* انتهيت */}
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
            <span>انتهيت</span>
            <span className="text-[10px] mr-1 opacity-80">({statusCounts.completed})</span>
          </button>
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
              الترتيب:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              style={{
                backgroundColor: 'transparent',
                color: tokens.textPrimary,
              }}
              className="text-xs font-bold focus:outline-none cursor-pointer font-['Cairo',sans-serif]"
              aria-label="خيارات الترتيب"
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
            aria-label="طريقة العرض"
          >
            <button
              type="button"
              onClick={() => handleToggleViewMode('grid')}
              aria-label="عرض شبكي"
              aria-pressed={viewMode === 'grid'}
              style={{
                backgroundColor: viewMode === 'grid'
                  ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.12)')
                  : 'transparent',
                color: viewMode === 'grid' ? tokens.deepAccent : tokens.textSecondary,
              }}
              className="p-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80"
              title="عرض شبكي"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => handleToggleViewMode('list')}
              aria-label="عرض قائمة"
              aria-pressed={viewMode === 'list'}
              style={{
                backgroundColor: viewMode === 'list'
                  ? (isDark ? 'rgba(127, 209, 174, 0.2)' : 'rgba(13, 92, 70, 0.12)')
                  : 'transparent',
                color: viewMode === 'list' ? tokens.deepAccent : tokens.textSecondary,
              }}
              className="p-1.5 rounded-lg transition-all cursor-pointer hover:opacity-80"
              title="عرض قائمة"
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
            لا توجد أساطير مطابقة لخيارات التصفية
          </p>
          <p
            style={{ color: tokens.textSecondary }}
            className="text-xs"
          >
            جرّب تغيير حالة القراءة أو إفراغ خانة البحث.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
            style={{
              backgroundColor: tokens.deepAccent,
              color: isDark ? tokens.background : '#FFFFFF',
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            عرض جميع الأساطير
          </button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* ================= GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {pagedMyths.map((entry) => {
            const status = getReadingStatus(entry.id, progressMap);
            const progressVal = progressMap[entry.id] ?? (progressMap[`al-${entry.id}`] ?? 0);

            return (
              <Card
                key={entry.id}
                variant="white"
                elevation="subtle"
                interactive
                className="p-3.5 flex flex-col justify-between group overflow-hidden transition-all cursor-pointer"
                onClick={() => onSelectEntry(entry)}
              >
                <div>
                  <div
                    style={{
                      backgroundColor: tokens.surface,
                      borderColor: tokens.borderSubtle,
                    }}
                    className="relative h-36 w-full rounded-xl overflow-hidden mb-2.5 border"
                  >
                    <img
                      src={entry.heroImage}
                      alt={entry.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80';
                      }}
                    />

                    {/* Bottom Right: Type Label */}
                    {entry.typeLabel && (
                      <span
                        style={{
                          backgroundColor: isDark ? 'rgba(18, 51, 45, 0.95)' : 'rgba(255, 255, 255, 0.92)',
                          color: tokens.deepAccent,
                          borderColor: tokens.border,
                        }}
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md backdrop-blur-xs text-[10px] font-bold border shadow-xs"
                      >
                        {entry.typeLabel}
                      </span>
                    )}

                    {/* Top Right: حكاية كاملة badge */}
                    {hasDeepStory(entry.id) && (
                      <span
                        style={{
                          backgroundColor: tokens.primaryMint,
                          color: '#0E5C4D',
                          borderColor: 'rgba(14, 92, 77, 0.25)',
                        }}
                        className="absolute top-2 right-2 px-2.5 py-0.5 rounded-full backdrop-blur-xs text-[10px] font-bold border shadow-xs flex items-center gap-1"
                      >
                        <Sparkles size={10} style={{ color: '#0E5C4D' }} />
                        <span>حكاية كاملة</span>
                      </span>
                    )}

                    {/* Top Left: Reading status pill */}
                    {status === 'completed' && (
                      <span
                        style={{
                          backgroundColor: isDark ? 'rgba(127, 209, 174, 0.9)' : 'rgba(14, 92, 77, 0.9)',
                          color: isDark ? '#0B2420' : '#FFFFFF',
                        }}
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full backdrop-blur-xs text-[10px] font-bold shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 size={10} />
                        <span>انتهيت</span>
                      </span>
                    )}
                    {status === 'reading' && (
                      <span
                        style={{
                          backgroundColor: isDark ? 'rgba(127, 178, 232, 0.9)' : 'rgba(79, 142, 219, 0.9)',
                          color: '#FFFFFF',
                        }}
                        className="absolute top-2 left-2 px-2 py-0.5 rounded-full backdrop-blur-xs text-[10px] font-bold shadow-xs flex items-center gap-1"
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
                      {entry.name}
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
                    {entry.summary}
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
                      {entry.region}
                    </span>
                    <span
                      style={{ color: tokens.deepAccent }}
                      className="text-[10px] font-mono shrink-0"
                    >
                      {formatReadingTime(getEstimatedReadingTime(entry))}
                    </span>
                  </div>
                  <div
                    style={{ color: tokens.coolBlueAccent }}
                    className="flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform font-bold shrink-0"
                  >
                    <span>{t('article.readStory')}</span>
                    <ChevronLeft size={14} />
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
            const status = getReadingStatus(entry.id, progressMap);
            const progressVal = progressMap[entry.id] ?? (progressMap[`al-${entry.id}`] ?? 0);

            return (
              <Card
                key={entry.id}
                variant="white"
                elevation="subtle"
                interactive
                className="p-3 group transition-all cursor-pointer flex items-center gap-3.5"
                onClick={() => onSelectEntry(entry)}
              >
                {/* Thumbnail Image */}
                <div
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.borderSubtle,
                  }}
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border"
                >
                  <img
                    src={entry.heroImage}
                    alt={entry.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80';
                    }}
                  />
                  {/* Status indicator overlay on thumbnail */}
                  {status === 'completed' && (
                    <span
                      style={{
                        backgroundColor: tokens.primaryMint,
                        color: '#0E5C4D',
                      }}
                      className="absolute bottom-1 right-1 p-0.5 rounded-full"
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
                      className="absolute bottom-1 right-1 px-1 rounded-sm text-[9px] font-bold"
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
                      {entry.name}
                    </h3>
                    {hasDeepStory(entry.id) && (
                      <span
                        style={{
                          backgroundColor: tokens.primaryMint,
                          color: '#0E5C4D',
                        }}
                        className="px-2 py-0.2 rounded-full text-[10px] font-bold flex items-center gap-0.5"
                      >
                        <Sparkles size={9} />
                        <span>حكاية كاملة</span>
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
                    {entry.summary}
                  </p>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <div className="flex items-center gap-2">
                      <span
                        style={{ color: tokens.deepAccent }}
                        className="text-[10px] font-mono"
                      >
                        {formatReadingTime(getEstimatedReadingTime(entry))}
                      </span>
                      <span style={{ color: tokens.textSecondary }} className="text-[10px]">
                        • {entry.region}
                      </span>
                    </div>

                    <div
                      style={{ color: tokens.coolBlueAccent }}
                      className="flex items-center gap-0.5 text-xs font-bold group-hover:translate-x-[-2px] transition-transform"
                    >
                      <span>قراءة</span>
                      <ChevronLeft size={13} />
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
            عرض {Math.min(visibleCount, finalSortedMyths.length)} من أصل {finalSortedMyths.length} أسطورة
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
              عرض المزيد ({finalSortedMyths.length - visibleCount} متبقية)
            </button>
          ) : (
            <span
              style={{ color: tokens.textSecondary }}
              className="text-[11px] font-medium"
            >
              تم استعراض جميع الأساطير ({finalSortedMyths.length}) ✨
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
