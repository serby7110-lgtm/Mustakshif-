import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  clearErrorLogs,
  ERROR_LOG_STORAGE_KEY,
  formatErrorLogsForCopy,
  getErrorLogs,
  initErrorLogger,
  MAX_ERROR_LOGS,
  parseStackLocation,
  recordError,
  teardownErrorLoggerForTests,
} from '../src/logger';
import { createMissingKeyHandler } from '../src/i18n';

function installMockWindow() {
  const store = new Map<string, string>();
  const listeners = new Map<string, Array<(event: Event) => void>>();

  const mockStorage = {
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    get length() {
      return store.size;
    },
  };

  const mockWindow = {
    localStorage: mockStorage,
    innerWidth: 390,
    innerHeight: 844,
    addEventListener(type: string, handler: (event: Event) => void) {
      const list = listeners.get(type) ?? [];
      list.push(handler);
      listeners.set(type, list);
    },
    removeEventListener(type: string, handler: (event: Event) => void) {
      const list = listeners.get(type) ?? [];
      listeners.set(
        type,
        list.filter((fn) => fn !== handler)
      );
    },
    dispatchEvent(event: Event) {
      const list = listeners.get(event.type) ?? [];
      for (const fn of list) {
        fn(event);
      }
      return true;
    },
  };

  (globalThis as Record<string, unknown>).window = mockWindow;
  (globalThis as Record<string, unknown>).document = {
    documentElement: {
      lang: 'ar',
      dir: 'rtl',
      setAttribute() {},
    },
  };

  return { mockWindow, store };
}

test('logger records error fields and caps stored entries at 50', () => {
  const { store } = installMockWindow();
  store.set('mustakshif:lang', 'en');

  for (let i = 1; i <= 60; i++) {
    recordError({
      message: `Error #${i}`,
      file: `src/file_${i}.ts`,
      line: i * 10,
      source: 'manual',
    });
  }

  const logs = getErrorLogs();
  assert.equal(logs.length, MAX_ERROR_LOGS);
  assert.equal(MAX_ERROR_LOGS, 50);
  assert.equal(logs[0].message, 'Error #60');
  assert.equal(logs[0].file, 'src/file_60.ts');
  assert.equal(logs[0].line, 600);
  assert.equal(logs[0].lang, 'en');
  assert.equal(logs[0].screenSize, '390x844');
  assert.ok(Date.parse(logs[0].timestamp) > 0);
  assert.equal(logs[49].message, 'Error #11');

  const formatted = formatErrorLogsForCopy(logs.slice(0, 2));
  assert.ok(formatted.includes('Error #60'));
  assert.ok(formatted.includes('src/file_60.ts:600'));
  assert.ok(formatted.includes('Screen: 390x844'));

  clearErrorLogs();
  assert.equal(getErrorLogs().length, 0);
  assert.equal(store.get(ERROR_LOG_STORAGE_KEY), undefined);
});

test('initErrorLogger captures window error and unhandledrejection events cleanly', () => {
  const { mockWindow } = installMockWindow();
  clearErrorLogs();
  teardownErrorLoggerForTests();
  initErrorLogger();

  try {
    const errEvent = {
      type: 'error',
      message: 'Boom in window error',
      filename: 'http://localhost:3000/src/App.tsx',
      lineno: 42,
      colno: 7,
      error: new Error('Boom in window error'),
    } as unknown as Event;

    mockWindow.dispatchEvent(errEvent);

    const rejectionError = new Error('Rejected promise failure');
    rejectionError.stack = 'Error: Rejected promise failure\n    at testFn (http://localhost:3000/src/utils/foo.ts:88:12)';
    const rejEvent = {
      type: 'unhandledrejection',
      reason: rejectionError,
    } as unknown as Event;

    mockWindow.dispatchEvent(rejEvent);

    const logs = getErrorLogs();
    assert.equal(logs.length, 2);
    assert.equal(logs[0].source, 'unhandledrejection');
    assert.equal(logs[0].message, 'Rejected promise failure');
    assert.equal(logs[0].file, 'http://localhost:3000/src/utils/foo.ts');
    assert.equal(logs[0].line, 88);

    assert.equal(logs[1].source, 'window.error');
    assert.equal(logs[1].message, 'Boom in window error');
    assert.equal(logs[1].file, 'http://localhost:3000/src/App.tsx');
    assert.equal(logs[1].line, 42);
  } finally {
    teardownErrorLoggerForTests();
    clearErrorLogs();
  }
});

test('parseStackLocation extracts file and line from V8/browser stack traces', () => {
  const loc = parseStackLocation('Error: test\n    at renderCard (http://localhost:3000/src/screens/HomeScreen.tsx:123:19)');
  assert.equal(loc.file, 'http://localhost:3000/src/screens/HomeScreen.tsx');
  assert.equal(loc.line, 123);
  assert.equal(loc.column, 19);
});

test('i18n missingKeyHandler logs warning only in development mode', () => {
  const originalWarn = console.warn;
  const warnings: unknown[][] = [];
  console.warn = (...args: unknown[]) => {
    warnings.push(args);
  };

  try {
    const prodHandler = createMissingKeyHandler(false);
    prodHandler(['ar'], 'translation', 'missing.prod.key', '');
    assert.equal(warnings.length, 0);

    const devHandler = createMissingKeyHandler(true);
    devHandler(['ar'], 'translation', 'missing.dev.key', 'fallback');
    assert.equal(warnings.length, 1);
    assert.ok(String(warnings[0][0]).includes('missing.dev.key'));
  } finally {
    console.warn = originalWarn;
  }
});

test('locales and hidden debug UI contract exist across ar, en, id, th', () => {
  for (const code of ['ar', 'en', 'id', 'th']) {
    const data = JSON.parse(fs.readFileSync(`src/locales/${code}.json`, 'utf8'));
    assert.ok(data.debug, `debug section missing in ${code}.json`);
    assert.ok(data.debug.title, `debug.title missing in ${code}.json`);
    assert.ok(data.debug.copyAll, `debug.copyAll missing in ${code}.json`);
    assert.ok(data.debug.clear, `debug.clear missing in ${code}.json`);
    assert.ok(data.debug.empty, `debug.empty missing in ${code}.json`);
    assert.ok(data.debug.friendlyDesc, `debug.friendlyDesc missing in ${code}.json`);
  }

  const ar = JSON.parse(fs.readFileSync('src/locales/ar.json', 'utf8'));
  assert.equal(ar.debug.copyAll, 'نسخ الكل');
  assert.equal(ar.debug.clear, 'مسح');

  const appCode = fs.readFileSync('src/App.tsx', 'utf8');
  assert.ok(appCode.includes('DebugScreen'));
  assert.ok(appCode.includes("'/debug'") || appCode.includes('"/debug"'));
  assert.ok(appCode.includes('>= 5'));
});
