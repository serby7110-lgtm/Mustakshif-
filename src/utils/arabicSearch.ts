/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Arabic Search & Normalization Engine (مستكشف)
 * Full Arabic diacritic stripping, letter folding (Alef, Taa Marbuta, Yaa),
 * and definite article ("ال") stripping so "الغول" and "غول" both match.
 */

import { MythEntry } from '../data/types';

/**
 * Normalizes Arabic text for flexible matching:
 * 1. Strips Tashkeel (harakat / diacritics: Fatha, Damma, Kasra, Sukun, Tanween, Shadda)
 * 2. Normalizes Alef variations: [أإآا] -> ا
 * 3. Normalizes Taa Marbuta: [ة] -> ه
 * 4. Normalizes Yaa / Alef Maqsura: [ىي] -> ي
 * 5. Removes Tatweel / Kashida (ـ)
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';

  return text
    // Remove diacritics / tashkeel
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Remove Tatweel / Kashida
    .replace(/\u0640/g, '')
    // Normalize Alef variants
    .replace(/[أإآا]/g, 'ا')
    // Normalize Taa Marbuta to Haa
    .replace(/ة/g, 'ه')
    // Normalize Yaa / Alef Maqsura
    .replace(/[ىي]/g, 'ي')
    // Trim and lower case (for latinNames)
    .trim()
    .toLowerCase();
}

/**
 * Strips the Arabic definite article "ال" prefix if present
 */
export function stripDefiniteArticle(text: string): string {
  const norm = normalizeArabic(text);
  if (norm.startsWith('ال') && norm.length > 2) {
    return norm.slice(2);
  }
  return norm;
}

export interface SearchMatch {
  entry: MythEntry;
  score: number;
  matchedField: 'name' | 'summary' | 'tags' | 'body' | 'region';
  snippet?: string;
}

export interface PrebuiltSearchItem {
  entry: MythEntry;
  normName: string;
  bareName: string;
  normSummary: string;
  normRegion: string;
  normTags: string[];
  latinName: string;
  normBody: string[];
}

let _prebuiltIndex: PrebuiltSearchItem[] | null = null;

export function buildSearchIndex(entries: MythEntry[]): PrebuiltSearchItem[] {
  _prebuiltIndex = entries.map((entry) => ({
    entry,
    normName: normalizeArabic(entry.name),
    bareName: stripDefiniteArticle(entry.name),
    normSummary: normalizeArabic(entry.summary),
    normRegion: normalizeArabic(entry.region),
    normTags: entry.tags.map((t) => normalizeArabic(t)),
    latinName: (entry.latinName || '').toLowerCase(),
    normBody: entry.body.map((p) => normalizeArabic(p)),
  }));
  return _prebuiltIndex;
}

export function getOrBuildSearchIndex(entries: MythEntry[]): PrebuiltSearchItem[] {
  if (!_prebuiltIndex || _prebuiltIndex.length !== entries.length) {
    return buildSearchIndex(entries);
  }
  return _prebuiltIndex;
}

/**
 * Searches across name, summary, body, tags, and region with Arabic normalization.
 * Matches both with and without "ال" (e.g. "غول" matches "الغول", "عنقاء" matches "العنقاء").
 * Uses pre-built search index for maximum performance.
 */
export function searchEntries(entries: MythEntry[], rawQuery: string): SearchMatch[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const normQuery = normalizeArabic(query);
  const bareQuery = stripDefiniteArticle(query);
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);

  const index = getOrBuildSearchIndex(entries);
  const results: SearchMatch[] = [];

  for (const item of index) {
    const { entry, normName, bareName, normSummary, normRegion, normTags, latinName, normBody } = item;

    let score = 0;
    let matchedField: SearchMatch['matchedField'] = 'name';
    let snippet: string | undefined = undefined;

    // 1. Direct or bare name match (Highest priority)
    if (normName === normQuery || bareName === bareQuery) {
      score += 100;
      matchedField = 'name';
    } else if (normName.includes(normQuery) || bareName.includes(bareQuery)) {
      score += 60;
      matchedField = 'name';
    } else if (latinName.includes(query.toLowerCase())) {
      score += 50;
      matchedField = 'name';
    }

    // 2. Tag match
    if (normTags.some((t) => t.includes(normQuery) || t.includes(bareQuery))) {
      score += 35;
      if (score < 40) matchedField = 'tags';
    }

    // 3. Region match
    if (normRegion.includes(normQuery) || normRegion.includes(bareQuery)) {
      score += 30;
      if (score < 40) matchedField = 'region';
    }

    // 4. Summary match
    if (normSummary.includes(normQuery) || normSummary.includes(bareQuery)) {
      score += 25;
      if (score < 40) {
        matchedField = 'summary';
        snippet = entry.summary;
      }
    }

    // 5. Body paragraphs match using pre-normalized normBody
    for (let i = 0; i < normBody.length; i++) {
      const normParagraph = normBody[i];
      if (normParagraph.includes(normQuery) || (bareQuery.length > 2 && normParagraph.includes(bareQuery))) {
        score += 15;
        if (!snippet) {
          matchedField = 'body';
          const paragraph = entry.body[i] || '';
          const idx = normParagraph.indexOf(normQuery !== '' ? normQuery : bareQuery);
          const start = Math.max(0, idx - 40);
          const end = Math.min(paragraph.length, idx + 80);
          snippet = (start > 0 ? '...' : '') + paragraph.substring(start, end).trim() + (end < paragraph.length ? '...' : '');
        }
        break;
      }
    }

    // 6. Multi-token partial matches
    if (score === 0 && queryTokens.length > 1) {
      const allTokensInEntry = queryTokens.every(
        (tok) =>
          normName.includes(tok) ||
          normSummary.includes(tok) ||
          normRegion.includes(tok)
      );
      if (allTokensInEntry) {
        score += 20;
        matchedField = 'summary';
      }
    }

    if (score > 0) {
      results.push({
        entry,
        score,
        matchedField,
        snippet: snippet || entry.summary,
      });
    }
  }

  // Sort descending by relevance score
  return results.sort((a, b) => b.score - a.score);
}

export interface SearchCivilizationMatch {
  civ: import('../data/civTypes').Civilization;
  score: number;
  matchedField: 'name' | 'region' | 'era' | 'cities' | 'prophet' | 'legacy' | 'chapters';
  snippet?: string;
}

/**
 * Searches civilizations across name, latinName, region, era, cities, prophet, and chapters
 */
export function searchCivilizations(
  civs: import('../data/civTypes').Civilization[],
  rawQuery: string
): SearchCivilizationMatch[] {
  const query = rawQuery.trim();
  if (!query) return [];

  const normQuery = normalizeArabic(query);
  const bareQuery = stripDefiniteArticle(query);
  const queryTokens = normQuery.split(/\s+/).filter(Boolean);

  const results: SearchCivilizationMatch[] = [];

  for (const civ of civs) {
    const normName = normalizeArabic(civ.name || '');
    const bareName = stripDefiniteArticle(civ.name || '');
    const normLatin = (civ.latinName || '').toLowerCase();
    const normRegion = normalizeArabic(civ.region || '');
    const normEra = normalizeArabic(civ.era || '');
    const normProphet = normalizeArabic(civ.prophet || '');
    const normCities = (civ.cities || []).map((c) => normalizeArabic(c));
    const normLegacy = normalizeArabic(civ.legacy || '');

    let score = 0;
    let matchedField: SearchCivilizationMatch['matchedField'] = 'name';
    let snippet: string | undefined = undefined;

    // 1. Name match
    if (normName === normQuery || bareName === bareQuery) {
      score += 100;
      matchedField = 'name';
    } else if (normName.includes(normQuery) || bareName.includes(bareQuery)) {
      score += 65;
      matchedField = 'name';
    } else if (normLatin.includes(query.toLowerCase())) {
      score += 55;
      matchedField = 'name';
    }

    // 2. Prophet match
    if (normProphet.includes(normQuery) || (bareQuery.length > 2 && normProphet.includes(bareQuery))) {
      score += 45;
      if (score < 50) matchedField = 'prophet';
    }

    // 3. Cities match
    if (normCities.some((c) => c.includes(normQuery) || c.includes(bareQuery))) {
      score += 40;
      if (score < 50) matchedField = 'cities';
    }

    // 4. Region match
    if (normRegion.includes(normQuery) || normRegion.includes(bareQuery)) {
      score += 35;
      if (score < 50) matchedField = 'region';
    }

    // 5. Era match
    if (normEra.includes(normQuery) || normEra.includes(bareQuery)) {
      score += 30;
      if (score < 50) matchedField = 'era';
    }

    // 6. Legacy / chapters match
    if (normLegacy.includes(normQuery)) {
      score += 25;
      if (!snippet) {
        snippet = civ.legacy;
        if (score < 50) matchedField = 'legacy';
      }
    }

    for (const ch of civ.chapters || []) {
      const normChText = normalizeArabic(ch.text || '');
      if (normChText.includes(normQuery) || (bareQuery.length > 2 && normChText.includes(bareQuery))) {
        score += 20;
        if (!snippet) {
          matchedField = 'chapters';
          const idx = normChText.indexOf(normQuery !== '' ? normQuery : bareQuery);
          const start = Math.max(0, idx - 40);
          const end = Math.min(ch.text.length, idx + 80);
          snippet = (start > 0 ? '...' : '') + ch.text.substring(start, end).trim() + (end < ch.text.length ? '...' : '');
        }
        break;
      }
    }

    // Multi-token match
    if (score === 0 && queryTokens.length > 1) {
      const allMatch = queryTokens.every(
        (tok) =>
          normName.includes(tok) ||
          normRegion.includes(tok) ||
          normEra.includes(tok) ||
          normCities.some((c) => c.includes(tok))
      );
      if (allMatch) {
        score += 25;
        matchedField = 'region';
      }
    }

    if (score > 0) {
      results.push({
        civ,
        score,
        matchedField,
        snippet: snippet || civ.economy || civ.region,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
