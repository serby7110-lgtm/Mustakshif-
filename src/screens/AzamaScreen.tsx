/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Azama List Screen (طبقات كتاب العظمة — مخطوط الأزهر ٩٤٠٢٣)
 * Reuses Library components & design language:
 * - Source banner at top
 * - Normalized Arabic search across title / quote / note
 * - Category filter chips for all 8 registered cool-palette categories
 * - Sort by world number / page number / alphabetical
 * - Grid & List view toggle persisted in storage
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  LayoutGrid,
  List,
  ArrowUpDown,
  ChevronLeft,
  ScrollText,
  Layers,
  FileText,
  Orbit,
  ShieldAlert,
  Info,
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { SectionTitle } from '../components/primitives/SectionTitle';
import { AzamaCategory, AzamaEntry, AZAMA_CATEGORIES } from '../data/azamaTypes';
import {
  AzamaSortOption,
  getAllAzamaEntries,
  getAzamaCategoryMeta,
  getAzamaCategoryCounts,
  filterAndSortAzamaEntries,
  getAzamaTagBadgeStyle,
  getCategoryPillColors,
  getAzamaCardSnippets,
  hasAzamaCaution,
} from '../utils/azama';
import { storage } from '../data/storage';
import { ViewMode } from '../utils/libraryAndProfile';
import { useDebounce } from '../hooks/useDebounce';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/i18n';

export interface AzamaScreenProps {
  onSelectEntry: (entry: AzamaEntry) => void;
  showSectionHeading?: boolean;
}

export const AzamaScreen: React.FC<AzamaScreenProps> = ({
  onSelectEntry,
  showSectionHeading = true,
}) => {
  const { t, dir } = useI18n();
  const { tokens, isDark } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 250);
  const [selectedCategory, setSelectedCategory] = useState<AzamaCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<AzamaSortOption>('world');
  const [viewMode, setViewModeState] = useState<ViewMode>(() => storage.getAzamaViewMode());

  const allEntries = useMemo(() => getAllAzamaEntries(), []);
  const categoryCounts = useMemo(() => getAzamaCategoryCounts(allEntries), [allEntries]);

  const filteredEntries = useMemo(
    () =>
      filterAndSortAzamaEntries(allEntries, {
        query: debouncedQuery,
        category: selectedCategory,
        sortBy,
      }),
    [allEntries, debouncedQuery, selectedCategory, sortBy]
  );

  const handleToggleViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    storage.setAzamaViewMode(mode);
  };

  return (
    <div data-testid="azama-list-screen" className="space-y-4 pb-8 animate-in fade-in duration-200" dir={dir}>
      {/* Optional Section Heading */}
      {showSectionHeading && (
        <SectionTitle
          title={t('azama.title')}
          subtitle={t('azama.subtitle', { count: allEntries.length })}
        />
      )}

      {/* Source Banner (Req 7) */}
      <div
        data-testid="azama-source-banner"
        style={{
          background: isDark
            ? 'linear-gradient(135deg, rgba(74, 144, 217, 0.16) 0%, rgba(18, 51, 45, 0.9) 100%)'
            : 'linear-gradient(135deg, #E8F1FB 0%, #F2FBF7 100%)',
          borderColor: isDark ? 'rgba(127, 178, 232, 0.4)' : 'rgba(74, 144, 217, 0.38)',
        }}
        className="p-4 rounded-[20px] border-2 shadow-xs flex items-start gap-3 text-start"
      >
        <div
          style={{
            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.25)' : '#FFFFFF',
            color: isDark ? '#9CC4EE' : '#4A90D9',
            borderColor: isDark ? 'rgba(127, 178, 232, 0.4)' : 'rgba(74, 144, 217, 0.25)',
          }}
          className="w-10 h-10 rounded-xl border flex items-center justify-center shrink-0"
        >
          <ScrollText size={19} strokeWidth={1.9} />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <p
            style={{ color: isDark ? '#E8F6F0' : '#0E5C4D' }}
            className="font-['Aref_Ruqaa',serif] text-base font-bold leading-snug"
          >
            {t('azama.bannerTitle')}
          </p>
          <p
            style={{ color: tokens.textSecondary }}
            className="text-xs font-['Cairo',sans-serif] leading-relaxed"
          >
            {t('azama.bannerNote')}
          </p>
        </div>
      </div>

      {/* Search Bar (Normalized Arabic across title / quote / note) */}
      <div className="relative">
        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="relative flex items-center border rounded-2xl shadow-xs transition-all duration-200"
        >
          <div style={{ color: tokens.coolBlueAccent }} className="ps-3.5 pe-2">
            <Search size={18} strokeWidth={2.2} />
          </div>
          <input
            type="text"
            data-testid="azama-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('azama.searchPlaceholder')}
            style={{ color: tokens.textPrimary }}
            className="w-full py-3 pe-10 ps-1 text-sm bg-transparent outline-none font-['Cairo',sans-serif] min-h-[44px]"
            dir={dir}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{ color: tokens.textSecondary }}
              className="absolute end-2 p-2 rounded-full hover:opacity-80 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={t('home.clearSearch')}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter Chips (8 registered cool-palette categories) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
        <button
          type="button"
          data-testid="azama-cat-all"
          onClick={() => setSelectedCategory('all')}
          style={{
            backgroundColor: selectedCategory === 'all' ? tokens.deepAccent : tokens.card,
            color:
              selectedCategory === 'all'
                ? isDark
                  ? '#0B2420'
                  : '#FFFFFF'
                : tokens.textSecondary,
            borderColor: selectedCategory === 'all' ? tokens.deepAccent : tokens.border,
          }}
          className="shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95 min-h-[40px]"
        >
          <span>{t('azama.allCategories')}</span>
          <span className="text-[10px] ms-1 opacity-80">({allEntries.length})</span>
        </button>

        {AZAMA_CATEGORIES.map((catMeta) => {
          const isSelected = selectedCategory === catMeta.id;
          const catColors = getCategoryPillColors(catMeta.color, isDark);
          const count = categoryCounts[catMeta.id] ?? 0;

          return (
            <button
              key={catMeta.id}
              type="button"
              data-testid={`azama-cat-${catMeta.id}`}
              onClick={() => setSelectedCategory(catMeta.id)}
              style={{
                backgroundColor: isSelected ? tokens.deepAccent : tokens.card,
                color: isSelected
                  ? isDark
                    ? '#0B2420'
                    : '#FFFFFF'
                  : catColors.text,
                borderColor: isSelected ? tokens.deepAccent : catColors.border,
              }}
              className="shrink-0 px-3.5 py-1.5 rounded-2xl text-xs font-bold border transition-all cursor-pointer hover:opacity-90 active:scale-95 flex items-center gap-1.5 min-h-[40px]"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? (isDark ? '#0B2420' : catMeta.color) : catColors.dot }}
              />
              <span>{catMeta.label}</span>
              <span className="text-[10px] opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Sort Menu & View Mode Toggle (Reused Library controls bar) */}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <div
          style={{
            backgroundColor: tokens.card,
            borderColor: tokens.border,
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xs min-h-[44px]"
        >
          <ArrowUpDown size={14} style={{ color: tokens.deepAccent }} />
          <span style={{ color: tokens.textSecondary }} className="text-[11px] font-medium shrink-0">
            {t('library.sort')}:
          </span>
          <select
            data-testid="azama-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as AzamaSortOption)}
            style={{
              backgroundColor: 'transparent',
              color: tokens.textPrimary,
            }}
            className="text-xs font-bold focus:outline-none cursor-pointer font-['Cairo',sans-serif]"
            aria-label={t('library.sort')}
          >
            <option value="world">{t('azama.sortWorld')}</option>
            <option value="page">{t('azama.sortPage')}</option>
            <option value="alphabetical">{t('azama.sortAlphabetical')}</option>
          </select>
        </div>

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
            data-testid="azama-view-grid"
            onClick={() => handleToggleViewMode('grid')}
            aria-label={t('library.viewGrid')}
            aria-pressed={viewMode === 'grid'}
            style={{
              backgroundColor:
                viewMode === 'grid'
                  ? isDark
                    ? 'rgba(127, 209, 174, 0.2)'
                    : 'rgba(13, 92, 70, 0.12)'
                  : 'transparent',
              color: viewMode === 'grid' ? tokens.deepAccent : tokens.textSecondary,
            }}
            className="p-2 rounded-lg transition-all cursor-pointer hover:opacity-80 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title={t('library.viewGrid')}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            data-testid="azama-view-list"
            onClick={() => handleToggleViewMode('list')}
            aria-label={t('library.viewList')}
            aria-pressed={viewMode === 'list'}
            style={{
              backgroundColor:
                viewMode === 'list'
                  ? isDark
                    ? 'rgba(127, 209, 174, 0.2)'
                    : 'rgba(13, 92, 70, 0.12)'
                  : 'transparent',
              color: viewMode === 'list' ? tokens.deepAccent : tokens.textSecondary,
            }}
            className="p-2 rounded-lg transition-all cursor-pointer hover:opacity-80 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title={t('library.viewList')}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Results Area */}
      {filteredEntries.length === 0 ? (
        <Card variant="white" className="p-8 text-center space-y-3 my-4">
          <Orbit size={34} className="mx-auto" style={{ color: tokens.coolBlueAccent }} />
          <p style={{ color: tokens.textPrimary }} className="font-['Aref_Ruqaa',serif] text-lg font-bold">
            {t('azama.emptyResults')}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            style={{
              backgroundColor: tokens.deepAccent,
              color: isDark ? tokens.background : '#FFFFFF',
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer min-h-[44px]"
          >
            {t('azama.resetFilters')}
          </button>
        </Card>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div data-testid="azama-grid" className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredEntries.map((entry) => {
            const catMeta = getAzamaCategoryMeta(entry.cat);
            const catColors = getCategoryPillColors(catMeta.color, isDark);
            const tagStyle = getAzamaTagBadgeStyle(entry.tag, isDark);

            return (
              <Card
                key={entry.id}
                data-testid={`azama-card-${entry.id}`}
                variant="white"
                elevation="subtle"
                interactive
                onClick={() => onSelectEntry(entry)}
                className="p-4 flex flex-col justify-between gap-3 group cursor-pointer text-start"
              >
                <div className="space-y-2.5">
                  {/* Top pills: World + Page + Tag */}
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        style={{
                          backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : '#E8F1FB',
                          color: isDark ? '#9CC4EE' : '#4A90D9',
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                      >
                        <Layers size={10} />
                        <span>{t('azama.worldPill', { world: entry.world })}</span>
                      </span>
                      <span
                        style={{
                          backgroundColor: tokens.surface,
                          color: tokens.deepAccent,
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                      >
                        <FileText size={10} />
                        <span>{t('azama.pagePill', { page: entry.page })}</span>
                      </span>
                    </div>

                    <span
                      style={{
                        backgroundColor: tagStyle.bg,
                        borderColor: tagStyle.border,
                        color: tagStyle.text,
                      }}
                      className="px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0"
                    >
                      {entry.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    style={{ color: tokens.textPrimary }}
                    className="font-['Aref_Ruqaa',serif] text-lg font-bold leading-snug"
                  >
                    {entry.title}
                  </h3>

                  {entry.sensitive ? (
                    <div
                      data-testid={`azama-card-sensitive-${entry.id}`}
                      style={{
                        backgroundColor: isDark ? 'rgba(142, 123, 232, 0.14)' : '#F2EFFC',
                        borderColor: isDark ? 'rgba(142, 123, 232, 0.4)' : 'rgba(142, 123, 232, 0.35)',
                        color: isDark ? '#D5C8F7' : '#583696',
                      }}
                      className="p-2.5 rounded-xl border flex items-center gap-2 text-xs font-bold"
                    >
                      <ShieldAlert size={14} className="shrink-0" />
                      <span>{t('azama.sensitiveGate')}</span>
                    </div>
                  ) : hasAzamaCaution(entry) ? (
                    <div
                      data-testid={`azama-card-caution-${entry.id}`}
                      style={{
                        backgroundColor: isDark ? 'rgba(74, 144, 217, 0.16)' : '#E8F1FB',
                        borderColor: '#4A90D9',
                        color: isDark ? '#DDF3EC' : '#0E5C4D',
                      }}
                      className="p-2.5 rounded-xl border flex items-start gap-2 text-xs font-bold leading-relaxed"
                    >
                      <Info size={14} style={{ color: '#4A90D9' }} className="shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{entry.caution}</span>
                    </div>
                  ) : (
                    <>
                      {/* Amiri quote snippet */}
                      <p
                        dir="rtl"
                        style={{
                          color: tokens.deepAccent,
                          fontFamily: "'Amiri', serif",
                          borderColor: catColors.border,
                        }}
                        className="font-['Amiri',serif] text-sm leading-relaxed line-clamp-2 ps-2.5 border-s-2"
                      >
                        «{getAzamaCardSnippets(entry).quote}»
                      </p>

                      {/* Note summary */}
                      <p
                        style={{ color: tokens.textSecondary }}
                        className="text-xs line-clamp-2 leading-relaxed"
                      >
                        {getAzamaCardSnippets(entry).note}
                      </p>
                    </>
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{ borderColor: tokens.borderSubtle }}
                  className="pt-2.5 border-t flex items-center justify-between gap-2 text-[11px]"
                >
                  <span
                    style={{ color: catColors.text }}
                    className="inline-flex items-center gap-1.5 font-bold truncate"
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: catColors.dot }}
                    />
                    <span className="truncate">{catMeta.label}</span>
                  </span>

                  <span
                    style={{ color: tokens.coolBlueAccent }}
                    className="inline-flex items-center gap-0.5 font-bold shrink-0"
                  >
                    <span>{t('azama.readAction')}</span>
                    <ChevronLeft size={14} className={dir === 'ltr' ? 'rotate-180' : ''} />
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div data-testid="azama-list" className="space-y-2.5">
          {filteredEntries.map((entry) => {
            const catMeta = getAzamaCategoryMeta(entry.cat);
            const catColors = getCategoryPillColors(catMeta.color, isDark);
            const tagStyle = getAzamaTagBadgeStyle(entry.tag, isDark);

            return (
              <Card
                key={entry.id}
                data-testid={`azama-card-${entry.id}`}
                variant="white"
                elevation="subtle"
                interactive
                onClick={() => onSelectEntry(entry)}
                className="p-3.5 group cursor-pointer flex items-center justify-between gap-3 text-start"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      style={{
                        backgroundColor: isDark ? 'rgba(74, 144, 217, 0.2)' : '#E8F1FB',
                        color: isDark ? '#9CC4EE' : '#4A90D9',
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    >
                      {t('azama.worldPill', { world: entry.world })}
                    </span>
                    <span
                      style={{
                        backgroundColor: tokens.surface,
                        color: tokens.deepAccent,
                      }}
                      className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
                    >
                      {t('azama.pagePill', { page: entry.page })}
                    </span>
                    <span
                      style={{
                        backgroundColor: tagStyle.bg,
                        borderColor: tagStyle.border,
                        color: tagStyle.text,
                      }}
                      className="px-2 py-0.5 rounded-full border text-[10px] font-bold"
                    >
                      {entry.tag}
                    </span>
                    <span
                      style={{ color: catColors.text }}
                      className="inline-flex items-center gap-1 text-[10px] font-bold"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: catColors.dot }}
                      />
                      <span>{catMeta.label}</span>
                    </span>
                  </div>

                  <h3
                    style={{ color: tokens.textPrimary }}
                    className="font-['Aref_Ruqaa',serif] text-base sm:text-lg font-bold leading-snug"
                  >
                    {entry.title}
                  </h3>

                  {entry.sensitive ? (
                    <div
                      data-testid={`azama-card-sensitive-${entry.id}`}
                      style={{
                        color: isDark ? '#D5C8F7' : '#583696',
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold"
                    >
                      <ShieldAlert size={13} className="shrink-0" />
                      <span>{t('azama.sensitiveGate')}</span>
                    </div>
                  ) : hasAzamaCaution(entry) ? (
                    <div
                      data-testid={`azama-card-caution-${entry.id}`}
                      style={{
                        color: isDark ? '#DDF3EC' : '#0E5C4D',
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold"
                    >
                      <Info size={13} style={{ color: '#4A90D9' }} className="shrink-0" />
                      <span className="line-clamp-1">{entry.caution}</span>
                    </div>
                  ) : (
                    <p
                      style={{ color: tokens.textSecondary }}
                      className="text-xs line-clamp-1 leading-relaxed"
                    >
                      {getAzamaCardSnippets(entry).note}
                    </p>
                  )}
                </div>

                <ChevronLeft
                  size={18}
                  style={{ color: tokens.coolBlueAccent }}
                  className={`shrink-0 ${dir === 'ltr' ? 'rotate-180' : ''}`}
                />
              </Card>
            );
          })}
        </div>
      )}

      {filteredEntries.length > 0 && (
        <p style={{ color: tokens.textSecondary }} className="text-center text-xs pt-2">
          {t('azama.resultsShown', {
            shown: filteredEntries.length,
            total: allEntries.length,
          })}
        </p>
      )}
    </div>
  );
};

export default AzamaScreen;
