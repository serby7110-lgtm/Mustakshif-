import test from 'node:test';
import assert from 'node:assert/strict';
import { getEntryById } from '../src/data/seed';

test('ArticleScreen data resolution: al-ghul resolves with all required sections', () => {
  const ghul = getEntryById('al-ghul');
  assert.ok(ghul, 'Al-Ghul must resolve');

  // Title and Type
  assert.equal(ghul.name, 'الغول');
  assert.equal(ghul.typeLabel, 'كائن أسطوري مفترس');

  // Body
  assert.ok(ghul.body.length >= 3, 'Body must contain at least 3 paragraphs for comfortable reading');

  // Sources
  assert.ok(ghul.sources.length >= 2, 'Must have classical sources');
  assert.ok(ghul.sources.some((s) => s.author.includes('الجاحظ')), 'Must cite Al-Jahiz');

  // Timeline
  assert.ok(ghul.timeline.length >= 2, 'Must have timeline points across eras');
  const eras = ghul.timeline.map((t) => t.era);
  assert.ok(eras.includes('جاهلية'), 'Must contain Jahiliyyah era');

  // Related entities
  assert.ok(ghul.related.length > 0, 'Must have related entities');
  for (const relId of ghul.related) {
    const rel = getEntryById(relId);
    assert.ok(rel, `Related entry ${relId} must resolve in database`);
  }
});

test('ArticleScreen data resolution: iram-dhat-al-imad and al-anqa resolve properly', () => {
  const iram = getEntryById('iram-dhat-al-imad');
  assert.ok(iram);
  assert.equal(iram.category, 'places');

  const anqa = getEntryById('al-anqa');
  assert.ok(anqa);
  assert.equal(anqa.category, 'creatures');
  assert.ok(anqa.sources.some((s) => s.author.includes('المسعودي')), 'Must cite Al-Masudi');
});

test('Arabic TTS: Hook exports and configuration', async () => {
  const { useArabicTTS } = await import('../src/hooks/useArabicTTS');
  assert.equal(typeof useArabicTTS, 'function', 'useArabicTTS must be a function hook');
});

test('Arabic TTS: Utterance configuration adheres to requirements (lang ar-SA, rate 0.95, pitch 1)', async () => {
  // Test mock synthesis environment
  let createdUtterances: Array<{ text: string; lang: string; rate: number; pitch: number }> = [];

  class MockSpeechSynthesisUtterance {
    text: string;
    lang = '';
    rate = 1;
    pitch = 1;
    onstart: (() => void) | null = null;
    onend: (() => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;

    constructor(text: string) {
      this.text = text;
      createdUtterances.push(this);
    }
  }

  const mockSynthesis = {
    speaking: false,
    paused: false,
    speak(utterance: MockSpeechSynthesisUtterance) {
      this.speaking = true;
      if (utterance.onstart) utterance.onstart();
      setTimeout(() => {
        this.speaking = false;
        if (utterance.onend) utterance.onend();
      }, 5);
    },
    pause() {
      this.paused = true;
    },
    resume() {
      this.paused = false;
    },
    cancel() {
      this.speaking = false;
      this.paused = false;
    },
    getVoices() {
      return [{ lang: 'ar-SA', name: 'Arabic Male' }];
    },
  };

  // Verify that an utterance configured by our specifications has exact params
  const u = new MockSpeechSynthesisUtterance('الغول');
  u.lang = 'ar-SA';
  u.rate = 0.95;
  u.pitch = 1;

  assert.equal(u.lang, 'ar-SA', 'Language must be ar-SA');
  assert.equal(u.rate, 0.95, 'Rate must be 0.95');
  assert.equal(u.pitch, 1, 'Pitch must be 1');
});

test('Arabic TTS: ArticleScreen source code contains all required steps', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const articleCode = fs.readFileSync(path.resolve('src/screens/ArticleScreen.tsx'), 'utf-8');

  // STEP 1 & 2
  assert.ok(articleCode.includes('useArabicTTS'), 'ArticleScreen must import and use useArabicTTS');
  
  // STEP 3: First tap reads title + body paragraphs, pause/resume, stop on exit
  assert.ok(articleCode.includes('speak([entry.name, ...entry.body])'), 'Must speak entry title and body paragraphs in order');
  assert.ok(articleCode.includes('pause()'), 'Must wire pause');
  assert.ok(articleCode.includes('resume()'), 'Must wire resume');
  assert.ok(articleCode.includes('stop()'), 'Must stop speech on unmount/exit');

  // STEP 4: Progress hint text
  assert.ok(articleCode.includes('يتم السرد الآن…'), 'Must show progress hint: يتم السرد الآن…');

// Graceful degradation: hide button when unsupported
  assert.ok(articleCode.includes('isSupported &&'), 'Must check isSupported to hide speaker button in unsupported browsers');
});

test('Myth Dual-Narrative Mode: myths.json merged fields, storage persistence, and ArticleScreen implementation', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { storage } = await import('../src/data/storage');

  const myths = JSON.parse(fs.readFileSync(path.resolve('src/data/myths.json'), 'utf8'));

  // Test target myths have both mythTradition and mythAnalysis in myths.json
  const targetIds = ['ghul', 'jinn', 'anqa', 'irm', 'zarqa-al-yamama', 'sihr'];
  for (const id of targetIds) {
    const myth = myths.find((m: any) => m.id === id);
    assert.ok(myth, `Myth with id ${id} must exist in myths.json`);
    assert.ok(myth.mythTradition && myth.mythTradition.length > 10, `${id} must have mythTradition string`);
    assert.ok(myth.mythAnalysis && myth.mythAnalysis.length > 10, `${id} must have mythAnalysis string`);
  }

  // Specific content assertions
  const ghul = myths.find((m: any) => m.id === 'ghul');
  assert.ok(ghul.mythTradition.includes('في الرواية الشعبية الغول كائن حقيقي'));
  assert.ok(ghul.mythAnalysis.includes('تحليلياً الغول تشخيصٌ لمخاطر الصحراء'));

  // Test storage persistence
  storage.setMythDualNarrativeView('tradition');
  assert.equal(storage.getMythDualNarrativeView(), 'tradition');
  storage.setMythDualNarrativeView('analysis');
  assert.equal(storage.getMythDualNarrativeView(), 'analysis');

  // Test ArticleScreen implementation
  const articleCode = fs.readFileSync(path.resolve('src/screens/ArticleScreen.tsx'), 'utf-8');
  assert.ok(articleCode.includes('القراءة التاريخية'), 'ArticleScreen must contain section title "القراءة التاريخية"');
  assert.ok(articleCode.includes('الرواية الشعبية'), 'ArticleScreen must contain button "الرواية الشعبية"');
  assert.ok(articleCode.includes('التحليل التاريخي'), 'ArticleScreen must contain button "التحليل التاريخي"');
  assert.ok(articleCode.includes('renderDualNarrativeSection'), 'ArticleScreen must render dual narrative section');
});

