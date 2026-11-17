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

test('UI Audit Fixes 1-6: typography, text-start alignment, full reading time, chapter navigator, stroke icons, active timeline', () => {
  const articleCode = fs.readFileSync(path.resolve('src/screens/ArticleScreen.tsx'), 'utf-8');
  const longFormUiCode = fs.readFileSync(path.resolve('src/components/longform/LongFormReaderSection.tsx'), 'utf-8');
  const civCode = fs.readFileSync(path.resolve('src/screens/CivilizationPage.tsx'), 'utf-8');

  // 1. Body typography: 17px mobile / 18px tablet+, line-height 1.95, 16px horizontal padding (px-4)
  assert.ok(articleCode.includes('text-[17px] sm:text-[18px] leading-[1.95]'), 'Base body must be 17px mobile / 18px tablet+ with line-height 1.95');
  assert.ok(articleCode.includes('px-4 py-5'), 'Text cards must use 16px horizontal padding (px-4)');

  // 2. Text alignment: no text-justify left in reader screens; use text-start
  assert.ok(!articleCode.includes('text-justify'), 'ArticleScreen must not use text-justify');
  assert.ok(!longFormUiCode.includes('text-justify'), 'LongFormReaderSection must not use text-justify');
  assert.ok(!civCode.includes('text-justify'), 'CivilizationPage must not use text-justify');
  assert.ok(articleCode.includes('text-start'), 'ArticleScreen must use text-start');

  // 3. Reading time: recomputed from body + ALL chapters + quotes at 180 words/min
  const ghul = getEntryById('ghul');
  assert.ok(ghul, 'ghul must exist');
  // ghul has 92 body words + 253 deep chapter words + 53 quote words = 398 words -> ceil(398/180) = 3 min
  assert.equal(getEstimatedReadingTime(ghul), 3);

  // 4. Chapter navigator: 16px inline padding, scroll-padding-inline 16px, fade mask, scrollIntoView
  assert.ok(articleCode.includes("scrollPaddingInline: '16px'"), 'Chapter navigator must set scroll-padding-inline 16px');
  assert.ok(articleCode.includes("paddingInline: '16px'"), 'Chapter navigator must set 16px inline padding');
  assert.ok(articleCode.includes('linear-gradient(to'), 'Chapter navigator must render soft fade mask');

  // 5. No emojis in UI; PenLine + Gamepad2 at 18px, strokeWidth 1.9, #0E5C4D / #9FE8CC
  const emojiRegex = /[\u{1F300}-\u{1FAFF}]/u;
  for (const rel of [
    'src/screens/ArticleScreen.tsx',
    'src/screens/ProfileScreen.tsx',
    'src/screens/ContactScreen.tsx',
    'src/screens/StudioScreen.tsx',
    'src/screens/LibraryScreen.tsx',
  ]) {
    const srcText = fs.readFileSync(path.resolve(rel), 'utf-8');
    assert.equal(emojiRegex.test(srcText), false, `${rel} must contain zero emojis`);
  }
  assert.ok(articleCode.includes('<PenLine'), 'Must use PenLine stroke icon');
  assert.ok(articleCode.includes('<Gamepad2'), 'Must use Gamepad2 stroke icon');
  assert.ok(articleCode.includes('strokeWidth={1.9}'), 'Icons must use stroke 1.9');
  assert.ok(articleCode.includes('#0E5C4D') && articleCode.includes('#9FE8CC'), 'Icons must use #0E5C4D light / #9FE8CC dark');

  // 6. Timeline active state: #4A90D9 active node + connector fill, #DDEEE6 inactive border & remainder, 200ms transition
  assert.ok(articleCode.includes('normalizeEra'), 'Timeline must normalize الجاهلية / جاهلية');
  assert.ok(articleCode.includes('#4A90D9'), 'Active node & connector must use #4A90D9');
  assert.ok(articleCode.includes('#DDEEE6'), 'Inactive node border & track must use #DDEEE6');
  assert.ok(articleCode.includes('duration-200'), 'Timeline must use 200ms transition');
});

