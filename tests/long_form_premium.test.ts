import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  LONG_FORM_ENTRIES,
  getLongFormEntryById,
  isLongFormEntry,
  toLibraryMythEntry,
  isChapterUnlocked,
} from '../src/data/longForm';
import { getEntryById, getAllEntries, getEntriesByCategory } from '../src/data/seed';
import { CATEGORY_META } from '../src/data/types';
import { storage } from '../src/data/storage';

const ROOT = process.cwd();

describe('Mustakshif Three Premium Long-Form Entries', () => {
  it('keeps Android assets/long_form_entries.json and src/data/longFormEntries.json identical', () => {
    const androidJson = fs.readFileSync(
      path.join(ROOT, 'app/src/main/assets/long_form_entries.json'),
      'utf-8'
    );
    const webJson = fs.readFileSync(
      path.join(ROOT, 'src/data/longFormEntries.json'),
      'utf-8'
    );
    assert.equal(androidJson, webJson);
    assert.equal(LONG_FORM_ENTRIES.length, 3);
  });

  it('registers dhul-qarnayn with exact schema, chapters, and evidence labels', () => {
    const dq = getLongFormEntryById('dhul-qarnayn');
    assert.ok(dq, 'dhul-qarnayn should be registered');
    assert.equal(dq.name, 'ذو القرنين');
    assert.equal(dq.category, 'الشخصيات');
    assert.equal(dq.categoryKey, 'personalities');
    assert.equal(dq.entryType, 'شخصية قرآنية');
    assert.equal(dq.isPremium, true);
    assert.equal(dq.isHistorical, false);
    assert.equal(dq.heroImage, 'images/dhul-qarnayn.jpg');
    assert.deepEqual(dq.evidenceLabels, [
      'نص قرآني',
      'أقوال المفسرين',
      'إعادة تخيل أدبي',
    ]);
    assert.equal(dq.targetWords, 8000);
    assert.equal(dq.requiredSubscription, 'premium_monthly');
    assert.equal(dq.chapters.length, 8);
  });

  it('registers sinbad with exact schema, Seven Voyages, and evidence label', () => {
    const sinbad = getLongFormEntryById('sinbad');
    assert.ok(sinbad, 'sinbad should be registered');
    assert.equal(sinbad.name, 'السندباد البحري');
    assert.equal(sinbad.category, 'الشخصيات');
    assert.equal(sinbad.categoryKey, 'personalities');
    assert.equal(sinbad.entryType, 'بطل خيالي');
    assert.equal(sinbad.isPremium, true);
    assert.equal(sinbad.isHistorical, false);
    assert.equal(sinbad.heroImage, 'images/sinbad.jpg');
    assert.deepEqual(sinbad.evidenceLabels, ['خيال أدبي']);
    assert.equal(sinbad.targetWords, 10000);
    assert.equal(sinbad.requiredSubscription, 'premium_monthly');
    assert.equal(sinbad.chapters.length, 7);
    assert.ok(sinbad.chapters.every((ch) => !ch.isAppendix));
  });

  it('registers ibn-battuta with exact schema, 12 chapters + 2 appendices, and 3 evidence labels', () => {
    const ib = getLongFormEntryById('ibn-battuta');
    assert.ok(ib, 'ibn-battuta should be registered');
    assert.equal(ib.name, 'ابن بطوطة');
    assert.equal(ib.category, 'الشخصيات');
    assert.equal(ib.categoryKey, 'personalities');
    assert.equal(ib.entryType, 'رحّالة تاريخي');
    assert.equal(ib.isPremium, true);
    assert.equal(ib.isHistorical, true);
    assert.equal(ib.heroImage, 'images/ibn-battuta.jpg');
    assert.deepEqual(ib.evidenceLabels, [
      'موثق تاريخياً',
      'من عجائب روايته',
      'إعادة تخيل أدبي',
    ]);
    assert.equal(ib.targetWords, 11000);
    assert.equal(ib.requiredSubscription, 'premium_monthly');
    const mainChapters = ib.chapters.filter((ch) => !ch.isAppendix);
    const appendices = ib.chapters.filter((ch) => ch.isAppendix);
    assert.equal(mainChapters.length, 12);
    assert.equal(appendices.length, 2);
    assert.equal(ib.chapters.length, 14);
  });

  it('enforces Chapter 1 FREE teaser + Chapters 2+ locked behind premium_monthly + per-chapter evidence labels', () => {
    for (const entry of LONG_FORM_ENTRIES) {
      const ch1 = entry.chapters[0];
      assert.equal(ch1.index, 0);
      assert.equal(ch1.isFree, true);
      assert.equal(ch1.contentPending, false);
      assert.ok(ch1.paragraphs.length >= 3, `${entry.id} chapter 1 should have teaser paragraphs`);
      assert.equal(isChapterUnlocked(entry, 0, false), true);

      for (let i = 1; i < entry.chapters.length; i++) {
        const ch = entry.chapters[i];
        assert.equal(ch.isFree, false);
        assert.equal(ch.contentPending, true);
        assert.deepEqual(ch.paragraphs, []);
        assert.equal(isChapterUnlocked(entry, i, false), false);
        assert.equal(isChapterUnlocked(entry, i, true), true);
      }

      for (const ch of entry.chapters) {
        assert.ok(ch.title.trim().length > 0);
        assert.ok(
          entry.evidenceLabels.includes(ch.evidenceLabel),
          `${entry.id} chapter ${ch.id} evidenceLabel "${ch.evidenceLabel}" must belong to entry.evidenceLabels`
        );
      }
    }
  });

  it('bundles all 3 hero images locally for both Android assets and Web public/images', () => {
    for (const entry of LONG_FORM_ENTRIES) {
      const androidImg = path.join(ROOT, 'app/src/main/assets', entry.heroImage);
      const webImg = path.join(ROOT, 'public', entry.heroImage);
      assert.ok(fs.existsSync(androidImg), `Missing Android hero image: ${androidImg}`);
      assert.ok(fs.existsSync(webImg), `Missing Web hero image: ${webImg}`);
      assert.ok(fs.statSync(androidImg).size > 1024);
      assert.ok(fs.statSync(webImg).size > 1024);
    }
  });

  it('increases الشخصيات category count from 5 to 8 and merges long-form entries with badges metadata', () => {
    const personalities = getEntriesByCategory('personalities');
    assert.equal(personalities.length, 8);
    assert.equal(CATEGORY_META.personalities.countLabel, '٨ شخصيات');

    const homeTsx = fs.readFileSync(
      path.join(ROOT, 'src/screens/HomeScreen.tsx'),
      'utf-8'
    );
    assert.match(homeTsx, /٨ شخصيات/);

    const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');
    assert.match(appTsx, /getEntriesByCategory\(categoryFilterModal\)\.length/);
    assert.match(appTsx, /طويلة/);
    assert.match(appTsx, /Premium/);

    const all = getAllEntries();
    for (const id of ['dhul-qarnayn', 'sinbad', 'ibn-battuta']) {
      assert.equal(isLongFormEntry(id), true);
      const seedEntry = getEntryById(id);
      assert.ok(seedEntry, `${id} should resolve via getEntryById`);
      assert.equal(seedEntry.category, 'personalities');
      assert.equal(seedEntry.isLongForm, true);
      assert.equal(seedEntry.isPremium, true);
      assert.equal(seedEntry.requiredSubscription, 'premium_monthly');
      assert.ok(all.some((m) => m.id === id), `${id} should exist in getAllEntries`);
      assert.ok(
        personalities.some((m) => m.id === id),
        `${id} should appear in الشخصيات category detail list`
      );
      const lib = toLibraryMythEntry(getLongFormEntryById(id)!);
      assert.equal(lib.heroImage, `/images/${id}.jpg`);
    }
  });

  it('persists per-chapter progress and resume state + premium_monthly entitlement safely', () => {
    storage.setPremiumMonthly(false);
    assert.equal(storage.hasPremiumMonthly(), false);

    storage.setLongFormChapterProgress('ibn-battuta', 'ib-ch-1', 0, 'الفصل الأول', 75);
    const resume = storage.getLongFormResumeState('ibn-battuta');
    assert.ok(resume);
    assert.equal(resume.lastChapterId, 'ib-ch-1');
    assert.equal(resume.lastChapterIndex, 0);
    assert.equal(resume.chapterProgressPercent, 75);

    const map = storage.getLongFormChapterProgressMap();
    assert.equal(map['ibn-battuta:ib-ch-1'], 75);

    storage.setPremiumMonthly(true);
    assert.equal(storage.hasPremiumMonthly(), true);
  });

  it('wires Android native long-form components, EntitlementManager, LongFormProgressStore, and UI badges', () => {
    const requiredAndroidFiles = [
      'app/src/main/java/com/mustakshif/app/data/LongFormModels.kt',
      'app/src/main/java/com/mustakshif/app/data/EntitlementManager.kt',
      'app/src/main/java/com/mustakshif/app/storage/LongFormProgressStore.kt',
      'app/src/main/java/com/mustakshif/app/data/MythRepository.kt',
      'app/src/main/java/com/mustakshif/app/ui/LongFormReaderComponents.kt',
      'app/src/main/java/com/mustakshif/app/MainActivity.kt',
      'app/src/main/res/values/strings.xml',
    ];
    for (const rel of requiredAndroidFiles) {
      assert.ok(fs.existsSync(path.join(ROOT, rel)), `Missing ${rel}`);
    }

    const repoKt = fs.readFileSync(
      path.join(ROOT, 'app/src/main/java/com/mustakshif/app/data/MythRepository.kt'),
      'utf-8'
    );
    assert.match(repoKt, /long_form_entries\.json/);
    assert.match(repoKt, /getLongFormEntries/);

    const uiKt = fs.readFileSync(
      path.join(ROOT, 'app/src/main/java/com/mustakshif/app/ui/LongFormReaderComponents.kt'),
      'utf-8'
    );
    const stringsXml = fs.readFileSync(
      path.join(ROOT, 'app/src/main/res/values/strings.xml'),
      'utf-8'
    );
    assert.match(uiKt, /badge_long_form/);
    assert.match(uiKt, /badge_premium/);
    assert.match(uiKt, /long_form_resume/);
    assert.match(stringsXml, /طويلة/);
    assert.match(stringsXml, /Premium/);
    assert.match(stringsXml, /استئناف القراءة/);
    assert.doesNotMatch(uiKt, /#(?:795548|8B4513|A0522D|D4AF37|FFD700|B8860B)/i);

    const libraryTsx = fs.readFileSync(
      path.join(ROOT, 'src/screens/LibraryScreen.tsx'),
      'utf-8'
    );
    assert.match(libraryTsx, /LONG_FORM_ENTRIES/);
    assert.match(libraryTsx, /طويلة/);
    assert.match(libraryTsx, /Premium/);

    const articleTsx = fs.readFileSync(
      path.join(ROOT, 'src/screens/ArticleScreen.tsx'),
      'utf-8'
    );
    assert.match(articleTsx, /LongFormReaderSection/);
    assert.match(articleTsx, /getLongFormEntryById/);
  });
});
