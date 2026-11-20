/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Typography scale & multilingual font family configuration for Mustakshif.
 * Supports 5-step accessible reader font sizes and selectable Arabic & English typefaces.
 */

export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ArabicFontId = 'cairo' | 'amiri' | 'naskh';
export type EnglishFontId = 'jakarta' | 'merriweather' | 'garamond';

export const FONT_SIZE_ORDER: readonly FontSize[] = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

export interface FontSizeMeta {
  id: FontSize;
  mobilePx: number;
  desktopPx: number;
  tailwindClass: string;
}

export const FONT_SIZE_META: Record<FontSize, FontSizeMeta> = {
  xs: {
    id: 'xs',
    mobilePx: 14,
    desktopPx: 15,
    tailwindClass: 'text-[14px] sm:text-[15px] leading-[1.9]',
  },
  sm: {
    id: 'sm',
    mobilePx: 15,
    desktopPx: 16,
    tailwindClass: 'text-[15px] sm:text-[16px] leading-[1.92]',
  },
  md: {
    id: 'md',
    mobilePx: 17,
    desktopPx: 18,
    tailwindClass: 'text-[17px] sm:text-[18px] leading-[1.95]',
  },
  lg: {
    id: 'lg',
    mobilePx: 20,
    desktopPx: 21,
    tailwindClass: 'text-[20px] sm:text-[21px] leading-[1.95]',
  },
  xl: {
    id: 'xl',
    mobilePx: 23,
    desktopPx: 24,
    tailwindClass: 'text-[23px] sm:text-[24px] leading-[2.0]',
  },
};

export interface FontOptionMeta<T extends string> {
  id: T;
  cssFamily: string;
  sampleText: string;
  isDefault?: boolean;
}

export const ARABIC_FONT_OPTIONS: readonly FontOptionMeta<ArabicFontId>[] = [
  {
    id: 'cairo',
    cssFamily: "'Cairo', 'Tajawal', 'Noto Sans Arabic', system-ui, sans-serif",
    sampleText: 'في قديم الزمان حكت العرب عن العنقاء والغول',
    isDefault: true,
  },
  {
    id: 'amiri',
    cssFamily: "'Amiri', 'Traditional Arabic', serif",
    sampleText: 'في قديم الزمان حكت العرب عن العنقاء والغول',
  },
  {
    id: 'naskh',
    cssFamily: "'Noto Naskh Arabic', 'Amiri', serif",
    sampleText: 'في قديم الزمان حكت العرب عن العنقاء والغول',
  },
] as const;

export const ENGLISH_FONT_OPTIONS: readonly FontOptionMeta<EnglishFontId>[] = [
  {
    id: 'jakarta',
    cssFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    sampleText: 'Ancient desert legends preserved in timeless chronicles',
    isDefault: true,
  },
  {
    id: 'merriweather',
    cssFamily: "'Merriweather', Georgia, serif",
    sampleText: 'Ancient desert legends preserved in timeless chronicles',
  },
  {
    id: 'garamond',
    cssFamily: "'EB Garamond', Georgia, serif",
    sampleText: 'Ancient desert legends preserved in timeless chronicles',
  },
] as const;

export function normalizeFontSize(raw: unknown): FontSize {
  if (typeof raw === 'string' && (FONT_SIZE_ORDER as readonly string[]).includes(raw)) {
    return raw as FontSize;
  }
  return 'md';
}

export function normalizeArabicFont(raw: unknown): ArabicFontId {
  if (raw === 'cairo' || raw === 'amiri' || raw === 'naskh') {
    return raw;
  }
  return 'cairo';
}

export function normalizeEnglishFont(raw: unknown): EnglishFontId {
  if (raw === 'jakarta' || raw === 'merriweather' || raw === 'garamond') {
    return raw;
  }
  return 'jakarta';
}

export function stepFontSize(current: FontSize, direction: 'up' | 'down'): FontSize {
  const safe = normalizeFontSize(current);
  const idx = FONT_SIZE_ORDER.indexOf(safe);
  if (direction === 'up') {
    return FONT_SIZE_ORDER[Math.min(FONT_SIZE_ORDER.length - 1, idx + 1)];
  }
  return FONT_SIZE_ORDER[Math.max(0, idx - 1)];
}

export function canShrinkFontSize(size: FontSize): boolean {
  return normalizeFontSize(size) !== FONT_SIZE_ORDER[0];
}

export function canEnlargeFontSize(size: FontSize): boolean {
  return normalizeFontSize(size) !== FONT_SIZE_ORDER[FONT_SIZE_ORDER.length - 1];
}

export function getBodyTextSizeClass(size: FontSize): string {
  return FONT_SIZE_META[normalizeFontSize(size)].tailwindClass;
}

export function getArabicFontCssFamily(id: ArabicFontId): string {
  const match = ARABIC_FONT_OPTIONS.find((opt) => opt.id === id);
  return match?.cssFamily ?? ARABIC_FONT_OPTIONS[0].cssFamily;
}

export function getEnglishFontCssFamily(id: EnglishFontId): string {
  const match = ENGLISH_FONT_OPTIONS.find((opt) => opt.id === id);
  return match?.cssFamily ?? ENGLISH_FONT_OPTIONS[0].cssFamily;
}

export const FONT_SETTINGS_EVENT = 'mustakshif:font-settings-changed';

export function applyTypographyToDocument(prefs: {
  fontSize?: FontSize;
  arabicFont?: ArabicFontId;
  englishFont?: EnglishFontId;
}): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (prefs.fontSize) {
    const safeSize = normalizeFontSize(prefs.fontSize);
    root.setAttribute('data-font-size', safeSize);
    root.style.setProperty('--reader-font-px', `${FONT_SIZE_META[safeSize].mobilePx}px`);
  }
  if (prefs.arabicFont) {
    const safeAr = normalizeArabicFont(prefs.arabicFont);
    root.setAttribute('data-ar-font', safeAr);
    root.style.setProperty('--font-reader-ar', getArabicFontCssFamily(safeAr));
  }
  if (prefs.englishFont) {
    const safeEn = normalizeEnglishFont(prefs.englishFont);
    root.setAttribute('data-en-font', safeEn);
    root.style.setProperty('--font-reader-en', getEnglishFontCssFamily(safeEn));
  }
}
