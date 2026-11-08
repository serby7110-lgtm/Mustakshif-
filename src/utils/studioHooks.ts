/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Studio Hooks Extraction, Filter, and Export Utilities
 * For game developers and story writers exploring Arab mythology.
 */

import { DeepStoriesMap } from '../data/storyTypes';
import { MythEntry } from '../data/types';

export type HookType = 'game' | 'writing';

export interface AggregatedHook {
  id: string;
  text: string;
  type: HookType;
  mythId: string;
  mythName: string;
  mythCategory: string;
  themes: string[];
}

export interface CategoryFilterOption {
  id: string;
  label: string;
}

export const STUDIO_CATEGORY_OPTIONS: CategoryFilterOption[] = [
  { id: 'all', label: 'الكل' },
  { id: 'creatures', label: 'كائنات' },
  { id: 'places', label: 'أماكن' },
  { id: 'gods', label: 'آلهة' },
  { id: 'heroes', label: 'أبطال' },
  { id: 'personalities', label: 'شخصيات' },
  { id: 'rituals', label: 'طقوس' },
  { id: 'sa3aleek', label: 'صعاليك' },
  { id: 'kings', label: 'ملوك' },
  { id: 'seers', label: 'عرافون' },
];

/**
 * Resolves a myth entry for a given story key (e.g. 'ghul', 'irm', 'al-ghul')
 */
export function resolveMythForStoryKey(
  storyKey: string,
  mythEntries: MythEntry[]
): MythEntry | undefined {
  if (!storyKey) return undefined;

  // Direct ID match
  const exact = mythEntries.find((m) => m.id === storyKey);
  if (exact) return exact;

  // Prefix al- match
  const withAl = mythEntries.find((m) => m.id === `al-${storyKey}`);
  if (withAl) return withAl;

  // Stripped al- match
  if (storyKey.startsWith('al-')) {
    const stripped = storyKey.slice(3);
    const withoutAl = mythEntries.find((m) => m.id === stripped);
    if (withoutAl) return withoutAl;
  }

  // Known alias mappings
  if (storyKey === 'irm') {
    const iram = mythEntries.find((m) => m.id === 'iram-dhat-al-imad' || m.id === 'irm');
    if (iram) return iram;
  }

  // Name substring fallback
  const byName = mythEntries.find(
    (m) => m.name.includes(storyKey) || (m.latinName && m.latinName.toLowerCase().includes(storyKey.toLowerCase()))
  );
  if (byName) return byName;

  return undefined;
}

/**
 * Extracts and aggregates all gameHooks and writingHooks from stories
 */
export function getAggregatedHooks(
  stories: DeepStoriesMap,
  mythEntries: MythEntry[]
): AggregatedHook[] {
  const result: AggregatedHook[] = [];

  for (const [storyKey, story] of Object.entries(stories)) {
    if (!story) continue;

    const matchedMyth = resolveMythForStoryKey(storyKey, mythEntries);
    const mythId = matchedMyth ? matchedMyth.id : storyKey;
    const mythName = matchedMyth ? matchedMyth.name : storyKey;
    const mythCategory = matchedMyth ? matchedMyth.category : 'other';
    const themes = Array.isArray(story.themes) ? story.themes : [];

    // Game hooks
    if (Array.isArray(story.gameHooks)) {
      story.gameHooks.forEach((hookText, index) => {
        if (!hookText || typeof hookText !== 'string') return;
        result.push({
          id: `${storyKey}_game_${index}`,
          text: hookText.trim(),
          type: 'game',
          mythId,
          mythName,
          mythCategory,
          themes,
        });
      });
    }

    // Writing hooks
    if (Array.isArray(story.writingHooks)) {
      story.writingHooks.forEach((hookText, index) => {
        if (!hookText || typeof hookText !== 'string') return;
        result.push({
          id: `${storyKey}_writing_${index}`,
          text: hookText.trim(),
          type: 'writing',
          mythId,
          mythName,
          mythCategory,
          themes,
        });
      });
    }
  }

  return result;
}

/**
 * Returns the unique union of all themes across all stories
 */
export function extractAllThemes(stories: DeepStoriesMap): string[] {
  const set = new Set<string>();
  for (const story of Object.values(stories)) {
    if (!story || !Array.isArray(story.themes)) continue;
    for (const theme of story.themes) {
      if (theme && typeof theme === 'string') {
        const trimmed = theme.trim();
        if (trimmed) set.add(trimmed);
      }
    }
  }
  return Array.from(set);
}

/**
 * Filters hooks by selected category and theme
 */
export function filterHooks(
  hooks: AggregatedHook[],
  selectedCategory: string,
  selectedTheme: string
): AggregatedHook[] {
  return hooks.filter((hook) => {
    // Category match
    if (selectedCategory && selectedCategory !== 'all') {
      if (hook.mythCategory !== selectedCategory) {
        return false;
      }
    }

    // Theme match
    if (selectedTheme && selectedTheme !== 'all') {
      if (!hook.themes.includes(selectedTheme)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Formats a list of hooks into a clean plain-text list for clipboard/export:
 * "${hookText} — ${mythName}"
 */
export function formatHooksForExport(hooks: AggregatedHook[]): string {
  if (!hooks || hooks.length === 0) return '';
  return hooks.map((h) => `${h.text} — ${h.mythName}`).join('\n\n');
}

export interface AggregatedQuote {
  id: string;
  text: string;
  source: string;
  type: 'نص حرفي' | 'بأسلوب المصدر' | string;
  mythId: string;
  mythName: string;
}

/**
 * Extracts and aggregates all quotes from stories.json
 */
export function getAggregatedQuotes(
  stories: DeepStoriesMap,
  mythEntries: MythEntry[]
): AggregatedQuote[] {
  const result: AggregatedQuote[] = [];

  for (const [storyKey, story] of Object.entries(stories)) {
    if (!story || !Array.isArray(story.quotes)) continue;

    const matchedMyth = resolveMythForStoryKey(storyKey, mythEntries);
    const mythId = matchedMyth ? matchedMyth.id : storyKey;
    const mythName = matchedMyth ? matchedMyth.name : storyKey;

    story.quotes.forEach((q, index) => {
      if (!q || !q.text) return;
      result.push({
        id: `${storyKey}_quote_${index}`,
        text: q.text.trim(),
        source: (q.source || '').trim(),
        type: (q.type || 'نص حرفي').trim(),
        mythId,
        mythName,
      });
    });
  }

  return result;
}

/**
 * Filters quotes by type (الكل / نص حرفي / بأسلوب المصدر) and search input
 * with Arabic normalization (alef/hamza/taa-marbuta folding).
 */
export function filterQuotes(
  quotes: AggregatedQuote[],
  typeFilter: string,
  searchQuery: string,
  normalizer?: (t: string) => string
): AggregatedQuote[] {
  const normalize = normalizer || ((t: string) => t.trim().toLowerCase());
  const normQuery = searchQuery ? normalize(searchQuery) : '';

  return quotes.filter((quote) => {
    // Type filter
    if (typeFilter && typeFilter !== 'all' && typeFilter !== 'الكل') {
      if (quote.type !== typeFilter) {
        return false;
      }
    }

    // Search filter across text, source, and mythName
    if (normQuery) {
      const normText = normalize(quote.text);
      const normSource = normalize(quote.source);
      const normMyth = normalize(quote.mythName);

      if (
        !normText.includes(normQuery) &&
        !normSource.includes(normQuery) &&
        !normMyth.includes(normQuery)
      ) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Formats quote for copy: text + " — " + source
 */
export function formatQuoteForCopy(quote: AggregatedQuote): string {
  if (!quote) return '';
  return `${quote.text} — ${quote.source}`;
}

