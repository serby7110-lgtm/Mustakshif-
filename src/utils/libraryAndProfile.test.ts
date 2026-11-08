/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getReadingStatus,
  sortMyths,
  filterMythsByReadingStatus,
  computeProfileStats,
  computeBadges,
} from './libraryAndProfile.ts';
import { MythEntry } from '../data/types.ts';

const mockMyths: MythEntry[] = [
  {
    id: 'ghul',
    name: 'الغول',
    latinName: 'Al-Ghul',
    category: 'creatures',
    typeLabel: 'كائن أسطوري',
    heroImage: '',
    summary: 'مخلوق صحراوي',
    body: ['فقرة أولى', 'فقرة ثانية'],
    sources: [],
    timeline: [],
    region: 'نجد',
    related: [],
    tags: ['رعب'],
  },
  {
    id: 'allat',
    name: 'اللات',
    latinName: 'Allat',
    category: 'gods',
    typeLabel: 'ربة قديمة',
    heroImage: '',
    summary: 'معبودة قديمة',
    body: ['نص اللات'],
    sources: [],
    timeline: [],
    region: 'الطائف',
    related: [],
    tags: ['تاريخ'],
  },
  {
    id: 'irm',
    name: 'إرم ذات العماد',
    latinName: 'Iram',
    category: 'places',
    typeLabel: 'مدينة مفقودة',
    heroImage: '',
    summary: 'مدينة الرمال',
    body: ['نص إرم'],
    sources: [],
    timeline: [],
    region: 'الأحقاف',
    related: [],
    tags: ['تاريخ'],
  },
];

describe('libraryAndProfile utilities', () => {
  test('getReadingStatus returns unread, reading, and completed accurately', () => {
    const progressMap = {
      ghul: 45,
      allat: 100,
    };

    assert.equal(getReadingStatus('ghul', progressMap), 'reading');
    assert.equal(getReadingStatus('allat', progressMap), 'completed');
    assert.equal(getReadingStatus('irm', progressMap), 'unread');
  });

  test('sortMyths sorts alphabetically and by mostRead', () => {
    const progressMap = {
      ghul: 50,
      allat: 100,
      irm: 0,
    };

    // Alphabetical
    const alpha = sortMyths(mockMyths, 'alphabetical', progressMap);
    assert.equal(alpha[0].name, 'إرم ذات العماد');
    assert.equal(alpha[1].name, 'الغول');
    assert.equal(alpha[2].name, 'اللات');

    // Most Read (allat at 100% first, then ghul at 50%, then irm)
    const mostRead = sortMyths(mockMyths, 'mostRead', progressMap);
    assert.equal(mostRead[0].id, 'allat');
    assert.equal(mostRead[1].id, 'ghul');
  });

  test('filterMythsByReadingStatus filters correctly', () => {
    const progressMap = {
      ghul: 50,
      allat: 100,
    };

    const reading = filterMythsByReadingStatus(mockMyths, 'reading', progressMap);
    assert.equal(reading.length, 1);
    assert.equal(reading[0].id, 'ghul');

    const completed = filterMythsByReadingStatus(mockMyths, 'completed', progressMap);
    assert.equal(completed.length, 1);
    assert.equal(completed[0].id, 'allat');

    const unread = filterMythsByReadingStatus(mockMyths, 'unread', progressMap);
    assert.equal(unread.length, 1);
    assert.equal(unread[0].id, 'irm');
  });

  test('computeProfileStats computes stats correctly', () => {
    const progressMap = {
      allat: 100,
      ghul: 50,
    };
    const readChapters = ['ch_1', 'ch_2'];
    const bookmarks = ['b_1', 'b_2', 'b_3'];

    const stats = computeProfileStats(mockMyths, progressMap, readChapters, bookmarks, 4);
    assert.equal(stats.completedCount, 1);
    assert.equal(stats.readChaptersCount, 2);
    assert.equal(stats.bookmarksCount, 3);
    assert.equal(stats.favoriteQuotesCount, 4);
    assert.ok(stats.estimatedReadingMinutes > 0);
  });

  test('computeBadges determines unlocked state for each of the 6 badges', () => {
    const progressMap = {
      ghul: 100,
      allat: 100,
    };
    const bookmarks = new Array(10).fill('bm');
    const starred = new Array(10).fill('st');
    const mapSheets = 12;
    const darkMinutes = 35;

    const badges = computeBadges(mockMyths, progressMap, bookmarks, starred, mapSheets, darkMinutes);
    assert.equal(badges.length, 6);

    const mapTraveler = badges.find((b) => b.id === 'map_traveler');
    assert.ok(mapTraveler?.unlocked);
    assert.equal(mapTraveler?.name, 'رحّالة الخرائط');

    const storyCollector = badges.find((b) => b.id === 'story_collector');
    assert.ok(storyCollector?.unlocked);
    assert.equal(storyCollector?.name, 'جامع الحكايات');

    const ideaHunter = badges.find((b) => b.id === 'idea_hunter');
    assert.ok(ideaHunter?.unlocked);
    assert.equal(ideaHunter?.name, 'صائد الأفكار');

    const nightReader = badges.find((b) => b.id === 'night_reader');
    assert.ok(nightReader?.unlocked);
    assert.equal(nightReader?.name, 'قارئ الليل');
  });
});
