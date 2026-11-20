/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Library & Profile v2 Business Logic & Calculation Utilities
 */

import { MythEntry } from '../data/types';
import { getEstimatedReadingTime } from './readingTime';

export type SortOption = 'latest' | 'mostRead' | 'alphabetical';
export type ReadingStatusFilter = 'all' | 'unread' | 'reading' | 'completed';
export type ViewMode = 'grid' | 'list';

export interface ProfileStats {
  completedCount: number;
  readChaptersCount: number;
  bookmarksCount: number;
  estimatedReadingMinutes: number;
  favoriteQuotesCount: number;
}

export interface BadgeItem {
  id: string;
  name: string;
  description: string;
  target: number;
  current: number;
  unlocked: boolean;
  unit?: string;
  iconType: 'desert' | 'temple' | 'map' | 'stories' | 'ideas' | 'night';
}

/**
 * Returns reading status for an entry:
 * - 'reading' if progress > 0 and < 100
 * - 'completed' if progress >= 100
 * - 'unread' otherwise
 */
export function getReadingStatus(
  entryId: string,
  progressMap: Record<string, number> = {}
): 'unread' | 'reading' | 'completed' {
  if (typeof entryId !== 'string' || !entryId || !progressMap) return 'unread';
  const bareId = entryId.startsWith('al-') ? entryId.slice(3) : entryId;
  const raw = progressMap[entryId] ?? progressMap[`al-${bareId}`] ?? progressMap[bareId] ?? 0;
  const p = Number.isFinite(raw) ? raw : 0;
  if (p >= 100) return 'completed';
  if (p > 0) return 'reading';
  return 'unread';
}

/**
 * Sorts myths by selected sort option
 */
export function sortMyths(
  myths: MythEntry[] = [],
  sortBy: SortOption,
  progressMap: Record<string, number> = {}
): MythEntry[] {
  const safeMap = progressMap ?? {};
  const list = Array.isArray(myths) ? [...myths.filter(Boolean)] : [];

  switch (sortBy) {
    case 'alphabetical':
      return list.sort((a, b) => (a?.name ?? '').localeCompare(b?.name ?? '', 'ar'));

    case 'mostRead':
      return list.sort((a, b) => {
        const pB = safeMap[b?.id ?? ''] ?? (safeMap[`al-${b?.id ?? ''}`] ?? 0);
        const pA = safeMap[a?.id ?? ''] ?? (safeMap[`al-${a?.id ?? ''}`] ?? 0);
        const numB = Number.isFinite(pB) ? pB : 0;
        const numA = Number.isFinite(pA) ? pA : 0;
        if (numB !== numA) return numB - numA;
        // Secondary sort: reading time (longer stories first)
        return getEstimatedReadingTime(b) - getEstimatedReadingTime(a);
      });

    case 'latest':
    default:
      return list;
  }
}

/**
 * Filters myths by reading status
 */
export function filterMythsByReadingStatus(
  myths: MythEntry[] = [],
  filter: ReadingStatusFilter,
  progressMap: Record<string, number> = {}
): MythEntry[] {
  const safeMyths = Array.isArray(myths) ? myths.filter(Boolean) : [];
  if (filter === 'all') return safeMyths;

  return safeMyths.filter((m) => {
    const status = getReadingStatus(m.id ?? '', progressMap);
    return status === filter;
  });
}

/**
 * Computes profile overview stats
 */
export function computeProfileStats(
  allMyths: MythEntry[] = [],
  progressMap: Record<string, number> = {},
  readChapters: string[] = [],
  bookmarks: string[] = [],
  favoriteQuotesCount: number = 0
): ProfileStats {
  const safeMyths = Array.isArray(allMyths) ? allMyths.filter(Boolean) : [];
  const safeMap = progressMap ?? {};
  const safeReadChapters = Array.isArray(readChapters) ? readChapters : [];
  const safeBookmarks = Array.isArray(bookmarks) ? bookmarks : [];
  const safeQuotesCount = Number.isFinite(favoriteQuotesCount) && favoriteQuotesCount > 0 ? favoriteQuotesCount : 0;

  let completedCount = 0;
  let estimatedReadingMinutes = 0;

  for (const myth of safeMyths) {
    const rawProg = safeMap[myth.id ?? ''] ?? safeMap[`al-${myth.id ?? ''}`] ?? 0;
    const prog = Number.isFinite(rawProg) ? rawProg : 0;
    const est = getEstimatedReadingTime(myth);

    if (prog >= 100) {
      completedCount++;
      estimatedReadingMinutes += est;
    } else if (prog > 0) {
      // Partial estimated minutes
      estimatedReadingMinutes += Math.max(1, Math.round((est * prog) / 100));
    }
  }

  // Factor in deep chapters read
  estimatedReadingMinutes += Math.round(safeReadChapters.length * 1.5);

  return {
    completedCount,
    readChaptersCount: safeReadChapters.length,
    bookmarksCount: safeBookmarks.length,
    estimatedReadingMinutes: Math.max(1, estimatedReadingMinutes),
    favoriteQuotesCount: safeQuotesCount,
  };
}

/**
 * Computes the 6 specific profile badges
 */
export function computeBadges(
  allMyths: MythEntry[] = [],
  progressMap: Record<string, number> = {},
  bookmarks: string[] = [],
  starredHooks: string[] = [],
  mapSheetsOpened: number = 0,
  darkReadingMinutes: number = 0
): BadgeItem[] {
  const safeMyths = Array.isArray(allMyths) ? allMyths.filter(Boolean) : [];
  const safeMap = progressMap ?? {};
  const safeBookmarks = Array.isArray(bookmarks) ? bookmarks : [];
  const safeStarred = Array.isArray(starredHooks) ? starredHooks : [];

  // 1. "مستكشف الصحراء" (read 5 creature myths)
  const creatureMyths = safeMyths.filter((m) => m.category === 'creatures');
  const readCreatures = creatureMyths.filter((m) => {
    const p = safeMap[m.id ?? ''] ?? safeMap[`al-${m.id ?? ''}`] ?? 0;
    return Number.isFinite(p) && p > 0;
  }).length;

  // 2. "حارس المعبد" (read all gods)
  const godMyths = safeMyths.filter((m) => m.category === 'gods');
  const readGods = godMyths.filter((m) => {
    const p = safeMap[m.id ?? ''] ?? safeMap[`al-${m.id ?? ''}`] ?? 0;
    return Number.isFinite(p) && p > 0;
  }).length;
  const totalGods = godMyths.length > 0 ? godMyths.length : 10;

  // 3. "رحّالة الخرائط" (open 10 map sheets)
  const mapSheetsCount = Number.isFinite(mapSheetsOpened) && mapSheetsOpened > 0 ? mapSheetsOpened : 0;

  // 4. "جامع الحكايات" (10 bookmarks)
  const bookmarksCount = safeBookmarks.length;

  // 5. "صائد الأفكار" (star 10 hooks)
  const starredCount = safeStarred.length;

  // 6. "قارئ الليل" (read 30 min in dark mode)
  const nightMinutes = Number.isFinite(darkReadingMinutes) && darkReadingMinutes > 0 ? darkReadingMinutes : 0;

  return [
    {
      id: 'desert_explorer',
      name: 'مستكشف الصحراء',
      description: 'قراءة ٥ أساطير من عالم الكائنات والوحوش',
      target: 5,
      current: readCreatures,
      unlocked: readCreatures >= 5,
      iconType: 'desert',
    },
    {
      id: 'temple_guardian',
      name: 'حارس المعبد',
      description: 'قراءة جميع أساطير معبودات وأرباب العرب القديمة',
      target: totalGods,
      current: readGods,
      unlocked: totalGods > 0 && readGods >= totalGods,
      iconType: 'temple',
    },
    {
      id: 'map_traveler',
      name: 'رحّالة الخرائط',
      description: 'استكشاف وفتح ١٠ مواقع في خريطة الأساطير',
      target: 10,
      current: mapSheetsCount,
      unlocked: mapSheetsCount >= 10,
      iconType: 'map',
    },
    {
      id: 'story_collector',
      name: 'جامع الحكايات',
      description: 'حفظ ١٠ أساطير في مكتبتك الخاصة',
      target: 10,
      current: bookmarksCount,
      unlocked: bookmarksCount >= 10,
      iconType: 'stories',
    },
    {
      id: 'idea_hunter',
      name: 'صائد الأفكار',
      description: 'تمييز ١٠ أفكار وبذور سردية بنجمة في الاستوديو',
      target: 10,
      current: starredCount,
      unlocked: starredCount >= 10,
      iconType: 'ideas',
    },
    {
      id: 'night_reader',
      name: 'قارئ الليل',
      description: 'قراءة ٣٠ دقيقة في الوضع الليلي الهادئ',
      target: 30,
      current: nightMinutes,
      unlocked: nightMinutes >= 30,
      unit: 'د',
      iconType: 'night',
    },
  ];
}
