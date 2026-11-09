import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { LANGUAGES } from '../src/i18n/i18n';
import { translations } from '../src/i18n/index';

test('STEP 1: i18n files exist in src/i18n/', () => {
  const i18nDir = path.resolve(process.cwd(), 'src/i18n');
  assert.ok(fs.existsSync(path.join(i18nDir, 'ar.ts')), 'src/i18n/ar.ts must exist');
  assert.ok(fs.existsSync(path.join(i18nDir, 'id.ts')), 'src/i18n/id.ts must exist');
  assert.ok(fs.existsSync(path.join(i18nDir, 'th.ts')), 'src/i18n/th.ts must exist');
  assert.ok(fs.existsSync(path.join(i18nDir, 'index.ts')), 'src/i18n/index.ts must exist');
  assert.ok(fs.existsSync(path.join(i18nDir, 'i18n.ts')), 'src/i18n/i18n.ts must exist');
});

test('STEP 2: Language metadata contains Tunisia flag 🇹🇳 and all 3 languages', () => {
  const arabic = LANGUAGES.find((l) => l.lang === 'ar');
  assert.ok(arabic, 'Arabic metadata must exist');
  assert.equal(arabic?.flag, '🇹🇳', 'Arabic flag must be 🇹🇳 (Tunisia)');
  assert.equal(arabic?.dir, 'rtl');
  assert.equal(arabic?.label, 'العربية');

  const indonesian = LANGUAGES.find((l) => l.lang === 'id');
  assert.ok(indonesian, 'Indonesian metadata must exist');
  assert.equal(indonesian?.flag, '🇮🇩');
  assert.equal(indonesian?.dir, 'ltr');
  assert.equal(indonesian?.label, 'Bahasa Indonesia');

  const thai = LANGUAGES.find((l) => l.lang === 'th');
  assert.ok(thai, 'Thai metadata must exist');
  assert.equal(thai?.flag, '🇹🇭');
  assert.equal(thai?.dir, 'ltr');
  assert.equal(thai?.label, 'ไทย');
});

test('STEP 3: translations index exports ar, id, and th dictionaries', () => {
  assert.ok(translations.ar, 'translations.ar must exist');
  assert.ok(translations.id !== undefined, 'translations.id must exist');
  assert.ok(translations.th !== undefined, 'translations.th must exist');
});
