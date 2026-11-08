/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif Design Tokens (مستكشف)
 * Light & Dark theme tokens strictly preserving the deep teal / mint / cool blue hue family.
 * Never gold, never brown, never generic slate.
 */

// --- Light Theme Palette ---
export const bg = '#FFFFFF';
export const surface = '#F2FBF7';
export const card = '#FFFFFF';
export const green = '#7FD1AE';
export const greenDeep = '#0E5C4D';
export const blue = '#4A90D9';
export const blueTint = '#E8F1FB';
export const textPrimary = '#14312B';
export const textSecondary = '#6B7C78';

// Pastel tag colors (Light)
export const tagHorror = '#F08A8A';
export const tagHistory = '#7FB2E8';
export const tagSupernatural = '#B79CE8';

// --- Dark Theme Palette (STEP 1: Exact user specification) ---
export const darkBg = '#0B2420';
export const darkSurface = '#12332D';
export const darkCard = '#12332D';
export const darkPrimaryMint = '#7FD1AE'; // Unchanged
export const darkDeepAccent = '#9FE8CC';
export const darkCoolBlueAccent = '#7FB2E8';
export const darkTextPrimary = '#E8F6F0';
export const darkTextSecondary = '#9DB8B0';

// Tag pastels (dark variants)
export const darkTagHorror = '#E89A9A';
export const darkTagHistory = '#9CC4EE';
export const darkTagSupernatural = '#C9B2F0';

export interface ThemeColors {
  background: string;
  surface: string;
  card: string;
  primaryMint: string;
  deepAccent: string;
  coolBlueAccent: string;
  coolBlueTint: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  borderSubtle: string;
  tags: {
    horror: string;
    horrorBg: string;
    horrorText: string;
    history: string;
    historyBg: string;
    historyText: string;
    supernatural: string;
    supernaturalBg: string;
    supernaturalText: string;
  };
}

export const lightPalette: ThemeColors = {
  background: bg,
  surface: surface,
  card: card,
  primaryMint: green,
  deepAccent: greenDeep,
  coolBlueAccent: blue,
  coolBlueTint: blueTint,
  textPrimary: textPrimary,
  textSecondary: textSecondary,
  border: 'rgba(127, 209, 174, 0.35)',
  borderSubtle: 'rgba(127, 209, 174, 0.2)',
  tags: {
    horror: tagHorror,
    horrorBg: 'rgba(240, 138, 138, 0.16)',
    horrorText: '#A63333',
    history: tagHistory,
    historyBg: 'rgba(127, 178, 232, 0.18)',
    historyText: '#1E5894',
    supernatural: tagSupernatural,
    supernaturalBg: 'rgba(183, 156, 232, 0.2)',
    supernaturalText: '#583696',
  },
};

export const darkPalette: ThemeColors = {
  background: darkBg,
  surface: darkSurface,
  card: darkCard,
  primaryMint: darkPrimaryMint,
  deepAccent: darkDeepAccent,
  coolBlueAccent: darkCoolBlueAccent,
  coolBlueTint: 'rgba(127, 178, 232, 0.18)',
  textPrimary: darkTextPrimary,
  textSecondary: darkTextSecondary,
  border: 'rgba(127, 209, 174, 0.25)',
  borderSubtle: 'rgba(127, 209, 174, 0.15)',
  tags: {
    horror: darkTagHorror,
    horrorBg: 'rgba(232, 154, 154, 0.22)',
    horrorText: '#FFB3B3',
    history: darkTagHistory,
    historyBg: 'rgba(156, 196, 238, 0.22)',
    historyText: '#BADCFF',
    supernatural: darkTagSupernatural,
    supernaturalBg: 'rgba(201, 178, 240, 0.22)',
    supernaturalText: '#DAC8FF',
  },
};

export const themeTokens = {
  light: lightPalette,
  dark: darkPalette,
} as const;

// Combined legacy light color object for backwards compatibility
export const colors = {
  bg,
  surface,
  card,
  green,
  greenDeep,
  blue,
  blueTint,
  textPrimary,
  textSecondary,
  tagHorror,
  tagHistory,
  tagSupernatural,
  // Dark additions
  darkBg,
  darkSurface,
  darkCard,
  darkPrimaryMint,
  darkDeepAccent,
  darkCoolBlueAccent,
  darkTextPrimary,
  darkTextSecondary,
  darkTagHorror,
  darkTagHistory,
  darkTagSupernatural,
} as const;

// Typography font stacks
export const fonts = {
  body: "'Cairo', 'Tajawal', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display: "'Aref Ruqaa', 'Amiri', serif",
  serif: "'Amiri', serif",
} as const;

// Generous rounded corners (16-20px for cards)
export const radii = {
  sm: '8px',
  md: '12px',
  card: '18px',
  lg: '20px',
  full: '9999px',
} as const;

// Soft, airy shadows suited for calm mint surfaces
export const shadows = {
  subtle: '0 2px 8px -2px rgba(14, 92, 77, 0.05), 0 1px 3px -1px rgba(14, 92, 77, 0.04)',
  card: '0 8px 24px -6px rgba(14, 92, 77, 0.06), 0 2px 6px -2px rgba(14, 92, 77, 0.03)',
  elevated: '0 16px 36px -8px rgba(14, 92, 77, 0.1), 0 4px 12px -3px rgba(14, 92, 77, 0.05)',
  tabBar: '0 -4px 20px -2px rgba(14, 92, 77, 0.06)',
} as const;

export default {
  colors,
  lightPalette,
  darkPalette,
  themeTokens,
  fonts,
  radii,
  shadows,
};
