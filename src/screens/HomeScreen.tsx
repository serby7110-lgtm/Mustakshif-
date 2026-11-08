/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Home Screen (مستكشف)
 * Full RTL layout with Arabic normalization global search,
 * keyword highlighting, 2x2 + 1 pastel category tiles, hero banner,
 * and most-read entries list. Colors read strictly from theme tokens.
 */

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';

import { Card } from '../components/primitives/Card';
import { Tag, TagVariant } from '../components/primitives/Tag';
import { SectionTitle } from '../components/primitives/SectionTitle';
import { Logo } from '../components/primitives/Logo';
import { MythEntry, MythCategory } from '../data/types';
import { MYTH_ENTRIES, getEntryById } from '../data/seed';
import { getAllCivilizations } from '../data/civTypes';
import { storage, LastReadChapter } from '../data/storage';
import { searchEntries, searchCivilizations } from '../utils/arabicSearch';
import { getCivImageUrl } from '../utils/assets';
import { getEstimatedReadingTime, formatReadingTime } from '../utils/readingTime';
import { useTheme } from '../theme/ThemeContext';
import { legacyAr as ar } from '../i18n/legacyAr';
import anqaBannerImg from '../assets/images/anqa_oasis_banner_1793094389649.jpg';
import { SurpriseMeButton } from '../components/primitives/SurpriseMeButton';

import { useI18n } from '../i18n/i18n';
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
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onSelectEntry,
  onOpenProfile,
  onSelectCategoryFilter,
  savedIds,
  onToggleSave,
  onSelectCivilization,
  onExploreCivilizations,
}) => {
  const { t } = useI18n();
  const { tokens, isDark } = useTheme();

  const allCivilizations = useMemo(() => getAllCivilizations(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'all' | 'myths' | 'civs'>('all');
  const [isMicActive, setIsMicActive] = useState(false);
  const [showAllMostRead, setShowAllMostRead] = useState(false);

  // Check for last-read chapter (STEP 1: Home v2)
  const [lastRead] = useState<LastReadChapter | null>(() => storage.getLastReadChapter());
  const lastReadEntry = useMemo(() => {
    if (!lastRead?.mythId) return null;
    return getEntryById(lastRead.mythId);
  }, [lastRead]);

  // Phoenix entry for Hero Banner
  const anqaEntry = useMemo(() => {
    return getEntryById('al-anqa') || MYTH_ENTRIES[1];
  }, []);

  // Entries for "الأكثر قراءة": الغول (al-ghul), إرم ذات العماد (iram-dhat-al-imad), الجن (al-jinn)
  const mostReadEntries = useMemo(() => {
    const ids = ['al-ghul', 'iram-dhat-al-imad', 'al-jinn', 'al-lat', 'zarqa-al-yamama'];
    const selected = ids
      .map((id) => getEntryById(id))
      .filter((e): e is MythEntry => Boolean(e));
    return showAllMostRead ? selected : selected.slice(0, 3);
  }, [showAllMostRead]);

  // Global search with Arabic normalization
  const searchResults = useMemo(() => {
    if (searchScope === 'civs') return [];
    return searchEntries(MYTH_ENTRIES, searchQuery);
  }, [searchQuery, searchScope]);

  // Civilizations search
  const searchCivResults = useMemo(() => {
    if (searchScope === 'myths') return [];
    return searchCivilizations(allCivilizations, searchQuery);
  }, [allCivilizations, searchQuery, searchScope]);

  const handleMicClick = () => {
    setIsMicActive(true);
    setTimeout(() => {
      setSearchQuery('غول');
      setIsMicActive(false);
    }, 1000);
  };

  const getTagVariant = (tag: string): TagVariant => {
    if (tag === 'رعب') return 'horror';
    if (tag === 'تاريخ') return 'history';
    if (tag === 'خرافي') return 'supernatural';
    return 'neutral';
  };

  const renderHighlighted = (text: string, query: string) => {
    if (!query.trim()) return text;
    const cleanQ = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${cleanQ}|ال${cleanQ})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
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
    <div className="space-y-6 animate-in fade-in duration-200" dir="rtl">
      {/* 1. Header: greeting + logo button */}
      <header className="flex items-center justify-between gap-4 pt-1">
        <div className="text-right">
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
            {ar.home.subgreeting}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenProfile}
          aria-label="الملف الشخصي وشارة مستكشف"
          title="الملف الشخصي وشارة مستكشف"
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
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
          />
        </button>
      </header>

      {/* 1.5. "أكمل القراءة" Card at the very top (only if a last-read chapter exists) */}
      {lastRead && lastReadEntry && (
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
                أكمل القراءة
              </span>
            </div>
            <span
              style={{ color: tokens.textSecondary }}
              className="text-[11px] font-mono font-medium"
            >
              {lastRead.progressPercent}% مكتمل
            </span>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold truncate leading-snug"
              >
                {lastRead.mythName || lastReadEntry.name}
              </h3>
              <p
                style={{ color: tokens.textSecondary }}
                className="text-xs font-['Cairo',sans-serif] mt-0.5 truncate"
              >
                {lastRead.chapterTitle || 'الفصل السابق'}
              </p>

              {/* Progress bar */}
              <div
                style={{ backgroundColor: tokens.surface }}
                className="w-full h-1.5 rounded-full overflow-hidden mt-2.5 border"
              >
                <div
                  style={{
                    width: `${Math.max(5, Math.min(100, lastRead.progressPercent))}%`,
                    backgroundColor: tokens.primaryMint,
                  }}
                  className="h-full rounded-full transition-all duration-300"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onSelectEntry(lastReadEntry, lastRead.chapterIndex)}
              style={{
                backgroundColor: tokens.primaryMint,
                color: '#0E5C4D',
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold shadow-xs hover:opacity-90 transition-all cursor-pointer shrink-0 min-h-[44px]"
            >
              <span>متابعة</span>
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}

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
            className="pr-3.5 pl-2 flex items-center pointer-events-none"
          >
            <Search size={20} strokeWidth={2.2} />
          </div>

          {/* Search Input */}
          <input
            type="text"
            dir="rtl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={ar.home.searchPlaceholder}
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
              className="p-2 hover:opacity-80 cursor-pointer ml-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label={ar.search.clearSearch}
            >
              <X size={17} />
            </button>
          )}

          {/* Mic Icon */}
          <button
            type="button"
            onClick={handleMicClick}
            aria-label="البحث الصوتي"
            title="البحث الصوتي"
            style={{ color: tokens.coolBlueAccent }}
            className={`pl-3 pr-2 py-2 hover:opacity-80 transition-colors cursor-pointer flex items-center min-h-[44px] min-w-[44px] justify-center ${
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
                  {searchScope === 'all' && `النتائج (${searchResults.length + searchCivResults.length})`}
                  {searchScope === 'myths' && `الأساطير (${searchResults.length})`}
                  {searchScope === 'civs' && `الحضارات (${searchCivResults.length})`}
                </span>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ color: tokens.textSecondary }}
                  className="text-[11px] hover:underline cursor-pointer"
                >
                  {ar.search.closeSearch}
                </button>
              </div>

              {/* Scope toggle buttons: الكل | أساطير | حضارات */}
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                }}
                className="flex items-center rounded-xl p-0.5 border text-xs"
                role="group"
                aria-label="تصفية نتائج البحث"
              >
                <button
                  type="button"
                  onClick={() => setSearchScope('all')}
                  style={{
                    backgroundColor: searchScope === 'all' ? tokens.deepAccent : 'transparent',
                    color: searchScope === 'all' ? (isDark ? '#0B2420' : '#FFFFFF') : tokens.textSecondary,
                  }}
                  className="flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer min-h-[32px]"
                >
                  {t('map.all')}
                </button>
                <button
                  type="button"
                  onClick={() => setSearchScope('myths')}
                  style={{
                    backgroundColor: searchScope === 'myths' ? tokens.deepAccent : 'transparent',
                    color: searchScope === 'myths' ? (isDark ? '#0B2420' : '#FFFFFF') : tokens.textSecondary,
                  }}
                  className="flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer min-h-[32px]"
                >
                  أساطير
                </button>
                <button
                  type="button"
                  onClick={() => setSearchScope('civs')}
                  style={{
                    backgroundColor: searchScope === 'civs' ? tokens.deepAccent : 'transparent',
                    color: searchScope === 'civs' ? (isDark ? '#0B2420' : '#FFFFFF') : tokens.textSecondary,
                  }}
                  className="flex-1 py-1 rounded-lg font-bold text-center transition-all cursor-pointer min-h-[32px]"
                >
                  حضارات
                </button>
              </div>
            </div>

            {/* Results Content */}
            {searchResults.length === 0 && searchCivResults.length === 0 ? (
              <div className="p-5 text-center space-y-1">
                <p style={{ color: tokens.textPrimary }} className="text-xs font-bold">
                  {ar.search.noResults(searchQuery)}
                </p>
                <p style={{ color: tokens.textSecondary }} className="text-[11px]">
                  {ar.search.noResultsHint}
                </p>
              </div>
            ) : (
              <>
                {/* 1. Civilization results: show name + era + region and open CivilizationPage */}
                {searchCivResults.map(({ civ, matchedField, snippet }) => (
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
                    className="p-3.5 hover:opacity-90 transition-colors cursor-pointer flex items-center justify-between gap-3 text-right group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          style={{ color: tokens.deepAccent }}
                          className="font-bold text-base font-['Aref_Ruqaa',serif] group-hover:underline"
                        >
                          {renderHighlighted(civ.name, searchQuery)}
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
                          <span>حضارة</span>
                        </span>
                        <span
                          style={{
                            color: tokens.coolBlueAccent,
                            backgroundColor: tokens.coolBlueTint,
                          }}
                          className="text-[10px] px-2 py-0.5 rounded-md font-medium"
                        >
                          {civ.era}
                        </span>
                      </div>

                      <div
                        style={{ color: tokens.textSecondary }}
                        className="flex items-center gap-1.5 text-xs font-['Cairo',sans-serif] mb-1"
                      >
                        <MapPin size={11} className="shrink-0 opacity-70" />
                        <span>{civ.region}</span>
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
                      className="group-hover:-translate-x-1 transition-transform shrink-0 p-1"
                    >
                      <ChevronLeft size={16} />
                    </div>
                  </div>
                ))}

                {/* 2. Myth entries results */}
                {searchResults.map(({ entry, matchedField, snippet }) => (
                  <div
                    key={`myth-${entry.id}`}
                    onClick={() => {
                      setSearchQuery('');
                      onSelectEntry(entry);
                    }}
                    style={{ borderColor: tokens.borderSubtle }}
                    className="p-3.5 hover:opacity-90 transition-colors cursor-pointer flex items-center justify-between gap-3 text-right"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          style={{ color: tokens.textPrimary }}
                          className="font-bold text-sm font-['Aref_Ruqaa',serif]"
                        >
                          {renderHighlighted(entry.name, searchQuery)}
                        </span>
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
                          {ar.search.matchedIn[matchedField]}
                        </span>
                        <span
                          style={{
                            color: tokens.deepAccent,
                            backgroundColor: tokens.surface,
                          }}
                          className="text-[10px] px-1.5 py-0.5 rounded-md font-mono border"
                        >
                          {formatReadingTime(getEstimatedReadingTime(entry))}
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
                      className="transform scale-x-[-1] shrink-0"
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* 3. Section "التصنيفات": 2x2 + 1 grid of category tiles */}
      <div>
        <SectionTitle
          title={t('home.categories')}
          subtitle={ar.home.categoriesSubtitle}
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
            className="p-4 rounded-[18px] border text-right flex flex-col justify-between h-28 hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group min-h-[48px]"
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
                ١٢ كائناً
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
                {ar.categories.creaturesSub}
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
            className="p-4 rounded-[18px] border text-right flex flex-col justify-between h-28 hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group min-h-[48px]"
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
                ١٠ أرباب
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
                {ar.categories.godsSub}
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
            className="p-4 rounded-[18px] border text-right flex flex-col justify-between h-28 hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group min-h-[48px]"
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
                ٨ طقوس
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
                {ar.categories.ritualsSub}
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
            className="p-4 rounded-[18px] border text-right flex flex-col justify-between h-28 hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group min-h-[48px]"
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
                ١٠ مواقع
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
                {ar.categories.placesSub}
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
            className="p-4 rounded-[18px] border text-right flex flex-col justify-between h-28 hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group min-h-[48px]"
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
                ٥ شخصيات
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
                {ar.categories.personalitiesSub}
              </span>
            </div>
          </button>

          {/* Tile 6: sa3aleek (الصعاليك) */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('sa3aleek')}
            style={{
              backgroundColor: isDark ? 'rgba(253, 231, 218, 0.14)' : '#FDE7DA',
              borderColor: isDark ? 'rgba(253, 231, 218, 0.35)' : 'rgba(232, 100, 50, 0.28)',
            }}
            className="p-4 rounded-[18px] border text-right flex flex-col justify-between h-28 hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group min-h-[48px]"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: '#C24514',
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <RunnerIcon size={20} />
              </div>
              <span
                style={{
                  color: '#C24514',
                  backgroundColor: tokens.card,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                {t('cat.sa3aleek')}
              </span>
            </div>
            <div>
              <span
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.sa3aleek')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {ar.categories.sa3aleekSub}
              </span>
            </div>
          </button>

          {/* Tile 7: kings (ملوك وملكات) */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('kings')}
            style={{
              backgroundColor: isDark ? 'rgba(246, 235, 210, 0.14)' : '#F6EBD2',
              borderColor: isDark ? 'rgba(246, 235, 210, 0.35)' : 'rgba(200, 160, 80, 0.3)',
            }}
            className="p-4 rounded-[18px] border text-right flex flex-col justify-between h-28 hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group min-h-[48px]"
          >
            <div className="flex items-center justify-between">
              <div
                style={{
                  backgroundColor: tokens.card,
                  borderColor: tokens.border,
                  color: '#9C6F1E',
                }}
                className="w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform"
              >
                <Crown size={20} strokeWidth={1.8} />
              </div>
              <span
                style={{
                  color: '#9C6F1E',
                  backgroundColor: tokens.card,
                }}
                className="text-[11px] font-bold px-2 py-0.5 rounded-full"
              >
                العروش
              </span>
            </div>
            <div>
              <span
                style={{ color: tokens.textPrimary }}
                className="font-['Aref_Ruqaa',serif] text-lg font-bold block leading-tight"
              >
                {t('cat.kings')}
              </span>
              <span
                style={{ color: tokens.textSecondary }}
                className="text-[11px] font-['Cairo',sans-serif] font-medium"
              >
                {ar.categories.kingsSub}
              </span>
            </div>
          </button>

          {/* Tile 8: seers (عرافون وكهان) */}
          <button
            type="button"
            onClick={() => onSelectCategoryFilter?.('seers')}
            style={{
              backgroundColor: isDark ? 'rgba(236, 231, 248, 0.14)' : '#ECE7F8',
              borderColor: isDark ? 'rgba(236, 231, 248, 0.35)' : 'rgba(150, 120, 220, 0.28)',
            }}
            className="p-4 rounded-[18px] border text-right flex flex-col justify-between h-28 hover:-translate-y-0.5 shadow-sm transition-all duration-200 cursor-pointer group min-h-[48px] col-span-2 sm:col-span-1"
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
                الكهانة
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
                {ar.categories.seersSub}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* 4. Hero banner "أسطورة اليوم" */}
      <div className="relative">
        {/* Dark mode only: subtle CSS twinkling stars behind the Home hero banner */}
        {isDark && (
          <div className="absolute -inset-2.5 pointer-events-none overflow-hidden rounded-[26px] z-0">
            <div className="hero-twinkling-star top-2 right-8 w-1.5 h-1.5" style={{ animationDuration: '2.8s', animationDelay: '0.2s', backgroundColor: tokens.primaryMint }} />
            <div className="hero-twinkling-star top-6 right-24 w-1 h-1" style={{ animationDuration: '3.4s', animationDelay: '0.8s', backgroundColor: '#FFFFFF' }} />
            <div className="hero-twinkling-star top-12 right-1/3 w-1.5 h-1.5" style={{ animationDuration: '4.1s', animationDelay: '1.2s', backgroundColor: '#FDE7DA' }} />
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
              alt="أسطورة العنقاء المحلقة فوق واحة النخيل"
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
                {ar.home.heroBadge}
              </span>

              <h2 className="font-['Aref_Ruqaa',serif] text-2xl sm:text-3xl font-bold text-white leading-tight tracking-wide drop-shadow-sm">
                {ar.home.heroTitle}
              </h2>

              <p className="text-xs text-white/90 font-['Cairo',sans-serif] mt-1.5 leading-relaxed line-clamp-2 max-w-sm">
                {anqaEntry.summary}
              </p>

              {/* Action pill button "اقرأ القصة ←" */}
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
                  <ChevronLeft size={16} />
                </button>

                <span className="text-[11px] text-white/90 font-medium">
                  {formatReadingTime(getEstimatedReadingTime(anqaEntry))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4.5. Section "أقوامٌ وحضارات" (Horizontal scroll of civilization cards) */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div>
            <h2
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-xl sm:text-2xl font-bold leading-tight"
            >
              أقوامٌ وحضارات
            </h2>
            <p
              style={{ color: tokens.textSecondary }}
              className="text-xs font-['Cairo',sans-serif] mt-0.5"
            >
              ممالك وحواضر شبه الجزيرة العربية عبر العصور
            </p>
          </div>
          {onExploreCivilizations && (
            <button
              type="button"
              onClick={onExploreCivilizations}
              style={{ color: tokens.deepAccent }}
              className="text-xs font-bold hover:underline flex items-center gap-0.5 cursor-pointer min-h-[44px] px-1"
            >
              <span>عرض الكل</span>
              <ChevronLeft size={14} />
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
                      <div className="absolute top-2 right-2">
                        <span
                          style={{
                            backgroundColor: isDark ? 'rgba(74, 144, 217, 0.4)' : 'rgba(232, 241, 251, 0.95)',
                            color: isDark ? '#A7E5C8' : '#1F5896',
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs backdrop-blur-xs"
                        >
                          <Calendar size={10} />
                          <span>{civ.era}</span>
                        </span>
                      </div>
                      <div className="absolute bottom-2 right-2.5 left-2.5 flex items-center justify-between text-white text-xs">
                        <span className="font-['Aref_Ruqaa',serif] text-base font-bold drop-shadow-sm">
                          {civ.name}
                        </span>
                        <span className="text-[10px] opacity-90">
                          {(civ.cities || []).length} حواضر
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
                            <span>{civ.era}</span>
                          </span>

                          <span
                            style={{ color: tokens.textSecondary }}
                            className="text-[10px] font-medium"
                          >
                            {(civ.cities || []).length} حواضر
                          </span>
                        </div>

                        <h3
                          style={{ color: tokens.deepAccent }}
                          className="font-['Aref_Ruqaa',serif] text-lg font-bold"
                        >
                          {civ.name}
                        </h3>
                      </div>
                    )}

                    <div
                      style={{ color: tokens.textSecondary }}
                      className="flex items-center gap-1 text-[11px]"
                    >
                      <MapPin size={11} className="shrink-0 opacity-70" />
                      <span className="truncate">{civ.region}</span>
                    </div>

                    <div
                      style={{ color: tokens.coolBlueAccent }}
                      className="pt-2 border-t flex items-center justify-between text-xs font-bold"
                    >
                      <span>استكشف الحضارة</span>
                      <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
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
              <span
                style={{
                  backgroundColor: tokens.primaryMint,
                  color: '#0E5C4D',
                }}
                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full"
              >
                تبويب جديد
              </span>
              <h3 style={{ color: tokens.deepAccent }} className="font-['Aref_Ruqaa',serif] text-base font-bold">
                أقوامٌ وحضارات الجزيرة العربية
              </h3>
              <p style={{ color: tokens.textSecondary }} className="text-xs">
                استكشف تاريخ ممالك عاد، ثمود، سبأ، مدين، والأنباط وحواضرها القديمة.
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
          subtitle={ar.home.mostReadSubtitle}
          action={
            <button
              type="button"
              onClick={() => setShowAllMostRead((v) => !v)}
              style={{ color: tokens.deepAccent }}
              className="text-xs font-bold hover:underline flex items-center gap-0.5 cursor-pointer min-h-[44px] px-1"
            >
              <span>{showAllMostRead ? ar.home.showLess : ar.home.showAll}</span>
              <ChevronLeft size={14} />
            </button>
          }
        />

        <div className="mt-3 space-y-2.5">
          {mostReadEntries.map((entry) => (
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
                <img
                  src={entry.heroImage}
                  alt={entry.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  decoding="async"
                />
              </div>

              {/* Center: Arabic title & subtitle */}
              <div className="flex-1 min-w-0 text-right">
                <h3
                  style={{ color: tokens.textPrimary }}
                  className="font-['Aref_Ruqaa',serif] text-base font-bold transition-colors truncate"
                >
                  {entry.name}
                </h3>
                <p
                  style={{ color: tokens.textSecondary }}
                  className="text-xs font-['Cairo',sans-serif] mt-0.5 line-clamp-1 leading-relaxed"
                >
                  {entry.summary}
                </p>
                <span
                  style={{ color: tokens.deepAccent }}
                  className="text-[10px] font-medium mt-1 block"
                >
                  {entry.region}
                </span>
              </div>

              {/* Left in RTL: Tag pill & reading time */}
              <div className="shrink-0 flex flex-col items-end gap-1.5">
                <Tag variant={getTagVariant(entry.tags[0])} size="sm">
                  {entry.tags[0]}
                </Tag>
                <span
                  style={{ color: tokens.textSecondary }}
                  className="text-[10px] font-mono font-medium"
                >
                  {formatReadingTime(getEstimatedReadingTime(entry))}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Floating Action Button: فاجئني */}
      <SurpriseMeButton onSelectEntry={(entry) => onSelectEntry(entry)} />
    </div>
  );
};

export default HomeScreen;
