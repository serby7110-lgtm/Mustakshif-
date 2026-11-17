import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  SUPPORTED_LANGS,
  LANG_STORAGE_KEY,
  APP_LANGUAGES,
  normalizeLang,
  getLangDirection,
} from '../src/i18n';
import {
  getLocalizedEntry,
  getLocalizedCivilization,
  getLocalizedDeepStory,
  localizeTag,
  localizeEra,
  localizeEvidenceLabel,
} from '../src/content/index';
import { formatReadingTime } from '../src/utils/readingTime';
import { MYTH_ENTRIES } from '../src/data/seed';
import { CIVILIZATIONS } from '../src/data/civTypes';
import { DEEP_STORIES } from '../src/data/storyTypes';

const LOCALE_DIR = path.resolve('src/locales');
const CONTENT_DIR = path.resolve('src/content');

function collectLeafKeys(obj: unknown, prefix = ''): Array<{ key: string; value: unknown }> {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return [{ key: prefix, value: obj }];
  }
  const entries: Array<{ key: string; value: unknown }> = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      entries.push(...collectLeafKeys(v, nextKey));
    } else {
      entries.push({ key: nextKey, value: v });
    }
  }
  return entries;
}

test('i18n configuration supports ar, en, id, th with ar default and localStorage persistence key', () => {
  assert.deepEqual([...SUPPORTED_LANGS], ['ar', 'en', 'id', 'th']);
  assert.equal(LANG_STORAGE_KEY, 'mustakshif:lang');
  assert.equal(normalizeLang('en-US'), 'en');
  assert.equal(normalizeLang('id-ID'), 'id');
  assert.equal(normalizeLang('th-TH'), 'th');
  assert.equal(normalizeLang('fr-FR'), 'ar');
  assert.equal(normalizeLang(undefined), 'ar');

  assert.equal(getLangDirection('ar'), 'rtl');
  assert.equal(getLangDirection('en'), 'ltr');
  assert.equal(getLangDirection('id'), 'ltr');
  assert.equal(getLangDirection('th'), 'ltr');

  const nativeLabels = APP_LANGUAGES.map((l) => l.nativeName);
  assert.deepEqual(nativeLabels, ['العربية', 'English', 'Bahasa Indonesia', 'ไทย']);
});

test('all 4 locale JSON files have identical keys and non-empty translations', () => {
  const bundles = Object.fromEntries(
    SUPPORTED_LANGS.map((lang) => [
      lang,
      JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, `${lang}.json`), 'utf8')) as Record<string, unknown>,
    ])
  );

  const arLeaves = collectLeafKeys(bundles.ar);
  const arMap = new Map(arLeaves.map((x) => [x.key, x.value]));
  assert.ok(arLeaves.length > 50, 'Arabic locale should contain UI keys');
  assert.ok(arMap.has('home.title'), 'Must contain home.title key');

  for (const lang of SUPPORTED_LANGS) {
    const leaves = collectLeafKeys(bundles[lang]);
    const leafMap = new Map(leaves.map((x) => [x.key, x.value]));

    for (const [key, arVal] of arMap.entries()) {
      assert.ok(leafMap.has(key), `Missing key "${key}" in ${lang}.json`);
      const val = leafMap.get(key);
      if (typeof arVal === 'string' && arVal.trim().length > 0) {
        assert.ok(typeof val === 'string' && val.trim().length > 0, `Empty string for key "${key}" in ${lang}.json`);
      } else if (Array.isArray(arVal) && arVal.length > 0) {
        assert.ok(Array.isArray(val) && val.length > 0, `Empty array for key "${key}" in ${lang}.json`);
      }
    }

    for (const key of leafMap.keys()) {
      assert.ok(arMap.has(key), `Unexpected extra key "${key}" in ${lang}.json`);
    }
  }
});

test('all 4 content JSON files contain full encyclopedia parity for myths, civilizations, and stories', () => {
  const contentBundles = Object.fromEntries(
    SUPPORTED_LANGS.map((lang) => [
      lang,
      JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, `${lang}.json`), 'utf8')) as {
        myths: Record<string, unknown>;
        civilizations: Record<string, unknown>;
        stories: Record<string, unknown>;
      },
    ])
  );

  const arMyths = Object.keys(contentBundles.ar.myths).sort();
  const arCivs = Object.keys(contentBundles.ar.civilizations).sort();
  const arStories = Object.keys(contentBundles.ar.stories).sort();

  assert.ok(arMyths.length >= MYTH_ENTRIES.length);
  assert.ok(arCivs.length >= CIVILIZATIONS.length);
  assert.ok(arStories.length > 0);

  for (const lang of SUPPORTED_LANGS) {
    assert.deepEqual(
      Object.keys(contentBundles[lang].myths).sort(),
      arMyths,
      `${lang} content myths keys must match ar`
    );
    assert.deepEqual(
      Object.keys(contentBundles[lang].civilizations).sort(),
      arCivs,
      `${lang} content civilizations keys must match ar`
    );
    assert.deepEqual(
      Object.keys(contentBundles[lang].stories).sort(),
      arStories,
      `${lang} content stories keys must match ar`
    );
  }
});

test('content localization translates all entries cleanly and falls back to Arabic when fields are missing', () => {
  const sampleMyth = MYTH_ENTRIES[0];
  for (const lang of ['en', 'id', 'th'] as const) {
    const localized = getLocalizedEntry(sampleMyth, lang);
    assert.equal(localized.hasMissingTranslation, false, `${sampleMyth.id} should be fully translated in ${lang}`);
    assert.notEqual(localized.name, sampleMyth.name, `${sampleMyth.id} name should be localized in ${lang}`);
  }

  // Fallback check on missing translation ID
  const phantomEntry = { ...sampleMyth, id: 'non-existent-entry-id' };
  const fallbackEntry = getLocalizedEntry(phantomEntry, 'en');
  assert.equal(fallbackEntry.hasMissingTranslation, true);
  assert.equal(fallbackEntry.name, sampleMyth.name);

  const sampleCiv = CIVILIZATIONS[0];
  for (const lang of ['en', 'id', 'th'] as const) {
    const localizedCiv = getLocalizedCivilization(sampleCiv, lang);
    assert.equal(localizedCiv.hasMissingTranslation, false, `${sampleCiv.id} should be fully translated in ${lang}`);
    assert.notEqual(localizedCiv.name, sampleCiv.name);
  }

  const firstStoryKey = Object.keys(DEEP_STORIES)[0];
  const sampleStory = DEEP_STORIES[firstStoryKey];
  const localizedStory = getLocalizedDeepStory(sampleStory, firstStoryKey, 'th');
  assert.ok(localizedStory);
  assert.equal(localizedStory.hasMissingTranslation, false);

  assert.equal(localizeTag('تاريخ', 'en'), 'History');
  assert.equal(localizeEra('جاهلية', 'id'), 'Era Pra-Islam');
  assert.equal(localizeEvidenceLabel('نص قرآني', 'th'), 'โองการอัลกุรอาน');
  assert.equal(formatReadingTime(5, 'ar'), '≈ 5 د قراءة');
  assert.equal(formatReadingTime(5, 'en'), '≈ 5 min read');
  assert.equal(formatReadingTime(5, 'id'), '≈ 5 mnt baca');
  assert.equal(formatReadingTime(5, 'th'), '≈ อ่าน 5 นาที');
});

test('header language selector and Thai/Arabic Google Fonts are configured cleanly', () => {
  const appShellCode = fs.readFileSync(path.resolve('src/components/layout/AppShell.tsx'), 'utf8');
  assert.ok(appShellCode.includes('header-lang-selector'));
  assert.ok(appShellCode.includes('header-lang-menu'));

  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(indexHtml.includes('Noto+Sans+Thai'), 'index.html must load Noto Sans Thai font');
  assert.ok(indexHtml.includes('Noto+Naskh+Arabic'), 'index.html must load Noto Naskh Arabic font');

  const indexCss = fs.readFileSync(path.resolve('src/index.css'), 'utf8');
  assert.ok(
    indexCss.includes('html[lang="th"]') || indexCss.includes("html[lang='th']"),
    'index.css must bind Noto Sans Thai when html[lang="th"]'
  );
});
