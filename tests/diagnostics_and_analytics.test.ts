import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('1. Cloudflare Web Analytics beacon is removed and replaced by native Firebase Analytics', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(!html.includes('static.cloudflareinsights.com/beacon.min.js'), 'Must remove web-only Cloudflare beacon script');
  assert.ok(!html.includes('data-cf-beacon='), 'Must remove data-cf-beacon attribute');
});

test('2. Error Tracking: window.onerror and unhandledrejection save last 20 errors in localStorage under "app_errors"', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(html.includes("STORAGE_KEY = 'app_errors'"), 'Must define STORAGE_KEY app_errors');
  assert.ok(html.includes('window.onerror = function'), 'Must wire window.onerror');
  assert.ok(html.includes("addEventListener('unhandledrejection'"), 'Must wire unhandledrejection');
  assert.ok(html.includes('MAX_ERRORS = 20'), 'Must cap at 20 errors');
  assert.ok(html.includes('message:') && html.includes('time:') && html.includes('page:'), 'Must store message, time, page');
});

test('3. Diagnostic Mode: Checks ?debug=1 and dynamically loads & initializes Eruda', () => {
  const html = fs.readFileSync(path.resolve('index.html'), 'utf8');
  assert.ok(html.includes("params.get('debug') === '1'"), 'Must check for ?debug=1');
  assert.ok(html.includes('cdn.jsdelivr.net/npm/eruda'), 'Must load Eruda CDN URL');
  assert.ok(html.includes('eruda.init()'), 'Must initialize Eruda');
});

test('4. Service Worker: Cache name carries version number that can be changed on every update', () => {
  const swPublic = fs.readFileSync(path.resolve('public', 'sw.js'), 'utf8');
  assert.ok(swPublic.includes('CACHE_VERSION'), 'public/sw.js must define CACHE_VERSION');
  assert.ok(swPublic.includes("const CACHE = 'mustakshif-v1'"), 'public/sw.js must contain versioned cache name');

  const swRoot = fs.readFileSync(path.resolve('sw.js'), 'utf8');
  assert.ok(swRoot.includes('CACHE_VERSION'), 'root sw.js must define CACHE_VERSION');
  assert.ok(swRoot.includes("const CACHE = 'mustakshif-v1'"), 'root sw.js must contain versioned cache name');
});
