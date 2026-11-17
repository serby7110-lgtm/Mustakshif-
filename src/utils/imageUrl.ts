/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function resolveHeroImageUrl(src?: string | null): string {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (!trimmed) return '';
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }
  return `/${trimmed}`;
}
