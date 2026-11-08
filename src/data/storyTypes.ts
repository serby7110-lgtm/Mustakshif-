/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Deep Story & Lore Types for Mustakshif (مستكشف)
 * Deep-content layer for game developers and story writers.
 */

import storiesData from './stories.json';

export interface DeepChapter {
  title: string;
  text: string;
}

export interface DeepQuote {
  text: string;
  source: string;
  type: string;
}

export interface DeepStory {
  chapters?: { title: string; text: string }[];
  quotes?: { text: string; source: string; type: string }[];
  motifs?: string[];
  themes?: string[];
  cast?: string[];
  gameHooks?: string[];
  writingHooks?: string[];
  traits?: string[];
  storyHooks?: string[];
  gameRoles?: string[];
  scenes?: { title: string; text: string }[];
  decision?: string;
}

export type DeepStoriesMap = Record<string, DeepStory>;

export const DEEP_STORIES: DeepStoriesMap = storiesData as unknown as DeepStoriesMap;

const ID_ALIASES: Record<string, string> = {
  'al-ghul': 'ghul',
  'al-anqa': 'anqa',
  'iram-dhat-al-imad': 'irm',
  'al-si-la': 'saqlaba',
  'al-hama': 'hama',
  'wadi-abqar': 'wad_abqar',
  'al-sulayk': 'sulayk',
  'jadhima-al-abrash': 'jadhima',
  'al-shiqq': 'shiqq-satih',
  'kahana-arrafa': 'shiqq-satih',
  'nasnas': 'nasanis',
};

/**
 * Retrieve deep story by myth ID (stories.json keys are myth ids from myths.json)
 */
export function getDeepStory(id: string): DeepStory | undefined {
  if (!id) return undefined;
  if (ID_ALIASES[id] && DEEP_STORIES[ID_ALIASES[id]]) {
    return DEEP_STORIES[ID_ALIASES[id]];
  }
  if (DEEP_STORIES[id]) return DEEP_STORIES[id];
  if (id.startsWith('al-') && DEEP_STORIES[id.slice(3)]) {
    return DEEP_STORIES[id.slice(3)];
  }
  if (!id.startsWith('al-') && DEEP_STORIES[`al-${id}`]) {
    return DEEP_STORIES[`al-${id}`];
  }
  return undefined;
}

/**
 * Check if a myth entry has a full deep story available (with chapters)
 */
export function hasDeepStory(id: string): boolean {
  const story = getDeepStory(id);
  return Boolean(story && story.chapters && story.chapters.length > 0);
}
