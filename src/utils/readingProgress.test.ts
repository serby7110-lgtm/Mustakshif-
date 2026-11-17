import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReadingProgress,
  computePersistableProgress,
  resolveScrollMetrics,
} from './readingProgress';

test('calculateReadingProgress clamps accurately between 0 and 100', () => {
  assert.equal(calculateReadingProgress(0, 1000), 0);
  assert.equal(calculateReadingProgress(-50, 1000), 0);
  assert.equal(calculateReadingProgress(500, 1000), 50);
  assert.equal(calculateReadingProgress(1000, 1000), 100);
  assert.equal(calculateReadingProgress(1400, 1000), 100);
  assert.equal(calculateReadingProgress(100, 0), 0);
  assert.equal(calculateReadingProgress(Number.NaN, 1000), 0);
});

test('resolveScrollMetrics ignores sub-pixel <main> overflow when window scrolls', () => {
  const metrics = resolveScrollMetrics({
    mainScrollHeight: 2001,
    mainClientHeight: 2000,
    mainScrollTop: 0,
    docScrollHeight: 2400,
    viewportHeight: 844,
    windowScrollY: 778,
  });

  assert.equal(metrics.scrollTop, 778);
  assert.equal(metrics.scrollableHeight, 1556);
  assert.equal(Math.round(calculateReadingProgress(metrics.scrollTop, metrics.scrollableHeight)), 50);
});

test('resolveScrollMetrics prefers <main> when <main> has scrolled or owns significant overflow', () => {
  const scrolledMain = resolveScrollMetrics({
    mainScrollHeight: 2400,
    mainClientHeight: 800,
    mainScrollTop: 400,
    docScrollHeight: 844,
    viewportHeight: 844,
    windowScrollY: 0,
  });

  assert.equal(scrolledMain.scrollTop, 400);
  assert.equal(scrolledMain.scrollableHeight, 1600);
  assert.equal(calculateReadingProgress(scrolledMain.scrollTop, scrolledMain.scrollableHeight), 25);
});

test('computePersistableProgress snaps >=90% to 100% and keeps positive progress >=10%', () => {
  assert.equal(computePersistableProgress(0), 0);
  assert.equal(computePersistableProgress(3), 10);
  assert.equal(computePersistableProgress(47.6), 48);
  assert.equal(computePersistableProgress(90), 100);
  assert.equal(computePersistableProgress(100), 100);
});
