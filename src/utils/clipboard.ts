/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Safe cross-environment clipboard helper with awaited async API,
 * textarea execCommand fallback, and explicit boolean outcome.
 */

export async function copyTextSafely(text: string): Promise<boolean> {
  if (!text) return false;

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('[Clipboard] navigator.clipboard.writeText failed, trying fallback:', err);
    }
  }

  if (typeof document !== 'undefined' && document.body) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';

    try {
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = typeof document.execCommand === 'function' && document.execCommand('copy');
      if (!copied) {
        console.warn('[Clipboard] document.execCommand("copy") returned false');
      }
      return Boolean(copied);
    } catch (err) {
      console.warn('[Clipboard] Fallback copy failed:', err);
      return false;
    } finally {
      if (textarea.parentNode) {
        textarea.parentNode.removeChild(textarea);
      }
    }
  }

  return false;
}
