/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Encyclopedia Data Models (مستكشف)
 */

import mythsJson from './myths.json';
import longFormEntriesJson from './longFormEntries.json';

export type MythCategory =
  | 'gods'
  | 'creatures'
  | 'places'
  | 'heroes'
  | 'rituals'
  | 'personalities'
  | 'sa3aleek'
  | 'kings'
  | 'seers';
export type MythTag = 'رعب' | 'تاريخ' | 'خرافي';
export type MythEra = 'جاهلية' | 'صدر الإسلام' | 'العصر العباسي' | string;
export type MythSource = { title: string; author: string; year: string };
export type MythTimelinePoint = { era: string; note: string };

export interface MythChapter {
  id: string;
  index: number;
  title: string;
  evidenceLabel: string;
  isAppendix: boolean;
  isFree: boolean;
  estimatedWords: number;
  contentPending: boolean;
  paragraphs: string[];
  wordCount?: number;
  estimatedReadingMinutes?: number;
}

export interface MythMetadata {
  chaptersCount?: number;
  totalWords?: number;
  estimatedReadingMinutes?: number;
  quotes?: { text: string; source: string; type: string }[];
  motifs?: string[];
  themes?: string[];
  cast?: string[];
  gameHooks: string[];
  writingHooks: string[];
}

export interface CategoryMetaItem {
  key: MythCategory;
  label: string;
  icon: 'runner' | 'crown' | 'crystal-ball' | 'sparkles' | 'landmark' | 'flame' | 'users' | 'sword';
  tileTint: string;
  subLabel?: string;
  countLabel?: string;
}

export interface MythEntry {
  id: string;
  name: string;
  latinName: string;
  category: MythCategory;
  typeLabel: string;
  heroImage: string;
  summary: string;
  body: string[];
  sources: { title: string; author: string; year: string }[];
  timeline: { era: string; note: string }[];
  region: string;
  related: string[];
  tags: ('رعب' | 'تاريخ' | 'خرافي')[];
  approxYear?: number;
  mythTradition?: string;
  mythAnalysis?: string;
  isLongForm?: boolean;
  isPremium?: boolean;
  isHistorical?: boolean;
  entryType?: string;
  evidenceLabels?: string[];
  targetWords?: number;
  requiredSubscription?: string;
  chapters?: MythChapter[];
  metadata?: MythMetadata;
}

const baseMyths: MythEntry[] = mythsJson as unknown as MythEntry[];

interface RawLongFormJson extends Omit<MythEntry, 'category'> {
  category: string;
  categoryKey?: MythCategory;
  entryType: string;
  isLongForm: boolean;
  isPremium: boolean;
  isHistorical: boolean;
  requiredSubscription: string;
  evidenceLabels: string[];
  targetWords: number;
  chapters: MythChapter[];
}

const normalizedLongFormMyths: MythEntry[] = (longFormEntriesJson as unknown as RawLongFormJson[]).map(
  (entry) => ({
    id: entry.id,
    name: entry.name,
    latinName: entry.latinName,
    category: entry.categoryKey || 'personalities',
    typeLabel: entry.entryType || entry.typeLabel,
    heroImage:
      typeof entry?.heroImage === 'string' && entry.heroImage.trim()
        ? entry.heroImage.startsWith('/')
          ? entry.heroImage
          : `/${entry.heroImage}`
        : '',
    summary: entry.summary,
    body: entry.body || [],
    sources: entry.sources || [],
    timeline: entry.timeline || [],
    region: entry.region,
    related: entry.related || [],
    tags: entry.tags || [],
    approxYear: entry.approxYear,
    isLongForm: entry.isLongForm,
    isPremium: entry.isPremium,
    isHistorical: entry.isHistorical,
    entryType: entry.entryType,
    evidenceLabels: entry.evidenceLabels || [],
    targetWords: entry.targetWords,
    requiredSubscription: entry.requiredSubscription,
    chapters: entry.chapters || [],
  })
);

const mergedMap = new Map<string, MythEntry>();
for (const entry of baseMyths) {
  mergedMap.set(entry.id, entry);
}
for (const entry of normalizedLongFormMyths) {
  mergedMap.set(entry.id, entry);
}

export const myths: MythEntry[] = Array.from(mergedMap.values());

const countFor = (cat: MythCategory): number =>
  myths.filter((m) => m.category === cat).length;

export const CATEGORY_META: Record<MythCategory, CategoryMetaItem> = {
  creatures: { key: 'creatures', label: 'كائنات ووحوش أسطورية', icon: 'sparkles', tileTint: '#E8F1FB', subLabel: 'الغول والسعلاة والنسناس', countLabel: `${countFor('creatures')} كائناً` },
  gods: { key: 'gods', label: 'معبودات وأرباب قديمة', icon: 'crown', tileTint: '#F2FBF7', subLabel: 'اللات والعزى وهبل', countLabel: `${countFor('gods')} أرباب` },
  rituals: { key: 'rituals', label: 'طقوس ومعتقدات غابرة', icon: 'flame', tileTint: '#E8F1FB', subLabel: 'الاستسقاء والكهانة', countLabel: `${countFor('rituals')} طقوس` },
  places: { key: 'places', label: 'أماكن وممالك مفقودة', icon: 'landmark', tileTint: '#F2FBF7', subLabel: 'إرم ووبار ومأرب', countLabel: `${countFor('places')} مواقع` },
  personalities: { key: 'personalities', label: 'شخصيات وأساطير شعبية', icon: 'users', tileTint: '#E8F1FB', subLabel: 'سيف بن ذي يزن', countLabel: `${countFor('personalities')} شخصيات` },
  heroes: { key: 'heroes', label: 'فرسان وشخصيات ملحمية', icon: 'sword', tileTint: '#ECE7F8', subLabel: 'عنترة والزير سالم', countLabel: `${countFor('heroes')} أبطال` },
  sa3aleek: { key: 'sa3aleek', label: 'الصعاليك', icon: 'runner', tileTint: '#F2FBF7', subLabel: 'تأبط شراً والشنفرى وعروة', countLabel: `${countFor('sa3aleek')} صعاليك` },
  kings: { key: 'kings', label: 'ملوك وملكات', icon: 'crown', tileTint: '#E8F1FB', subLabel: 'الزباء والسموأل وجذيمة', countLabel: `${countFor('kings')} ملوك` },
  seers: { key: 'seers', label: 'عرافون وكهان', icon: 'crystal-ball', tileTint: '#ECE7F8', subLabel: 'زرقاء اليمامة وسطيح وشق', countLabel: `${countFor('seers')} عرافين` },
};

export const CATEGORY_LABELS: Record<MythCategory, string> = {
  gods: 'معبودات وأرباب قديمة',
  creatures: 'كائنات ووحوش أسطورية',
  places: 'أماكن وممالك مفقودة',
  heroes: 'فرسان وشخصيات ملحمية',
  rituals: 'طقوس ومعتقدات غابرة',
  personalities: 'شخصيات وأساطير شعبية',
  sa3aleek: 'الصعاليك',
  kings: 'ملوك وملكات',
  seers: 'عرافون وكهان',
};

/**
 * Helper: Find a myth by ID
 */
export function getMythById(id: string, dataset: MythEntry[] = myths): MythEntry | undefined {
  return dataset.find((m) => m.id === id);
}

/**
 * Helper: Filter myths by category
 */
export function byCategory(c: MythEntry['category'], dataset: MythEntry[] = myths): MythEntry[] {
  return dataset.filter((m) => m.category === c);
}

/**
 * Helper: Get related myth entries for a given myth entry
 */
export function getRelated(entry: MythEntry, dataset: MythEntry[] = myths): MythEntry[] {
  if (!entry || !entry.related) return [];
  const relatedSet = new Set(entry.related);
  return dataset.filter((m) => relatedSet.has(m.id));
}
