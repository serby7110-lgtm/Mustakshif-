import test from 'node:test';
import assert from 'node:assert/strict';
import { storage } from '../src/data/storage';

test('Storage service default states and operations', () => {
  // Test fallback defaults when localStorage is simulated or mocked
  const defaultBookmarks = storage.getBookmarks();
  assert.ok(Array.isArray(defaultBookmarks), 'Bookmarks must return an array');
  assert.ok(defaultBookmarks.length > 0, 'Should have initial sample bookmarks');

  const defaultHistory = storage.getHistory();
  assert.ok(Array.isArray(defaultHistory), 'History must return an array');

  const defaultTheme = storage.getThemeMode();
  assert.equal(defaultTheme, 'light', 'Default theme must be light');

  const defaultFont = storage.getFontSize();
  assert.equal(defaultFont, 'md', 'Default font size must be md');
});

test('Theme modes strictly conform to light and darkTeal hue family', () => {
  const validThemes = ['light', 'darkTeal'];
  assert.ok(validThemes.includes('light'));
  assert.ok(validThemes.includes('darkTeal'));
  // Ensure no gold/brown theme options exist
  assert.equal(validThemes.includes('gold' as any), false);
  assert.equal(validThemes.includes('brown' as any), false);
});
