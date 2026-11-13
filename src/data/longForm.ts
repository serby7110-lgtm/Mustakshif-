import longFormEntriesJson from './longFormEntries.json';
import { MythCategory, MythEntry } from './types';

export interface LongFormChapter {
  id: string;
  index: number;
  title: string;
  evidenceLabel: string;
  isAppendix: boolean;
  isFree: boolean;
  estimatedWords: number;
  contentPending: boolean;
  paragraphs: string[];
}

export interface LongFormEntryData extends Omit<MythEntry, 'category'> {
  category: string;
  categoryKey: MythCategory;
  entryType: string;
  isLongForm: boolean;
  isPremium: boolean;
  isHistorical: boolean;
  requiredSubscription: 'premium_monthly';
  evidenceLabels: string[];
  targetWords: number;
  chapters: LongFormChapter[];
}

export const LONG_FORM_ENTRIES: LongFormEntryData[] =
  longFormEntriesJson as unknown as LongFormEntryData[];

export function getLongFormEntryById(id: string): LongFormEntryData | undefined {
  return LONG_FORM_ENTRIES.find((entry) => entry.id === id);
}

export function isLongFormEntry(id: string): boolean {
  return LONG_FORM_ENTRIES.some((entry) => entry.id === id);
}

export function toLibraryMythEntry(entry: LongFormEntryData): MythEntry {
  return {
    id: entry.id,
    name: entry.name,
    latinName: entry.latinName,
    category: entry.categoryKey,
    typeLabel: entry.entryType,
    heroImage: entry.heroImage.startsWith('/') ? entry.heroImage : `/${entry.heroImage}`,
    summary: entry.summary,
    body: entry.body,
    sources: entry.sources,
    timeline: entry.timeline,
    region: entry.region,
    related: entry.related,
    tags: entry.tags,
    approxYear: entry.approxYear,
    isLongForm: entry.isLongForm,
    isPremium: entry.isPremium,
    isHistorical: entry.isHistorical,
    entryType: entry.entryType,
    evidenceLabels: entry.evidenceLabels,
    targetWords: entry.targetWords,
    requiredSubscription: entry.requiredSubscription,
  };
}

export function isChapterUnlocked(
  entry: LongFormEntryData,
  chapterIndex: number,
  hasPremiumMonthly: boolean
): boolean {
  const ch = entry.chapters[chapterIndex];
  if (!ch) return false;
  return ch.index === 0 || ch.isFree || !entry.isPremium || hasPremiumMonthly;
}
