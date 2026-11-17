import test from 'node:test';
import assert from 'node:assert/strict';
import { copyTextSafely } from '../src/utils/clipboard';

function installMockLocalStorage(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  const mockLS = {
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => {
      store.set(k, String(v));
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    clear: () => store.clear(),
  };

  (globalThis as unknown as { window?: Record<string, unknown> }).window = {
    localStorage: mockLS,
    location: { search: '', href: 'http://localhost:3000/' },
    dispatchEvent: () => true,
    CustomEvent: class CustomEvent {
      type: string;
      detail: unknown;
      constructor(type: string, init?: { detail?: unknown }) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
  };
  return store;
}

test('storage recovers cleanly from corrupted JSON, null strings, wrong types, and NaN counters', async () => {
  const originalWindow = (globalThis as unknown as { window?: unknown }).window;
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    installMockLocalStorage({
      mustakshif_saved_ids_v1: 'null',
      mustakshif_history_ids_v1: '{"not":"an-array"}',
      mustakshif_myth_progress_v2: '["bad-type"]',
      mustakshif_map_sheets_v2: 'not-a-number',
      mustakshif_dark_minutes_v2: '-15',
      mustakshif_long_form_resume_v1: 'null',
      mustakshif_last_read_v1: '{"broken":true}',
    });

    const { storage } = await import(`../src/data/storage?t=${Date.now()}`);

    assert.deepEqual(storage.getBookmarks(), ['al-anqa', 'al-ghul', 'iram-dhat-al-imad']);
    assert.deepEqual(storage.getHistory(), ['al-anqa', 'al-ghul', 'al-jinn', 'al-lat']);
    assert.equal(typeof storage.getAllMythProgress().ghul, 'number');
    assert.equal(storage.getMapSheetsCount(), 10);
    assert.equal(storage.getDarkReadingMinutes(), 32);
    assert.equal(storage.getLongFormResumeState('dhul-qarnayn'), null);
    assert.equal(storage.getLastReadChapter(), null);

    // Ensure setting long-form progress after corrupted resume JSON succeeds and filters NaN
    storage.setLongFormChapterProgress('dhul-qarnayn', 'ch1', 0, 'البداية', Number.NaN);
    const resume = storage.getLongFormResumeState('dhul-qarnayn');
    assert.ok(resume);
    assert.equal(resume.chapterProgressPercent, 0);
    assert.equal(resume.lastChapterId, 'ch1');

    // Empty IDs are ignored safely without throwing
    storage.setLongFormChapterProgress('', 'ch1', 0, 'test', 50);
    storage.setMythProgress('', 50);
    storage.markChapterRead('');

    assert.ok(warnings.length >= 6, 'Corrupted storage reads should emit developer warnings');
  } finally {
    console.warn = originalWarn;
    (globalThis as unknown as { window?: unknown }).window = originalWindow;
  }
});

test('copyTextSafely awaits clipboard API, falls back gracefully, and returns false without throwing on failure', async () => {
  const originalNavigator = globalThis.navigator;
  const originalDocument = globalThis.document;
  const originalWarn = console.warn;
  console.warn = () => {};

  try {
    // 1. Empty string returns false cleanly
    assert.equal(await copyTextSafely(''), false);

    // 2. Successful Clipboard API returns true
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        clipboard: {
          writeText: async () => undefined,
        },
      },
    });
    assert.equal(await copyTextSafely('مرحبا'), true);

    // 3. Rejected Clipboard API with no DOM fallback returns false instead of throwing
    Object.defineProperty(globalThis, 'navigator', {
      configurable: true,
      value: {
        clipboard: {
          writeText: async () => {
            throw new Error('Permission denied');
          },
        },
      },
    });
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: undefined,
    });
    assert.equal(await copyTextSafely('مرحبا'), false);
  } finally {
    console.warn = originalWarn;
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: originalNavigator });
    Object.defineProperty(globalThis, 'document', { configurable: true, value: originalDocument });
  }
});

test('assets, readingTime, and arabicSearch handle null/undefined and partial data safely', async () => {
  const { resolveHeroImageUrl } = await import('../src/utils/imageUrl');
  assert.equal(resolveHeroImageUrl(undefined), '');
  assert.equal(resolveHeroImageUrl(null), '');
  assert.equal(resolveHeroImageUrl('   '), '');
  assert.equal(resolveHeroImageUrl('images/ghul.jpg'), '/images/ghul.jpg');
  assert.equal(resolveHeroImageUrl('/images/ghul.jpg'), '/images/ghul.jpg');

  const { countWords, getEstimatedReadingTime, formatReadingTime } = await import('../src/utils/readingTime');
  assert.equal(countWords(undefined), 0);
  assert.equal(countWords(null), 0);
  assert.equal(getEstimatedReadingTime(undefined), 1);
  assert.equal(getEstimatedReadingTime(null), 1);
  assert.equal(formatReadingTime(Number.NaN, 'ar'), '≈ 1 د قراءة');
  assert.equal(formatReadingTime(0, 'en'), '≈ 1 min read');

  const { normalizeArabic, searchEntries, searchCivilizations } = await import('../src/utils/arabicSearch');
  assert.equal(normalizeArabic(undefined), '');
  assert.equal(normalizeArabic(null), '');

  const partialMyth = { id: 'partial-1', name: 'أسطورة اختبار' } as unknown as import('../src/data/types').MythEntry;
  const mythMatches = searchEntries([partialMyth], 'اختبار');
  assert.equal(mythMatches.length, 1);

  const partialCiv = { id: 'civ-test', name: 'حضارة اختبار' } as unknown as import('../src/data/civTypes').Civilization;
  const civMatches = searchCivilizations([partialCiv], 'اختبار');
  assert.equal(civMatches.length, 1);
});

test('libraryAndProfile, studioHooks, civTypes, and content helpers tolerate partial/empty/NaN values', async () => {
  const { computeProfileStats, computeBadges, sortMyths, filterMythsByReadingStatus } = await import(
    '../src/utils/libraryAndProfile'
  );
  const stats = computeProfileStats([], {}, [], [], Number.NaN);
  assert.equal(stats.completedCount, 0);
  assert.equal(stats.favoriteQuotesCount, 0);
  assert.ok(Number.isFinite(stats.estimatedReadingMinutes) && stats.estimatedReadingMinutes >= 1);

  const badges = computeBadges([], {}, [], [], Number.NaN, Number.NaN);
  assert.equal(badges.length, 6);
  for (const b of badges) {
    assert.ok(Number.isFinite(b.target) && b.target > 0);
    assert.ok(Number.isFinite(b.current) && b.current >= 0);
  }

  assert.deepEqual(sortMyths(undefined, 'alphabetical', undefined), []);
  assert.deepEqual(filterMythsByReadingStatus(undefined, 'reading', undefined), []);

  const { formatCivilizationNarrative } = await import('../src/data/civTypes');
  assert.equal(formatCivilizationNarrative(undefined), '');
  const partialNarration = formatCivilizationNarrative({ id: 'c1', name: 'قوم' } as unknown as import('../src/data/civTypes').Civilization);
  assert.ok(partialNarration.includes('قوم'));

  const { getAggregatedHooks, getAggregatedQuotes, formatQuoteForCopy } = await import('../src/utils/studioHooks');
  assert.deepEqual(getAggregatedHooks(undefined, undefined), []);
  assert.deepEqual(getAggregatedQuotes(undefined, undefined), []);
  assert.equal(formatQuoteForCopy(undefined), '');
  const hooks = getAggregatedHooks({ partial: { gameHooks: ['  فكرة  ', ''] as unknown as string[] } }, []);
  assert.equal(hooks.length, 1);
  assert.equal(hooks[0].text, 'فكرة');

  const { getLocalizedEntry, getLocalizedCivilization } = await import('../src/content/index');
  assert.equal(getLocalizedEntry(undefined as unknown as import('../src/data/types').MythEntry, 'en'), undefined);
  assert.equal(getLocalizedCivilization(undefined as unknown as import('../src/data/civTypes').Civilization, 'en'), undefined);
});

test('all 4 locale bundles include required null-safety fallback translation keys', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const locales = ['ar', 'en', 'id', 'th'] as const;
  const requiredPaths = [
    ['article', 'noStoryYet'],
    ['article', 'entryNotFound'],
    ['subscription', 'activeLocally'],
    ['civ', 'noChaptersYet'],
    ['common', 'undated'],
    ['common', 'unknownAuthor'],
  ] as const;

  for (const loc of locales) {
    const filePath = path.resolve(process.cwd(), 'src', 'locales', `${loc}.json`);
    const json = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Record<string, Record<string, string>>;
    for (const [section, key] of requiredPaths) {
      const val = json?.[section]?.[key];
      assert.equal(typeof val, 'string', `Missing ${section}.${key} in ${loc}.json`);
      assert.ok(val.trim().length > 0, `Empty ${section}.${key} in ${loc}.json`);
    }
  }
});

