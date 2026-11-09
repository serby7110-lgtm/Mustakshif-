/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Translations Index
 */

import { ar } from './ar';
import { id } from './id';
import { th } from './th';

export type TranslationKey =
  | 'nav.home'
  | 'nav.civilizations'
  | 'nav.map'
  | 'nav.library'
  | 'nav.profile'
  | 'home.greeting'
  | 'home.categories'
  | 'home.mostRead'
  | 'map.all'
  | 'map.legend'
  | 'cat.creatures'
  | 'cat.gods'
  | 'cat.rituals'
  | 'cat.places'
  | 'cat.personalities'
  | 'cat.sa3aleek'
  | 'cat.kings'
  | 'cat.seers'
  | 'article.readStory'
  | 'article.chapters'
  | 'article.quotes'
  | 'article.creatorKit'
  | 'article.writingHooks'
  | 'article.gameHooks'
  | 'article.scenes'
  | 'article.decision'
  | 'article.timeline'
  | 'article.sources'
  | 'article.related'
  | 'article.copyJson'
  | 'common.copy'
  | 'common.copied'
  | 'method.title'
  | 'method.folk'
  | 'method.analysis'
  | 'library.myths'
  | 'library.creatorTools'
  | 'library.newest'
  | 'library.mostRead'
  | 'library.alphabetical'
  | 'civ.story'
  | 'civ.economy'
  | 'civ.prophet'
  | 'civ.archaeology'
  | 'civ.tradition'
  | 'civ.archaeologyView'
  | 'civ.historian'
  | 'civ.relatedMyths'
  | 'timeline.list'
  | 'timeline.timeline'
  | 'timeline.journey'
  | (string & {});

export const translations: Record<'ar' | 'id' | 'th', Record<string, string>> = {
  ar: ar as unknown as Record<string, string>,
  id: id as unknown as Record<string, string>,
  th: th as unknown as Record<string, string>,
};

export { ar, id, th };
export default translations;
