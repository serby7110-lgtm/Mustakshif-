import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Cloudflare Web Analytics beacon is removed and replaced by native Firebase Analytics', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(!html.includes('static.cloudflareinsights.com/beacon.min.js'), 'Must remove web-only Cloudflare beacon script');
  assert.ok(!html.includes('data-cf-beacon='), 'Must remove data-cf-beacon attribute');
});

test('2. Error Tracking: src/logger.ts captures window error & unhandledrejection up to 50 entries', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(!html.includes("STORAGE_KEY = 'app_errors'"), 'Legacy duplicate app_errors script should be removed from index.html');

  const loggerCode = fs.readFileSync(path.resolve('src', 'logger.ts'), 'utf8');
  assert.ok(loggerCode.includes('MAX_ERROR_LOGS = 50'), 'Must cap error log at 50 entries');
  assert.ok(loggerCode.includes("window.addEventListener('error'"), 'Must wire window error listener');
  assert.ok(loggerCode.includes("window.addEventListener('unhandledrejection'"), 'Must wire unhandledrejection listener');
  assert.ok(loggerCode.includes('screenSize:') && loggerCode.includes('lang:'), 'Must capture language and screen size');
});

test('3. Diagnostic Mode: External unpinned CDN Eruda removed; local /debug DebugScreen provides diagnostics', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(!html.includes('cdn.jsdelivr.net/npm/eruda'), 'Must remove unpinned external Eruda CDN script');

  const appCode = fs.readFileSync(path.resolve('src', 'App.tsx'), 'utf8');
  assert.ok(appCode.includes("'/debug'") && appCode.includes('DebugScreen'), 'App must provide local /debug DebugScreen');
});

test('4. Service Worker: Cache name is configured and cleans old caches on activate', () => {
  const swPublic = fs.readFileSync(path.resolve('public', 'sw.js'), 'utf8');
  assert.ok(swPublic.includes('const CACHE = "pwabuilder-page"'), 'public/sw.js must contain cache name pwabuilder-page');
  assert.ok(swPublic.includes('const offlineFallbackPage = "/offline.html"'), 'public/sw.js must configure /offline.html');
  assert.ok(swPublic.includes('caches.delete'), 'public/sw.js must delete stale caches');

  const swRoot = fs.readFileSync(path.resolve('sw.js'), 'utf8');
  assert.ok(swRoot.includes('const CACHE = "pwabuilder-page"'), 'root sw.js must contain cache name pwabuilder-page');
  assert.ok(swRoot.includes('const offlineFallbackPage = "/offline.html"'), 'root sw.js must configure /offline.html');
  assert.ok(swRoot.includes('caches.delete'), 'root sw.js must delete stale caches');
});
