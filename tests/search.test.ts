import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeArabic, stripDefiniteArticle, searchEntries } from '../src/utils/arabicSearch';
import { MYTH_ENTRIES } from '../src/data/seed';

test('normalizeArabic: handles diacritics, Alef variants, Taa Marbuta and Yaa', () => {
  // Tashkeel removal
  assert.equal(normalizeArabic('الْغُولُ'), 'الغول');
  assert.equal(normalizeArabic('العَنْقاء'), 'العنقاء');

  // Alef variants
  assert.equal(normalizeArabic('إرم'), 'ارم');
  assert.equal(normalizeArabic('أساطير'), 'اساطير');
  assert.equal(normalizeArabic('آلهة'), 'الهه');

  // Taa Marbuta to Haa
  assert.equal(normalizeArabic('مدينة'), 'مدينه');
  assert.equal(normalizeArabic('العنقاء'), 'العنقاء');

  // Yaa and Alef Maqsura
  assert.equal(normalizeArabic('إلى'), 'الي');
  assert.equal(normalizeArabic('اللاتِ'), 'اللات');
});

test('stripDefiniteArticle: removes "ال" prefix correctly', () => {
  assert.equal(stripDefiniteArticle('الغول'), 'غول');
  assert.equal(stripDefiniteArticle('العنقاء'), 'عنقاء');
  assert.equal(stripDefiniteArticle('اللات'), 'لات');
  // Short words starting with ال like "ال" shouldn't crash
  assert.equal(stripDefiniteArticle('ال'), 'ال');
  // Word not starting with ال
  assert.equal(stripDefiniteArticle('جن'), 'جن');
});

test('searchEntries: finds "الغول" when searching for "غول"', () => {
  const results = searchEntries(MYTH_ENTRIES, 'غول');
  assert.ok(results.length > 0, 'Should find at least 1 match');
  assert.equal(results[0].entry.id, 'al-ghul');
});

test('searchEntries: finds "العنقاء" when searching for "عنقاء"', () => {
  const results = searchEntries(MYTH_ENTRIES, 'عنقاء');
  assert.ok(results.length > 0, 'Should find at least 1 match');
  assert.equal(results[0].entry.id, 'al-anqa');
});

test('searchEntries: finds "مدينة إرم ذات العماد" searching with hamza variation or without', () => {
  const resultsWithHamza = searchEntries(MYTH_ENTRIES, 'إرم');
  assert.ok(resultsWithHamza.length > 0);
  assert.equal(resultsWithHamza[0].entry.id, 'iram-dhat-al-imad');

  const resultsWithoutHamza = searchEntries(MYTH_ENTRIES, 'ارم');
  assert.ok(resultsWithoutHamza.length > 0);
  assert.equal(resultsWithoutHamza[0].entry.id, 'iram-dhat-al-imad');
});

test('searchEntries: matches tags and region', () => {
  const horrorResults = searchEntries(MYTH_ENTRIES, 'رعب');
  assert.ok(horrorResults.length > 0);
  assert.ok(horrorResults.some((r) => r.entry.id === 'al-ghul'));

  const hijazResults = searchEntries(MYTH_ENTRIES, 'الحجاز');
  assert.ok(hijazResults.length > 0);
  assert.ok(hijazResults.some((r) => r.entry.id === 'al-lat'));
});

test('searchEntries: returns empty array on blank query', () => {
  assert.deepEqual(searchEntries(MYTH_ENTRIES, ''), []);
  assert.deepEqual(searchEntries(MYTH_ENTRIES, '   '), []);
});
