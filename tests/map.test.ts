import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { getEntryById } from '../src/data/seed';

test('MapScreen data integrity: check key mythic locations and pins', () => {
  const placeIds = [
    'iram-dhat-al-imad',
    'al-lat',
    'al-uzza',
    'hubal',
    'al-ghul',
    'al-jinn',
    'al-anqa',
    'well-of-barhout',
    'marib-dam',
    'ghumdan-palace',
  ];

  for (const id of placeIds) {
    const entry = getEntryById(id);
    assert.ok(entry, `Entry ${id} must exist in encyclopedia seed`);
    assert.ok(entry.region && entry.region.length > 0, `Entry ${id} must have a geographic region`);
    assert.ok(entry.name && entry.name.length > 0, `Entry ${id} must have Arabic name`);
    assert.ok(entry.summary && entry.summary.length > 0, `Entry ${id} must have Arabic summary`);
  }
});

test('MapScreen: 2D Flat SVG map adheres to STEP 1 specifications', () => {
  const code = fs.readFileSync(path.resolve('src/screens/MapScreen.tsx'), 'utf8');

  // Sea #E8F1FB with wave pattern, Land #F2FBF7 with 1px teal outline #7FD1AE, dark mode #0B2420 / #12332D
  assert.ok(code.includes('#E8F1FB'), 'Sea pale blue #E8F1FB is used');
  assert.ok(code.includes('#F2FBF7'), 'Land soft mint #F2FBF7 is used');
  assert.ok(code.includes('#7FD1AE'), 'Teal outline #7FD1AE is used');
  assert.ok(code.includes('#C9E8D9'), 'Faint dashed border lines #C9E8D9 are used');
  assert.ok(code.includes('strokeWidth="0.5"'), 'Faint borders have 0.5px stroke');
  assert.ok(code.includes('strokeDasharray="3,3"'), 'Country hint borders are dashed');
  assert.ok(code.includes('pattern') && code.includes('seaWavePattern'), 'Subtle sea wave pattern is used');
  assert.ok(code.includes('opacity="0.03"'), 'Subtle watermark with 3% opacity in corners');
  assert.ok(!code.includes('linearGradient id="seaGrad"'), 'No gradients or 3D terrain on sea');
});

test('MapScreen: Markers conform to STEP 2 category colors and shapes', () => {
  const code = fs.readFileSync(path.resolve('src/screens/MapScreen.tsx'), 'utf8');

  // gods: mint circle #7FD1AE
  assert.ok(code.includes("color = '#7FD1AE'") || code.includes("categoryKey === 'gods'"), 'Gods marker color is mint');
  // creatures: cool blue circle #4A90D9
  assert.ok(code.includes('#4A90D9'), 'Creatures marker color is cool blue #4A90D9');
  // places: deep teal circle #0E5C4D
  assert.ok(code.includes('#0E5C4D'), 'Places marker color is deep teal #0E5C4D');
  // heroes: coral circle #E8602C
  assert.ok(code.includes('#E8602C'), 'Heroes marker color is coral #E8602C');
  // personalities: purple circle #9B7EDE
  assert.ok(code.includes('#9B7EDE'), 'Personalities marker color is purple #9B7EDE');
  // rituals: amber circle #D4A24C
  assert.ok(code.includes('#D4A24C'), 'Rituals marker color is amber #D4A24C');
  // civilizations: square with rounded corners (10x10px, rx=2, ry=2) in deep teal
  assert.ok(code.includes('rx="2"') && code.includes('ry="2"'), 'Civilization square marker has rounded corners');
  // 1.5px white stroke
  assert.ok(code.includes('stroke="#FFFFFF"'), 'Markers have white stroke');
  assert.ok(code.includes('strokeWidth="1.5"'), 'Markers have 1.5px stroke width');
});

test('MapScreen: STEP 3 interactions, tooltip, and RTL bottom sheet', () => {
  const code = fs.readFileSync(path.resolve('src/screens/MapScreen.tsx'), 'utf8');

  // 1.3x scale on hover
  assert.ok(code.includes('1.3'), 'Scales to 1.3x on hover');
  // Tooltip with teal border
  assert.ok(code.includes('hoveredItem'), 'Hover tooltip state exists');
  // Bottom sheet with max 40% height
  assert.ok(code.includes('max-h-[40vh]'), 'Bottom sheet max height 40%');
  // 48x48 thumbnail (w-12 h-12)
  assert.ok(code.includes('w-12 h-12'), 'Hero thumbnail is 48x48 (w-12 h-12)');
  // Display font for name
  assert.ok(code.includes('Aref_Ruqaa'), 'Name uses display font Aref_Ruqaa');
  // 2 lines summary
  assert.ok(code.includes('line-clamp-2'), 'Summary is clamped to 2 lines max');
  // "اقرأ القصة" button
  assert.ok(code.includes('اقرأ القصة'), 'Action button is "اقرأ القصة"');
});

test('MapScreen: STEP 4 Top bar search with Arabic normalization & filter chips', () => {
  const code = fs.readFileSync(path.resolve('src/screens/MapScreen.tsx'), 'utf8');

  assert.ok(code.includes('ابحث في الخريطة'), 'Search input placeholder "ابحث في الخريطة"');
  assert.ok(code.includes('normalizeArabic'), 'Arabic search normalization is implemented');
  assert.ok(code.includes('الكل'), 'Filter chip "الكل" exists');
  assert.ok(code.includes('آلهة'), 'Filter chip "آلهة" exists');
  assert.ok(code.includes('كائنات'), 'Filter chip "كائنات" exists');
  assert.ok(code.includes('أماكن'), 'Filter chip "أماكن" exists');
  assert.ok(code.includes('أبطال'), 'Filter chip "أبطال" exists');
  assert.ok(code.includes('شخصيات'), 'Filter chip "شخصيات" exists');
  assert.ok(code.includes('طقوس'), 'Filter chip "طقوس" exists');
  assert.ok(code.includes('حضارات'), 'Filter chip "حضارات" exists');
});

test('MapScreen: STEP 5 Legend box and STEP 6 Compass Rose', () => {
  const code = fs.readFileSync(path.resolve('src/screens/MapScreen.tsx'), 'utf8');

  // Legend box: bottom-left, ~120px, title "دليل الخريطة"
  assert.ok(code.includes('دليل الخريطة'), 'Legend box has title "دليل الخريطة"');
  assert.ok(code.includes('bottom-3 left-3'), 'Legend is at bottom-left');
  assert.ok(code.includes("width: '125px'"), 'Legend width ~120x180px');

  // Compass rose: bottom-right, simple 4-point star, teal, 32px
  assert.ok(code.includes('bottom-3 right-3'), 'Compass rose is at bottom-right');
  assert.ok(code.includes('width="32"') && code.includes('height="32"'), 'Compass rose is 32px');
  assert.ok(code.includes('polygon'), 'Compass rose is a clean 4-point star polygon');
});

test('MapScreen: STEP 7 Performance & STEP 8 Empty state', () => {
  const code = fs.readFileSync(path.resolve('src/screens/MapScreen.tsx'), 'utf8');

  // requestAnimationFrame for pan/zoom
  assert.ok(code.includes('requestAnimationFrame'), 'requestAnimationFrame is used for 60fps pan/zoom');
  assert.ok(code.includes('cancelAnimationFrame'), 'cancelAnimationFrame cleans up RAF');
  // SVG circle and rect elements for markers
  assert.ok(code.includes('<circle'), 'Markers rendered as SVG <circle>');
  assert.ok(code.includes('<rect'), 'Civilization markers rendered as SVG <rect>');
  // Empty state copy
  assert.ok(code.includes('لا نتائج — جرّب فلتر آخر'), 'Empty state copy "لا نتائج — جرّب فلتر آخر"');
});
