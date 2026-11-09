import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('PWA STEP 1 & 2: manifest.json exists with exact verbatim Arabic metadata and SVG icons', () => {
  const manifestPath = path.resolve('public', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'public/manifest.json must exist');

  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.ok(content.name === 'مستكشف' || content.name === 'مستكشف — موسوعة الأساطير والحضارات العربية', 'Valid manifest name');
  assert.equal(content.short_name, 'مستكشف');
  assert.ok(content.description && content.description.length > 0, 'Valid description');
  assert.equal(content.start_url, '/');
  assert.equal(content.scope, '/');
  assert.equal(content.display, 'standalone');
  assert.ok(Array.isArray(content.icons), 'icons must be an array');
  assert.ok(content.icons.length >= 2, 'At least 2 icons defined');

  // Verify icon file physically exists
  assert.ok(fs.existsSync(path.resolve('public', 'icons', 'icon.svg')), 'public/icons/icon.svg must exist');
});

test('PWA STEP 2: sw.js caches assets and json data', () => {
  const swPath = path.resolve('public', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');

  const content = fs.readFileSync(swPath, 'utf8');
  assert.ok(content.includes("const CACHE = 'mustakshif-v1';"), 'Must define CACHE constant');
  assert.ok(content.includes("const ASSETS = ['/', '/index.html', '/manifest.json', '/icons/icon.svg'];"), 'Must define ASSETS list');
  assert.ok(content.includes("url.pathname.endsWith('.json')"), 'Must cache JSON requests');
  assert.ok(content.includes('caches.open(CACHE)'), 'Must open cache');
});

test('PWA STEP 3: index.html links manifest, apple-touch-icon, and registers sw.js', () => {
  const htmlPath = path.resolve('index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(htmlContent.includes('rel="manifest" href="/manifest.json"'), 'Must link manifest.json');
  assert.ok(htmlContent.includes('rel="apple-touch-icon"'), 'Must define apple-touch-icon');
  assert.ok(htmlContent.includes("navigator.serviceWorker.register('/sw.js')"), 'Must register service worker in index.html');
});

test('PWA STEP 4: SplashScreen displays exact tagline and white background', () => {
  const splashPath = path.resolve('src', 'screens', 'SplashScreen.tsx');
  const splashContent = fs.readFileSync(splashPath, 'utf8');

  assert.ok(splashContent.includes('bg-[#FFFFFF]'), 'White background required');
  assert.ok(splashContent.includes('<Logo'), 'Must render Logo SVG');
  assert.ok(splashContent.includes('مستكشف'), 'App name مستكشف required');
  assert.ok(splashContent.includes('موسوعة الأساطير والحضارات العربية'), 'Tagline موسوعة الأساطير والحضارات العربية required');
  assert.ok(splashContent.includes('fade-in'), 'Fade-in animation required');
});

test('PWA STEP 5: ProfileScreen includes "تثبيت التطبيق" button with beforeinstallprompt', () => {
  const profilePath = path.resolve('src', 'screens', 'ProfileScreen.tsx');
  const profileContent = fs.readFileSync(profilePath, 'utf8');

  assert.ok(profileContent.includes('تثبيت التطبيق'), 'Must include "تثبيت التطبيق" button');
  assert.ok(profileContent.includes('beforeinstallprompt'), 'Must use beforeinstallprompt event');
  assert.ok(profileContent.includes('!isInstalled'), 'Must show only if not installed');
});
