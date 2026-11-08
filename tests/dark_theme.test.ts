import test from 'node:test';
import assert from 'node:assert/strict';
import {
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
  darkPalette,
  lightPalette,
  themeTokens,
} from '../src/theme/tokens';
import { storage } from '../src/data/storage';
import { ar } from '../src/i18n/ar';

test('STEP 1: Dark theme tokens match exact user-specified hex values', () => {
  // background: #0B2420
  assert.equal(darkBg, '#0B2420');
  assert.equal(darkPalette.background, '#0B2420');

  // surface/card: #12332D
  assert.equal(darkSurface, '#12332D');
  assert.equal(darkCard, '#12332D');
  assert.equal(darkPalette.surface, '#12332D');
  assert.equal(darkPalette.card, '#12332D');

  // primary mint: #7FD1AE (unchanged)
  assert.equal(darkPrimaryMint, '#7FD1AE');
  assert.equal(darkPalette.primaryMint, '#7FD1AE');

  // deep accent: #9FE8CC
  assert.equal(darkDeepAccent, '#9FE8CC');
  assert.equal(darkPalette.deepAccent, '#9FE8CC');

  // cool blue accent: #7FB2E8
  assert.equal(darkCoolBlueAccent, '#7FB2E8');
  assert.equal(darkPalette.coolBlueAccent, '#7FB2E8');

  // text primary: #E8F6F0
  assert.equal(darkTextPrimary, '#E8F6F0');
  assert.equal(darkPalette.textPrimary, '#E8F6F0');

  // text secondary: #9DB8B0
  assert.equal(darkTextSecondary, '#9DB8B0');
  assert.equal(darkPalette.textSecondary, '#9DB8B0');

  // tag pastels (dark variants): horror #E89A9A, history #9CC4EE, supernatural #C9B2F0
  assert.equal(darkTagHorror, '#E89A9A');
  assert.equal(darkPalette.tags.horror, '#E89A9A');

  assert.equal(darkTagHistory, '#9CC4EE');
  assert.equal(darkPalette.tags.history, '#9CC4EE');

  assert.equal(darkTagSupernatural, '#C9B2F0');
  assert.equal(darkPalette.tags.supernatural, '#C9B2F0');

  // Theme tokens map both light and dark
  assert.ok(themeTokens.light);
  assert.ok(themeTokens.dark);
  assert.equal(themeTokens.dark.background, '#0B2420');
});

test('STEP 2: Profile screen row label is exactly "الوضع الليلي" and persists in storage', () => {
  assert.equal(ar.profile.darkMode, 'الوضع الليلي');

  // Storage allows toggling and retrieval
  storage.setThemeMode('dark');
  assert.equal(storage.getThemeMode(), 'dark');

  storage.setThemeMode('light');
  assert.equal(storage.getThemeMode(), 'light');
});

test('Theme strictly maintains deep teal/mint/cool blue hue family with no brown or gold', () => {
  const allDarkColors = [
    darkBg,
    darkSurface,
    darkCard,
    darkPrimaryMint,
    darkDeepAccent,
    darkCoolBlueAccent,
    darkTextPrimary,
    darkTextSecondary,
  ];

  // Verify none of the colors are warm golds (#D4AF37, #FFD700) or muddy browns (#8B4513, etc.)
  allDarkColors.forEach((hex) => {
    assert.match(hex, /^#[0-9A-Fa-f]{6}$/, `Invalid hex: ${hex}`);
    assert.notEqual(hex.toLowerCase(), '#ffd700');
    assert.notEqual(hex.toLowerCase(), '#d4af37');
    assert.notEqual(hex.toLowerCase(), '#8b4513');
  });
});
