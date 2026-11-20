/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unified content, cosmology, folklore, story, and creature data models
 * localized across Arabic (ar), English (en), Indonesian (id), and Thai (th).
 */

import type { AppLang } from '../i18n';

export type ContentType = 'story' | 'myth' | 'cosmology' | 'folklore';

export type CreatureKind = 'deity' | 'spirit' | 'creature';

export type LocalizedText = Record<AppLang, string>;
export type LocalizedParagraphs = Record<AppLang, string[]>;

export interface ContentRegion {
  lat: number;
  lng: number;
  label: LocalizedText;
}

export interface ContentSource {
  title: LocalizedText;
  author: LocalizedText;
  year?: string;
}

export interface ContentItem {
  id: string;
  type: ContentType;
  culture: string;
  region: ContentRegion;
  tags: string[];
  title: LocalizedText;
  summary: LocalizedText;
  text: LocalizedParagraphs;
  source: ContentSource;
  image: string;
  creatureIds?: string[];
  legacyCategory?: 'creatures' | 'gods' | 'rituals' | 'places' | 'personalities' | 'heroes' | 'sa3aleek' | 'kings' | 'seers';
  isPublicDomain?: boolean;
}

export interface CreatureEntry {
  id: string;
  kind: CreatureKind;
  culture: string;
  name: LocalizedText;
  epithet: LocalizedText;
  description: LocalizedText;
  attributes: LocalizedParagraphs;
  image: string;
  storyIds: string[];
  legacyMythId?: string;
}
