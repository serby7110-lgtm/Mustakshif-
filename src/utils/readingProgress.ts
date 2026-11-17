/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Pure scroll & reading-progress calculations for ArticleScreen.
 */

export interface ScrollMetricsInput {
  mainScrollHeight: number;
  mainClientHeight: number;
  mainScrollTop: number;
  docScrollHeight: number;
  viewportHeight: number;
  windowScrollY: number;
}

export interface ResolvedScrollMetrics {
  scrollTop: number;
  scrollableHeight: number;
}

/**
 * Resolves which container (<main> or document/window) is actively scrolling
 * and returns normalized scrollTop and scrollableHeight values.
 * Ignores sub-pixel (< 8px) main overflow caused by flex rounding.
 */
export function resolveScrollMetrics(input: ScrollMetricsInput): ResolvedScrollMetrics {
  const mainOverflow = Math.max(0, (Number.isFinite(input.mainScrollHeight) ? input.mainScrollHeight : 0) - (Number.isFinite(input.mainClientHeight) ? input.mainClientHeight : 0));
  const docOverflow = Math.max(0, (Number.isFinite(input.docScrollHeight) ? input.docScrollHeight : 0) - (Number.isFinite(input.viewportHeight) ? input.viewportHeight : 0));
  const mainTop = Math.max(0, Number.isFinite(input.mainScrollTop) ? input.mainScrollTop : 0);
  const winTop = Math.max(0, Number.isFinite(input.windowScrollY) ? input.windowScrollY : 0);

  const useMain = mainTop > 0 || (mainOverflow > 8 && docOverflow <= 8);

  if (useMain) {
    return {
      scrollTop: mainTop,
      scrollableHeight: mainOverflow,
    };
  }

  return {
    scrollTop: winTop,
    scrollableHeight: docOverflow,
  };
}

/**
 * Computes clamped reading progress percentage in [0, 100].
 */
export function calculateReadingProgress(scrollTop: number, scrollableHeight: number): number {
  if (!Number.isFinite(scrollTop) || !Number.isFinite(scrollableHeight) || scrollableHeight <= 0) {
    return 0;
  }
  const raw = (scrollTop / scrollableHeight) * 100;
  if (!Number.isFinite(raw)) return 0;
  return Math.min(100, Math.max(0, raw));
}

/**
 * Computes normalized persisted storage progress (10..100 or 0 at start).
 */
export function computePersistableProgress(progress: number): number {
  if (!Number.isFinite(progress) || progress <= 0) return 0;
  if (progress >= 90) return 100;
  return Math.max(10, Math.min(100, Math.round(progress)));
}
