/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure testable logic for Mustakshif content catalog filtering,
 * Story of the Day selection, Random Story discovery, Cross-Cultural
 * Tag comparisons, and Creature <-> Story relationship resolution.
 */

import type { AppLang } from '../i18n';
import type { ContentItem, ContentType, CreatureEntry, CreatureKind } from '../content/catalogTypes';
import { normalizeArabic } from './arabicSearch';

export interface ContentFilterCriteria {
  type?: ContentType | 'all';
  culture?: string | 'all';
  tag?: string | 'all';
  query?: string;
  onlyFavorites?: boolean;
  favoriteIds?: string[];
  lang?: AppLang;
}

/**
 * Filter ContentItem catalog by content type, culture, tag, favorites, and text search.
 */
export function filterContentItems(
  items: ContentItem[],
  criteria: ContentFilterCriteria = {}
): ContentItem[] {
  const {
    type = 'all',
    culture = 'all',
    tag = 'all',
    query = '',
    onlyFavorites = false,
    favoriteIds = [],
  } = criteria;

  const trimmedQuery = query.trim();
  const normQ = normalizeArabic(trimmedQuery);
  const lowerQ = trimmedQuery.toLowerCase();
  const favSet = onlyFavorites ? new Set(favoriteIds) : null;

  return items.filter((item) => {
    if (!item) return false;
    if (type !== 'all' && item.type !== type) return false;
    if (culture !== 'all' && item.culture !== culture) return false;
    if (tag !== 'all' && !item.tags.includes(tag)) return false;
    if (favSet && !favSet.has(item.id)) return false;

    if (trimmedQuery.length > 0) {
      const titles = Object.values(item.title).join(' ');
      const summaries = Object.values(item.summary).join(' ');
      const bodies = Object.values(item.text)
        .flat()
        .join(' ');
      const regions = Object.values(item.region.label).join(' ');
      const tags = item.tags.join(' ');
      const sources = `${Object.values(item.source.title).join(' ')} ${Object.values(item.source.author).join(' ')}`;

      const haystack = `${titles} ${summaries} ${regions} ${tags} ${sources} ${item.culture} ${bodies}`;
      const normHaystack = normalizeArabic(haystack);
      const lowerHaystack = haystack.toLowerCase();

      if (!normHaystack.includes(normQ) && !lowerHaystack.includes(lowerQ)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Deterministic "Story of the Day" (قصة اليوم) seeded by calendar date.
 * Prioritizes featured public-domain curated stories when present so every day
 * highlights a complete 4-language narrative with full metadata.
 */
export function getStoryOfTheDay(items: ContentItem[], date: Date = new Date()): ContentItem | undefined {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const featured = items.filter((i) => i.isPublicDomain);
  const pool = featured.length > 0 ? featured : items;

  const year = date.getUTCFullYear();
  const startOfYear = Date.UTC(year, 0, 0);
  const todayUtc = Date.UTC(year, date.getUTCMonth(), date.getUTCDate());
  const dayOfYear = Math.max(0, Math.floor((todayUtc - startOfYear) / 86_400_000));

  return pool[dayOfYear % pool.length];
}

/**
 * Pick a random story from items, optionally excluding the currently viewed story
 * when more than one item exists.
 */
export function pickRandomStory(
  items: ContentItem[],
  excludeId?: string,
  rng: () => number = Math.random
): ContentItem | undefined {
  if (!Array.isArray(items) || items.length === 0) return undefined;
  const pool = excludeId && items.length > 1 ? items.filter((item) => item.id !== excludeId) : items;
  if (pool.length === 0) return items[0];
  const rawIndex = Math.floor(Math.max(0, Math.min(0.999999999, rng())) * pool.length);
  return pool[rawIndex];
}

export interface CultureComparisonGroup {
  culture: string;
  items: ContentItem[];
}

export interface CrossCulturalTagComparison {
  tag: string;
  totalStories: number;
  cultureCount: number;
  groups: CultureComparisonGroup[];
}

/**
 * Group all stories matching `tag` by `culture` so the Tag page can present
 * the "عبر الثقافات" (Across Cultures) comparison matrix.
 */
export function getCrossCulturalTagComparison(
  items: ContentItem[],
  tag: string
): CrossCulturalTagComparison {
  const matching = items.filter((item) => item.tags.includes(tag));
  const grouped = new Map<string, ContentItem[]>();

  for (const item of matching) {
    const existing = grouped.get(item.culture);
    if (existing) {
      existing.push(item);
    } else {
      grouped.set(item.culture, [item]);
    }
  }

  const groups: CultureComparisonGroup[] = Array.from(grouped.entries())
    .map(([culture, groupItems]) => ({
      culture,
      items: groupItems,
    }))
    .sort((a, b) => b.items.length - a.items.length || a.culture.localeCompare(b.culture));

  return {
    tag,
    totalStories: matching.length,
    cultureCount: groups.length,
    groups,
  };
}

/**
 * Return unique culture keys ordered by frequency descending.
 */
export function getUniqueCultures(items: ContentItem[]): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    if (!item.culture) continue;
    counts.set(item.culture, (counts.get(item.culture) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([culture]) => culture);
}

/**
 * Return unique tag keys ordered by frequency descending.
 */
export function getUniqueTags(items: ContentItem[]): string[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of item.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

/**
 * Filter creatures by kind (deity | spirit | creature | all) and optional text query.
 */
export function filterCreatures(
  creatures: CreatureEntry[],
  kind: CreatureKind | 'all' = 'all',
  query: string = ''
): CreatureEntry[] {
  const trimmed = query.trim();
  const normQ = normalizeArabic(trimmed);
  const lowerQ = trimmed.toLowerCase();

  return creatures.filter((creature) => {
    if (kind !== 'all' && creature.kind !== kind) return false;
    if (!trimmed) return true;
    const text = [
      ...Object.values(creature.name),
      ...Object.values(creature.epithet),
      ...Object.values(creature.description),
      ...Object.values(creature.attributes).flat(),
      creature.culture,
    ].join(' ');
    return normalizeArabic(text).includes(normQ) || text.toLowerCase().includes(lowerQ);
  });
}

/**
 * Resolve all stories linked to a creature (checking both `creature.storyIds`
 * and `item.creatureIds` so links are always symmetrical).
 */
export function getStoriesForCreature(
  creature: CreatureEntry,
  items: ContentItem[]
): ContentItem[] {
  const directIds = new Set(creature.storyIds);
  if (creature.legacyMythId) directIds.add(creature.legacyMythId);
  return items.filter(
    (item) => directIds.has(item.id) || Boolean(item.creatureIds?.includes(creature.id))
  );
}

/**
 * Resolve all creatures linked to a given story ID cleanly.
 */
export function getCreaturesForStory(
  storyId: string,
  creatures: CreatureEntry[],
  explicitCreatureIds?: string[]
): CreatureEntry[] {
  const explicitSet = new Set(explicitCreatureIds ?? []);
  return creatures.filter(
    (creature) =>
      explicitSet.has(creature.id) ||
      creature.storyIds.includes(storyId) ||
      creature.legacyMythId === storyId
  );
}
