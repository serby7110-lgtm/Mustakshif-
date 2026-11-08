/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Encyclopedia Data Models (مستكشف)
 */

import mythsJson from './myths.json';

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
}

export const CATEGORY_META: Record<MythCategory, CategoryMetaItem> = {
  creatures: { key: 'creatures', label: 'كائنات ووحوش أسطورية', icon: 'sparkles', tileTint: '#E8F1FB', subLabel: 'الغول والسعلاة والنسناس', countLabel: '١٢ كائناً' },
  gods: { key: 'gods', label: 'معبودات وأرباب قديمة', icon: 'crown', tileTint: '#F6EBD2', subLabel: 'اللات والعزى وهبل', countLabel: '١٠ أرباب' },
  rituals: { key: 'rituals', label: 'طقوس ومعتقدات غابرة', icon: 'flame', tileTint: '#FEF3C7', subLabel: 'الاستسقاء والكهانة', countLabel: '٨ طقوس' },
  places: { key: 'places', label: 'أماكن وممالك مفقودة', icon: 'landmark', tileTint: '#F2FBF7', subLabel: 'إرم ووبار ومأرب', countLabel: '١٠ مواقع' },
  personalities: { key: 'personalities', label: 'شخصيات وأساطير شعبية', icon: 'users', tileTint: '#E8F1FB', subLabel: 'سيف بن ذي يزن', countLabel: '٥ شخصيات' },
  heroes: { key: 'heroes', label: 'فرسان وشخصيات ملحمية', icon: 'sword', tileTint: '#FEE2E2', subLabel: 'عنترة والزير سالم', countLabel: '٦ أبطال' },
  sa3aleek: { key: 'sa3aleek', label: 'الصعاليك', icon: 'runner', tileTint: '#FDE7DA', subLabel: 'تأبط شراً والشنفرى وعروة', countLabel: '٤ صعاليك' },
  kings: { key: 'kings', label: 'ملوك وملكات', icon: 'crown', tileTint: '#F6EBD2', subLabel: 'الزباء والسموأل وجذيمة', countLabel: '٤ ملوك' },
  seers: { key: 'seers', label: 'عرافون وكهان', icon: 'crystal-ball', tileTint: '#ECE7F8', subLabel: 'زرقاء اليمامة وسطيح وشق', countLabel: '٣ عرافين' },
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

export const myths: MythEntry[] = mythsJson as unknown as MythEntry[];

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
