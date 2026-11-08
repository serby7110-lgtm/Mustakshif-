import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bg,
  surface,
  green,
  greenDeep,
  blue,
  blueTint,
  textPrimary,
  textSecondary,
  tagHorror,
  tagHistory,
  tagSupernatural,
  colors,
} from '../src/theme/tokens';
import { TABS } from '../src/components/layout/TabBar';

test('Theme tokens export the exact required palette', () => {
  assert.equal(bg, '#FFFFFF');
  assert.equal(surface, '#F2FBF7');
  assert.equal(green, '#7FD1AE');
  assert.equal(greenDeep, '#0E5C4D');
  assert.equal(blue, '#4A90D9');
  assert.equal(blueTint, '#E8F1FB');
  assert.equal(textPrimary, '#14312B');
  assert.equal(textSecondary, '#6B7C78');
  assert.equal(tagHorror, '#F08A8A');
  assert.equal(tagHistory, '#7FB2E8');
  assert.equal(tagSupernatural, '#B79CE8');

  assert.equal(colors.bg, '#FFFFFF');
  assert.equal(colors.greenDeep, '#0E5C4D');
});

test('Tabs are configured in exact RTL order: home, civilizations, map, library, profile', () => {
  assert.equal(TABS.length, 5);
  assert.equal(TABS[0].id, 'home');
  assert.equal(TABS[0].label, 'الرئيسية');
  assert.equal(TABS[1].id, 'civilizations');
  assert.equal(TABS[1].label, 'الحضارات');
  assert.equal(TABS[2].id, 'map');
  assert.equal(TABS[2].label, 'الخريطة');
  assert.equal(TABS[3].id, 'library');
  assert.equal(TABS[3].label, 'المكتبة');
  assert.equal(TABS[4].id, 'profile');
  assert.equal(TABS[4].label, 'حسابي');
});
