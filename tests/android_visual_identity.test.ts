import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. colors.xml and values-night/colors.xml contain exact palettes with zero brown/gold', () => {
  const lightColors = fs.readFileSync(path.resolve('app/src/main/res/values/colors.xml'), 'utf8');
  assert.ok(lightColors.includes('#F2FBF7'), 'Must contain light background #F2FBF7');
  assert.ok(lightColors.includes('#0E5C4D'), 'Must contain deep accent #0E5C4D');
  assert.ok(lightColors.includes('#7FD1AE'), 'Must contain primary mint #7FD1AE');
  assert.ok(lightColors.includes('#4A90D9'), 'Must contain cool blue #4A90D9');
  assert.ok(lightColors.includes('#14312B'), 'Must contain text primary #14312B');

  const darkColors = fs.readFileSync(path.resolve('app/src/main/res/values-night/colors.xml'), 'utf8');
  assert.ok(darkColors.includes('#0B2420'), 'Must contain dark background #0B2420');
  assert.ok(darkColors.includes('#12332D'), 'Must contain dark surface #12332D');
  assert.ok(darkColors.includes('#7FD1AE'), 'Must contain dark primary #7FD1AE');
  assert.ok(darkColors.includes('#E8F6F0'), 'Must contain dark text primary #E8F6F0');

  // Strict check: no brown or gold in either file
  for (const content of [lightColors, darkColors]) {
    assert.ok(!content.toLowerCase().includes('gold'), 'Must not contain gold');
    assert.ok(!content.toLowerCase().includes('brown'), 'Must not contain brown');
    assert.ok(!content.includes('#d4af37'), 'No gold hex');
    assert.ok(!content.includes('#ffd700'), 'No gold hex');
    assert.ok(!content.includes('#8b4513'), 'No brown hex');
  }
});

test('2. themes.xml implements DayNight theme with enforced RTL', () => {
  const themes = fs.readFileSync(path.resolve('app/src/main/res/values/themes.xml'), 'utf8');
  assert.ok(themes.includes('Theme.MaterialComponents.DayNight'), 'Must use DayNight base theme');
  assert.ok(themes.includes('android:layoutDirection">rtl'), 'Must enforce layoutDirection rtl');
});

test('3. Compose Theme.kt and Color.kt implement exact palette and enforce RTL', () => {
  const colorKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/theme/Color.kt'), 'utf8');
  assert.ok(colorKt.includes('0xFFF2FBF7'), 'LightBackground 0xFFF2FBF7');
  assert.ok(colorKt.includes('0xFF0E5C4D'), 'PrimaryEmerald 0xFF0E5C4D');
  assert.ok(colorKt.includes('0xFF7FD1AE'), 'PrimaryMint 0xFF7FD1AE');
  assert.ok(colorKt.includes('0xFF0B2420'), 'DarkBackground 0xFF0B2420');
  assert.ok(colorKt.includes('0xFF12332D'), 'DarkSurface 0xFF12332D');

  const themeKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/theme/Theme.kt'), 'utf8');
  assert.ok(themeKt.includes('LayoutDirection.Rtl'), 'Must enforce LayoutDirection.Rtl in Compose');
  assert.ok(themeKt.includes('LocalLayoutDirection provides LayoutDirection.Rtl'), 'CompositionLocalProvider for RTL');
});

test('4. Typography: uses Arabic body and display fonts with start-alignment for RTL', () => {
  const typeKt = fs.readFileSync(path.resolve('app/src/main/java/com/mustakshif/app/theme/Type.kt'), 'utf8');
  assert.ok(typeKt.includes('ArabicBodyFont'), 'Must define ArabicBodyFont');
  assert.ok(typeKt.includes('ArabicDisplayFont'), 'Must define ArabicDisplayFont');
  assert.ok(typeKt.includes('TextAlign.Start'), 'Must use TextAlign.Start for proper RTL alignment');
});

test('5. Launcher Icons: legacy mipmap for API 21-25 and adaptive-icon for API 26+ with eight-pointed star', () => {
  const v21 = fs.readFileSync(path.resolve('app/src/main/res/mipmap-anydpi-v21/ic_launcher.xml'), 'utf8');
  assert.ok(v21.includes('layer-list'), 'API 21 launcher must use layer-list');
  assert.ok(v21.includes('@drawable/ic_star_logo'), 'Must render star logo');

  const v26 = fs.readFileSync(path.resolve('app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml'), 'utf8');
  assert.ok(v26.includes('adaptive-icon'), 'API 26 launcher must use adaptive-icon');
  assert.ok(v26.includes('@drawable/ic_star_logo'), 'Must render star logo');

  const logo = fs.readFileSync(path.resolve('app/src/main/res/drawable/ic_star_logo.xml'), 'utf8');
  assert.ok(logo.includes('vector'), 'ic_star_logo must be a vector drawable');
  assert.ok(logo.includes('#0E5C4D') && logo.includes('#7FD1AE'), 'Logo must use Emerald and Mint colors');
});
