/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Mustakshif Client Error Logger (مستكشف)
 * Captures global window errors, unhandled promise rejections, and React ErrorBoundary crashes,
 * persisting the latest 50 entries in localStorage with file, line, timestamp, language, and viewport size.
 */

export const ERROR_LOG_STORAGE_KEY = 'mustakshif_error_logs_v1';
export const MAX_ERROR_LOGS = 50;
export const ERROR_LOG_EVENT = 'mustakshif:error-logged';

export type ErrorLogSource = 'window.error' | 'unhandledrejection' | 'errorBoundary' | 'manual';

export interface ErrorLogEntry {
  id: string;
  message: string;
  file: string;
  line: number | null;
  column?: number | null;
  timestamp: string;
  lang: string;
  screenSize: string;
  source: ErrorLogSource;
  stack?: string;
}

export interface RecordErrorInput {
  message: string;
  file?: string | null;
  line?: number | null;
  column?: number | null;
  source?: ErrorLogSource;
  stack?: string;
  lang?: string;
  screenSize?: string;
  timestamp?: string;
}

function getLocalStorageSafe(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    // Ignore storage access errors in restricted environments
  }
  return null;
}

export function getCurrentLangSafe(): string {
  try {
    const ls = getLocalStorageSafe();
    const stored = ls?.getItem('mustakshif:lang');
    if (stored && stored.trim()) return stored.trim();
    if (typeof document !== 'undefined' && document.documentElement?.lang) {
      return document.documentElement.lang;
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language.split(/[-_]/)[0] || 'ar';
    }
  } catch {
    // Fallback below
  }
  return 'ar';
}

export function getScreenSizeSafe(): string {
  try {
    if (typeof window !== 'undefined' && typeof window.innerWidth === 'number' && typeof window.innerHeight === 'number') {
      return `${window.innerWidth}x${window.innerHeight}`;
    }
  } catch {
    // Fallback below
  }
  return '0x0';
}

export function parseStackLocation(stack?: string | null): {
  file: string;
  line: number | null;
  column: number | null;
} {
  if (!stack || typeof stack !== 'string') {
    return { file: '', line: null, column: null };
  }

  const lines = stack.split('\n');
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    // Matches JS stack frames like "at fn (https://.../file.tsx:12:34)" or "at https://.../file.ts:12:34" or "fn@http://.../file.js:12:34"
    const match = trimmed.match(/(?:https?:\/\/[^\s)]+|\/[^\s):]+|[^\s(@:]+\.[a-zA-Z0-9]+):(\d+):(\d+)/);
    if (match) {
      const fullFrame = match[0];
      const lineNum = Number.parseInt(match[1], 10);
      const colNum = Number.parseInt(match[2], 10);
      const filePart = fullFrame.replace(/:\d+:\d+$/, '');
      return {
        file: filePart,
        line: Number.isFinite(lineNum) ? lineNum : null,
        column: Number.isFinite(colNum) ? colNum : null,
      };
    }
  }

  return { file: '', line: null, column: null };
}

function sanitizeEntry(raw: unknown): ErrorLogEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const message = typeof obj.message === 'string' ? obj.message : '';
  if (!message) return null;

  return {
    id: typeof obj.id === 'string' && obj.id ? obj.id : `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    message,
    file: typeof obj.file === 'string' ? obj.file : '',
    line: typeof obj.line === 'number' && Number.isFinite(obj.line) ? obj.line : null,
    column: typeof obj.column === 'number' && Number.isFinite(obj.column) ? obj.column : null,
    timestamp: typeof obj.timestamp === 'string' && obj.timestamp ? obj.timestamp : new Date().toISOString(),
    lang: typeof obj.lang === 'string' && obj.lang ? obj.lang : 'ar',
    screenSize: typeof obj.screenSize === 'string' && obj.screenSize ? obj.screenSize : '0x0',
    source:
      obj.source === 'window.error' ||
      obj.source === 'unhandledrejection' ||
      obj.source === 'errorBoundary' ||
      obj.source === 'manual'
        ? obj.source
        : 'manual',
    stack: typeof obj.stack === 'string' && obj.stack ? obj.stack : undefined,
  };
}

export function getErrorLogs(): ErrorLogEntry[] {
  const ls = getLocalStorageSafe();
  if (!ls) return [];

  try {
    const raw = ls.getItem(ERROR_LOG_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(sanitizeEntry)
      .filter((item): item is ErrorLogEntry => item !== null)
      .slice(0, MAX_ERROR_LOGS);
  } catch {
    return [];
  }
}

function emitLogUpdate(entry?: ErrorLogEntry): void {
  try {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent(ERROR_LOG_EVENT, { detail: entry ?? null }));
    }
  } catch {
    // Ignore event dispatch failures
  }
}

export function recordError(input: RecordErrorInput): ErrorLogEntry {
  const parsedStack = parseStackLocation(input.stack);
  const entry: ErrorLogEntry = {
    id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    message: (input.message || 'Unknown error').trim() || 'Unknown error',
    file: (input.file ?? parsedStack.file ?? '').trim(),
    line:
      typeof input.line === 'number' && Number.isFinite(input.line) && input.line > 0
        ? input.line
        : parsedStack.line,
    column:
      typeof input.column === 'number' && Number.isFinite(input.column) && input.column > 0
        ? input.column
        : parsedStack.column,
    timestamp: input.timestamp || new Date().toISOString(),
    lang: input.lang || getCurrentLangSafe(),
    screenSize: input.screenSize || getScreenSizeSafe(),
    source: input.source || 'manual',
    stack: input.stack ? input.stack.slice(0, 2000) : undefined,
  };

  const ls = getLocalStorageSafe();
  if (ls) {
    try {
      const existing = getErrorLogs();
      const next = [entry, ...existing].slice(0, MAX_ERROR_LOGS);
      ls.setItem(ERROR_LOG_STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      console.warn('[logger] Failed to persist error log:', err);
    }
  }

  emitLogUpdate(entry);
  return entry;
}

export function clearErrorLogs(): void {
  const ls = getLocalStorageSafe();
  if (ls) {
    try {
      ls.removeItem(ERROR_LOG_STORAGE_KEY);
    } catch (err) {
      console.warn('[logger] Failed to clear error logs:', err);
    }
  }
  emitLogUpdate();
}

export function formatErrorLogsForCopy(logs?: ErrorLogEntry[]): string {
  const entries = Array.isArray(logs) ? logs : getErrorLogs();
  if (entries.length === 0) return '';

  return entries
    .map((entry, idx) => {
      const location = entry.file
        ? `${entry.file}${entry.line != null ? `:${entry.line}${entry.column != null ? `:${entry.column}` : ''}` : ''}`
        : '—';
      return [
        `#${idx + 1} [${entry.source}] ${entry.timestamp}`,
        `Message: ${entry.message}`,
        `Location: ${location}`,
        `Lang: ${entry.lang} | Screen: ${entry.screenSize}`,
        entry.stack ? `Stack:\n${entry.stack}` : null,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n\n---\n\n');
}

function formatRejectionReason(reason: unknown): {
  message: string;
  stack?: string;
} {
  if (reason instanceof Error) {
    return {
      message: reason.message || reason.name || 'Unhandled promise rejection',
      stack: reason.stack,
    };
  }
  if (typeof reason === 'string') {
    return { message: reason || 'Unhandled promise rejection' };
  }
  if (reason && typeof reason === 'object') {
    const maybeMessage = (reason as { message?: unknown }).message;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return {
        message: maybeMessage,
        stack: typeof (reason as { stack?: unknown }).stack === 'string'
          ? (reason as { stack?: string }).stack
          : undefined,
      };
    }
    try {
      return { message: JSON.stringify(reason) };
    } catch {
      return { message: String(reason) };
    }
  }
  return { message: reason == null ? 'Unhandled promise rejection' : String(reason) };
}

let isInitialized = false;

function handleWindowError(event: Event): void {
  const errEvent = event as ErrorEvent;
  const errObj = errEvent?.error instanceof Error ? errEvent.error : undefined;
  const message =
    errEvent?.message ||
    errObj?.message ||
    'Uncaught runtime error';
  const stack = errObj?.stack;
  const parsed = parseStackLocation(stack);
  const file = errEvent?.filename || parsed.file || '';
  const line =
    typeof errEvent?.lineno === 'number' && errEvent.lineno > 0
      ? errEvent.lineno
      : parsed.line;
  const column =
    typeof errEvent?.colno === 'number' && errEvent.colno > 0
      ? errEvent.colno
      : parsed.column;

  recordError({
    message,
    file,
    line,
    column,
    stack,
    source: 'window.error',
  });
}

function handleUnhandledRejection(event: Event): void {
  const rejEvent = event as PromiseRejectionEvent;
  const { message, stack } = formatRejectionReason(rejEvent?.reason);
  const parsed = parseStackLocation(stack);

  recordError({
    message,
    file: parsed.file,
    line: parsed.line,
    column: parsed.column,
    stack,
    source: 'unhandledrejection',
  });
}

export function initErrorLogger(): void {
  if (isInitialized || typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return;
  }
  window.addEventListener('error', handleWindowError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  isInitialized = true;
}

export function teardownErrorLoggerForTests(): void {
  if (!isInitialized || typeof window === 'undefined' || typeof window.removeEventListener !== 'function') {
    isInitialized = false;
    return;
  }
  window.removeEventListener('error', handleWindowError);
  window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  isInitialized = false;
}
