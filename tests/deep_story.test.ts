import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getDeepStory, hasDeepStory, DeepStory } from '../src/data/storyTypes';

test('Deep Story: stories.json exists and is valid JSON', () => {
  const storiesPath = path.resolve('src/data/stories.json');
  assert.ok(fs.existsSync(storiesPath), 'src/data/stories.json must exist');
  const raw = fs.readFileSync(storiesPath, 'utf-8');
  const parsed = JSON.parse(raw);
  assert.equal(typeof parsed, 'object', 'stories.json must parse into an object');
});

test('Deep Story: getDeepStory and hasDeepStory helpers behave correctly', () => {
  assert.equal(typeof getDeepStory, 'function', 'getDeepStory must be a function');
  assert.equal(typeof hasDeepStory, 'function', 'hasDeepStory must be a function');

  // Currently stories.json is empty
  assert.equal(getDeepStory('non_existent_id'), undefined);
  assert.equal(hasDeepStory('non_existent_id'), false);
  assert.equal(getDeepStory(''), undefined);
  assert.equal(hasDeepStory(''), false);
});

test('Deep Story: DeepStory schema conforms to interface specification', () => {
  // Mock entry conforming to DeepStory
  const mockStory: DeepStory = {
    chapters: [
      { title: 'أسرار الرمال', text: 'كانت القوافل تتجنب وادي عبقر في الهزيع الأخير من الليل...' }
    ],
    quotes: [
      { text: 'ما من أحد يدخل هذا الوادي إلا استوحش', source: 'كتاب الحيوان للجاحظ', type: 'نص حرفي' },
      { text: 'تروي الأعراب أن العنقاء تظهر كل ألف عام', source: 'مروج الذهب للمسعودي', type: 'بأسلوب المصدر' }
    ],
    motifs: ['النار الباردة', 'أصوات الليل', 'التحول الشكلي'],
    themes: ['المجهول', 'البقاء في الصحراء'],
    cast: ['الراعي المسافر', 'هاتف الليل'],
    gameHooks: ['ميكانيكا الاختفاء والضباب', 'مواجهة زعيم متحول الأطوار'],
    writingHooks: ['قصيدة منسية تكشف نقطة الضعف', 'حوار بين حكيم وكائن خفي']
  };

  assert.equal(mockStory.chapters!.length, 1);
  assert.equal(mockStory.chapters![0].title, 'أسرار الرمال');
  assert.equal(mockStory.quotes!.length, 2);
  assert.equal(mockStory.quotes![0].type, 'نص حرفي');
  assert.equal(mockStory.quotes![1].type, 'بأسلوب المصدر');
  assert.equal(mockStory.motifs!.length, 3);
  assert.equal(mockStory.gameHooks!.length, 2);
  assert.equal(mockStory.writingHooks!.length, 2);
});

test('Deep Story: ArticleScreen source code contains all required sections and tokens', () => {
  const articleCode = fs.readFileSync(path.resolve('src/screens/ArticleScreen.tsx'), 'utf-8');

  // getDeepStory integration
  assert.ok(articleCode.includes('getDeepStory'), 'Must import and use getDeepStory');

  // Section "الحكاية الكاملة"
  assert.ok(articleCode.includes('الحكاية الكاملة'), 'Must render section title الحكاية الكاملة');
  assert.ok(articleCode.includes('chapter.title'), 'Must render chapter title in display font');
  assert.ok(articleCode.includes('chapter.text'), 'Must render chapter text');

  // Section "من المصادر"
  assert.ok(articleCode.includes('من المصادر'), 'Must render section title من المصادر');
  assert.ok(articleCode.includes('Amiri'), 'Must style quotes in serif Arabic (Amiri)');
  assert.ok(articleCode.includes('نص حرفي'), 'Must handle quote type pills');

  // Section "عدّة المبدع"
  assert.ok(articleCode.includes('عدّة المبدع'), 'Must render section title عدّة المبدع');
  assert.ok(articleCode.includes('لصنّاع الألعاب'), 'Must render card title لصنّاع الألعاب');
  assert.ok(articleCode.includes('لكتّاب القصص'), 'Must render card title لكتّاب القصص');
  assert.ok(articleCode.includes('العناصر الدرامية'), 'Must render chip row label العناصر الدرامية');
  assert.ok(articleCode.includes('الثيمات'), 'Must render chip row label الثيمات');
  assert.ok(articleCode.includes('شخصيات الحكاية'), 'Must render chip row label شخصيات الحكاية');
});

test('Deep Story: LibraryScreen displays mint badge "حكاية كاملة" when available', () => {
  const libraryCode = fs.readFileSync(path.resolve('src/screens/LibraryScreen.tsx'), 'utf-8');
  assert.ok(libraryCode.includes('hasDeepStory'), 'Must import and use hasDeepStory in LibraryScreen');
  assert.ok(libraryCode.includes('حكاية كاملة'), 'Must show mint badge with text "حكاية كاملة"');
});
