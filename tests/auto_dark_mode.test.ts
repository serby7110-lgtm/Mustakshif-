import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  calculateSunTimes,
  evaluateAutoDarkMode,
  AMBIENT_LIGHT_DARK_THRESHOLD_LUX,
} from '../src/utils/autoDarkMode';
import { storage } from '../src/data/storage';

test('Auto Dark Mode: AMBIENT_LIGHT_DARK_THRESHOLD_LUX is 25 lux', () => {
  assert.equal(AMBIENT_LIGHT_DARK_THRESHOLD_LUX, 25);
});

test('Auto Dark Mode: Ambient Light Sensor evaluation (< 25 lux triggers dark, >= 25 lux triggers light)', () => {
  // Low ambient light (e.g. 10 lux in a dark room) -> dark mode
  const darkResult = evaluateAutoDarkMode(10);
  assert.equal(darkResult.isDark, true);
  assert.equal(darkResult.reason, 'sensor');
  assert.match(darkResult.description, /مستشعر الضوء/);

  // High ambient light (e.g. 150 lux in day room) -> light mode
  const lightResult = evaluateAutoDarkMode(150);
  assert.equal(lightResult.isDark, false);
  assert.equal(lightResult.reason, 'sensor');
  assert.match(lightResult.description, /مستشعر الضوء/);

  // Boundary checks: 24 lux -> dark, 25 lux -> light
  assert.equal(evaluateAutoDarkMode(24).isDark, true);
  assert.equal(evaluateAutoDarkMode(25).isDark, false);
});

test('Auto Dark Mode: Sunset/Sunrise calculation operates correctly for Arabian peninsula coordinates', () => {
  // Midday test (12:00 PM)
  const midday = new Date(2026, 5, 21, 12, 0, 0); // June 21 at noon
  const noonSun = calculateSunTimes(midday);
  assert.equal(noonSun.isNight, false);
  assert.ok(noonSun.sunriseMinutes < noonSun.sunsetMinutes);

  // Midnight test (01:00 AM)
  const midnight = new Date(2026, 5, 21, 1, 0, 0); // June 21 at 1 AM
  const midnightSun = calculateSunTimes(midnight);
  assert.equal(midnightSun.isNight, true);

  // Fallback to sunset/sunrise when ambient light sensor is null
  const sunsetMidday = evaluateAutoDarkMode(null, midday);
  assert.equal(sunsetMidday.isDark, false);
  assert.equal(sunsetMidday.reason, 'sunset');
  assert.match(sunsetMidday.description, /الشروق|الغروب/);

  const sunsetMidnight = evaluateAutoDarkMode(null, midnight);
  assert.equal(sunsetMidnight.isDark, true);
  assert.equal(sunsetMidnight.reason, 'sunset');
  assert.match(sunsetMidnight.description, /الغروب|الشروق/);
});

test('Auto Dark Mode: Storage persistence getAutoDarkMode / setAutoDarkMode', () => {
  storage.setAutoDarkMode(true);
  assert.equal(storage.getAutoDarkMode(), true);

  storage.setAutoDarkMode(false);
  assert.equal(storage.getAutoDarkMode(), false);
});

test('ArticleScreen: Implements smooth scrolling navigation between chapters', () => {
  const articlePath = path.resolve('src/screens/ArticleScreen.tsx');
  const code = fs.readFileSync(articlePath, 'utf8');

  assert.ok(code.includes('handleScrollToChapter'), 'Must define handleScrollToChapter');
  assert.ok(code.includes("behavior: 'smooth'"), 'Must invoke smooth scrolling');
  assert.ok(code.includes('scroll-mt-24'), 'Must include scroll-mt-24 offset for chapters');
  assert.ok(code.includes('scrollContainer.scrollTo'), 'Must support container scroll');
});

test('ProfileScreen: Includes "الوضع الليلي التلقائي" toggle switch and description', () => {
  const profilePath = path.resolve('src/screens/ProfileScreen.tsx');
  const code = fs.readFileSync(profilePath, 'utf8');

  assert.ok(code.includes('الوضع الليلي التلقائي'), 'Must include auto dark mode title');
  assert.ok(code.includes('isAutoDark'), 'Must read isAutoDark state');
  assert.ok(code.includes('toggleAutoDark'), 'Must wire toggleAutoDark handler');
  assert.ok(code.includes('autoDarkDescription'), 'Must show dynamic status description');
});

test('CSS and AppShell: Enable smooth scroll behavior', () => {
  const cssPath = path.resolve('src/index.css');
  const css = fs.readFileSync(cssPath, 'utf8');
  assert.ok(css.includes('scroll-behavior: smooth'), 'Global CSS must define smooth scroll');

  const appShellPath = path.resolve('src/components/layout/AppShell.tsx');
  const appShell = fs.readFileSync(appShellPath, 'utf8');
  assert.ok(appShell.includes('scroll-smooth'), 'AppShell main must have scroll-smooth class');
});
