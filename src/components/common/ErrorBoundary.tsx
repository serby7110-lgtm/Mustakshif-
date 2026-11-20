/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mustakshif ErrorBoundary Component (مستكشف)
 * Catches rendering errors in the application & screens and shows friendly fallback:
 * "حدث خطأ — أعد التحميل"
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import i18n from '../../i18n';
import { recordError } from '../../logger';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

function safeT(key: string, fallback: string): string {
  try {
    if (i18n && typeof i18n.t === 'function') {
      const translated = i18n.t(key, { defaultValue: fallback });
      if (typeof translated === 'string' && translated.trim() && translated !== key) {
        return translated;
      }
    }
  } catch {
    // Fallback cleanly if i18n is not ready
  }
  return fallback;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    const msg = error?.message || String(error || 'React rendering error');
    const combinedStack = [error?.stack, errorInfo?.componentStack].filter(Boolean).join('\n');
    recordError({
      message: msg,
      stack: combinedStack || undefined,
      source: 'errorBoundary',
    });

    const isStaleChunkOrHookMismatch =
      /Cannot read properties of null \(reading '(?:useState|useEffect|useRef|useMemo|useCallback|useContext|useReducer)'\)|Invalid hook call|Failed to fetch dynamically imported module|Importing a module script failed/i.test(
        msg
      );

    if (isStaleChunkOrHookMismatch && typeof window !== 'undefined') {
      try {
        const lastReload = Number(sessionStorage.getItem('mustakshif_chunk_reload_ts') || '0');
        if (!Number.isFinite(lastReload) || Date.now() - lastReload > 15000) {
          sessionStorage.setItem('mustakshif_chunk_reload_ts', String(Date.now()));
          const win = window;
          if (typeof win.caches !== 'undefined') {
            win.caches.delete('mustakshif-runtime-v1').catch(() => {}).finally(() => {
              win.location.reload();
            });
            return;
          }
          win.location.reload();
        }
      } catch {
        // Ignore storage errors and show ErrorBoundary fallback
      }
    }
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined });
    this.props.onReset?.();
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const currentDir =
        typeof document !== 'undefined'
          ? document.documentElement.dir || i18n.dir() || 'rtl'
          : i18n.dir() || 'rtl';

      const titleText = safeT('common.errorBoundaryTitle', 'حدث خطأ — أعد التحميل');
      const descText =
        this.props.fallbackMessage ||
        safeT(
          'debug.friendlyDesc',
          'نعتذر عن هذا الخلل غير المتوقع. تم تسجيل تفاصيل الخطأ محلياً ويمكنك إعادة المحاولة أو تحديث التطبيق.'
        );
      const retryText = safeT('common.retry', 'إعادة المحاولة');
      const reloadText = safeT('common.reloadPage', 'إعادة تحميل التطبيق');

      return (
        <div
          dir={currentDir}
          role="alert"
          aria-live="assertive"
          data-testid="error-boundary-fallback"
          className="min-h-[300px] w-full flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <div className="max-w-md w-full bg-white dark:bg-[#12332D] border border-red-200 dark:border-red-900/50 rounded-3xl p-6 shadow-md space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <h3 className="font-['Aref_Ruqaa',serif] text-xl font-bold text-[#0E5C4D] dark:text-[#7FD1AE]">
              {titleText}
            </h3>

            <p className="font-['Cairo',sans-serif] text-xs text-[#6B7C78] dark:text-[#A7E5C8]/80 leading-relaxed">
              {descText}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-[#7FD1AE] text-[#0E5C4D] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer min-h-[44px] min-w-[44px]"
              >
                <RotateCcw size={14} />
                <span>{retryText}</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl border border-[#0E5C4D]/30 dark:border-[#7FD1AE]/30 text-[#0E5C4D] dark:text-[#7FD1AE] font-bold text-xs shadow-xs hover:opacity-90 cursor-pointer min-h-[44px] min-w-[44px]"
              >
                {reloadText}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
