/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Mustakshif ErrorBoundary Component (مستكشف)
 * Catches rendering errors in screens and shows Arabic fallback:
 * "حدث خطأ — أعد التحميل"
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
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
      return (
        <div
          dir="rtl"
          role="alert"
          aria-live="assertive"
          className="min-h-[300px] w-full flex flex-col items-center justify-center p-6 text-center select-none"
        >
          <div className="max-w-md w-full bg-white dark:bg-[#12332D] border border-red-200 dark:border-red-900/50 rounded-3xl p-6 shadow-md space-y-4">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle size={24} />
            </div>

            <h3 className="font-['Aref_Ruqaa',serif] text-xl font-bold text-[#0E5C4D] dark:text-[#7FD1AE]">
              حدث خطأ — أعد التحميل
            </h3>

            <p className="font-['Cairo',sans-serif] text-xs text-[#6B7C78] dark:text-[#A7E5C8]/80 leading-relaxed">
              حدث خطأ غير متوقع أثناء عرض هذه الشاشة. يمكنك إعادة المحاولة أو تحديث الصفحة لمتابعة الاستكشاف.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-[#7FD1AE] text-[#0E5C4D] font-bold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 cursor-pointer min-h-[44px] min-w-[44px]"
              >
                <RotateCcw size={14} />
                <span>إعادة المحاولة</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="px-5 py-2.5 rounded-xl border border-[#0E5C4D]/30 dark:border-[#7FD1AE]/30 text-[#0E5C4D] dark:text-[#7FD1AE] font-bold text-xs shadow-xs hover:opacity-90 cursor-pointer min-h-[44px] min-w-[44px]"
              >
                تحديث الصفحة
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
