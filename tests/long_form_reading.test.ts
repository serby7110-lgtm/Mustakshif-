import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEstimatedReadingTime, formatReadingTime, countWords } from '../src/utils/readingTime';
import { storage } from '../src/data/storage';
import { getEntryById } from '../src/data/seed';

test('Reading Time: counts Arabic words and computes ~180 words/min correctly', () => {
  const sampleArabic = 'هذا نص تجريبي لحساب عدد الكلمات في اللغة العربية بدقة تامة';
  assert.equal(countWords(sampleArabic), 11);

  assert.equal(formatReadingTime(3), '≈ 3 د قراءة');
  assert.equal(formatReadingTime(1), '≈ 1 د قراءة');

  const ghul = getEntryById('al-ghul');
  assert.ok(ghul, 'Al-Ghul must exist');
  const time = getEstimatedReadingTime(ghul);
  assert.ok(typeof time === 'number');
  assert.ok(time >= 1, 'Reading time must be at least 1 minute');
});

test('Storage: LastReadChapter saves, retrieves, and clears correctly', () => {
  assert.equal(typeof storage.getLastReadChapter, 'function');
  assert.equal(typeof storage.setLastReadChapter, 'function');

  storage.setLastReadChapter({
    mythId: 'ghul',
    mythName: 'الغول',
    chapterIndex: 1,
    chapterTitle: 'الصوتُ الذي يعرف اسمك',
    progressPercent: 45,
  });

  const lastRead = storage.getLastReadChapter();
  assert.ok(lastRead, 'Last read record must be saved');
  assert.equal(lastRead.mythId, 'ghul');
  assert.equal(lastRead.mythName, 'الغول');
  assert.equal(lastRead.chapterIndex, 1);
  assert.equal(lastRead.chapterTitle, 'الصوتُ الذي يعرف اسمك');
  assert.equal(lastRead.progressPercent, 45);

  storage.clearLastReadChapter();
  assert.equal(storage.getLastReadChapter(), null);
});

test('Home v2: contains "أكمل القراءة" card and reading time indicators', () => {
  const homeCode = fs.readFileSync(path.resolve('src/screens/HomeScreen.tsx'), 'utf-8');

  // STEP 1: "أكمل القراءة" card
  assert.ok(homeCode.includes('أكمل القراءة'), 'Must render title "أكمل القراءة"');
  assert.ok(homeCode.includes('متابعة'), 'Must render mint "متابعة" button');
  assert.ok(homeCode.includes('lastRead.progressPercent'), 'Must display progress percent');
  assert.ok(homeCode.includes('formatReadingTime'), 'Must use formatReadingTime on cards');
  assert.ok(homeCode.includes('anqaEntry'), 'Must keep hero banner intact');
  assert.ok(homeCode.includes('mostReadEntries'), 'Must keep most read list intact');
});

test('Article v2: contains fixed reading progress, sticky chapter chips, font controls, quote copy, and "ألهمني"', () => {
  const articleCode = fs.readFileSync(path.resolve('src/screens/ArticleScreen.tsx'), 'utf-8');

  // STEP 2.1: Thin mint reading-progress bar fixed at top
  assert.ok(articleCode.includes('readingProgress'), 'Must compute readingProgress state');
  assert.ok(articleCode.includes('fixed top-0'), 'Must have fixed progress bar at top');
  assert.ok(articleCode.includes('tokens.primaryMint'), 'Progress bar must use mint theme token');

  // STEP 2.2: Sticky horizontal chapter chips & smooth scroll
  assert.ok(articleCode.includes('sticky top-1') || articleCode.includes('sticky top-0'), 'Must have sticky chapter container');
  assert.ok(articleCode.includes('scrollIntoView'), 'Must smooth-scroll to chapter');
  assert.ok(articleCode.includes('activeChapterIndex'), 'Must track and highlight active chapter chip');

  // STEP 2.3: Font-size control (A- / A+) in top bar persisted in storage
  assert.ok(articleCode.includes('A-'), 'Must have A- button');
  assert.ok(articleCode.includes('A+'), 'Must have A+ button');
  assert.ok(articleCode.includes('storage.setFontSize'), 'Must persist font size in storage');
  assert.ok(articleCode.includes('bodyTextSizeClass'), 'Must apply font-size exclusively to body and chapters');

  // STEP 2.4: Quote copy button
  assert.ok(articleCode.includes('handleCopyQuote'), 'Must implement handleCopyQuote');
  assert.ok(articleCode.includes('${quoteText} — ${quoteSource}'), 'Must copy quote text and source with dash');

  // STEP 2.5: Cool-blue "ألهمني" button and modal dialog
  assert.ok(articleCode.includes('ألهمني'), 'Must render "ألهمني" button');
  assert.ok(articleCode.includes('inspireModalOpen'), 'Must control inspire modal dialog');
  assert.ok(articleCode.includes('handleCopyHook'), 'Must provide hook copy action');
});
