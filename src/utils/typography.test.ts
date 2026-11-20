import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARABIC_FONT_OPTIONS,
  ENGLISH_FONT_OPTIONS,
  FONT_SIZE_META,
  FONT_SIZE_ORDER,
  canEnlargeFontSize,
  canShrinkFontSize,
  getArabicFontCssFamily,
  getBodyTextSizeClass,
  getEnglishFontCssFamily,
  normalizeArabicFont,
  normalizeEnglishFont,
  normalizeFontSize,
  stepFontSize,
} from './typography';

test('Font size scale supports 5 distinct clamped steps (xs -> sm -> md -> lg -> xl)', () => {
  assert.deepEqual(FONT_SIZE_ORDER, ['xs', 'sm', 'md', 'lg', 'xl']);
  assert.equal(normalizeFontSize('unknown'), 'md');
  assert.equal(normalizeFontSize(undefined), 'md');
  assert.equal(normalizeFontSize('xl'), 'xl');

  assert.equal(stepFontSize('md', 'up'), 'lg');
  assert.equal(stepFontSize('lg', 'up'), 'xl');
  assert.equal(stepFontSize('xl', 'up'), 'xl');
  assert.equal(stepFontSize('md', 'down'), 'sm');
  assert.equal(stepFontSize('sm', 'down'), 'xs');
  assert.equal(stepFontSize('xs', 'down'), 'xs');

  assert.equal(canShrinkFontSize('xs'), false);
  assert.equal(canShrinkFontSize('sm'), true);
  assert.equal(canEnlargeFontSize('xl'), false);
  assert.equal(canEnlargeFontSize('lg'), true);

  assert.ok(FONT_SIZE_META.xs.mobilePx < FONT_SIZE_META.sm.mobilePx);
  assert.ok(FONT_SIZE_META.sm.mobilePx < FONT_SIZE_META.md.mobilePx);
  assert.ok(FONT_SIZE_META.md.mobilePx < FONT_SIZE_META.lg.mobilePx);
  assert.ok(FONT_SIZE_META.lg.mobilePx < FONT_SIZE_META.xl.mobilePx);
  assert.equal(getBodyTextSizeClass('md'), 'text-[17px] sm:text-[18px] leading-[1.95]');
});

test('Provides 3 Arabic font choices (Cairo default + Amiri & Noto Naskh Arabic) and 3 English fonts', () => {
  assert.equal(ARABIC_FONT_OPTIONS.length, 3);
  assert.equal(ENGLISH_FONT_OPTIONS.length, 3);

  assert.equal(normalizeArabicFont('invalid'), 'cairo');
  assert.equal(normalizeArabicFont('amiri'), 'amiri');
  assert.equal(normalizeArabicFont('naskh'), 'naskh');

  assert.equal(normalizeEnglishFont('invalid'), 'jakarta');
  assert.equal(normalizeEnglishFont('merriweather'), 'merriweather');
  assert.equal(normalizeEnglishFont('garamond'), 'garamond');

  assert.ok(getArabicFontCssFamily('amiri').includes('Amiri'));
  assert.ok(getArabicFontCssFamily('naskh').includes('Noto Naskh Arabic'));
  assert.ok(getEnglishFontCssFamily('jakarta').includes('Plus Jakarta Sans'));
  assert.ok(getEnglishFontCssFamily('merriweather').includes('Merriweather'));
  assert.ok(getEnglishFontCssFamily('garamond').includes('EB Garamond'));
});
