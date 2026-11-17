/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mustakshif Hidden Diagnostics & Error Log Screen (/debug)
 * Accessible via `/debug`, `#/debug`, or 5 taps on the app logo.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  Bug,
  CheckCircle2,
  Copy,
  FileCode2,
  Globe,
  Monitor,
  Clock,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../components/primitives/Card';
import { useTheme } from '../theme/ThemeContext';
import { useI18n } from '../i18n/i18n';
import { copyTextSafely } from '../utils/clipboard';
import {
  clearErrorLogs,
  ERROR_LOG_EVENT,
  ErrorLogEntry,
  formatErrorLogsForCopy,
  getErrorLogs,
  MAX_ERROR_LOGS,
} from '../logger';

export interface DebugScreenProps {
  onBack: () => void;
}

export const DebugScreen: React.FC<DebugScreenProps> = ({ onBack }) => {
  const { tokens, isDark } = useTheme();
  const { t, dir, lang } = useI18n();
  const [logs, setLogs] = useState<ErrorLogEntry[]>(() => getErrorLogs());
  const [toast, setToast] = useState<string | null>(null);

  const refreshLogs = useCallback(() => {
    setLogs(getErrorLogs());
  }, []);

  useEffect(() => {
    refreshLogs();
    if (typeof window === 'undefined') return;
    const handleUpdate = () => refreshLogs();
    window.addEventListener(ERROR_LOG_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(ERROR_LOG_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshLogs]);

  const showNotice = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const handleCopyAll = async () => {
    if (logs.length === 0) return;
    const payload = formatErrorLogsForCopy(logs);
    const copied = await copyTextSafely(payload);
    if (copied) {
      showNotice(t('debug.copiedToast') || 'تم نسخ جميع الأخطاء المسجلة');
    } else {
      showNotice(t('common.copyError') || 'تعذر النسخ تلقائياً، يرجى النسخ يدوياً');
    }
  };

  const handleClear = () => {
    clearErrorLogs();
    setLogs([]);
    showNotice(t('debug.clearedToast') || 'تم مسح سجل الأخطاء');
  };

  const formatTimestamp = (iso: string): string => {
    try {
      const date = new Date(iso);
      if (Number.isNaN(date.getTime())) return iso;
      return date.toLocaleString(lang === 'ar' ? 'ar-EG' : lang, {
        dateStyle: 'short',
        timeStyle: 'medium',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div
      dir={dir}
      lang={lang}
      style={{
        backgroundColor: tokens.background,
        color: tokens.textPrimary,
      }}
      className="min-h-screen flex justify-center font-['Cairo',sans-serif] transition-colors"
    >
      <div
        style={{
          backgroundColor: tokens.surface,
          borderColor: tokens.border,
        }}
        className="w-full max-w-md min-h-screen flex flex-col border-x shadow-[0_0_40px_-10px_rgba(14,92,77,0.08)]"
      >
        {/* Sticky Top Bar */}
        <header
          style={{
            backgroundColor: isDark ? 'rgba(18, 51, 45, 0.95)' : 'rgba(255, 255, 255, 0.94)',
            borderColor: tokens.border,
          }}
          className="sticky top-0 z-30 backdrop-blur-md border-b px-4 py-3 flex items-center justify-between gap-2"
        >
          <button
            type="button"
            onClick={onBack}
            data-testid="debug-back-btn"
            style={{
              backgroundColor: tokens.card,
              color: tokens.deepAccent,
              borderColor: tokens.border,
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold border shadow-xs hover:opacity-90 cursor-pointer min-h-[44px]"
            aria-label={t('common.back') || 'العودة'}
          >
            <ArrowRight size={16} className={dir === 'ltr' ? 'rotate-180' : ''} />
            <span>{t('common.back') || 'العودة'}</span>
          </button>

          <div
            style={{
              backgroundColor: isDark ? 'rgba(127, 209, 174, 0.16)' : '#D6F4E7',
              borderColor: isDark ? 'rgba(127, 209, 174, 0.35)' : '#8EDBC0',
              color: isDark ? '#7FD1AE' : '#0E5C4D',
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
            data-testid="debug-log-count"
          >
            <Bug size={14} />
            <span>
              {logs.length} / {MAX_ERROR_LOGS}
            </span>
          </div>
        </header>

        <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-12">
          {/* Header & Controls */}
          <div className="space-y-1">
            <h1
              style={{ color: tokens.deepAccent }}
              className="font-['Aref_Ruqaa',serif] text-2xl font-bold"
            >
              {t('debug.title') || 'سجل الأخطاء والتشخيص'}
            </h1>
            <p style={{ color: tokens.textSecondary }} className="text-xs leading-relaxed">
              {t('debug.subtitle', { max: MAX_ERROR_LOGS }) ||
                `آخر ${MAX_ERROR_LOGS} خطأ مسجلاً محلياً على هذا الجهاز`}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleCopyAll}
              disabled={logs.length === 0}
              data-testid="debug-copy-all-btn"
              style={{
                backgroundColor: tokens.primaryMint,
                color: '#0E5C4D',
              }}
              className="flex-1 px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
            >
              <Copy size={15} />
              <span>{t('debug.copyAll') || 'نسخ الكل'}</span>
            </button>

            <button
              type="button"
              onClick={handleClear}
              disabled={logs.length === 0}
              data-testid="debug-clear-btn"
              style={{
                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEF2F2',
                borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FECACA',
                color: isDark ? '#FCA5A5' : '#B91C1C',
              }}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold border flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer min-h-[44px]"
            >
              <Trash2 size={15} />
              <span>{t('debug.clear') || 'مسح'}</span>
            </button>
          </div>

          {toast && (
            <div
              role="status"
              data-testid="debug-toast"
              style={{
                backgroundColor: isDark ? 'rgba(127, 209, 174, 0.18)' : '#D6F4E7',
                borderColor: isDark ? 'rgba(127, 209, 174, 0.4)' : '#8EDBC0',
                color: isDark ? '#A7E5C8' : '#0E5C4D',
              }}
              className="px-3.5 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2"
            >
              <CheckCircle2 size={15} className="shrink-0" />
              <span>{toast}</span>
            </div>
          )}

          {/* Error List / Empty State */}
          {logs.length === 0 ? (
            <Card
              variant="white"
              elevation="card"
              className="p-8 rounded-3xl text-center space-y-3"
              data-testid="debug-empty-state"
            >
              <div
                style={{
                  backgroundColor: isDark ? 'rgba(127, 209, 174, 0.14)' : '#E8F7F0',
                  color: tokens.deepAccent,
                }}
                className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center"
              >
                <CheckCircle2 size={24} />
              </div>
              <p style={{ color: tokens.textSecondary }} className="text-sm font-medium leading-relaxed">
                {t('debug.empty') || 'لا توجد أخطاء مسجلة حالياً — التطبيق يعمل بثبات.'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3" data-testid="debug-logs-list">
              {logs.map((entry, idx) => (
                <Card
                  key={entry.id}
                  variant="white"
                  elevation="card"
                  className="p-4 rounded-2xl space-y-2.5 border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle size={16} className="text-red-500 shrink-0" />
                      <span
                        style={{
                          backgroundColor: isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2',
                          color: isDark ? '#FCA5A5' : '#991B1B',
                        }}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                      >
                        #{idx + 1} • {entry.source}
                      </span>
                    </div>
                    <span
                      style={{ color: tokens.textSecondary }}
                      className="text-[11px] flex items-center gap-1 shrink-0"
                      title={entry.timestamp}
                    >
                      <Clock size={11} />
                      <span>{formatTimestamp(entry.timestamp)}</span>
                    </span>
                  </div>

                  <p
                    style={{ color: tokens.textPrimary }}
                    className="text-xs font-bold leading-relaxed break-words"
                    dir="auto"
                  >
                    {entry.message}
                  </p>

                  <div
                    style={{ color: tokens.textSecondary, borderColor: tokens.borderSubtle }}
                    className="pt-2 border-t grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 col-span-2">
                      <FileCode2 size={12} className="shrink-0 opacity-75" />
                      <span className="font-semibold shrink-0">{t('debug.fileLabel') || 'الملف'}:</span>
                      <span className="flex items-center min-w-0 font-mono" dir="ltr">
                        <span className="truncate">{entry.file || '—'}</span>
                        {entry.line != null && (
                          <span className="shrink-0 font-bold" style={{ color: tokens.deepAccent }}>
                            :{entry.line}
                          </span>
                        )}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Globe size={12} className="shrink-0 opacity-75" />
                      <span className="font-semibold">{t('debug.langLabel') || 'اللغة'}:</span>
                      <span>{entry.lang}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Monitor size={12} className="shrink-0 opacity-75" />
                      <span className="font-semibold">{t('debug.screenLabel') || 'الشاشة'}:</span>
                      <span dir="ltr" className="font-mono">
                        {entry.screenSize}
                      </span>
                    </div>
                  </div>

                  {entry.stack && (
                    <details className="pt-1">
                      <summary
                        style={{ color: tokens.deepAccent }}
                        className="text-[11px] font-bold cursor-pointer select-none"
                      >
                        Stack Trace
                      </summary>
                      <pre
                        dir="ltr"
                        style={{
                          backgroundColor: tokens.surface,
                          borderColor: tokens.borderSubtle,
                          color: tokens.textSecondary,
                        }}
                        className="mt-1.5 p-2.5 rounded-xl border text-[10px] font-mono overflow-x-auto whitespace-pre-wrap break-all"
                      >
                        {entry.stack}
                      </pre>
                    </details>
                  )}
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DebugScreen;
