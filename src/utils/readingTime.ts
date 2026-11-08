/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Reading Time Utility (مستكشف)
 * Computes estimated reading time based on Arabic words (~180 words/min).
 */

import { MythEntry } from '../data/types';
import { getDeepStory } from '../data/storyTypes';

const ARABIC_WORDS_PER_MINUTE = 180;

/**
 * Counts words in a string, handling Arabic text, punctuation, and whitespace.
 */
export function countWords(text: string): number {
  if (!text) return 0;
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

/**
 * Estimates reading time in minutes for a myth entry (body paragraphs + deep story chapters).
 * Formula: Math.max(1, Math.ceil(totalWords / 180))
 */
export function getEstimatedReadingTime(entry: MythEntry): number {
  if (!entry) return 1;

  // Words from standard entry body
  const bodyWords = (entry.body || []).reduce((acc, p) => acc + countWords(p), 0);

  // Words from summary
  const summaryWords = countWords(entry.summary || '');

  // Words from deep story chapters if present
  let deepWords = 0;
  try {
    const deep = getDeepStory(entry.id);
    if (deep && Array.isArray(deep.chapters)) {
      deepWords = deep.chapters.reduce((acc, ch) => acc + countWords(ch.title) + countWords(ch.text), 0);
    }
  } catch {
    deepWords = 0;
  }

  const totalWords = bodyWords + summaryWords + deepWords;
  return Math.max(1, Math.ceil(totalWords / ARABIC_WORDS_PER_MINUTE));
}

/**
 * Formats reading time in minutes into the required Arabic string: "≈ X د قراءة"
 */
export function formatReadingTime(minutes: number): string {
  return `≈ ${minutes} د قراءة`;
}
