/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { getLocalizedEntry, getLocalizedDeepStory } from './index.ts';
import { isChapterUnlocked, toLibraryMythEntry, LongFormEntryData } from '../data/longForm.ts';
import { MythEntry } from '../data/types.ts';

describe('content localization & longForm safety', () => {
  test('getLocalizedEntry falls back cleanly to array index when chapters lack ids', () => {
    const entry: MythEntry = {
      id: 'non-existent-entry-id-for-test',
      name: 'اختبار',
      latinName: 'Test',
      category: 'creatures',
      typeLabel: 'أسطورة',
      heroImage: 'assets/hero.png',
      summary: 'ملخص',
      body: ['فقرة'],
      sources: [],
      timeline: [],
      region: 'الجزيرة',
      related: [],
      tags: [],
      chapters: [
        {
          id: '',
          index: 0,
          title: 'الفصل الأول',
          evidenceLabel: 'خيال أدبي',
          isAppendix: false,
          isFree: true,
          estimatedWords: 100,
          contentPending: false,
          paragraphs: ['أ'],
        },
        {
          id: '',
          index: 1,
          title: 'الفصل الثاني',
          evidenceLabel: 'نص موثق',
          isAppendix: false,
          isFree: false,
          estimatedWords: 100,
          contentPending: false,
          paragraphs: ['ب'],
        },
      ],
    };

    const localized = getLocalizedEntry(entry, 'en');
    assert.equal(localized.chapters?.length, 2);
    assert.equal(localized.chapters?.[0]?.title, 'الفصل الأول');
    assert.equal(localized.chapters?.[1]?.title, 'الفصل الثاني');
  });

  test('getLocalizedDeepStory handles missing baseStory and missing quotes safely', () => {
    const missingStory = getLocalizedDeepStory(undefined, 'unknown-story-id', 'en');
    assert.equal(missingStory, undefined);

    const localizedNoQuotes = getLocalizedDeepStory(
      {
        source: 'مصدر',
        writingHooks: ['فكرة'],
        storyHooks: [],
      },
      'unknown-story-id',
      'en'
    );
    assert.ok(localizedNoQuotes);
    assert.equal(localizedNoQuotes?.quotes, undefined);
  });

  test('isChapterUnlocked handles null/undefined entries and normalizes heroImage safely', () => {
    assert.equal(isChapterUnlocked(null, 0, false), false);
    assert.equal(isChapterUnlocked(undefined, 0, true), false);

    const mockLongForm: LongFormEntryData = {
      id: 'lf-test',
      name: 'اختبار طويل',
      latinName: 'LF Test',
      category: 'personalities',
      categoryKey: 'personalities',
      typeLabel: 'قصة طويلة',
      entryType: 'قصة طويلة',
      heroImage: undefined as unknown as string,
      summary: 'ملخص',
      body: [],
      sources: [],
      timeline: [],
      region: 'العراق',
      related: [],
      tags: [],
      isLongForm: true,
      isPremium: true,
      isHistorical: false,
      requiredSubscription: 'premium_monthly',
      evidenceLabels: [],
      targetWords: 1000,
      chapters: [
        {
          id: 'c0',
          index: 0,
          title: 'مقدمة',
          evidenceLabel: 'خيال أدبي',
          isAppendix: false,
          isFree: true,
          estimatedWords: 100,
          contentPending: false,
          paragraphs: ['...'],
        },
        {
          id: 'c1',
          index: 1,
          title: 'ثان',
          evidenceLabel: 'خيال أدبي',
          isAppendix: false,
          isFree: false,
          estimatedWords: 100,
          contentPending: false,
          paragraphs: ['...'],
        },
      ],
    };

    const libEntry = toLibraryMythEntry(mockLongForm);
    assert.equal(libEntry.heroImage, '');
    assert.equal(isChapterUnlocked(mockLongForm, 0, false), true);
    assert.equal(isChapterUnlocked(mockLongForm, 1, false), false);
    assert.equal(isChapterUnlocked(mockLongForm, 1, true), true);
    assert.equal(isChapterUnlocked(mockLongForm, 99, true), false);
  });
});
