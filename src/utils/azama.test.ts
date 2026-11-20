import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { AZAMA_CATEGORIES, AZAMA_CATEGORY_MAP } from '../data/azamaTypes';
import {
  getAllAzamaEntries,
  getAzamaEntriesCount,
  getAzamaEntryById,
  getAzamaCategoryCounts,
  filterAndSortAzamaEntries,
  sortAzamaEntries,
  getAzamaTagBadgeStyle,
  getCategoryPillColors,
  isAzamaEntrySensitive,
  hasAzamaCaution,
  getAzamaPreviewEntries,
  getAzamaCardSnippets,
  formatAzamaNotificationPayload,
} from './azama';

test('azama.json contains exact 86 seeded entries with valid schema fields', () => {
  const raw = JSON.parse(fs.readFileSync(path.resolve('src/data/azama.json'), 'utf8')) as unknown[];
  assert.equal(raw.length, 86);
  assert.equal(getAzamaEntriesCount(), 86);

  const entries = getAllAzamaEntries();
  assert.equal(entries.length, 86);
  assert.equal(entries[0].id, 'az-w01');
  assert.equal(entries[entries.length - 1].id, 'az-h06');

  for (const entry of entries) {
    assert.ok(typeof entry.id === 'string' && entry.id.length > 0);
    assert.ok(typeof entry.title === 'string' && entry.title.length > 0);
    assert.ok(entry.cat in AZAMA_CATEGORY_MAP);
    assert.equal(typeof entry.world, 'number');
    assert.equal(typeof entry.page, 'number');
    assert.ok(typeof entry.quote === 'string' && entry.quote.length > 0);
    assert.ok(typeof entry.note === 'string' && entry.note.length > 0);
    assert.ok(
      [
        'مروي',
        'متخيَّل',
        'مخطوط',
        'نص قرآني + مروي',
        'نص حديثي + مروي',
        'مروي + متخيَّل',
        'نص قرآني + متخيَّل',
        'نص حديثي + متخيَّل',
      ].includes(entry.tag),
      `Unexpected tag: ${entry.tag}`
    );
    assert.ok(Array.isArray(entry.related));
  }

  const f13 = getAzamaEntryById('az-f13');
  assert.ok(f13);
  assert.equal(isAzamaEntrySensitive(f13), true);
  assert.deepEqual(getAzamaCardSnippets(f13), { quote: '', note: '' });
  assert.equal(formatAzamaNotificationPayload(f13), null);
  assert.equal(
    getAzamaPreviewEntries(entries).some((e) => e.id === 'az-f13'),
    false
  );
  // Searching text inside az-f13's quote/note must not return az-f13, whereas title search matches
  assert.equal(
    filterAndSortAzamaEntries(entries, { query: 'سكين من غضب' }).some((e) => e.id === 'az-f13'),
    false
  );
  assert.equal(
    filterAndSortAzamaEntries(entries, { query: 'وادي ماب' }).some((e) => e.id === 'az-f13'),
    true
  );

  // Entries carrying caution (e.g. az-o04, az-j06) are excluded from Home previews and search snippets
  const o04 = getAzamaEntryById('az-o04');
  assert.ok(o04);
  assert.equal(hasAzamaCaution(o04), true);
  assert.deepEqual(getAzamaCardSnippets(o04), { quote: '', note: '' });
  assert.equal(formatAzamaNotificationPayload(o04), null);
  assert.equal(
    getAzamaPreviewEntries(entries).some((e) => e.id === 'az-o04' || e.id === 'az-j06'),
    false
  );
  assert.equal(
    filterAndSortAzamaEntries(entries, { query: 'تحترق بالعرش' }).some((e) => e.id === 'az-o04'),
    false
  );
  assert.equal(
    filterAndSortAzamaEntries(entries, { query: 'الحية الصفراء' }).some((e) => e.id === 'az-o04'),
    true
  );
});

test('all 9 Azama categories are registered with exact labels and cool-palette colors', () => {
  assert.equal(AZAMA_CATEGORIES.length, 9);
  assert.deepEqual(
    AZAMA_CATEGORIES.map((c) => [c.id, c.label, c.color]),
    [
      ['tabaqat', 'الطبقات والعوالم', '#2FD8E8'],
      ['mawadd', 'بحارٌ وأراضٍ ومواد', '#8E7BE8'],
      ['malaika', 'ملائكة وخلائق', '#C6F24E'],
      ['nar', 'النار وأوديتها', '#E0446B'],
      ['janna', 'الجنة ودرجاتها', '#3DDC97'],
      ['bad', 'بدء الخلق', '#4A90D9'],
      ['ashrat', 'الأشراط والملحم', '#4A90D9'],
      ['makh', 'المخطوط والسند', '#5C7B75'],
      ['hashr', 'الحشر والموقف', '#8E7BE8'],
    ]
  );

  const counts = getAzamaCategoryCounts();
  assert.equal(counts.tabaqat, 20);
  assert.equal(counts.mawadd, 12);
  assert.equal(counts.malaika, 8);
  assert.equal(counts.nar, 20);
  assert.equal(counts.janna, 10);
  assert.equal(counts.bad, 10);
  assert.equal(counts.ashrat, 0);
  assert.equal(counts.makh, 0);
  assert.equal(counts.hashr, 6);
});

test('search uses Arabic normalization across title, quote, and note', () => {
  // Match diacritic/Alef/Taa Marbuta variations in title & quote & note
  const byTitle = filterAndSortAzamaEntries(undefined, { query: 'العالم الثامن' });
  assert.ok(byTitle.some((e) => e.id === 'az-w08'));
  const byTitleExact = filterAndSortAzamaEntries(undefined, { query: 'قرنان في الصدر' });
  assert.equal(byTitleExact.length, 1);
  assert.equal(byTitleExact[0].id, 'az-w08');

  const byQuote = filterAndSortAzamaEntries(undefined, { query: 'نقره الابهام' });
  assert.equal(byQuote.length, 1);
  assert.equal(byQuote[0].id, 'az-w10');

  const byNote = filterAndSortAzamaEntries(undefined, { query: 'كوسمولوجيا الكتاب' });
  assert.equal(byNote.length, 1);
  assert.equal(byNote[0].id, 'az-w24');

  const definiteArticle = filterAndSortAzamaEntries(undefined, { query: 'حوت' });
  assert.ok(definiteArticle.some((e) => e.id === 'az-hut'));
});

test('sorting supports world, page, and alphabetical orders', () => {
  const byWorld = filterAndSortAzamaEntries(undefined, { sortBy: 'world' });
  assert.equal(byWorld[0].world, 0);
  assert.equal(byWorld[byWorld.length - 1].world, 48);

  const byPage = filterAndSortAzamaEntries(undefined, { sortBy: 'page' });
  assert.equal(byPage[0].page, 6);
  assert.equal(byPage[byPage.length - 1].page, 156);

  const byAlpha = filterAndSortAzamaEntries(undefined, { sortBy: 'alphabetical' });
  assert.equal(byAlpha.length, 86);
  const sortedTitles = [...byAlpha].map((e) => e.title);
  assert.deepEqual(
    sortedTitles,
    [...sortedTitles].sort((a, b) => a.localeCompare(b, 'ar'))
  );
});

test('related lookup and tag styles handle valid and pending entries cleanly', () => {
  assert.equal(getAzamaEntryById('az-w01')?.world, 1);
  assert.equal(getAzamaEntryById('az-bahmut'), undefined);

  const mintTag = getAzamaTagBadgeStyle('مروي', false);
  const violetTag = getAzamaTagBadgeStyle('متخيَّل', false);
  const mutedTag = getAzamaTagBadgeStyle('مخطوط', false);
  assert.notEqual(mintTag.text, violetTag.text);
  assert.notEqual(violetTag.text, mutedTag.text);
});

test('azama utilities handle null, undefined, and sparse entries safely', () => {
  assert.deepEqual(sortAzamaEntries(undefined as never, 'world'), []);
  assert.deepEqual(
    sortAzamaEntries([undefined as never, null as never], 'alphabetical'),
    []
  );

  const fallbackTag = getAzamaTagBadgeStyle(undefined, false);
  assert.ok(fallbackTag.bg && fallbackTag.text && fallbackTag.border);

  const fallbackPill = getCategoryPillColors(null, false);
  assert.equal(fallbackPill.dot, '#4A90D9');

  const darkFallbackPill = getCategoryPillColors('', true);
  assert.equal(darkFallbackPill.dot, '#4A90D9');
});

test('sensitive entries are excluded from previews, search snippets, quote/note search, and notifications', () => {
  const sample = [
    {
      id: 'safe-1',
      title: 'مدخل عادي',
      cat: 'nar' as const,
      world: 1,
      page: 50,
      quote: 'نص ظاهر',
      note: 'شرح ظاهر',
      tag: 'مروي',
      related: [],
      sensitive: false,
    },
    {
      id: 'sens-1',
      title: 'مدخل حساس',
      cat: 'nar' as const,
      world: 2,
      page: 51,
      quote: 'كلمة_سرية_حساسة',
      note: 'وصف_سري_حساس',
      tag: 'مروي',
      related: [],
      sensitive: true,
    },
  ];

  assert.equal(isAzamaEntrySensitive(sample[0]), false);
  assert.equal(isAzamaEntrySensitive(sample[1]), true);

  // Excluded from Home previews
  const previews = getAzamaPreviewEntries(sample);
  assert.deepEqual(
    previews.map((e) => e.id),
    ['safe-1']
  );

  // Excluded from card/search snippets
  assert.deepEqual(getAzamaCardSnippets(sample[1]), { quote: '', note: '' });
  assert.deepEqual(getAzamaCardSnippets(sample[0]), {
    quote: 'نص ظاهر',
    note: 'شرح ظاهر',
  });

  // Excluded from notification payloads
  assert.equal(formatAzamaNotificationPayload(sample[1]), null);
  assert.deepEqual(formatAzamaNotificationPayload(sample[0]), {
    title: 'مدخل عادي',
    body: 'شرح ظاهر',
  });

  // Search does not match inside hidden quote/note of sensitive entries, only title
  assert.equal(
    filterAndSortAzamaEntries(sample, { query: 'كلمة_سرية_حساسة' }).length,
    0
  );
  assert.equal(
    filterAndSortAzamaEntries(sample, { query: 'مدخل حساس' }).length,
    1
  );
});

test('caution entries are excluded from Home previews, search snippets, and quote/note search', () => {
  const sample = [
    {
      id: 'normal-1',
      title: 'مدخل عادي',
      cat: 'bad' as const,
      world: 0,
      page: 105,
      quote: 'نص عادي',
      note: 'شرح عادي',
      tag: 'مروي',
      related: [],
    },
    {
      id: 'caution-1',
      title: 'مدخل بتنبيه معرفي',
      cat: 'janna' as const,
      world: 0,
      page: 120,
      quote: 'عبارة_مقيدة_في_التنبيه',
      note: 'ملاحظة_مقيدة_في_التنبيه',
      tag: 'مروي',
      related: [],
      caution: 'تنبيه: هذا الموضع يحتاج مراجعة السياق',
    },
  ];

  assert.equal(hasAzamaCaution(sample[0]), false);
  assert.equal(hasAzamaCaution(sample[1]), true);

  assert.deepEqual(
    getAzamaPreviewEntries(sample).map((e) => e.id),
    ['normal-1']
  );

  assert.deepEqual(getAzamaCardSnippets(sample[1]), { quote: '', note: '' });
  assert.deepEqual(getAzamaCardSnippets(sample[0]), {
    quote: 'نص عادي',
    note: 'شرح عادي',
  });

  assert.equal(formatAzamaNotificationPayload(sample[1]), null);
  assert.deepEqual(formatAzamaNotificationPayload(sample[0]), {
    title: 'مدخل عادي',
    body: 'شرح عادي',
  });

  assert.equal(
    filterAndSortAzamaEntries(sample, { query: 'عبارة_مقيدة_في_التنبيه' }).length,
    0
  );
  assert.equal(
    filterAndSortAzamaEntries(sample, { query: 'مدخل بتنبيه معرفي' }).length,
    1
  );
});
