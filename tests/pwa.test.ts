import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('PWA STEP 1 & 2: manifest.json exists with complete icons, attractive Arabic metadata, categories, and RTL config', () => {
  const manifestPath = path.resolve('public', 'manifest.json');
  assert.ok(fs.existsSync(manifestPath), 'public/manifest.json must exist');

  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(content.id, '/');
  assert.equal(content.name, 'مستكشف');
  assert.equal(content.short_name, 'مستكشف');
  assert.equal(content.dir, 'rtl');
  assert.equal(content.lang, 'ar');
  assert.equal(content.start_url, '/');
  assert.equal(content.scope, '/');
  assert.equal(content.display, 'standalone');
  assert.equal(content.background_color, '#ffffff');
  assert.equal(content.theme_color, '#0f766e');
  assert.ok(
    content.description &&
      content.description.includes('مستكشف:') &&
      content.description.includes('يعمل دون اتصال'),
    'Valid engaging Arabic description'
  );
  assert.ok(Array.isArray(content.icons) && content.icons.length >= 4, 'Complete icon set defined');
  assert.ok(
    content.icons.some((i: { src?: string; sizes?: string; purpose?: string }) =>
      i.src === '/icons/icon-192.png' && i.sizes === '192x192' && i.purpose === 'any'
    ),
    'Must include /icons/icon-192.png with purpose any'
  );
  assert.ok(
    content.icons.some((i: { src?: string; sizes?: string; purpose?: string }) =>
      i.src === '/icons/icon-512.png' && i.sizes === '512x512' && i.purpose === 'any'
    ),
    'Must include /icons/icon-512.png with purpose any'
  );
  assert.ok(
    content.icons.some((i: { src?: string; sizes?: string; purpose?: string }) =>
      i.src === '/icons/icon-maskable-512.png' && i.sizes === '512x512' && i.purpose === 'maskable'
    ),
    'Must include dedicated /icons/icon-maskable-512.png with purpose maskable'
  );
  assert.ok(
    content.icons.some((i: { src?: string; type?: string }) =>
      i.src === '/icons/icon.svg' && i.type === 'image/svg+xml'
    ),
    'Must include /icons/icon.svg'
  );

  assert.ok(fs.existsSync(path.resolve('public', 'icons', 'icon-192.png')), 'public/icons/icon-192.png must exist');
  assert.ok(fs.existsSync(path.resolve('public', 'icons', 'icon-512.png')), 'public/icons/icon-512.png must exist');
  assert.ok(fs.existsSync(path.resolve('public', 'icons', 'icon-maskable-512.png')), 'public/icons/icon-maskable-512.png must exist');
  assert.ok(fs.existsSync(path.resolve('public', 'icons', 'icon.svg')), 'public/icons/icon.svg must exist');
  assert.ok(fs.existsSync(path.resolve('public', 'apple-touch-icon.png')), 'public/apple-touch-icon.png must exist');
});

test('PWA STEP 2: public/sw.js handles precaching, offline app-shell fallback, and stale-while-revalidate asset caching', () => {
  const swPath = path.resolve('public', 'sw.js');
  assert.ok(fs.existsSync(swPath), 'public/sw.js must exist');

  const content = fs.readFileSync(swPath, 'utf8');
  assert.ok(content.includes('workbox-sw.js'), 'Must import Workbox service worker safely');
  assert.ok(content.includes('const CACHE = "pwabuilder-page";'), 'Must define CACHE constant pwabuilder-page');
  assert.ok(content.includes('const RUNTIME_CACHE = "mustakshif-runtime-v1";'), 'Must define RUNTIME_CACHE');
  assert.ok(content.includes('const offlineFallbackPage = "/offline.html";'), 'Must define offlineFallbackPage /offline.html');
  assert.ok(content.includes('caches.open(CACHE)'), 'Must open precache');
  assert.ok(content.includes('.match(offlineFallbackPage)'), 'Must fall back to offlineFallbackPage');
  assert.ok(content.includes('handleStaticAssetRequest'), 'Must cache static assets for offline reliability');

  const offlinePath = path.resolve('public', 'offline.html');
  assert.ok(fs.existsSync(offlinePath), 'public/offline.html must exist');
  const offlineHtml = fs.readFileSync(offlinePath, 'utf8');
  assert.ok(offlineHtml.includes('dir="rtl"') && offlineHtml.includes('lang="ar"'), 'offline.html must be Arabic RTL');
});

test('PWA STEP 3: index.html links manifest, theme-color #0f766e, apple-touch-icon, and sw.js registration is guarded with catch', () => {
  const htmlPath = path.resolve('index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(htmlContent.includes('rel="manifest" href="/manifest.json"'), 'Must link manifest.json');
  assert.ok(htmlContent.includes('name="theme-color" content="#0f766e"'), 'Must set theme-color #0f766e');
  assert.ok(htmlContent.includes('rel="apple-touch-icon"'), 'Must define apple-touch-icon');
  assert.ok(htmlContent.includes("'serviceWorker' in navigator"), 'index.html must check serviceWorker support');
  assert.ok(htmlContent.includes("navigator.serviceWorker.register('/sw.js', { scope: '/' })"), 'index.html must register /sw.js cleanly');
  assert.ok(htmlContent.includes('.catch('), 'index.html SW registration must handle errors');

  const indexTsxPath = path.resolve('src', 'index.tsx');
  assert.ok(fs.existsSync(indexTsxPath), 'src/index.tsx must exist');
  const indexContent = fs.readFileSync(indexTsxPath, 'utf8');
  assert.ok(indexContent.includes("register('/sw.js', { scope: '/' })"), 'Must register /sw.js with root scope in src/index.tsx');
  assert.ok(indexContent.includes('.catch('), 'Must handle registration errors in src/index.tsx');

  const mainContent = fs.readFileSync(path.resolve('src', 'main.tsx'), 'utf8');
  assert.ok(mainContent.includes("import './index.tsx'"), 'src/main.tsx must import src/index.tsx');
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
