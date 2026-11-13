import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('STEP 4: Verify all required i18n files exist', () => {
  const i18nDir = path.resolve('src/i18n');
  const requiredFiles = ['i18n.ts', 'ar.ts', 'id.ts', 'th.ts', 'index.ts'];

  for (const file of requiredFiles) {
    const fullPath = path.join(i18nDir, file);
    assert.ok(fs.existsSync(fullPath), `Required file missing: src/i18n/${file}`);
  }
});

test('STEP 1: ProfileScreen row "لغة التطبيق" is tappable with chevron and dynamic flag+label badge', () => {
  const profilePath = path.resolve('src/screens/ProfileScreen.tsx');
  const code = fs.readFileSync(profilePath, 'utf8');

  // Verify row is a button
  assert.ok(
    code.includes('setIsLangSheetOpen(true)'),
    'Profile row must open language bottom sheet on tap'
  );

  // Verify chevron icon is present
  assert.ok(
    code.includes('<ChevronLeft') && code.includes('rotate-180'),
    'Profile row must have chevron icon supporting RTL and LTR'
  );

  // Verify current language badge mapping includes all 3 languages (🇹🇳 عربي / 🇮🇩 Indonesia / 🇹🇭 ไทย)
  assert.ok(code.includes("'🇹🇳'"), 'Badge must support Tunisia flag');
  assert.ok(code.includes("'عربي'"), 'Arabic label must be عربي');
  assert.ok(code.includes("'🇮🇩'"), 'Badge must support Indonesia flag');
  assert.ok(code.includes("'Indonesia'"), 'Indonesian label must be Indonesia');
  assert.ok(code.includes("'🇹🇭'"), 'Badge must support Thailand flag');
  assert.ok(code.includes("'ไทย'"), 'Thai label must be ไทย');
});

test('STEP 2: Bottom sheet is RTL-safe and renders 3 radio options with mint highlight', () => {
  const profilePath = path.resolve('src/screens/ProfileScreen.tsx');
  const code = fs.readFileSync(profilePath, 'utf8');

  // Verify bottom sheet container and RTL-safe dir attribute
  assert.ok(code.includes('isLangSheetOpen'), 'Must render when isLangSheetOpen is true');
  assert.ok(code.includes('dir={dir}'), 'Bottom sheet must be RTL-safe with dir={dir}');
  assert.ok(code.includes('slide-in-from-bottom'), 'Must animate as a bottom sheet');
  assert.ok(code.includes('role="radiogroup"'), 'Must have accessible radiogroup');
  assert.ok(code.includes('role="radio"'), 'Options must have role="radio"');

  // Verify 3 options: 🇹🇳 العربية, 🇮🇩 Bahasa Indonesia, 🇹🇭 ไทย
  assert.ok(code.includes('العربية'), 'Option 1 must be العربية');
  assert.ok(code.includes('Bahasa Indonesia'), 'Option 2 must be Bahasa Indonesia');
  assert.ok(code.includes('ไทย'), 'Option 3 must be ไทย');

  // Verify mint highlight and filled radio indicator
  assert.ok(
    code.includes('primaryMint') || code.includes('#7FD1AE'),
    'Must highlight selected option with mint token'
  );
  assert.ok(code.includes('rounded-full border-2'), 'Must render radio circle');
});

test('STEP 3: Selection triggers setLang, localStorage persistence, document dir, and localized toast', () => {
  const profilePath = path.resolve('src/screens/ProfileScreen.tsx');
  const code = fs.readFileSync(profilePath, 'utf8');

  // Local storage persistence
  assert.ok(
    code.includes("window.localStorage.setItem('mustakshif:lang'"),
    'Must persist selected language to localStorage'
  );

  // Document direction update
  assert.ok(
    code.includes("document.documentElement.setAttribute('dir'"),
    'Must update document direction'
  );

  // Exact toast messages per language
  assert.ok(code.includes('تم تغيير اللغة'), 'Arabic toast must be "تم تغيير اللغة"');
  assert.ok(code.includes('Language changed'), 'English toast must be "Language changed"');
  assert.ok(code.includes('Bahasa diubah'), 'Indonesian toast must be "Bahasa diubah"');
  assert.ok(code.includes('เปลี่ยนภาษาแล้ว'), 'Thai toast must be "เปลี่ยนภาษาแล้ว"');
});
