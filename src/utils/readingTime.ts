/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Reading Time Utility (مستكشف)
 * Computes estimated reading time based on Arabic words (~180 words/min).
 */

import { MythEntry } from '../data/types';
import { getDeepStory } from '../data/storyTypes';
import { getLongFormEntryById } from '../data/longForm';

const ARABIC_WORDS_PER_MINUTE = 180;

/**
 * Counts words in a string, handling Arabic text, punctuation, and whitespace.
 */
export function countWords(text?: string | null): number {
  if (!text || typeof text !== 'string') return 0;
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

/**
 * Estimates reading time in minutes for a myth entry (body + ALL chapters + ALL quotes).
 * Formula: Math.max(1, Math.ceil(totalWords / 180))
 */
export function getEstimatedReadingTime(entry?: MythEntry | null): number {
  if (!entry) return 1;

  // Words from standard entry body
  const safeBody = Array.isArray(entry.body) ? entry.body : [];
  const bodyWords = safeBody.reduce((acc, p) => acc + countWords(p), 0);

  // Words from ALL deep story chapters and quotes if present
  let deepWords = 0;
  try {
    const deep = entry.id ? getDeepStory(entry.id) : undefined;
    if (deep) {
      if (Array.isArray(deep.chapters)) {
        deepWords += deep.chapters.reduce(
          (acc, ch) => acc + countWords(ch?.title) + countWords(ch?.text),
          0
        );
      }
      if (Array.isArray(deep.quotes)) {
        deepWords += deep.quotes.reduce(
          (acc, q) => acc + countWords(q?.text) + countWords(q?.source),
          0
        );
      }
    }
  } catch {
    deepWords = 0;
  }

  // Words from ALL long-form chapters (preferring live longForm entry or entry.chapters)
  let longFormWords = 0;
  try {
    const lf = entry.id ? getLongFormEntryById(entry.id) : undefined;
    const lfChapters = Array.isArray(lf?.chapters) ? lf.chapters : [];
    const entryChapters = Array.isArray(entry.chapters) ? entry.chapters : [];
    const chapters = lfChapters.length > 0 ? lfChapters : entryChapters;
    if (chapters.length > 0) {
      longFormWords = chapters.reduce(
        (acc, ch) =>
          acc +
          countWords(ch?.title) +
          (Array.isArray(ch?.paragraphs) ? ch.paragraphs : []).reduce((pAcc, p) => pAcc + countWords(p), 0),
        0
      );
    }
  } catch {
    longFormWords = 0;
  }

  // Quotes attached directly to entry object if any
  const directQuotes = (entry as unknown as { quotes?: Array<{ text?: string; source?: string }> }).quotes;
  let directQuoteWords = 0;
  if (Array.isArray(directQuotes)) {
    directQuoteWords = directQuotes.reduce(
      (acc, q) => acc + countWords(q?.text ?? '') + countWords(q?.source ?? ''),
      0
    );
  }

  const totalWords = bodyWords + deepWords + longFormWords + directQuoteWords;
  return Math.max(1, Math.ceil(totalWords / ARABIC_WORDS_PER_MINUTE));
}

/**
 * Formats reading time in minutes into localized string ("≈ X د قراءة", "≈ X min read", etc.)
 */
export function formatReadingTime(minutes: number, lang: 'ar' | 'en' | 'id' | 'th' = 'ar'): string {
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes) : 1;
  switch (lang) {
    case 'en':
      return `≈ ${safeMinutes} min read`;
    case 'id':
      return `≈ ${safeMinutes} mnt baca`;
    case 'th':
      return `≈ อ่าน ${safeMinutes} นาที`;
    case 'ar':
    default:
      return `≈ ${safeMinutes} د قراءة`;
  }
}
