/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAggregatedHooks,
  extractAllThemes,
  filterHooks,
  formatHooksForExport,
  resolveMythForStoryKey,
  AggregatedHook,
  getAggregatedQuotes,
  filterQuotes,
  formatQuoteForCopy,
} from './studioHooks.ts';
import { DeepStoriesMap } from '../data/storyTypes.ts';
import { MythEntry } from '../data/types.ts';

const mockStories: DeepStoriesMap = {
  ghul: {
    chapters: [],
    quotes: [
      { text: 'لا عَدْوَى ولا غُولَ', source: 'حديث شريف', type: 'نص حرفي' },
      { text: 'الغول يتلون ألوانا', source: 'الجاحظ', type: 'بأسلوب المصدر' },
    ],
    motifs: ['الظل'],
    themes: ['الخوف من المجهول', 'الجماعة أمان'],
    cast: ['حارثة'],
    gameHooks: [
      'ميكانيكا الشك: أي مرافق قد يكون غولاً',
      'عداد الخوف: البقاء وحيداً ليلاً يرفع الخطر',
    ],
    writingHooks: [
      'راوٍ غير موثوق: الناجي الوحيد يُشكّ أنه غول',
    ],
  },
  irm: {
    chapters: [],
    quotes: [
      { text: 'إِرَمَ ذَاتِ الْعِمَادِ', source: 'سورة الفجر', type: 'نص حرفي' },
    ],
    motifs: ['الأعمدة'],
    themes: ['الكبرياء قبل السقوط', 'الحلم الذي يلتهم صاحبه', 'الخوف من المجهول'],
    cast: ['شداد'],
    gameHooks: [
      'بناء واستكشاف: مدينة تتغير هندستها مع الرمال',
    ],
    writingHooks: [
      'المكتشف الأعمى: خريطة لا تُقرأ إلا باللمس',
      'مفارقة الحاكم: يموت قبل أن يخطو خطوة في مدينته',
    ],
  },
};

const mockMyths: MythEntry[] = [
  {
    id: 'ghul',
    name: 'الغول',
    latinName: 'Al-Ghul',
    category: 'creatures',
    typeLabel: 'كائن أسطوري',
    heroImage: '',
    summary: 'مخلوق الصحراء المرعب',
    body: [],
    sources: [],
    timeline: [],
    region: 'نجد',
    related: [],
    tags: ['رعب'],
  },
  {
    id: 'iram-dhat-al-imad',
    name: 'مدينة إرم ذات العماد',
    latinName: 'Iram of the Pillars',
    category: 'places',
    typeLabel: 'مكان أسطوري',
    heroImage: '',
    summary: 'المدينة الضائعة',
    body: [],
    sources: [],
    timeline: [],
    region: 'الأحقاف',
    related: [],
    tags: ['تاريخ'],
  },
];

describe('studioHooks utilities', () => {
  test('resolveMythForStoryKey matches direct and aliased myths', () => {
    const ghul = resolveMythForStoryKey('ghul', mockMyths);
    assert.equal(ghul?.name, 'الغول');
    assert.equal(ghul?.category, 'creatures');

    const irm = resolveMythForStoryKey('irm', mockMyths);
    assert.equal(irm?.name, 'مدينة إرم ذات العماد');
    assert.equal(irm?.category, 'places');
  });

  test('getAggregatedHooks extracts only writing hooks and excludes gameHooks', () => {
    const hooks = getAggregatedHooks(mockStories, mockMyths);
    assert.equal(hooks.length, 3);
    assert.ok(hooks.every((h) => h.type === 'writing'));

    const firstHook = hooks[0];
    assert.equal(firstHook.mythName, 'الغول');
    assert.equal(firstHook.mythCategory, 'creatures');
    assert.ok(firstHook.text.includes('راوٍ غير موثوق'));
  });

  test('extractAllThemes gathers unique union of themes', () => {
    const themes = extractAllThemes(mockStories);
    assert.equal(themes.length, 4);
    assert.ok(themes.includes('الخوف من المجهول'));
    assert.ok(themes.includes('الجماعة أمان'));
    assert.ok(themes.includes('الكبرياء قبل السقوط'));
    assert.ok(themes.includes('الحلم الذي يلتهم صاحبه'));
  });

  test('filterHooks filters by category and theme', () => {
    const allHooks = getAggregatedHooks(mockStories, mockMyths);

    // Filter by category creatures
    const creaturesOnly = filterHooks(allHooks, 'creatures', 'all');
    assert.equal(creaturesOnly.length, 1);
    assert.ok(creaturesOnly.every((h) => h.mythCategory === 'creatures'));

    // Filter by places
    const placesOnly = filterHooks(allHooks, 'places', 'all');
    assert.equal(placesOnly.length, 2);
    assert.ok(placesOnly.every((h) => h.mythCategory === 'places'));

    // Filter by shared theme 'الخوف من المجهول' (exists in both ghul and irm)
    const fearTheme = filterHooks(allHooks, 'all', 'الخوف من المجهول');
    assert.equal(fearTheme.length, 3);

    // Filter by theme only in irm
    const prideTheme = filterHooks(allHooks, 'all', 'الكبرياء قبل السقوط');
    assert.equal(prideTheme.length, 2);
    assert.ok(prideTheme.every((h) => h.mythName.includes('إرم')));

    // No matching combination
    const emptyResult = filterHooks(allHooks, 'creatures', 'الكبرياء قبل السقوط');
    assert.equal(emptyResult.length, 0);
  });

  test('formatHooksForExport generates plain-text list with hook + myth name', () => {
    const allHooks = getAggregatedHooks(mockStories, mockMyths);
    const selected = [allHooks[0], allHooks[1]]; // one from ghul, one from irm

    const exportText = formatHooksForExport(selected);
    assert.ok(exportText.includes('راوٍ غير موثوق: الناجي الوحيد يُشكّ أنه غول — الغول'));
    assert.ok(exportText.includes('المكتشف الأعمى: خريطة لا تُقرأ إلا باللمس — مدينة إرم ذات العماد'));
  });

  test('getAggregatedQuotes extracts quotes and resolves myth names', () => {
    const quotes = getAggregatedQuotes(mockStories, mockMyths);
    assert.equal(quotes.length, 3);
    assert.equal(quotes[0].mythName, 'الغول');
    assert.equal(quotes[0].type, 'نص حرفي');
    assert.equal(quotes[1].type, 'بأسلوب المصدر');
  });

  test('filterQuotes filters by type and search query with normalization', () => {
    const quotes = getAggregatedQuotes(mockStories, mockMyths);

    // Filter by type
    const literalOnly = filterQuotes(quotes, 'نص حرفي', '');
    assert.equal(literalOnly.length, 2);

    const sourcedOnly = filterQuotes(quotes, 'بأسلوب المصدر', '');
    assert.equal(sourcedOnly.length, 1);

    // Filter by search text
    const searchGhul = filterQuotes(quotes, 'all', 'غول');
    assert.equal(searchGhul.length, 2);

    // Filter by source
    const searchFajr = filterQuotes(quotes, 'all', 'الفجر');
    assert.equal(searchFajr.length, 1);
  });

  test('formatQuoteForCopy formats text and source', () => {
    const quotes = getAggregatedQuotes(mockStories, mockMyths);
    const formatted = formatQuoteForCopy(quotes[0]);
    assert.equal(formatted, 'لا عَدْوَى ولا غُولَ — حديث شريف');
  });
});
