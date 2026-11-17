import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { MYTH_ENTRIES } from '../src/data/seed';
import { DEEP_STORIES } from '../src/data/storyTypes';
import { SUPPORTED_LANGS } from '../src/i18n';
import mythsJson from '../src/data/myths.json';

test('Audit Phase 1: Zero external unsplash.com URLs in src/ and valid local image files exist on disk', () => {
  const seedCode = fs.readFileSync(path.resolve('src/data/seed.ts'), 'utf8');
  assert.equal(seedCode.includes('unsplash.com'), false, 'seed.ts must not contain external unsplash.com URLs');

  for (const entry of MYTH_ENTRIES) {
    if (entry.heroImage && entry.heroImage.startsWith('/images/')) {
      const diskPath = path.resolve('public', entry.heroImage.replace(/^\//, ''));
      assert.ok(fs.existsSync(diskPath), `Missing seed heroImage on disk: ${entry.heroImage}`);
    }
  }

  for (const item of mythsJson as Array<{ id: string; heroImage?: string }>) {
    if (item.heroImage && item.heroImage.startsWith('/images/')) {
      const diskPath = path.resolve('public', item.heroImage.replace(/^\//, ''));
      assert.ok(fs.existsSync(diskPath), `Missing myths.json heroImage on disk for ${item.id}: ${item.heroImage}`);
    }
  }
});

test('Audit Phase 1: public/favicon.ico is compressed below 30 KB', () => {
  const faviconPath = path.resolve('public/favicon.ico');
  assert.ok(fs.existsSync(faviconPath), 'public/favicon.ico must exist');
  const stats = fs.statSync(faviconPath);
  assert.ok(stats.size < 30 * 1024, `favicon.ico size ${stats.size} bytes must be < 30 KB`);
});

test('Audit Phase 2: No external eruda CDN or legacy app_errors inline script in index.html', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.equal(indexHtml.includes('cdn.jsdelivr.net/npm/eruda'), false, 'eruda CDN must be removed from index.html');
  assert.equal(indexHtml.includes("STORAGE_KEY = 'app_errors'"), false, 'legacy inline app_errors script must be removed');
});

test('Audit Phase 3: Full 17-story parity (including dhul-qarnayn and sinbad) and non-empty badge units across all 4 languages', () => {
  const deepKeys = Object.keys(DEEP_STORIES).sort();
  assert.ok(deepKeys.includes('dhul-qarnayn'), 'DEEP_STORIES must include dhul-qarnayn');
  assert.ok(deepKeys.includes('sinbad'), 'DEEP_STORIES must include sinbad');

  for (const lang of SUPPORTED_LANGS) {
    const content = JSON.parse(
      fs.readFileSync(path.resolve(`src/content/${lang}.json`), 'utf8')
    ) as { stories: Record<string, { chapters?: unknown[] }> };

    for (const storyKey of deepKeys) {
      assert.ok(content.stories[storyKey], `${lang}.json must contain story ${storyKey}`);
      const expectedChapters = DEEP_STORIES[storyKey]?.chapters?.length ?? 0;
      if (expectedChapters > 0) {
        assert.ok(
          Array.isArray(content.stories[storyKey].chapters) && content.stories[storyKey].chapters!.length > 0,
          `${lang}.json story ${storyKey} must have translated chapters`
        );
      }
    }

    const locale = JSON.parse(
      fs.readFileSync(path.resolve(`src/locales/${lang}.json`), 'utf8')
    ) as {
      profile: {
        badgesMap: Record<string, { name: string; desc: string; unit: string }>;
      };
      theme: Record<string, string>;
      map: { pinRegions: Record<string, string> };
    };

    for (const [badgeId, badge] of Object.entries(locale.profile.badgesMap)) {
      assert.ok(badge.unit && badge.unit.trim().length > 0, `${lang}.json badge ${badgeId} unit must be non-empty`);
    }
    assert.ok(locale.theme.autoSunDefault, `${lang}.json must include theme.autoSunDefault`);
    assert.ok(locale.map.pinRegions['dhul-qarnayn'], `${lang}.json must include map.pinRegions.dhul-qarnayn`);
  }
});
