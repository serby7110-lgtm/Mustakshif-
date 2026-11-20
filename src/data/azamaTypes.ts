/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Kitab al-Azama (Al-Azhar Manuscript 94023) Types & Category Registry
 */

export type AzamaCategory =
  | 'tabaqat'
  | 'mawadd'
  | 'malaika'
  | 'nar'
  | 'janna'
  | 'bad'
  | 'ashrat'
  | 'makh'
  | 'hashr';

export type AzamaTag = 'مروي' | 'متخيَّل' | 'مخطوط';

export interface AzamaEntry {
  id: string;
  title: string;
  cat: AzamaCategory;
  world: number;
  page: number;
  quote: string;
  note: string;
  tag: AzamaTag | string;
  related: string[];
  sensitive?: boolean;
  caution?: string;
}

export interface AzamaCategoryMeta {
  id: AzamaCategory;
  label: string;
  color: string;
}

export const AZAMA_CATEGORIES: readonly AzamaCategoryMeta[] = [
  { id: 'tabaqat', label: 'الطبقات والعوالم', color: '#2FD8E8' },
  { id: 'mawadd', label: 'بحارٌ وأراضٍ ومواد', color: '#8E7BE8' },
  { id: 'malaika', label: 'ملائكة وخلائق', color: '#C6F24E' },
  { id: 'nar', label: 'النار وأوديتها', color: '#E0446B' },
  { id: 'janna', label: 'الجنة ودرجاتها', color: '#3DDC97' },
  { id: 'bad', label: 'بدء الخلق', color: '#4A90D9' },
  { id: 'ashrat', label: 'الأشراط والملحم', color: '#4A90D9' },
  { id: 'makh', label: 'المخطوط والسند', color: '#5C7B75' },
  { id: 'hashr', label: 'الحشر والموقف', color: '#8E7BE8' },
] as const;

export const AZAMA_CATEGORY_MAP: Record<AzamaCategory, AzamaCategoryMeta> = {
  tabaqat: AZAMA_CATEGORIES[0],
  mawadd: AZAMA_CATEGORIES[1],
  malaika: AZAMA_CATEGORIES[2],
  nar: AZAMA_CATEGORIES[3],
  janna: AZAMA_CATEGORIES[4],
  bad: AZAMA_CATEGORIES[5],
  ashrat: AZAMA_CATEGORIES[6],
  makh: AZAMA_CATEGORIES[7],
  hashr: AZAMA_CATEGORIES[8],
};
