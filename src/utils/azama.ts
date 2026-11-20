/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure helpers for Kitab al-Azama search (Arabic normalized),
 * category filtering, sorting (world / page / alphabetical), and styling.
 */

import azamaRawData from '../data/azama.json';
import {
  AzamaCategory,
  AzamaCategoryMeta,
  AzamaEntry,
  AZAMA_CATEGORIES,
  AZAMA_CATEGORY_MAP,
} from '../data/azamaTypes';
import { normalizeArabic, stripDefiniteArticle } from './arabicSearch';

export type AzamaSortOption = 'world' | 'page' | 'alphabetical';

const ALL_AZAMA_ENTRIES: AzamaEntry[] = Array.isArray(azamaRawData)
  ? (azamaRawData as AzamaEntry[]).filter((item) => Boolean(item && item.id))
  : [];

const AZAMA_BY_ID: Map<string, AzamaEntry> = new Map(
  ALL_AZAMA_ENTRIES.map((entry) => [entry.id, entry])
);

export function getAllAzamaEntries(): AzamaEntry[] {
  return ALL_AZAMA_ENTRIES;
}

export function getAzamaEntriesCount(): number {
  return ALL_AZAMA_ENTRIES.length;
}

export function getAzamaEntryById(id?: string | null): AzamaEntry | undefined {
  if (!id) return undefined;
  return AZAMA_BY_ID.get(id);
}

export function getAzamaCategoryMeta(cat: AzamaCategory): AzamaCategoryMeta {
  return AZAMA_CATEGORY_MAP[cat] ?? AZAMA_CATEGORIES[0];
}

export function getAzamaCategoryCounts(entries: AzamaEntry[] = ALL_AZAMA_ENTRIES): Record<AzamaCategory, number> {
  const counts: Record<AzamaCategory, number> = {
    tabaqat: 0,
    mawadd: 0,
    malaika: 0,
    nar: 0,
    janna: 0,
    bad: 0,
    ashrat: 0,
    makh: 0,
    hashr: 0,
  };
  for (const entry of Array.isArray(entries) ? entries : []) {
    if (entry?.cat && entry.cat in counts) {
      counts[entry.cat] += 1;
    }
  }
  return counts;
}

export interface FilterAndSortAzamaOptions {
  query?: string;
  category?: AzamaCategory | 'all';
  sortBy?: AzamaSortOption;
}

export function isAzamaEntrySensitive(entry?: AzamaEntry | null): boolean {
  return Boolean(entry?.sensitive);
}

export function hasAzamaCaution(entry?: AzamaEntry | null): boolean {
  return Boolean(typeof entry?.caution === 'string' && entry.caution.trim().length > 0);
}

/**
 * Excludes sensitive entries and entries carrying caution from Home previews or feed highlights.
 */
export function getAzamaPreviewEntries(
  entries: AzamaEntry[] = ALL_AZAMA_ENTRIES
): AzamaEntry[] {
  return (Array.isArray(entries) ? entries : []).filter(
    (entry) => Boolean(entry) && !entry.sensitive && !hasAzamaCaution(entry)
  );
}

/**
 * Returns non-restricted snippet fields for cards/search results, or empty strings if sensitive or carrying caution.
 */
export function getAzamaCardSnippets(entry?: AzamaEntry | null): {
  quote: string;
  note: string;
} {
  if (!entry || entry.sensitive || hasAzamaCaution(entry)) {
    return { quote: '', note: '' };
  }
  return {
    quote: entry.quote ?? '',
    note: entry.note ?? '',
  };
}

/**
 * Notification payloads must strictly omit any sensitive or caution entry.
 */
export function formatAzamaNotificationPayload(
  entry?: AzamaEntry | null
): { title: string; body: string } | null {
  if (!entry || entry.sensitive || hasAzamaCaution(entry)) return null;
  return {
    title: entry.title ?? '',
    body: entry.note ?? '',
  };
}

export function filterAndSortAzamaEntries(
  entries: AzamaEntry[] = ALL_AZAMA_ENTRIES,
  options: FilterAndSortAzamaOptions = {}
): AzamaEntry[] {
  const { query = '', category = 'all', sortBy = 'world' } = options;
  const safeEntries = Array.isArray(entries) ? entries.filter(Boolean) : [];

  let list =
    category === 'all'
      ? [...safeEntries]
      : safeEntries.filter((entry) => entry.cat === category);

  const trimmedQuery = typeof query === 'string' ? query.trim() : '';
  if (trimmedQuery) {
    const normQuery = normalizeArabic(trimmedQuery);
    const bareQuery = stripDefiniteArticle(trimmedQuery);
    const tokens = normQuery.split(/\s+/).filter(Boolean);

    list = list.filter((entry) => {
      // Sensitive and caution entries never expose or match quote/note snippets in search
      const searchable =
        entry.sensitive || hasAzamaCaution(entry)
          ? `${entry.title ?? ''}`
          : `${entry.title ?? ''} ${entry.quote ?? ''} ${entry.note ?? ''}`;
      const haystack = normalizeArabic(searchable);
      if (haystack.includes(normQuery)) return true;
      if (bareQuery.length >= 2 && haystack.includes(bareQuery)) return true;
      if (tokens.length > 1) {
        return tokens.every((tok) => haystack.includes(tok));
      }
      return false;
    });
  }

  return sortAzamaEntries(list, sortBy);
}

export function sortAzamaEntries(
  entries: AzamaEntry[] = [],
  sortBy: AzamaSortOption = 'world'
): AzamaEntry[] {
  const list = Array.isArray(entries) ? [...entries.filter(Boolean)] : [];
  if (sortBy === 'page') {
    return list.sort(
      (a, b) => (a?.page ?? 0) - (b?.page ?? 0) || (a?.world ?? 0) - (b?.world ?? 0)
    );
  }
  if (sortBy === 'alphabetical') {
    return list.sort((a, b) => (a?.title ?? '').localeCompare(b?.title ?? '', 'ar'));
  }
  return list.sort(
    (a, b) => (a?.world ?? 0) - (b?.world ?? 0) || (a?.page ?? 0) - (b?.page ?? 0)
  );
}

export interface AzamaTagBadgeStyle {
  bg: string;
  border: string;
  text: string;
}

export function getAzamaTagBadgeStyle(
  tag: string | null | undefined,
  isDark: boolean
): AzamaTagBadgeStyle {
  const normalized = (typeof tag === 'string' ? tag : '').trim();
  if (normalized === 'مروي' || normalized.includes('مروي')) {
    return isDark
      ? { bg: 'rgba(61, 220, 151, 0.18)', border: 'rgba(61, 220, 151, 0.45)', text: '#9FE8CC' }
      : { bg: 'rgba(61, 220, 151, 0.16)', border: 'rgba(61, 220, 151, 0.48)', text: '#0E5C4D' };
  }
  if (normalizeArabic(normalized).includes(normalizeArabic('متخيل'))) {
    return isDark
      ? { bg: 'rgba(142, 123, 232, 0.24)', border: 'rgba(142, 123, 232, 0.5)', text: '#C9B2F0' }
      : { bg: 'rgba(142, 123, 232, 0.16)', border: 'rgba(142, 123, 232, 0.45)', text: '#583696' };
  }
  // 'مخطوط' or fallback muted cool slate-teal
  return isDark
    ? { bg: 'rgba(92, 123, 117, 0.25)', border: 'rgba(157, 184, 176, 0.35)', text: '#9DB8B0' }
    : { bg: 'rgba(92, 123, 117, 0.12)', border: 'rgba(92, 123, 117, 0.35)', text: '#5C7B75' };
}

/**
 * Returns contrast-safe foreground accent for any of the 8 registered category colors.
 */
export function getCategoryPillColors(
  hexColor: string | null | undefined,
  isDark: boolean
): {
  bg: string;
  border: string;
  text: string;
  dot: string;
} {
  const safeHex =
    typeof hexColor === 'string' && hexColor.trim() ? hexColor.trim() : '#4A90D9';
  if (isDark) {
    return {
      bg: `${safeHex}24`,
      border: `${safeHex}66`,
      text: safeHex,
      dot: safeHex,
    };
  }
  // On bright cool backgrounds (#C6F24E lime, #2FD8E8 cyan, #3DDC97 mint),
  // keep deep teal text for crisp WCAG contrast while preserving exact hex on dot & border.
  const needsDarkText = ['#C6F24E', '#2FD8E8', '#3DDC97'].includes(
    safeHex.toUpperCase()
  );
  return {
    bg: `${safeHex}1C`,
    border: `${safeHex}80`,
    text: needsDarkText ? '#0E5C4D' : safeHex,
    dot: safeHex,
  };
}
